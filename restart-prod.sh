#!/bin/bash

echo "🔄 Restarting production server with demo mode enabled..."

# Остановить текущие контейнеры
docker-compose -f docker-compose.prod.yml down

# Пересобрать и запустить с новыми переменными окружения
docker-compose -f docker-compose.prod.yml up -d --build

echo "✅ Production server restarted with demo mode enabled"
echo "🌐 Frontend: https://supermock.ru"
echo "🔧 API: https://api.supermock.ru"
echo "🎭 Demo mode is now enabled for testing"
