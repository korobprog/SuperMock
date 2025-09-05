#!/bin/bash
set -e

echo "🔄 ПЕРЕЗАПУСК СЕРВЕРА ДЛЯ ОЧИСТКИ КЭША DOCKER..."

# Останавливаем все контейнеры
echo "🛑 Останавливаем все контейнеры..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Полная очистка Docker
echo "🧹 Полная очистка Docker..."
docker system prune -a --volumes --force

# Очищаем кэш buildx
echo "🧹 Очищаем кэш buildx..."
docker buildx prune --all --force

# Сохраняем логи перед перезапуском
echo "📝 Сохраняем логи перед перезапуском..."
mkdir -p /tmp/server-logs
docker logs supermock-backend > /tmp/server-logs/backend.log 2>&1 || true
docker logs supermock-frontend > /tmp/server-logs/frontend.log 2>&1 || true

echo "⚠️ ВНИМАНИЕ: Сервер будет перезапущен через 10 секунд!"
echo "Это должно решить проблему с кэшированием Docker."
sleep 10

# Перезапускаем сервер
echo "🔄 Перезапускаем сервер..."
sudo reboot
