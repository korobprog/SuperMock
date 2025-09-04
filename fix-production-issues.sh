#!/bin/bash

echo "🔧 Исправление проблем в продакшене..."

# Остановка контейнеров
echo "⏹️ Остановка контейнеров..."
docker compose -f docker-compose.prod.yml down

# Пересборка frontend контейнера с исправлениями
echo "🔨 Пересборка frontend контейнера..."
docker compose -f docker-compose.prod.yml build --no-cache frontend

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
docker compose -f docker-compose.prod.yml up -d

# Проверка статуса
echo "📊 Проверка статуса контейнеров..."
docker compose -f docker-compose.prod.yml ps

echo "✅ Исправления применены!"
echo "📝 Исправленные проблемы:"
echo "   - Favicon файлы теперь копируются в контейнер"
echo "   - site.webmanifest исправлен с правильными путями"
echo "   - API конфигурация исправлена для app.supermock.ru"
echo ""
echo "🌐 Проверьте сайт: https://app.supermock.ru"