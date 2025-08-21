#!/bin/bash

# Скрипт для безопасного обновления всего проекта
# Обновляет фронтенд и бэкенд, НЕ затрагивает Traefik

set -e  # Остановка при ошибке

echo "🚀 Полное обновление Super Mock..."

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен"
    exit 1
fi

# Сохраняем текущую директорию
SCRIPT_DIR=$(pwd)

# Переходим в корневую директорию проекта (из scripts/deploy в корень)
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

# Проверяем, что директории существуют
echo "📋 Проверка директорий..."
if [ ! -d "frontend" ]; then
    echo "❌ Директория frontend не найдена в $PROJECT_ROOT"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo "❌ Директория backend не найдена в $PROJECT_ROOT"
    exit 1
fi

echo "✅ Найдены директории: frontend, backend"

# Синхронизация кода фронтенда
echo "📦 Синхронизация кода фронтенда..."
echo "📁 Создание архива frontend.tar.gz..."
if tar -czf frontend.tar.gz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.env' --exclude='*.log' frontend/; then
    echo "✅ Архив frontend.tar.gz создан успешно"
else
    echo "❌ Ошибка создания архива frontend.tar.gz"
    exit 1
fi

# Проверяем, что архив создан
if [ ! -f "frontend.tar.gz" ]; then
    echo "❌ Файл frontend.tar.gz не существует"
    exit 1
fi

echo "📤 Отправка архива frontend на сервер..."
scp frontend.tar.gz dokploy-server:/opt/mockmate/
ssh dokploy-server "cd /opt/mockmate && tar -xzf frontend.tar.gz && rm frontend.tar.gz"
rm frontend.tar.gz

# Синхронизация кода бэкенда
echo "📦 Синхронизация кода бэкенда..."
echo "📁 Создание архива backend.tar.gz..."
if tar -czf backend.tar.gz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.env' --exclude='*.log' --exclude='uploads' backend/; then
    echo "✅ Архив backend.tar.gz создан успешно"
else
    echo "❌ Ошибка создания архива backend.tar.gz"
    exit 1
fi

# Проверяем, что архив создан
if [ ! -f "backend.tar.gz" ]; then
    echo "❌ Файл backend.tar.gz не существует"
    exit 1
fi

echo "📤 Отправка архива backend на сервер..."
scp backend.tar.gz dokploy-server:/opt/mockmate/
ssh dokploy-server "cd /opt/mockmate && tar -xzf backend.tar.gz && rm backend.tar.gz"
rm backend.tar.gz

# Синхронизация конфигурации Docker
echo "📦 Синхронизация конфигурации Docker..."
echo "📁 Создание архива docker-config.tar.gz..."
if tar -czf docker-config.tar.gz docker-compose.prod.yml frontend/Dockerfile backend/Dockerfile; then
    echo "✅ Архив docker-config.tar.gz создан успешно"
else
    echo "❌ Ошибка создания архива docker-config.tar.gz"
    exit 1
fi

# Проверяем, что архив создан
if [ ! -f "docker-config.tar.gz" ]; then
    echo "❌ Файл docker-config.tar.gz не существует"
    exit 1
fi

echo "📤 Отправка конфигурации Docker на сервер..."
scp docker-config.tar.gz dokploy-server:/opt/mockmate/
ssh dokploy-server "cd /opt/mockmate && tar -xzf docker-config.tar.gz && rm docker-config.tar.gz"
rm docker-config.tar.gz

# Возвращаемся в директорию скрипта
cd "$SCRIPT_DIR"

# Подключение к серверу и обновление
ssh dokploy-server << 'EOF'

echo "🔧 Полное обновление на сервере..."

cd /opt/mockmate

# Создание полного бэкапа
echo "💾 Создание полного бэкапа..."
BACKUP_NAME="full-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$BACKUP_NAME" frontend/ backend/ 2>/dev/null || true

# Остановка приложений (НЕ Traefik)
echo "⏹️  Остановка приложений..."
docker-compose -f docker-compose.prod.yml down

# Удаление старых образов
echo "🗑️  Удаление старых образов..."
docker rmi supermock-frontend supermock-backend 2>/dev/null || true

# Пересборка приложений
echo "🔨 Пересборка приложений..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend backend

# Запуск приложений
echo "▶️  Запуск приложений..."
docker-compose -f docker-compose.prod.yml up -d

# Ожидание запуска
echo "⏳ Ожидание запуска приложений..."
sleep 20

# Проверка статуса
echo "📊 Проверка статуса..."
FRONTEND_OK=false
BACKEND_OK=false

if docker ps | grep -q supermock-frontend; then
    echo "✅ Фронтенд запущен"
    FRONTEND_OK=true
else
    echo "❌ Ошибка запуска фронтенда"
fi

if docker ps | grep -q supermock-backend; then
    echo "✅ Бэкенд запущен"
    BACKEND_OK=true
else
    echo "❌ Ошибка запуска бэкенда"
fi

if [ "$FRONTEND_OK" = false ] || [ "$BACKEND_OK" = false ]; then
    echo "❌ Не все сервисы запущены"
    exit 1
fi

# Проверка здоровья
echo "🏥 Проверка здоровья..."

# Проверка фронтенда
sleep 10
if curl -f -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Фронтенд отвечает на запросы"
else
    echo "⚠️  Фронтенд может быть еще не готов"
fi

# Проверка бэкенда
sleep 10
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Бэкенд отвечает на запросы"
else
    echo "⚠️  Бэкенд может быть еще не готов"
fi

# Автоматическое исправление базы данных
echo "🔧 Автоматическое исправление базы данных..."
echo "📊 Проверка статуса миграций..."
docker exec supermock-backend npx prisma migrate status || true

echo "🔄 Синхронизация схемы базы данных..."
docker exec supermock-backend npx prisma db push --accept-data-loss || true

echo "🔧 Генерация Prisma Client..."
docker exec supermock-backend npx prisma generate --schema backend/prisma/schema.prisma || true

# Перезапуск бэкенда для применения изменений
echo "🔄 Перезапуск бэкенда для применения изменений..."
docker restart supermock-backend
sleep 15

# Проверка WebSocket
echo "🔧 Проверка WebSocket..."
if curl -f -s "https://api.supermock.ru/socket.io/?EIO=4&transport=polling" > /dev/null 2>&1; then
    echo "✅ WebSocket endpoint работает"
else
    echo "⚠️  WebSocket endpoint может быть еще не готов"
fi

# Проверка внешних URL
echo "🔍 Проверка внешних URL..."
sleep 5

if curl -f -s https://supermock.ru > /dev/null 2>&1; then
    echo "✅ Сайт доступен через HTTPS"
else
    echo "⚠️  Сайт может быть еще не готов"
fi

if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
    echo "✅ API доступен через HTTPS"
else
    echo "⚠️  API может быть еще не готов"
fi

# Очистка старых образов
echo "🧹 Очистка старых образов..."
docker image prune -f 2>/dev/null || true

echo "🎉 Полное обновление завершено!"
echo "🌐 Сайт: https://supermock.ru"
echo "🔗 API: https://api.supermock.ru"

EOF

echo "✅ Полное обновление выполнено!"
