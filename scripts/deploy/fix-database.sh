#!/bin/bash

# Скрипт для автоматического исправления проблем с базой данных
# Выполняет миграции и синхронизацию схемы Prisma

set -e

echo "🔧 Автоматическое исправление базы данных..."

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен"
    exit 1
fi

ssh dokploy-server << 'EOF'

echo "🔧 Исправление базы данных на сервере..."

cd /opt/mockmate

# Проверяем, что контейнер бэкенда запущен
if ! docker ps | grep -q supermock-backend; then
    echo "❌ Контейнер бэкенда не запущен"
    exit 1
fi

echo "📊 Проверка статуса миграций..."
docker exec supermock-backend npx prisma migrate status

echo "🔄 Применение миграций..."
docker exec supermock-backend npx prisma migrate deploy || true

echo "🔄 Синхронизация схемы базы данных (если миграции не применились)..."
docker exec supermock-backend npx prisma db push --accept-data-loss

echo "🔧 Генерация Prisma Client..."
docker exec supermock-backend npx prisma generate --schema backend/prisma/schema.prisma

echo "🔄 Перезапуск бэкенда для применения изменений..."
docker restart supermock-backend

echo "⏳ Ожидание запуска бэкенда..."
sleep 15

# Проверка здоровья
echo "🏥 Проверка здоровья бэкенда..."
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Бэкенд работает корректно"
else
    echo "⚠️  Бэкенд может быть еще не готов"
fi

echo "✅ Исправление базы данных завершено!"

EOF

echo "✅ Скрипт исправления базы данных выполнен!"
