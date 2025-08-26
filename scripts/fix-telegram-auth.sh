#!/usr/bin/env bash

# Скрипт для исправления Telegram авторизации
# Исправляет ошибку bot_id_required

set -Eeuo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции вывода
success() { printf "${GREEN}✅ %s${NC}\n" "$*"; }
error() { printf "${RED}❌ %s${NC}\n" "$*"; }
warning() { printf "${YELLOW}⚠️  %s${NC}\n" "$*"; }
info() { printf "${BLUE}ℹ️  %s${NC}\n" "$*"; }
step() { printf "\n${BLUE}==== %s ====${NC}\n" "$*"; }

# Переменные
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8464088869:AAFcZb7HmYQJa6vaYjfTDCjfr187p9hhk2o}"
BOT_ID="${TELEGRAM_BOT_ID:-8464088869}"
BOT_NAME="${TELEGRAM_BOT_NAME:-SuperMock_bot}"
DOMAIN="${DOMAIN:-supermock.ru}"

step "🤖 Диагностика Telegram бота"

# 1. Проверяем доступность бота
info "Проверяем доступность бота..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
if echo "$BOT_INFO" | grep -q '"ok":true'; then
    success "Бот доступен и активен"
    echo "$BOT_INFO" | jq .
else
    error "Бот недоступен или токен неверный"
    echo "$BOT_INFO"
    exit 1
fi

# 2. Проверяем настройки домена
step "🌐 Проверка настроек домена"
info "Внимание! Необходимо настроить домен в @BotFather:"
warning "1. Откройте @BotFather в Telegram"
warning "2. Отправьте команду: /mybots"
warning "3. Выберите бота: @${BOT_NAME}"
warning "4. Выберите: Bot Settings → Domain"
warning "5. Добавьте домен: ${DOMAIN}"
warning "6. Подтвердите настройку"

# 3. Проверяем переменные окружения
step "🔧 Проверка переменных окружения"
echo "Текущие настройки:"
echo "TELEGRAM_BOT_TOKEN: ${BOT_TOKEN:0:20}..."
echo "TELEGRAM_BOT_ID: ${BOT_ID}"
echo "TELEGRAM_BOT_NAME: ${BOT_NAME}"
echo "DOMAIN: ${DOMAIN}"

# 4. Создаем тестовую страницу для проверки
step "📝 Создание тестовой страницы"

