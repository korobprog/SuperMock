#!/usr/bin/env bash

# Упрощенный скрипт для деплоя фронтенда без тестовой сборки

set -e

echo "🚀 Быстрый деплой фронтенда Super Mock..."

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен"
    exit 1
fi

# Переходим в корневую директорию проекта
echo "📁 Переход в корневую директорию проекта..."
cd "$(dirname "$0")"
echo "📍 Текущая директория: $(pwd)"

# Проверяем наличие frontend директории
if [ ! -d "frontend" ]; then
    echo "❌ Директория 'frontend' не найдена"
    exit 1
fi

echo "📁 Создание архива из директории: $(pwd)/frontend"
tar -czf frontend.tar.gz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.env' --exclude='*.log' frontend/

# Проверяем, что архив создался
if [ ! -f "frontend.tar.gz" ]; then
    echo "❌ Не удалось создать архив frontend.tar.gz"
    exit 1
fi

echo "📦 Размер архива: $(du -h frontend.tar.gz | cut -f1)"
scp frontend.tar.gz dokploy-server:/opt/mockmate/
ssh dokploy-server "cd /opt/mockmate && echo '🧹 Очистка старых файлов...' && rm -rf frontend && echo '📦 Распаковка архива...' && tar -xzf frontend.tar.gz && rm frontend.tar.gz && echo '✅ Архив распакован на сервере'"
rm frontend.tar.gz

# Синхронизация конфигурации Docker
echo "📦 Синхронизация конфигурации Docker..."
tar -czf docker-config.tar.gz docker-compose.prod.yml docker-compose.override.yml frontend/Dockerfile .env
scp docker-config.tar.gz dokploy-server:/opt/mockmate/
ssh dokploy-server "cd /opt/mockmate && tar -xzf docker-config.tar.gz && rm docker-config.tar.gz"
rm docker-config.tar.gz

# Подключение к серверу и обновление
ssh dokploy-server << 'EOF'

echo "🔧 Обновление фронтенда на сервере..."

cd /opt/mockmate

# Создание бэкапа текущего фронтенда
echo "💾 Создание бэкапа..."
BACKUP_NAME="frontend-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$BACKUP_NAME" frontend/ 2>/dev/null || true

# Остановка только фронтенда
echo "⏹️  Остановка фронтенда..."
docker compose -f docker-compose.prod.yml stop frontend

# Удаление старого образа
echo "🗑️  Удаление старого образа..."
docker rmi supermock-frontend 2>/dev/null || true

# Пересборка фронтенда
echo "🔨 Пересборка фронтенда..."
docker compose -f docker-compose.prod.yml build frontend

# Запуск фронтенда
echo "▶️  Запуск фронтенда..."
docker compose -f docker-compose.prod.yml up -d frontend

# Ожидание запуска
echo "⏳ Ожидание запуска фронтенда..."
sleep 10

# Проверка статуса
echo "📊 Проверка статуса..."
if docker ps | grep -q supermock-frontend; then
    echo "✅ Фронтенд успешно запущен"
    echo "🌐 Доступен по адресу: https://supermock.ru"
else
    echo "❌ Ошибка запуска фронтенда"
    docker logs supermock-frontend --tail 20
    exit 1
fi

echo "🎉 Деплой фронтенда завершен успешно!"

EOF

echo "✅ Деплой фронтенда завершен!"
