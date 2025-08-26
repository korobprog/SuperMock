#!/bin/bash

echo "🚀 ЗАПУСК ПРИЛОЖЕНИЯ С БАЗОЙ ДАННЫХ"
echo "===================================="
echo ""

# Проверяем, что мы в корневой директории
if [ ! -f "package.json" ]; then
    echo "❌ Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Останавливаем все процессы
echo "1. Остановка старых процессов..."
pkill -f "vite\|pnpm.*frontend\|pnpm.*backend\|concurrently" 2>/dev/null || true
echo "   ✅ Старые процессы остановлены"

# Запускаем базу данных
echo ""
echo "2. Запуск базы данных..."
cd backend
if ./setup-dev-database.sh; then
    echo "   ✅ База данных запущена"
else
    echo "   ❌ Ошибка запуска базы данных"
    exit 1
fi

# Возвращаемся в корневую директорию
cd ..

# Запускаем приложение
echo ""
echo "3. Запуск приложения..."
if pnpm dev; then
    echo "   ✅ Приложение запущено"
else
    echo "   ❌ Ошибка запуска приложения"
    exit 1
fi

echo ""
echo "🎯 ПРИЛОЖЕНИЕ ЗАПУЩЕНО!"
echo "======================"
echo ""
echo "✅ Frontend: http://localhost:5173"
echo "✅ Backend: http://localhost:3000"
echo "✅ PostgreSQL: localhost:5432"
echo "✅ Redis: localhost:6379"
echo ""
echo "🔧 Теперь можно тестировать приложение с реальной базой данных!"