cat > telegram-auth-test.html << EOF
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест Telegram авторизации</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .test-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🤖 Тест Telegram авторизации</h1>
    
    <div class="test-section">
        <h2>Настройки</h2>
        <p><strong>Bot ID:</strong> <span id="botId">${BOT_ID}</span></p>
        <p><strong>Bot Name:</strong> <span id="botName">${BOT_NAME}</span></p>
        <p><strong>Domain:</strong> <span id="domain">${DOMAIN}</span></p>
        <p><strong>Current URL:</strong> <span id="currentUrl"></span></p>
    </div>

    <div class="test-section">
        <h2>1. Официальный Telegram Login Widget</h2>
        <div id="telegram-login-widget"></div>
        <div id="auth-result"></div>
    </div>

    <div class="test-section">
        <h2>2. OAuth через popup</h2>
        <button onclick="testTelegramOAuth()">Тест OAuth авторизации</button>
        <div id="oauth-result"></div>
    </div>

    <div class="test-section">
        <h2>3. Переменные окружения (Frontend)</h2>
        <pre id="env-vars"></pre>
    </div>

    <div class="test-section">
        <h2>4. Диагностика</h2>
        <div id="diagnostic"></div>
    </div>

    <script>
        // Отображаем текущий URL
        document.getElementById('currentUrl').textContent = window.location.origin;

        // Функция для проверки переменных окружения
        function checkEnvironment() {
            const envVars = {
                'VITE_TELEGRAM_BOT_ID': '${BOT_ID}',
                'VITE_TELEGRAM_BOT_NAME': '${BOT_NAME}',
                'Domain': '${DOMAIN}'
            };
            
            document.getElementById('env-vars').textContent = JSON.stringify(envVars, null, 2);
        }

        // Создаем официальный Telegram Login Widget
        function createTelegramWidget() {
            const container = document.getElementById('telegram-login-widget');
            
            // Глобальная функция для callback
            window.onTelegramAuth = function(user) {
                document.getElementById('auth-result').innerHTML = 
                    '<div class="success">✅ Авторизация успешна!</div>' +
                    '<pre>' + JSON.stringify(user, null, 2) + '</pre>';
            };

            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            script.setAttribute('data-telegram-login', '${BOT_NAME}');
            script.setAttribute('data-size', 'large');
            script.setAttribute('data-auth-url', window.location.origin);
            script.setAttribute('data-request-access', 'write');
            script.setAttribute('data-lang', 'ru');
            script.setAttribute('data-onauth', 'onTelegramAuth');
            
            container.appendChild(script);
        }

        // Тест OAuth через popup
        function testTelegramOAuth() {
            const botId = '${BOT_ID}';
            const origin = window.location.origin;
            const authUrl = \`https://oauth.telegram.org/auth?bot_id=\${botId}&origin=\${encodeURIComponent(origin)}&request_access=write&return_to=\${encodeURIComponent(origin)}\`;
            
            document.getElementById('oauth-result').innerHTML = 
                '<div class="warning">⏳ Открываем popup для авторизации...</div>' +
                '<p>URL: <code>' + authUrl + '</code></p>';
            
            const popup = window.open(authUrl, 'telegram_auth', 'width=500,height=600');
            
            if (!popup) {
                document.getElementById('oauth-result').innerHTML = 
                    '<div class="error">❌ Не удалось открыть popup (заблокирован браузером)</div>';
                return;
            }

            // Слушаем сообщения от popup
            const handleMessage = (event) => {
                if (event.origin !== 'https://oauth.telegram.org') return;
                
                document.getElementById('oauth-result').innerHTML = 
                    '<div class="success">✅ Получены данные от Telegram!</div>' +
                    '<pre>' + JSON.stringify(event.data, null, 2) + '</pre>';
                
                popup.close();
                window.removeEventListener('message', handleMessage);
            };

            window.addEventListener('message', handleMessage);
            
            // Проверяем закрытие popup
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', handleMessage);
                }
            }, 1000);
        }

        // Диагностика
        function runDiagnostic() {
            const diagnostic = document.getElementById('diagnostic');
            let issues = [];
            
            // Проверяем HTTPS
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                issues.push('⚠️ Telegram требует HTTPS для авторизации');
            }
            
            // Проверяем домен
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                issues.push('⚠️ Localhost может не работать с Telegram авторизацией');
            }
            
            // Проверяем настройки
            const botId = '${BOT_ID}';
            const botName = '${BOT_NAME}';
            
            if (!botId || botId === 'undefined') {
                issues.push('❌ VITE_TELEGRAM_BOT_ID не настроен');
            }
            
            if (!botName || botName === 'undefined') {
                issues.push('❌ VITE_TELEGRAM_BOT_NAME не настроен');
            }
            
            if (issues.length === 0) {
                diagnostic.innerHTML = '<div class="success">✅ Базовая конфигурация выглядит правильно</div>' +
                    '<p>Если авторизация не работает, проверьте настройки домена в @BotFather</p>';
            } else {
                diagnostic.innerHTML = '<div class="error">Найдены проблемы:</div><ul>' +
                    issues.map(issue => '<li>' + issue + '</li>').join('') + '</ul>';
            }
        }

        // Инициализация
        checkEnvironment();
        createTelegramWidget();
        runDiagnostic();
    </script>
</body>
</html>
EOF

success "Создана тестовая страница: telegram-auth-test.html"

# 5. Проверяем API endpoint
step "🔌 Проверка API endpoint"
info "Проверяем /api/telegram-auth endpoint..."

API_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://api.supermock.ru/api/telegram-auth \
    -H "Content-Type: application/json" \
    -d '{"test": true}' || echo "000")

if [[ "$API_TEST" == "200" ]] || [[ "$API_TEST" == "400" ]] || [[ "$API_TEST" == "500" ]]; then
    success "API endpoint доступен (HTTP $API_TEST)"
else
    warning "API endpoint может быть недоступен (HTTP $API_TEST)"
fi

step "📋 Итоги и рекомендации"

echo "Для исправления ошибки bot_id_required выполните следующие шаги:"
echo ""
echo "1. 🤖 Настройте домен в @BotFather:"
echo "   - Откройте @BotFather в Telegram"
echo "   - /mybots → @${BOT_NAME} → Bot Settings → Domain"
echo "   - Добавьте: ${DOMAIN}"
echo ""
echo "2. 🌐 Откройте тестовую страницу:"
echo "   - Загрузите telegram-auth-test.html на ваш сервер"
echo "   - Откройте https://${DOMAIN}/telegram-auth-test.html"
echo "   - Проверьте авторизацию"
echo ""
echo "3. 🔧 Если проблема остается:"
echo "   - Проверьте переменные окружения в frontend"
echo "   - Убедитесь, что домен точно настроен в BotFather"
echo "   - Проверьте CORS настройки"
echo ""
success "Диагностика завершена! Используйте рекомендации выше."
