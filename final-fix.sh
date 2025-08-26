#!/bin/bash

echo "🔧 Финальное исправление проблем..."

cd /opt/mockmate

# 1. Проверяем логи backend
echo "1. Проверяем логи backend..."
docker logs supermock-backend --tail 30

# 2. Проверяем переменные окружения в контейнере
echo "2. Проверяем переменные окружения в контейнере..."
docker exec supermock-backend env | grep -E "(DATABASE_URL|POSTGRES)"

# 3. Проверяем подключение к базе данных из контейнера backend
echo "3. Проверяем подключение к базе данных из контейнера backend..."
docker exec supermock-backend wget -qO- http://localhost:3000/api/health || echo "Backend не отвечает"

# 4. Проверяем миграции Prisma
echo "4. Проверяем миграции Prisma..."
docker exec supermock-backend npx prisma migrate status 2>/dev/null || echo "Prisma не настроен"

# 5. Запускаем миграции если нужно
echo "5. Запускаем миграции Prisma..."
docker exec supermock-backend npx prisma migrate deploy 2>/dev/null || echo "Ошибка миграций"

# 6. Генерируем Prisma клиент
echo "6. Генерируем Prisma клиент..."
docker exec supermock-backend npx prisma generate 2>/dev/null || echo "Ошибка генерации"

# 7. Перезапускаем backend
echo "7. Перезапускаем backend..."
docker-compose -f docker-compose.prod.yml restart backend

# 8. Ждем и проверяем
echo "8. Ждем 30 секунд..."
sleep 30

# 9. Проверяем статус
echo "9. Проверяем статус контейнеров..."
docker ps

# 10. Проверяем health check
echo "10. Проверяем health check backend..."
docker exec supermock-backend wget -qO- http://localhost:3000/api/health

echo "✅ Готово!"
