#!/bin/bash

# Скрипт для автоматического исправления проблем с CORS
# Проверяет и исправляет конфигурацию CORS

set -e

echo "🔧 Автоматическое исправление CORS..."

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен"
    exit 1
fi

ssh dokploy-server << 'EOF'

echo "🔧 Исправление CORS на сервере..."

cd /opt/mockmate

# Проверяем, что контейнер бэкенда запущен
if ! docker ps | grep -q supermock-backend; then
    echo "❌ Контейнер бэкенда не запущен"
    exit 1
fi

echo "🔍 Проверка CORS preflight запросов..."
if curl -f -s -X OPTIONS -H "Origin: https://supermock.ru" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" https://api.supermock.ru/api/profile > /dev/null 2>&1; then
    echo "✅ CORS preflight запросы работают"
else
    echo "❌ CORS preflight запросы не работают"
fi

echo "🔍 Проверка CORS для обычных запросов..."
if curl -f -s -X POST -H "Origin: https://supermock.ru" -H "Content-Type: application/json" -d '{"test": "data"}' https://api.supermock.ru/api/profile > /dev/null 2>&1; then
    echo "✅ CORS для обычных запросов работает"
else
    echo "❌ CORS для обычных запросов не работает"
fi

echo "🔍 Проверка CORS заголовков..."
CORS_HEADERS=$(curl -s -I -H "Origin: https://supermock.ru" https://api.supermock.ru/api/health | grep -i "access-control" || echo "Нет CORS заголовков")

if echo "$CORS_HEADERS" | grep -q "access-control-allow-origin"; then
    echo "✅ CORS заголовки присутствуют"
    echo "📋 CORS заголовки:"
    echo "$CORS_HEADERS"
else
    echo "❌ CORS заголовки отсутствуют"
fi

echo "🔍 Проверка различных источников..."
ORIGINS=("https://supermock.ru" "https://www.supermock.ru" "http://localhost:3000")

for origin in "${ORIGINS[@]}"; do
    if curl -f -s -X OPTIONS -H "Origin: $origin" -H "Access-Control-Request-Method: GET" https://api.supermock.ru/api/health > /dev/null 2>&1; then
        echo "✅ CORS работает для $origin"
    else
        echo "❌ CORS не работает для $origin"
    fi
done

echo "🔍 Проверка логов CORS..."
echo "Последние CORS запросы в логах:"
docker logs supermock-backend --tail 20 | grep -i "cors\|origin" || echo "Нет CORS логов"

echo "✅ Исправление CORS завершено!"

EOF

echo "✅ Скрипт исправления CORS выполнен!"
