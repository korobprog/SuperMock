#!/bin/bash
set -e

echo "🧹 Начинаем полную очистку Docker на сервере..."

# Останавливаем все контейнеры
echo "🛑 Останавливаем все контейнеры..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Удаляем все контейнеры
echo "🗑️ Удаляем все контейнеры..."
docker rm $(docker ps -aq) 2>/dev/null || true

# Удаляем все образы
echo "🗑️ Удаляем все образы..."
docker rmi $(docker images -q) 2>/dev/null || true

# Удаляем все volumes
echo "🗑️ Удаляем все volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Удаляем все сети (кроме default)
echo "🗑️ Удаляем все сети..."
docker network rm $(docker network ls -q --filter type=custom) 2>/dev/null || true

# Полная очистка системы
echo "🧹 Полная очистка Docker системы..."
docker system prune -a --volumes --force

# Очищаем кэш buildx
echo "🧹 Очищаем кэш buildx..."
docker buildx prune --all --force

echo "✅ Полная очистка Docker завершена!"
echo "📊 Статус Docker:"
docker system df
