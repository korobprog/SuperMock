#!/bin/bash

echo "🛑 Stopping Super Mock dev environment..."

# Останавливаем все процессы на портах 3000 и 5173
echo "🔌 Killing processes on ports 3000 and 5173..."
pkill -f "node.*start-dev" || true
pkill -f "vite" || true

# Останавливаем Docker контейнеры
echo "🐳 Stopping Docker containers..."
docker compose -f docker-compose.dev.yml --env-file dev.env down

echo "✅ Dev environment stopped!"
