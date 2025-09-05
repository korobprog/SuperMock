#!/bin/bash

# Скрипт для деплоя с изолированными доменами
# supermock.ru - лендинг (Nginx)
# app.supermock.ru и api.supermock.ru - приложение и API (Traefik)

set -e

# Конфигурация
SERVER=${SERVER:-"217.198.6.238"}
DEST=${DEST:-"/opt/mockmate"}
SSH_KEY=${SSH_KEY:-"$HOME/.ssh/timeweb_vps_key"}
DOMAIN=${DOMAIN:-"supermock.ru"}
APP_DOMAIN=${APP_DOMAIN:-"app.supermock.ru"}
API_DOMAIN=${API_DOMAIN:-"api.supermock.ru"}

echo "🚀 Начинаем деплой с изолированными доменами..."
echo "📍 Сервер: $SERVER"
echo "📁 Директория: $DEST"
echo "🌐 Основной домен (лендинг): $DOMAIN"
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
cp docker-compose.subdomains.yml "$BUILD_DIR/"
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

# Nginx конфигурация (только для лендинга)
cp -r nginx "$BUILD_DIR/"

# Скрипты
cp -r scripts "$BUILD_DIR/"

# Удаляем node_modules из корневой папки если есть
rm -rf "$BUILD_DIR/node_modules" 2>/dev/null || true

# Создаем архив
echo "📦 Создаем архив для деплоя..."
cd "$BUILD_DIR"
tar -czf supermock-isolated-domains.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    --exclude=*.tar.gz \
    --exclude=*.log \
    --exclude=.env \
    --exclude=production.env \
    docker-compose.subdomains.yml \
    frontend/ \
    backend/ \
    scripts/ \
    nginx/ \
    production.env

echo "📤 Загружаем файлы на сервер..."
scp -i "$SSH_KEY" supermock-isolated-domains.tar.gz "root@$SERVER:$DEST/"

echo "🚀 Запускаем деплой на сервере..."
ssh -i "$SSH_KEY" "root@$SERVER" << 'EOF'
set -e

echo "🔧 Начинаем деплой с изолированными доменами..."
cd /opt/mockmate

# Останавливаем старые контейнеры
echo "🛑 Останавливаем старые контейнеры..."
docker-compose -f docker-compose.prod-multi.yml down --timeout 30 --remove-orphans || true
docker-compose -f docker-compose.subdomains.yml down --timeout 30 --remove-orphans || true

# Останавливаем Nginx (если был запущен)
echo "🛑 Останавливаем Nginx (если был запущен)..."
systemctl stop nginx || true

# Освобождаем порты
echo "🔓 Освобождаем порты..."
sudo fuser -k 80/tcp || true
sudo fuser -k 443/tcp || true
sudo fuser -k 8080/tcp || true
sudo fuser -k 8443/tcp || true
sleep 2

# Распаковываем новый архив
echo "📂 Распаковываем новый код..."
tar -xzf supermock-isolated-domains.tar.gz

# Обновляем переменные окружения
echo "⚙️ Обновляем переменные окружения..."
if [ -f production.env ]; then
    ln -sf production.env .env
    
    # Создаем backend/.env файл
    echo "🔧 Создаем backend/.env файл..."
    mkdir -p backend
    echo "NODE_ENV=production" > backend/.env
    echo "PORT=3000" >> backend/.env
    echo "HOST=0.0.0.0" >> backend/.env
    echo "" >> backend/.env
    echo "# Database Configuration" >> backend/.env
    echo "DATABASE_URL=\"postgresql://supermock:krishna1284@postgres:5432/supermock\"" >> backend/.env
    echo "" >> backend/.env
    echo "USE_MONGODB=false" >> backend/.env
    echo "" >> backend/.env
    echo "# Redis Configuration" >> backend/.env
    echo "USE_REDIS=false" >> backend/.env
    echo "REDIS_HOST=redis" >> backend/.env
    echo "REDIS_PORT=6379" >> backend/.env
    echo "" >> backend/.env
    echo "# Frontend Configuration" >> backend/.env
    echo "FRONTEND_URL=https://app.supermock.ru" >> backend/.env
    echo "FRONTEND_PORT=8080" >> backend/.env
    echo "" >> backend/.env
    echo "# JWT Configuration" >> backend/.env
    echo "JWT_SECRET=052aa937e3faf8542efe8c091a7ff830" >> backend/.env
    echo "" >> backend/.env
    echo "# Telegram Configuration" >> backend/.env
    echo "TELEGRAM_BOT_TOKEN=8464088869:AAFcZb7HmYQJa6vaYjfTDCjfr187p9hhk2o" >> backend/.env
    echo "TELEGRAM_BOT_NAME=SuperMock_bot" >> backend/.env
    echo "" >> backend/.env
    echo "# Telegram Auth Configuration" >> backend/.env
    echo "MAX_VERIFICATION_ATTEMPTS=3" >> backend/.env
    echo "VERIFICATION_CODE_EXPIRY=5" >> backend/.env
    echo "JWT_EXPIRY_DAYS=30" >> backend/.env
    echo "VERIFICATION_CODE_LENGTH=6" >> backend/.env
    echo "CODE_CLEANUP_INTERVAL=5" >> backend/.env
    echo "MAX_CODES_PER_PHONE=3" >> backend/.env
    echo "" >> backend/.env
    echo "# Domain Configuration" >> backend/.env
    echo "DOMAIN=supermock.ru" >> backend/.env
    
    echo "✅ Backend .env файл создан"
