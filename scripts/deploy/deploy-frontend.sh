#!/bin/bash

# Скрипт для безопасного обновления только фронтенда
# Не затрагивает Traefik и другие сервисы

set -e  # Остановка при ошибке

echo "🚀 Обновление фронтенда Super Mock..."

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен"
    exit 1
fi

# Синхронизация кода фронтенда
echo "📦 Синхронизация кода фронтенда..."

# Проверяем, что мы в правильной директории
if [ ! -d "frontend" ]; then
    echo "❌ Директория 'frontend' не найдена в текущей директории: $(pwd)"
    echo "📁 Содержимое текущей директории:"
    ls -la
    exit 1
fi

# Проверяем, что директория frontend не пустая
if [ ! "$(ls -A frontend)" ]; then
    echo "❌ Директория 'frontend' пуста"
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
ssh dokploy-server "cd /opt/mockmate && tar -xzf frontend.tar.gz && rm frontend.tar.gz"
rm frontend.tar.gz

# Синхронизация конфигурации Docker
echo "📦 Синхронизация конфигурации Docker..."

# Проверяем наличие необходимых файлов
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Файл docker-compose.prod.yml не найден"
    exit 1
fi

if [ ! -f "docker-compose.override.yml" ]; then
    echo "❌ Файл docker-compose.override.yml не найден"
    exit 1
fi

if [ ! -f "frontend/Dockerfile" ]; then
    echo "❌ Файл frontend/Dockerfile не найден"
    exit 1
fi

echo "📁 Создание архива конфигурации Docker"
tar -czf docker-config.tar.gz docker-compose.prod.yml docker-compose.override.yml frontend/Dockerfile

# Проверяем, что архив создался
if [ ! -f "docker-config.tar.gz" ]; then
    echo "❌ Не удалось создать архив docker-config.tar.gz"
    exit 1
fi

echo "📦 Размер архива конфигурации: $(du -h docker-config.tar.gz | cut -f1)"
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
docker-compose -f docker-compose.prod.yml stop frontend

# Удаление старого образа фронтенда
echo "🗑️  Удаление старого образа..."
docker rmi supermock-frontend 2>/dev/null || true

# Пересборка только фронтенда
echo "🔨 Пересборка фронтенда..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# Запуск фронтенда
echo "▶️  Запуск фронтенда..."
docker-compose -f docker-compose.prod.yml up -d frontend

# Ожидание запуска
echo "⏳ Ожидание запуска фронтенда..."
sleep 10

# Проверка статуса
echo "📊 Проверка статуса..."
if docker ps | grep -q "supermock-frontend"; then
    echo "✅ Фронтенд успешно обновлен и запущен!"
else
    echo "❌ Ошибка запуска фронтенда"
    exit 1
fi

# Проверка здоровья
echo "🏥 Проверка здоровья..."
sleep 5
if curl -f -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Фронтенд отвечает на запросы"
else
    echo "⚠️  Фронтенд может быть еще не готов"
fi

echo "🎉 Обновление фронтенда завершено!"
echo "🌐 Сайт: https://supermock.ru"

EOF

echo "✅ Скрипт обновления фронтенда выполнен!"
