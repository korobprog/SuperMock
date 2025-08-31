#!/bin/bash

# Скрипт для деплоя multi-domain конфигурации
# supermock.ru - лендинг
# app.supermock.ru - приложение
# api.supermock.ru - API

set -e

# Конфигурация
SERVER=${SERVER:-"217.198.6.238"}
DEST=${DEST:-"/opt/mockmate"}
SSH_KEY=${SSH_KEY:-"$HOME/.ssh/timeweb_vps_key"}
DOMAIN=${DOMAIN:-"supermock.ru"}
APP_DOMAIN=${APP_DOMAIN:-"app.supermock.ru"}
API_DOMAIN=${API_DOMAIN:-"api.supermock.ru"}

echo "🚀 Начинаем деплой multi-domain конфигурации..."
echo "📍 Сервер: $SERVER"
echo "📁 Директория: $DEST"
echo "🌐 Основной домен: $DOMAIN"
echo "📱 Домен приложения: $APP_DOMAIN"
echo "🔌 Домен API: $API_DOMAIN"

# Проверяем наличие SSH ключа
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH ключ не найден: $SSH_KEY"
    exit 1
fi

# Создаем временную директорию для сборки
BUILD_DIR=$(mktemp -d)
echo "📦 Создаем временную директорию: $BUILD_DIR"

# Копируем необходимые файлы
echo "📋 Копируем файлы проекта..."

# Основные файлы
cp docker-compose.prod-multi.yml "$BUILD_DIR/"
cp production.env "$BUILD_DIR/"
cp package.json "$BUILD_DIR/"
cp pnpm-lock.yaml "$BUILD_DIR/"
cp pnpm-workspace.yaml "$BUILD_DIR/"

# Backend (исключаем node_modules)
cp -r backend "$BUILD_DIR/"
rm -rf "$BUILD_DIR/backend/node_modules"

# Frontend приложение (исключаем node_modules)
cp -r frontend "$BUILD_DIR/"
rm -rf "$BUILD_DIR/frontend/node_modules"

# Лендинг (исключаем node_modules)
cp -r Lading "$BUILD_DIR/"
rm -rf "$BUILD_DIR/Lading/supermock-ai-interview/node_modules"

# Nginx конфигурация
cp -r nginx "$BUILD_DIR/"

# Скрипты
cp -r scripts "$BUILD_DIR/"

# Public папка
cp -r public "$BUILD_DIR/"

# Удаляем node_modules из корневой папки если есть
rm -rf "$BUILD_DIR/node_modules"

# Создаем .env файл для production
cat > "$BUILD_DIR/.env" << EOF
# Multi-domain конфигурация
NODE_ENV=production
DOMAIN_NAME=$DOMAIN
APP_DOMAIN=$APP_DOMAIN
API_DOMAIN=$API_DOMAIN

# База данных
POSTGRES_DB=supermock
POSTGRES_USER=supermock
POSTGRES_PASSWORD=krishna1284
DATABASE_URL=postgresql://supermock:krishna1284@postgres:5432/supermock

# Redis
REDIS_PASSWORD=supermock_redis_2024

# Приложение
PORT=3000
JWT_SECRET=f0cf01026e91c1a40865ac15459e81fb
SESSION_SECRET=c7bee247bc9a10ce3b15ebe08429fab0afc1cbb94b1eec72ea64257f5fe5e9d3

# Telegram Bot
TELEGRAM_BOT_TOKEN=8464088869:AAFcZb7HmYQJa6vaYjfTDCjfr187p9hhk2o
TELEGRAM_BOT_ID=8464088869
TELEGRAM_BOT_NAME=SuperMock_bot
VITE_TELEGRAM_BOT_NAME=SuperMock_bot
VITE_TELEGRAM_BOT_ID=8464088869

# URLs
FRONTEND_URL=https://$APP_DOMAIN
BACKEND_URL=https://$API_DOMAIN
VITE_API_URL=https://$API_DOMAIN

# Jitsi
VITE_JITSI_URL=https://meet.jit.si

# WebRTC
VITE_STUN_URLS=stun:stun.l.google.com:19302
VITE_TURN_URL=turn:217.198.6.238:3478
VITE_TURN_USERNAME=supermock
VITE_TURN_PASSWORD=supermock_turn_secret_2024_very_long_and_secure_key_for_webrtc

# TURN Server
TURN_REALM=supermock.ru
TURN_SECRET=supermock_turn_secret_2024_very_long_and_secure_key_for_webrtc

# CORS
CORS_ORIGIN=https://$APP_DOMAIN

# Redis
USE_REDIS=true
REDIS_HOST=redis
REDIS_PORT=6379
EOF

# Создаем скрипт для настройки SSL сертификатов
cat > "$BUILD_DIR/setup-ssl.sh" << 'EOF'
#!/bin/bash

# Скрипт для настройки SSL сертификатов

DOMAIN=${1:-"supermock.ru"}
APP_DOMAIN=${2:-"app.supermock.ru"}
API_DOMAIN=${3:-"api.supermock.ru"}

echo "🔐 Настраиваем SSL сертификаты для доменов:"
echo "  - $DOMAIN"
echo "  - $APP_DOMAIN"
echo "  - $API_DOMAIN"

