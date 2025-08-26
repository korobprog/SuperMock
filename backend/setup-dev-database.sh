#!/bin/bash

echo "🗄️ НАСТРОЙКА БАЗЫ ДАННЫХ ДЛЯ DEV РЕЖИМА"
echo "========================================"
echo ""

# Проверяем Docker
echo "1. Проверка Docker..."
if command -v docker &> /dev/null; then
    echo "   ✅ Docker установлен"
else
    echo "   ❌ Docker не установлен"
    exit 1
fi

# Останавливаем старые контейнеры
echo ""
echo "2. Остановка старых контейнеров..."
docker compose -f docker-compose.dev-db.yml down 2>/dev/null || true
echo "   ✅ Старые контейнеры остановлены"

# Запускаем базу данных
echo ""
echo "3. Запуск PostgreSQL и Redis..."
docker compose -f docker-compose.dev-db.yml up -d
echo "   ✅ База данных запущена"

# Ждем запуска базы данных
echo ""
echo "4. Ожидание запуска базы данных..."
sleep 10

# Проверяем статус контейнеров
echo ""
echo "5. Проверка статуса контейнеров..."
if docker ps | grep -q "supermock-postgres-dev"; then
    echo "   ✅ PostgreSQL запущен"
else
    echo "   ❌ PostgreSQL не запущен"
    exit 1
fi

if docker ps | grep -q "supermock-redis-dev"; then
    echo "   ✅ Redis запущен"
else
    echo "   ❌ Redis не запущен"
    exit 1
fi

# Настраиваем .env файл
echo ""
echo "6. Настройка .env файла..."
if [ ! -f ".env.development" ]; then
    echo "   ❌ .env.development не найден"
    exit 1
fi

cp .env.development .env
echo "   ✅ .env файл настроен"

# Запускаем миграции Prisma
echo ""
echo "7. Запуск миграций Prisma..."
if npx prisma db push; then
    echo "   ✅ Миграции выполнены"
else
    echo "   ❌ Ошибка миграций"
    exit 1
fi

echo ""
echo "📋 НАСТРОЙКА ЗАВЕРШЕНА!"
echo "======================"
echo ""
echo "✅ PostgreSQL: localhost:5432"
echo "✅ Redis: localhost:6379"
echo "✅ База данных: supermock_dev"
echo "✅ Пользователь: supermock"
echo "✅ Пароль: supermock123"
echo ""
echo "🔧 Следующие шаги:"
echo "1. Запустите backend: pnpm dev"
echo "2. Запустите frontend: cd ../frontend && pnpm dev"
echo "3. Откройте http://localhost:5173"
echo ""
echo "🎯 СТАТУС: БАЗА ДАННЫХ ГОТОВА К РАБОТЕ!"
