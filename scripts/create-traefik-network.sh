#!/bin/bash

# Скрипт для создания общей сети traefik-network
# Эта сеть будет использоваться всеми проектами для Traefik

set -e

NETWORK_NAME="traefik-network"

echo "🔧 Создаем общую сеть для Traefik..."

# Проверяем, существует ли сеть
if docker network ls | grep -q "$NETWORK_NAME"; then
    echo "✅ Сеть $NETWORK_NAME уже существует"
    echo "📊 Информация о сети:"
    docker network inspect "$NETWORK_NAME" --format "{{.Name}}: {{.Driver}} ({{.Scope}})"
else
    echo "🚀 Создаем сеть $NETWORK_NAME..."
    docker network create "$NETWORK_NAME" --driver bridge
    echo "✅ Сеть $NETWORK_NAME успешно создана"
fi

echo ""
echo "📋 Список всех Docker сетей:"
docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

echo ""
echo "🎉 Готово! Теперь все проекты могут использовать сеть $NETWORK_NAME"
echo "💡 Используйте эту сеть в docker-compose файлах:"
echo "   networks:"
echo "     traefik-network:"
echo "       external: true"
