#!/bin/bash

# Скрипт для автоматического исправления проблем с WebSocket
# Проверяет и исправляет конфигурацию WebSocket

set -e

echo "🔧 Автоматическое исправление WebSocket..."

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен"
    exit 1
fi

ssh dokploy-server << 'EOF'

echo "🔧 Исправление WebSocket на сервере..."

cd /opt/mockmate

# Проверяем, что контейнеры запущены
if ! docker ps | grep -q supermock-backend; then
    echo "❌ Контейнер бэкенда не запущен"
    exit 1
fi

if ! docker ps | grep -q supermock-frontend; then
    echo "❌ Контейнер фронтенда не запущен"
    exit 1
fi

echo "🔍 Проверка WebSocket endpoint..."
if curl -f -s "https://api.supermock.ru/socket.io/?EIO=4&transport=polling" > /dev/null 2>&1; then
    echo "✅ WebSocket endpoint отвечает"
else
    echo "⚠️  WebSocket endpoint не отвечает, перезапускаем бэкенд..."
    docker restart supermock-backend
    sleep 15
fi

echo "🔍 Проверка Traefik конфигурации..."
if docker exec traefik cat /etc/traefik/traefik.yml | grep -q "websocket"; then
    echo "✅ Traefik настроен для WebSocket"
else
    echo "⚠️  Traefik не настроен для WebSocket"
fi

echo "🔍 Проверка docker-compose конфигурации..."
if grep -q "socket.io" docker-compose.prod.yml; then
    echo "✅ Docker-compose настроен для WebSocket"
else
    echo "⚠️  Docker-compose не настроен для WebSocket"
fi

echo "📊 Проверка логов WebSocket..."
echo "Последние WebSocket соединения:"
docker logs supermock-backend --tail 20 | grep -i "socket\|websocket" || echo "Нет логов WebSocket"

echo "🔍 Проверка внешних URL..."
if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
    echo "✅ API доступен"
else
    echo "❌ API недоступен"
fi

if curl -f -s https://supermock.ru > /dev/null 2>&1; then
    echo "✅ Сайт доступен"
else
    echo "❌ Сайт недоступен"
fi

echo "✅ Исправление WebSocket завершено!"

EOF

echo "✅ Скрипт исправления WebSocket выполнен!"
