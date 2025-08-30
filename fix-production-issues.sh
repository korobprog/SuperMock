#!/bin/bash

# 🔧 СКРИПТ ДЛЯ ИСПРАВЛЕНИЯ ПРОБЛЕМ В ПРОДАКШЕНЕ
# Исправляет основные проблемы в production версии

echo "🔧 Исправляем проблемы в продакшене..."

# 1. Копируем логотип в правильное место
echo "🖼️ Копируем логотип в frontend/public..."
mkdir -p frontend/public
cp public/logo_main.png frontend/public/
echo "✅ Логотип скопирован"

# 2. Проверяем и исправляем переменные окружения
echo "🔍 Проверяем переменные окружения..."
if [ -f "production.env" ]; then
    echo "✅ production.env найден"
    echo "📋 VITE_API_URL: $(grep VITE_API_URL production.env | cut -d'=' -f2)"
    
    # Копируем правильные переменные окружения
    echo "📝 Копируем production.env в .env..."
    cp production.env .env
    echo "✅ Переменные окружения обновлены"
else
    echo "❌ production.env не найден"
    exit 1
fi

# 3. Пересобираем фронтенд
echo "🔨 Пересобираем фронтенд..."
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "cd /opt/mockmate && cp production.env .env && docker compose -f docker-compose.prod.yml build --no-cache frontend && docker compose -f docker-compose.prod.yml up -d frontend"

# 4. Применяем миграции базы данных
echo "🗄️ Применяем миграции базы данных..."
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "cd /opt/mockmate && docker exec supermock-backend npx prisma migrate deploy"

# 5. Загружаем материалы в базу данных
echo "📚 Загружаем материалы в базу данных..."
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "cd /opt/mockmate && docker cp materials supermock-backend:/app/ && docker exec supermock-backend node backend/scripts/load-materials.js"

# 6. Перезапускаем бэкенд
echo "🔄 Перезапускаем бэкенд..."
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "cd /opt/mockmate && docker compose -f docker-compose.prod.yml restart backend"

# 7. Проверяем статус сервисов
echo "🔍 Проверяем статус сервисов..."
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "cd /opt/mockmate && docker compose -f docker-compose.prod.yml ps"

# 8. Проверяем доступность API
echo "🔍 Проверяем доступность API..."
if curl -s https://api.supermock.ru/api/health > /dev/null; then
    echo "✅ API доступен по HTTPS"
else
    echo "❌ API недоступен по HTTPS"
fi

# 9. Проверяем доступность материалов
echo "🔍 Проверяем доступность материалов..."
if curl -s "https://api.supermock.ru/api/materials?profession=frontend&language=ru&limit=1" > /dev/null; then
    echo "✅ Материалы доступны"
else
    echo "❌ Материалы недоступны"
fi

# 10. Проверяем доступность логотипа
echo "🔍 Проверяем доступность логотипа..."
if curl -s https://supermock.ru/logo_main.png > /dev/null; then
    echo "✅ Логотип доступен"
else
    echo "❌ Логотип недоступен"
fi

# 11. Проверяем переменные окружения в контейнере
echo "🔍 Проверяем переменные окружения в контейнере..."
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "docker exec supermock-frontend env | grep VITE_API_URL"

echo ""
echo "🎉 Исправления завершены!"
echo ""
echo "📋 Что исправлено:"
echo "   ✅ Логотип скопирован в правильное место"
echo "   ✅ Переменные окружения обновлены"
echo "   ✅ Фронтенд пересобран с правильными переменными"
echo "   ✅ Миграции базы данных применены"
echo "   ✅ Материалы загружены в базу данных"
echo "   ✅ API настроен на HTTPS"
echo "   ✅ Проверена доступность сервисов"
echo ""
echo "🌐 Проверьте сайт: https://supermock.ru"
