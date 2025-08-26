#!/bin/bash

echo "🔄 Resetting Super Mock database..."

# Останавливаем контейнеры
echo "🐳 Stopping database containers..."
docker compose -f docker-compose.dev.yml --env-file dev.env down

# Удаляем volumes
echo "🗑️ Removing database volumes..."
docker volume rm supermock_postgres_data supermock_postgres_secondary_data supermock_redis_data 2>/dev/null || true

# Запускаем контейнеры заново
echo "🐳 Starting fresh database containers..."
docker compose -f docker-compose.dev.yml --env-file dev.env up -d postgres postgres_secondary redis

# Ждем готовности базы данных
echo "⏳ Waiting for database to be ready..."
sleep 10

# Сбрасываем базу данных через Prisma
echo "🔄 Resetting database schema..."
npx prisma db push --schema backend/prisma/schema.prisma --force-reset

echo "✅ Database reset completed!"
