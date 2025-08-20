#!/bin/bash

# Скрипт для подготовки проекта к продакшену
# Проверяет все необходимые файлы и настройки

set -e

echo "🔧 Подготовка проекта к продакшену..."

# Проверка наличия необходимых файлов
echo "📋 Проверка файлов..."

REQUIRED_FILES=(
    "docker-compose.prod.yml"
    "production.env"
    "frontend/Dockerfile"
    "backend/Dockerfile"
    "frontend/nginx.conf"
    "backend/prisma/schema.prisma"
    "package.json"
    "pnpm-lock.yaml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Файл $file не найден"
        exit 1
    else
        echo "✅ $file"
    fi
done

# Проверка production environment
echo "🔍 Проверка production environment..."

# Проверяем, что все необходимые переменные есть в production.env
REQUIRED_VARS=(
    "DATABASE_URL"
    "POSTGRES_DB"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "TELEGRAM_BOT_TOKEN"
    "VITE_TELEGRAM_BOT_NAME"
    "VITE_TELEGRAM_BOT_ID"
    "FRONTEND_URL"
    "BACKEND_URL"
    "VITE_API_URL"
    "SESSION_SECRET"
    "JWT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" production.env; then
        echo "❌ Переменная $var не найдена в production.env"
        exit 1
    else
        echo "✅ $var"
    fi
done

# Проверка Dockerfile'ов
echo "🐳 Проверка Dockerfile'ов..."

# Проверяем frontend Dockerfile
if ! grep -q "VITE_API_URL" frontend/Dockerfile; then
    echo "❌ VITE_API_URL не найден в frontend/Dockerfile"
    exit 1
fi

if ! grep -q "VITE_TELEGRAM_BOT_NAME" frontend/Dockerfile; then
    echo "❌ VITE_TELEGRAM_BOT_NAME не найден в frontend/Dockerfile"
    exit 1
fi

if ! grep -q "VITE_TELEGRAM_BOT_ID" frontend/Dockerfile; then
    echo "❌ VITE_TELEGRAM_BOT_ID не найден в frontend/Dockerfile"
    exit 1
fi

echo "✅ Frontend Dockerfile"

# Проверяем backend Dockerfile
if ! grep -q "prisma generate" backend/Dockerfile; then
    echo "❌ prisma generate не найден в backend/Dockerfile"
    exit 1
fi

echo "✅ Backend Dockerfile"

# Проверка Prisma schema
echo "🗄️  Проверка Prisma schema..."

if ! grep -q "model UserTool" backend/prisma/schema.prisma; then
    echo "❌ Модель UserTool не найдена в Prisma schema"
    exit 1
fi

if ! grep -q "model User" backend/prisma/schema.prisma; then
    echo "❌ Модель User не найдена в Prisma schema"
    exit 1
fi

echo "✅ Prisma schema"

# Проверка package.json
echo "📦 Проверка package.json..."

if ! grep -q '"build"' package.json; then
    echo "❌ Скрипт build не найден в package.json"
    exit 1
fi

echo "✅ package.json"

# Проверка docker-compose.prod.yml
echo "🐳 Проверка docker-compose.prod.yml..."

if ! grep -q "supermock-frontend" docker-compose.prod.yml; then
    echo "❌ Сервис supermock-frontend не найден в docker-compose.prod.yml"
    exit 1
fi

if ! grep -q "supermock-backend" docker-compose.prod.yml; then
    echo "❌ Сервис supermock-backend не найден в docker-compose.prod.yml"
    exit 1
fi

if ! grep -q "traefik" docker-compose.prod.yml; then
    echo "❌ Traefik labels не найдены в docker-compose.prod.yml"
    exit 1
fi

echo "✅ docker-compose.prod.yml"

# Проверка nginx.conf
echo "🌐 Проверка nginx.conf..."

if [ ! -f "frontend/nginx.conf" ]; then
    echo "❌ nginx.conf не найден"
    exit 1
fi

echo "✅ nginx.conf"

# Проверка .dockerignore
echo "🚫 Проверка .dockerignore..."

if [ ! -f ".dockerignore" ]; then
    echo "❌ .dockerignore не найден"
    exit 1
fi

echo "✅ .dockerignore"

# Проверка переменных окружения
echo "🔐 Проверка переменных окружения..."

# Проверяем, что DATABASE_URL не содержит пробелов (исключая комментарии)
if grep -v "^#" production.env | grep -q "Super Mock"; then
    echo "❌ DATABASE_URL содержит пробелы в имени пользователя/базы данных"
    echo "   Исправьте на: supermock"
    exit 1
fi

echo "✅ Переменные окружения"

# Проверка SSL настроек
echo "🔒 Проверка SSL настроек..."

if ! grep -q "letsencrypt" docker-compose.prod.yml; then
    echo "❌ LetsEncrypt не настроен в docker-compose.prod.yml"
    exit 1
fi

echo "✅ SSL настройки"

# Проверка доменов
echo "🌍 Проверка доменов..."

if ! grep -q "supermock.ru" production.env; then
    echo "❌ Домен supermock.ru не найден в production.env"
    exit 1
fi

if ! grep -q "api.supermock.ru" production.env; then
    echo "❌ Домен api.supermock.ru не найден в production.env"
    exit 1
fi

echo "✅ Домены"

# Проверка Telegram Bot настроек
echo "🤖 Проверка Telegram Bot настроек..."

if ! grep -q "TELEGRAM_BOT_TOKEN" production.env; then
    echo "❌ TELEGRAM_BOT_TOKEN не найден в production.env"
    exit 1
fi

if ! grep -q "VITE_TELEGRAM_BOT_NAME" production.env; then
    echo "❌ VITE_TELEGRAM_BOT_NAME не найден в production.env"
    exit 1
fi

if ! grep -q "VITE_TELEGRAM_BOT_ID" production.env; then
    echo "❌ VITE_TELEGRAM_BOT_ID не найден в production.env"
    exit 1
fi

echo "✅ Telegram Bot настройки"

# Проверка TURN сервера
echo "🔄 Проверка TURN сервера..."

if ! grep -q "VITE_TURN_URL" production.env; then
    echo "❌ VITE_TURN_URL не найден в production.env"
    exit 1
fi

if ! grep -q "TURN_AUTH_SECRET" production.env; then
    echo "❌ TURN_AUTH_SECRET не найден в production.env"
    exit 1
fi

echo "✅ TURN сервер"

# Проверка безопасности
echo "🛡️  Проверка безопасности..."

if ! grep -q "SESSION_SECRET" production.env; then
    echo "❌ SESSION_SECRET не найден в production.env"
    exit 1
fi

if ! grep -q "JWT_SECRET" production.env; then
    echo "❌ JWT_SECRET не найден в production.env"
    exit 1
fi

echo "✅ Безопасность"

# Проверка производительности
echo "⚡ Проверка производительности..."

if ! grep -q "WORKERS" production.env; then
    echo "❌ WORKERS не найден в production.env"
    exit 1
fi

if ! grep -q "REQUEST_TIMEOUT" production.env; then
    echo "❌ REQUEST_TIMEOUT не найден в production.env"
    exit 1
fi

echo "✅ Производительность"

echo ""
echo "🎉 Все проверки пройдены успешно!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Убедитесь, что SSH ключи настроены для сервера"
echo "2. Проверьте, что сервер доступен: ssh dokploy-server"
echo "3. Запустите деплой: ./scripts/deploy/deploy-all.sh"
echo ""
echo "🔗 Полезные команды:"
echo "- Проверка статуса: ssh dokploy-server 'docker ps'"
echo "- Просмотр логов: ssh dokploy-server 'docker logs supermock-backend'"
echo "- Проверка сайта: curl https://supermock.ru"
echo "- Проверка API: curl https://api.supermock.ru/api/health"
