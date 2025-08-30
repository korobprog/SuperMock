#!/bin/bash

# 🔧 СКРИПТ ДЛЯ ИСПРАВЛЕНИЯ DEV РЕЖИМА
# Исправляет основные проблемы в dev режиме

echo "🔧 Исправляем dev режим..."

# 1. Проверяем и создаем .env.development
if [ ! -f "frontend/.env.development" ]; then
    echo "📝 Создаем .env.development..."
    cat > frontend/.env.development << 'ENVEOF'
VITE_TELEGRAM_BOT_NAME=SuperMockTest_bot
VITE_TELEGRAM_BOT_ID=8213869730
VITE_API_URL=http://localhost:3000
VITE_ENABLE_DEV_TEST_ACCOUNTS=true
VITE_ENABLE_DEMO_MODE=true
ENVEOF
    echo "✅ .env.development создан"
else
    echo "✅ .env.development уже существует"
fi

# 2. Копируем логотип в public
if [ ! -f "public/logo_main.png" ]; then
    echo "🖼️ Копируем логотип в public..."
    cp frontend/src/pic/logo_main.png public/
    echo "✅ Логотип скопирован"
else
    echo "✅ Логотип уже в public"
fi

# 3. Проверяем backend
echo "🔍 Проверяем backend..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend работает на порту 3000"
else
    echo "⚠️ Backend не запущен на порту 3000"
    echo "   Запустите: pnpm dev:backend"
fi

# 4. Проверяем переменные окружения
echo "🔍 Проверяем переменные окружения..."
if [ -f "frontend/.env.development" ]; then
    echo "✅ .env.development найден"
    echo "📋 Содержимое:"
    cat frontend/.env.development
else
    echo "❌ .env.development не найден"
fi

echo ""
echo "🎉 Исправления завершены!"
echo ""
echo "📋 Что исправлено:"
echo "   ✅ Переменные окружения для dev режима"
echo "   ✅ Логотип в правильном месте"
echo "   ✅ Проверка backend"
echo ""
echo "🚀 Теперь перезапустите dev сервер:"
echo "   pnpm dev"
echo ""
echo "🔍 Если проблемы остались, проверьте:"
echo "   1. Backend запущен на порту 3000"
echo "   2. Frontend запущен на порту 5173"
echo "   3. Браузер обновлен (Ctrl+F5)"
