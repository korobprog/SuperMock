#!/bin/bash

echo "🔧 Быстрое исправление проблем с базой данных..."

cd /opt/mockmate

# 1. Проверяем логи backend
echo "1. Логи backend:"
docker logs supermock-backend --tail 10

# 2. Проверяем переменные окружения
echo "2. Переменные окружения:"
docker exec supermock-backend env | grep DATABASE_URL

# 3. Проверяем подключение к базе данных
echo "3. Подключение к базе данных:"
docker exec supermock-postgres psql -U supermock -d supermock -c "SELECT version();"

# 4. Проверяем таблицы
echo "4. Таблицы в базе данных:"
docker exec supermock-postgres psql -U supermock -d supermock -c "\dt"

# 5. Запускаем миграции Prisma
echo "5. Запускаем миграции Prisma..."
docker exec supermock-backend npx prisma migrate deploy

# 6. Генерируем клиент
echo "6. Генерируем Prisma клиент..."
docker exec supermock-backend npx prisma generate

# 7. Перезапускаем backend
echo "7. Перезапускаем backend..."
docker-compose -f docker-compose.prod.yml restart backend

# 8. Ждем и проверяем
echo "8. Ждем 20 секунд..."
sleep 20

# 9. Проверяем статус
echo "9. Статус контейнеров:"
docker ps

echo "✅ Готово!"