# Создаем директории для сертификатов
mkdir -p /etc/nginx/ssl/live/$DOMAIN
mkdir -p /etc/nginx/ssl/live/$APP_DOMAIN
mkdir -p /etc/nginx/ssl/live/$API_DOMAIN

# Генерируем самоподписанные сертификаты (временные)
echo "📝 Генерируем временные сертификаты..."

# Основной домен
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/live/$DOMAIN/privkey.pem \
    -out /etc/nginx/ssl/live/$DOMAIN/fullchain.pem \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=SuperMock/CN=$DOMAIN"

# Домен приложения
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/live/$APP_DOMAIN/privkey.pem \
    -out /etc/nginx/ssl/live/$APP_DOMAIN/fullchain.pem \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=SuperMock/CN=$APP_DOMAIN"

# Домен API
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/live/$API_DOMAIN/privkey.pem \
    -out /etc/nginx/ssl/live/$API_DOMAIN/fullchain.pem \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=SuperMock/CN=$API_DOMAIN"

echo "✅ SSL сертификаты настроены"
echo "⚠️  ВНИМАНИЕ: Используются самоподписанные сертификаты!"
echo "   Для production используйте Let's Encrypt или другие CA"
EOF

chmod +x "$BUILD_DIR/setup-ssl.sh"

# Создаем скрипт для запуска
cat > "$BUILD_DIR/start.sh" << 'EOF'
#!/bin/bash

# Скрипт для запуска multi-domain приложения

echo "🚀 Запускаем multi-domain приложение..."

# Останавливаем старые контейнеры
echo "🛑 Останавливаем старые контейнеры..."
docker-compose -f docker-compose.prod-multi.yml down || true

# Удаляем старые образы
echo "🗑️ Удаляем старые образы..."
docker system prune -f

# Строим новые образы
echo "🔨 Строим новые образы..."
docker-compose -f docker-compose.prod-multi.yml build --no-cache

# Запускаем приложение
echo "▶️ Запускаем приложение..."
docker-compose -f docker-compose.prod-multi.yml up -d

# Проверяем статус
echo "📊 Проверяем статус контейнеров..."
docker-compose -f docker-compose.prod-multi.yml ps

echo "✅ Приложение запущено!"
echo "🌐 Лендинг: https://supermock.ru"
echo "📱 Приложение: https://app.supermock.ru"
echo "🔌 API: https://api.supermock.ru"
EOF

chmod +x "$BUILD_DIR/start.sh"

# Создаем скрипт для мониторинга
cat > "$BUILD_DIR/monitor.sh" << 'EOF'
#!/bin/bash

# Скрипт для мониторинга приложения

echo "📊 Мониторинг multi-domain приложения"
echo "======================================"

# Статус контейнеров
echo "🐳 Статус контейнеров:"
docker-compose -f docker-compose.prod-multi.yml ps

echo ""
echo "📈 Логи последних ошибок:"
docker-compose -f docker-compose.prod-multi.yml logs --tail=50 | grep -i error || echo "Ошибок не найдено"

echo ""
echo "🌐 Проверка доступности:"
curl -s -o /dev/null -w "Лендинг (supermock.ru): %{http_code}\n" https://supermock.ru || echo "Лендинг недоступен"
curl -s -o /dev/null -w "Приложение (app.supermock.ru): %{http_code}\n" https://app.supermock.ru || echo "Приложение недоступно"
curl -s -o /dev/null -w "API (api.supermock.ru): %{http_code}\n" https://api.supermock.ru || echo "API недоступен"

echo ""
echo "💾 Использование диска:"
df -h

echo ""
echo "🧠 Использование памяти:"
free -h
EOF

chmod +x "$BUILD_DIR/monitor.sh"

# Архивируем проект
echo "📦 Архивируем проект..."
cd "$BUILD_DIR"
tar -czf supermock-multi-domain.tar.gz ./*

# Копируем на сервер
echo "📤 Копируем на сервер..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no supermock-multi-domain.tar.gz root@"$SERVER":"$DEST/"

# Подключаемся к серверу и разворачиваем
echo "🔧 Разворачиваем на сервере..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@"$SERVER" << EOF
    set -e
    
    echo "📁 Переходим в директорию проекта..."
    cd $DEST
    
    echo "📦 Распаковываем архив..."
    tar -xzf supermock-multi-domain.tar.gz
    rm supermock-multi-domain.tar.gz
    
    echo "🔐 Настраиваем SSL сертификаты..."
    ./setup-ssl.sh $DOMAIN $APP_DOMAIN $API_DOMAIN
    
    echo "🚀 Запускаем приложение..."
    ./start.sh
    
    echo "📊 Проверяем статус..."
    ./monitor.sh
    
    echo "✅ Деплой завершен!"
EOF

# Очищаем временную директорию
echo "🧹 Очищаем временные файлы..."
rm -rf "$BUILD_DIR"

echo "🎉 Деплой multi-domain конфигурации завершен!"
echo ""
echo "📋 Ссылки:"
echo "  🌐 Лендинг: https://$DOMAIN"
echo "  📱 Приложение: https://$APP_DOMAIN"
echo "  🔌 API: https://$API_DOMAIN"
echo ""
echo "📊 Мониторинг: ssh root@$SERVER 'cd $DEST && ./monitor.sh'"
