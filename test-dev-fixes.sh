#!/bin/bash

echo "🧪 Тестирование исправлений в dev режиме..."

# Проверяем, что frontend работает
echo "🔍 Проверяем frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend работает на порту 5173"
else
    echo "❌ Frontend не отвечает на порту 5173"
    echo "Запустите: pnpm dev:frontend"
    exit 1
fi

# Проверяем, что backend не нужен (должен работать без него)
echo "🔍 Проверяем backend..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend работает на порту 3000 (не критично)"
else
    echo "✅ Backend не работает (ожидаемо в dev режиме)"
fi

echo ""
echo "📋 Инструкции для тестирования:"
echo "1. Откройте http://localhost:5173 в браузере"
echo "2. Нажмите '🧪 Enable Demo' в оранжевом баннере"
echo "3. Проверьте консоль браузера (F12) на наличие сообщений:"
echo "   - 🔧 Dev mode: continuing without backend initialization"
echo "   - 🔧 Dev mode: using demo tools (backend unavailable)"
echo "   - 🔧 Dev mode: saving tools locally"
echo "4. Приложение должно работать без ошибок backend"

echo ""
echo "🔍 Ожидаемые сообщения в консоли:"
echo "✅ 🔧 Dev mode detected, skipping IP geolocation for faster startup"
echo "✅ �� Dev mode: continuing without backend initialization"
echo "✅ 🔧 Dev mode: using demo tools (backend unavailable)"
echo "✅ 🔧 Dev mode: saving tools locally"

echo ""
echo "❌ Если видите ошибки:"
echo "- 'Failed to load user tools' - исправлено"
echo "- 'API Init error' - исправлено"
echo "- 'Get user tools failed' - исправлено"

echo ""
echo "✅ Все исправления применены и готовы к тестированию!"