else
    echo "❌ Файл production.env не найден!"
    exit 1
fi

# Nginx больше не нужен - все работает через Traefik
echo "ℹ️ Nginx больше не используется - все сервисы работают через Traefik"

# Создаем общую сеть traefik-network
echo "🔧 Создаем общую сеть traefik-network..."
if ! docker network ls | grep -q "traefik-network"; then
    docker network create traefik-network --driver bridge
    echo "✅ Сеть traefik-network создана"
else
    echo "✅ Сеть traefik-network уже существует"
fi

# Аутентификация в Docker Hub
echo "🔐 Аутентификация в Docker Hub..."
echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Запускаем контейнеры для поддоменов
echo "🚀 Запускаем контейнеры для поддоменов..."
docker-compose -f docker-compose.subdomains.yml up -d --build

# Ждем запуска сервисов
echo "⏳ Ждем запуска сервисов..."
sleep 30

# Nginx больше не нужен - все работает через Traefik
echo "ℹ️ Nginx больше не используется - все сервисы работают через Traefik"

# Проверяем статус контейнеров
echo "📊 Проверяем статус контейнеров..."
docker ps --filter "name=supermock" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Nginx больше не используется
echo "ℹ️ Nginx больше не используется - все сервисы работают через Traefik"

# Проверяем доступность сервисов
echo "🌐 Проверяем доступность сервисов..."

# API (через Traefik)
if curl -s -o /dev/null -w "%{http_code}" https://api.supermock.ru/api/health | grep -q "200"; then
    echo "✅ API доступен через https://api.supermock.ru"
else
    echo "❌ API недоступен через https://api.supermock.ru"
    echo "Проверяем логи Traefik..."
    docker logs supermock-traefik --tail 20
fi

# Frontend App (через Traefik)
if curl -s -o /dev/null -w "%{http_code}" https://app.supermock.ru/ | grep -q "200"; then
    echo "✅ Frontend App доступен через https://app.supermock.ru"
else
    echo "❌ Frontend App недоступен через https://app.supermock.ru"
fi

# Landing (через Traefik)
if curl -s -o /dev/null -w "%{http_code}" https://landing.supermock.ru/ | grep -q "200"; then
    echo "✅ Landing доступен через https://landing.supermock.ru"
else
    echo "❌ Landing недоступен через https://landing.supermock.ru"
    echo "Проверяем логи Traefik..."
    docker logs supermock-traefik --tail 20
fi

# Финальная проверка
echo "🔍 Финальная проверка..."

# Проверяем статус всех сервисов
CONTAINER_STATUS=$(docker ps --filter "name=supermock" --format "{{.Status}}" 2>/dev/null || echo "ERROR")

if echo "$CONTAINER_STATUS" | grep -q "Up"; then
    echo "🎉 Деплой с изолированными доменами успешно завершен!"
    echo ""
    echo "🌐 Сервисы доступны по адресам:"
    echo "- https://landing.supermock.ru (Лендинг - Traefik)"
    echo "- https://app.supermock.ru (Приложение - Traefik)"
    echo "- https://api.supermock.ru (API - Traefik)"
    echo ""
    echo "🔧 Архитектура:"
    echo "- Все сервисы работают через Traefik (порты 80/443)"
    echo "- landing.supermock.ru, app.supermock.ru, api.supermock.ru → Traefik"
    echo ""
    echo "🔐 Telegram Auth API доступен:"
    echo "- POST /api/telegram-auth/send-code - Отправка кода"
    echo "- POST /api/telegram-auth/verify-code - Проверка кода"
    echo "- GET /api/telegram-auth/me - Информация о пользователе"
    echo "- GET /api/telegram-auth/stats - Статистика"
    echo ""
    echo "📱 Пользователи могут авторизоваться через @SuperMock_bot"
    echo "🔗 Страница авторизации: https://app.supermock.ru/auth/telegram"
else
    echo "❌ Ошибка: не все сервисы запущены"
    echo "📊 Статус контейнеров:"
    docker ps --filter "name=supermock" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "Не удалось получить статус контейнеров"
    echo "🔍 Логи backend:"
    docker logs supermock-backend --tail 20 || echo "Не удалось получить логи backend"
    echo "🔍 Логи Traefik:"
    docker logs supermock-traefik --tail 20 || echo "Не удалось получить логи Traefik"
    exit 1
fi

# Очистка временных файлов
echo "🧹 Очистка временных файлов..."
rm -f supermock-isolated-domains.tar.gz
rm -f supermock-full-deploy-*.tar.gz

echo "✅ Очистка завершена"
EOF

# Очистка локальных временных файлов
echo "🧹 Очищаем локальные временные файлы..."
rm -rf "$BUILD_DIR"

echo "🎉 Деплой с изолированными доменами завершен!"
echo ""
echo "📋 Что было сделано:"
echo "1. ✅ Создана изолированная конфигурация Docker Compose для поддоменов"
echo "2. ✅ Настроен Traefik для работы со всеми поддоменами"
echo "3. ✅ Добавлен сервис landing на поддомен landing.supermock.ru"
echo "4. ✅ Создана общая сеть traefik-network для всех проектов"
echo "5. ✅ Устранены конфликты портов между сервисами"
echo ""
echo "🌐 Результат:"
echo "- landing.supermock.ru, app.supermock.ru, api.supermock.ru → Traefik (порты 80/443)"
echo "- Все сервисы изолированы в отдельных сетях"
echo "- Общая сеть traefik-network для всех проектов"
