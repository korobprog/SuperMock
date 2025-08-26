#!/usr/bin/env bash

# Исправление Telegram авторизации в frontend
set -Eeuo pipefail

SSH_KEY="${SSH_KEY:-~/.ssh/timeweb_vps_key}"
SERVER="${SERVER:-217.198.6.238}"
USER_="${USER_:-root}"
DEST="${DEST:-/opt/mockmate}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

success() { printf "${GREEN}✅ %s${NC}\n" "$*"; }
warning() { printf "${YELLOW}⚠️  %s${NC}\n" "$*"; }
error() { printf "${RED}❌ %s${NC}\n" "$*"; }

echo "🔧 Исправление Telegram авторизации в frontend..."

# 1. Проверяем переменные окружения на сервере
echo "1. Проверяем переменные окружения..."
ssh -i "${SSH_KEY}" "${USER_}@${SERVER}" "cd '${DEST}' && echo 'Frontend env vars:' && grep -E '^VITE_TELEGRAM' .env || echo 'VITE vars not found'"

# 2. Проверяем, правильно ли переменные передаются в Docker контейнер
echo "2. Проверяем Docker переменные окружения..."
ssh -i "${SSH_KEY}" "${USER_}@${SERVER}" "cd '${DEST}' && docker compose -f docker-compose.prod.yml config | grep -A5 -B5 VITE_TELEGRAM || echo 'Docker env not found'"

# 3. Пересобираем frontend с правильными переменными
echo "3. Пересобираем frontend..."
ssh -i "${SSH_KEY}" "${USER_}@${SERVER}" "cd '${DEST}' && 
    echo 'Building frontend with env vars...' &&
    docker compose -f docker-compose.prod.yml build --no-cache frontend &&
    docker compose -f docker-compose.prod.yml up -d frontend"

# 4. Проверяем логи frontend
echo "4. Проверяем логи frontend..."
ssh -i "${SSH_KEY}" "${USER_}@${SERVER}" "cd '${DEST}' && docker logs supermock-frontend --tail=20"

# 5. Создаем простую тестовую страницу прямо на сервере
echo "5. Создаем тестовую страницу..."
ssh -i "${SSH_KEY}" "${USER_}@${SERVER}" "cat > /tmp/telegram-debug.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Telegram Auth Debug</title>
    <style>body { font-family: Arial, sans-serif; margin: 50px; }</style>
</head>
<body>
    <h1>🔍 Telegram Auth Debug</h1>
    <div id=\"debug\"></div>
    
    <h2>1. Попробуйте авторизацию:</h2>
    <div id=\"telegram-login\"></div>
    
    <h2>2. Информация о домене:</h2>
    <p><strong>Current domain:</strong> <span id=\"domain\"></span></p>
    <p><strong>Protocol:</strong> <span id=\"protocol\"></span></p>
    
    <script>
        document.getElementById('domain').textContent = window.location.hostname;
        document.getElementById('protocol').textContent = window.location.protocol;
        
        window.onTelegramAuth = function(user) {
            document.getElementById('debug').innerHTML = 
                '<div style=\"color: green\">✅ Авторизация работает!</div>' +
                '<pre>' + JSON.stringify(user, null, 2) + '</pre>';
        };
        
        // Создаем Telegram widget
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', 'SuperMock_bot');
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-auth-url', window.location.origin);
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-lang', 'ru');
        script.setAttribute('data-onauth', 'onTelegramAuth');
        
        document.getElementById('telegram-login').appendChild(script);
        
        console.log('Debug page loaded, domain:', window.location.hostname);
    </script>
</body>
</html>
EOF"

# 6. Копируем в публичную директорию
ssh -i "${SSH_KEY}" "${USER_}@${SERVER}" "cd '${DEST}' && 
    cp /tmp/telegram-debug.html public/ || 
    docker exec supermock-frontend sh -c 'cp /tmp/telegram-debug.html /usr/share/nginx/html/' || 
    echo 'Could not copy debug file'"

success "✅ Исправления применены!"
echo ""
warning "📋 Следующие шаги:"
echo "1. Настройте домен supermock.ru в @BotFather (Bot Settings → Domain)"
echo "2. Откройте https://supermock.ru/telegram-debug.html для тестирования"
echo "3. Проверьте консоль браузера на ошибки"
echo ""
echo "🔍 Если проблема остается:"
echo "• Убедитесь что домен ТОЧНО настроен в BotFather"
echo "• Проверьте, что используется HTTPS"
echo "• Очистите кэш браузера"
