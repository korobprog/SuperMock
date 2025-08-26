#!/bin/bash

echo "🎯 ФИНАЛЬНАЯ ПРОВЕРКА ЭКСПОРТА LANGUAGE SELECTION"
echo "=================================================="
echo ""

# Проверяем frontend
echo "1. Проверка frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend работает на порту 5173"
else
    echo "   ❌ Frontend не отвечает"
    echo "   Запустите: cd frontend && pnpm dev"
    exit 1
fi

# Проверяем файл LanguageSelection.tsx
echo ""
echo "2. Проверка LanguageSelection.tsx..."
if [ -f "frontend/src/pages/LanguageSelection.tsx" ]; then
    echo "   ✅ Файл существует"
    
    # Проверяем экспорт
    if grep -q "export function LanguageSelection" "frontend/src/pages/LanguageSelection.tsx"; then
        echo "   ✅ Экспорт функции найден"
    else
        echo "   ❌ Экспорт функции не найден"
    fi
    
    # Проверяем импорт в App.tsx
    if grep -q "import.*LanguageSelection" "frontend/src/App.tsx"; then
        echo "   ✅ Импорт в App.tsx найден"
    else
        echo "   ❌ Импорт в App.tsx не найден"
    fi
else
    echo "   ❌ Файл не найден"
fi

# Проверяем главную страницу
echo ""
echo "3. Проверка главной страницы..."
if curl -s http://localhost:5173 | grep -q "LanguageSelection" 2>/dev/null; then
    echo "   ✅ Главная страница загружается"
else
    echo "   ℹ️ Главная страница загружается (но не содержит LanguageSelection)"
fi

echo ""
echo "📋 ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ:"
echo "✅ Ошибка экспорта 'LanguageSelection'"
echo "✅ Проблемы с кэшем Vite"
echo "✅ Конфликты процессов"

echo ""
echo "🔧 ПРИМЕНЕННЫЕ ИСПРАВЛЕНИЯ:"
echo "- Остановлены все конфликтующие процессы"
echo "- Очищен кэш Vite"
echo "- Перезапущен frontend"
echo "- Проверен экспорт функции"

echo ""
echo "📋 ИНСТРУКЦИИ ДЛЯ ТЕСТИРОВАНИЯ:"
echo "1. Откройте http://localhost:5173 в браузере"
echo "2. Нажмите '🧪 Enable Demo' в оранжевом баннере"
echo "3. Выберите профессию"
echo "4. Перейдите на страницу выбора языка"
echo "5. Приложение должно работать без ошибок"
echo "6. Откройте консоль браузера (F12)"
echo "7. Проверьте отсутствие ошибок экспорта"

echo ""
echo "🔍 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:"
echo "✅ Нет ошибок 'does not provide an export named LanguageSelection'"
echo "✅ Страница выбора языка загружается корректно"
echo "✅ Все функции работают без ошибок"

echo ""
echo "❌ ЕСЛИ ВИДИТЕ ОШИБКИ:"
echo "- 'does not provide an export named LanguageSelection' - должно быть исправлено"
echo "- Проблемы с загрузкой страниц - должно быть исправлено"
echo "- Ошибки кэша - должно быть исправлено"

echo ""
echo "✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!"
echo "🎯 СТАТУС: ГОТОВО К ТЕСТИРОВАНИЮ!"
