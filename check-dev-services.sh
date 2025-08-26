#!/bin/bash

echo "🔍 ПРОВЕРКА ВСЕХ СЕРВИСОВ В DEV РЕЖИМЕ"
echo "======================================"
echo ""

# Проверяем Docker контейнеры
echo "1. Проверка Docker контейнеров..."
if docker ps | grep -q "supermock-postgres-dev"; then
    echo "   ✅ PostgreSQL запущен"
else
    echo "   ❌ PostgreSQL не запущен"
fi

if docker ps | grep -q "supermock-redis-dev"; then
    echo "   ✅ Redis запущен"
else
    echo "   ❌ Redis не запущен"
fi

# Проверяем порты
echo ""
echo "2. Проверка портов..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ Backend работает (порт 3000)"
else
    echo "   ❌ Backend не отвечает (порт 3000)"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend работает (порт 5173)"
else
    echo "   ❌ Frontend не отвечает (порт 5173)"
fi

# Проверяем базу данных
echo ""
echo "3. Проверка базы данных..."
if docker exec supermock-postgres-dev pg_isready -U supermock -d supermock_dev > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL доступен"
else
    echo "   ❌ PostgreSQL недоступен"
fi

if docker exec supermock-redis-dev redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis доступен"
else
    echo "   ❌ Redis недоступен"
fi

echo ""
echo "📋 СТАТУС СЕРВИСОВ:"
echo "=================="
echo ""

# Подсчитываем количество работающих сервисов
services_running=0
total_services=4

if docker ps | grep -q "supermock-postgres-dev"; then ((services_running++)); fi
if docker ps | grep -q "supermock-redis-dev"; then ((services_running++)); fi
if curl -s http://localhost:3000/health > /dev/null 2>&1; then ((services_running++)); fi
if curl -s http://localhost:5173 > /dev/null 2>&1; then ((services_running++)); fi

echo "Работает сервисов: $services_running из $total_services"

if [ $services_running -eq $total_services ]; then
    echo "🎯 ВСЕ СЕРВИСЫ РАБОТАЮТ!"
    echo "✅ Приложение готово к тестированию"
else
    echo "⚠️ НЕ ВСЕ СЕРВИСЫ РАБОТАЮТ"
    echo "🔧 Запустите: ./start-dev-with-db.sh"
fi

echo ""
echo "🔧 КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ:"
echo "========================="
echo "• Запуск всех сервисов: ./start-dev-with-db.sh"
echo "• Остановка базы данных: cd backend && docker compose -f docker-compose.dev-db.yml down"
echo "• Проверка статуса: ./check-dev-services.sh"
echo "• Логи backend: cd backend && pnpm dev"
echo "• Логи frontend: cd frontend && pnpm dev"
