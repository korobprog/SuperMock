#!/bin/bash

# Скрипт для комплексной проверки здоровья системы
# Проверяет все компоненты и автоматически исправляет проблемы

set -e

echo "🏥 Комплексная проверка здоровья системы..."

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен"
    exit 1
fi

ssh dokploy-server << 'EOF'

echo "🏥 Проверка здоровья системы на сервере..."

cd /opt/mockmate

# Проверка контейнеров
echo "📊 Проверка контейнеров..."
CONTAINERS=("supermock-frontend" "supermock-backend" "supermock-postgres" "supermock-redis" "supermock-turn")
ALL_HEALTHY=true

for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q "$container"; then
        status=$(docker inspect --format='{{.State.Status}}' "$container")
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
        echo "✅ $container: $status ($health)"
    else
        echo "❌ $container: не запущен"
        ALL_HEALTHY=false
    fi
done

# Проверка API
echo ""
echo "🔍 Проверка API..."
if docker exec supermock-backend wget -q --spider http://localhost:3000/api/health 2>/dev/null; then
    echo "✅ Локальный API работает"
else
    echo "❌ Локальный API не отвечает (проверяем через внешний API)"
    if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
        echo "✅ Внешний API работает"
    else
        echo "❌ Внешний API не отвечает"
        ALL_HEALTHY=false
    fi
fi

if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
    echo "✅ Внешний API работает"
else
    echo "❌ Внешний API не отвечает"
    ALL_HEALTHY=false
fi

# Проверка WebSocket
echo ""
echo "🔧 Проверка WebSocket..."
if curl -f -s "https://api.supermock.ru/socket.io/?EIO=4&transport=polling" > /dev/null 2>&1; then
    echo "✅ WebSocket endpoint работает"
else
    echo "❌ WebSocket endpoint не отвечает"
    ALL_HEALTHY=false
fi

# Проверка сайта
echo ""
echo "🌐 Проверка сайта..."
if curl -f -s https://supermock.ru > /dev/null 2>&1; then
    echo "✅ Сайт доступен"
else
    echo "❌ Сайт недоступен"
    ALL_HEALTHY=false
fi

# Проверка базы данных
echo ""
echo "🗄️  Проверка базы данных..."
if docker exec supermock-backend npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ База данных доступна"
else
    echo "❌ База данных недоступна (проверяем через прямой запрос)"
    if docker exec supermock-postgres psql -U supermock -d supermock -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ База данных доступна через прямой запрос"
    else
        echo "❌ База данных недоступна"
        ALL_HEALTHY=false
    fi
fi

# Проверка Redis
echo ""
echo "🔴 Проверка Redis..."
if docker exec supermock-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis работает"
else
    echo "❌ Redis не отвечает"
    ALL_HEALTHY=false
fi

# Проверка Traefik
echo ""
echo "🔄 Проверка Traefik..."
if docker ps | grep -q traefik; then
    echo "✅ Traefik запущен"
else
    echo "❌ Traefik не запущен"
    ALL_HEALTHY=false
fi

# Автоматическое исправление проблем
if [ "$ALL_HEALTHY" = false ]; then
    echo ""
    echo "🔧 Обнаружены проблемы, выполняем автоматическое исправление..."
    
    # Исправление базы данных
    echo "🔄 Синхронизация схемы базы данных..."
    docker exec supermock-backend npx prisma db push --accept-data-loss || true
    
    # Перезапуск бэкенда
    echo "🔄 Перезапуск бэкенда..."
    docker restart supermock-backend
    sleep 15
    
    # Повторная проверка
    echo ""
    echo "🔄 Повторная проверка после исправлений..."
    if docker exec supermock-backend wget -q --spider http://localhost:3000/api/health 2>/dev/null; then
        echo "✅ Бэкенд восстановлен"
    else
        echo "❌ Бэкенд все еще не работает (проверяем внешний API)"
        if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
            echo "✅ Внешний API работает"
        else
            echo "❌ Внешний API не работает"
        fi
    fi
else
    echo ""
    echo "✅ Все системы работают корректно!"
fi

echo ""
echo "📊 Итоговый статус:"
echo "🌐 Сайт: https://supermock.ru"
echo "🔗 API: https://api.supermock.ru"
echo "🔧 WebSocket: wss://api.supermock.ru/socket.io/"

EOF

echo "✅ Проверка здоровья системы завершена!"
