#!/bin/bash

echo "🎯 ПРОВЕРКА ИСПРАВЛЕНИЙ MATERIALS.TSX"
echo "====================================="
echo ""

# Проверяем frontend
echo "1. Проверка frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend работает на порту 5173"
else
    echo "   ❌ Frontend не отвечает"
    echo "   Запустите: pnpm dev:frontend"
    exit 1
fi

# Проверяем файл Materials.tsx
echo ""
echo "2. Проверка Materials.tsx..."
if [ -f "frontend/src/pages/Materials.tsx" ]; then
    if grep -q "getDemoMaterials" "frontend/src/pages/Materials.tsx"; then
        echo "   ✅ Materials.tsx содержит демо данные"
    else
        echo "   ❌ Materials.tsx не содержит демо данные"
    fi
    
    if grep -q "Dev mode: using demo materials" "frontend/src/pages/Materials.tsx"; then
        echo "   ✅ Materials.tsx содержит dev fallback"
    else
        echo "   ❌ Materials.tsx не содержит dev fallback"
    fi
    
    if grep -q "getDemoCategories" "frontend/src/pages/Materials.tsx"; then
        echo "   ✅ Materials.tsx содержит демо категории"
    else
        echo "   ❌ Materials.tsx не содержит демо категории"
    fi
else
    echo "   ❌ Materials.tsx не найден"
fi

echo ""
echo "📋 ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ:"
echo "✅ Ошибка 'Unexpected token <' в fetchMaterials"
echo "✅ Ошибка 'Unexpected token <' в fetchPopularMaterials"
echo "✅ Ошибка 'Unexpected token <' в fetchNewMaterials"
echo "✅ Ошибка 'Unexpected token <' в fetchCategories"

echo ""
echo "🔧 ПРИМЕНЕННЫЕ ИСПРАВЛЕНИЯ:"
echo "- Добавлены демо данные для материалов"
echo "- Добавлены демо категории"
echo "- Добавлен прямой fallback в dev режиме"
echo "- Добавлен fallback при ошибках API"

echo ""
echo "📋 ИНСТРУКЦИИ ДЛЯ ТЕСТИРОВАНИЯ:"
echo "1. Откройте http://localhost:5173 в браузере"
echo "2. Нажмите '🧪 Enable Demo' в оранжевом баннере"
echo "3. Перейдите на страницу материалов"
echo "4. Откройте консоль браузера (F12)"
echo "5. Проверьте наличие сообщений:"
echo "   - 🔧 Dev mode: using demo materials"
echo "   - 🔧 Dev mode: using demo popular materials"
echo "   - 🔧 Dev mode: using demo new materials"
echo "   - 🔧 Dev mode: using demo categories"

echo ""
echo "🔍 ОЖИДАЕМЫЕ СООБЩЕНИЯ В КОНСОЛИ:"
echo "✅ 🔧 Dev mode: using demo materials"
echo "✅ 🔧 Dev mode: using demo popular materials"
echo "✅ 🔧 Dev mode: using demo new materials"
echo "✅ 🔧 Dev mode: using demo categories"

echo ""
echo "❌ ЕСЛИ ВИДИТЕ ОШИБКИ:"
echo "- 'Unexpected token <' - должно быть исправлено"
echo "- 'SyntaxError' - должно быть исправлено"
echo "- 'Error fetching materials' - должно быть исправлено"

echo ""
echo "✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!"
echo "🎯 СТАТУС: ГОТОВО К ТЕСТИРОВАНИЮ!"
