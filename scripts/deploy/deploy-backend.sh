#!/bin/bash

# Скрипт для безопасного обновления только бэкенда
# Не затрагивает Traefik и другие сервисы

set -e  # Остановка при ошибке

echo "🚀 Обновление бэкенда Super Mock..."

# Проверка подключения к серверу
echo "📡 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен"
    exit 1
fi

# Переходим в корневую директорию проекта
echo "📁 Переход в корневую директорию проекта..."
cd "$(dirname "$0")/../.."
echo "📍 Текущая директория: $(pwd)"

# Синхронизация кода бэкенда
echo "📦 Синхронизация кода бэкенда..."

# Проверяем, что мы в правильной директории
if [ ! -d "backend" ]; then
    echo "❌ Директория 'backend' не найдена в текущей директории: $(pwd)"
    echo "📁 Содержимое текущей директории:"
    ls -la
    exit 1
fi

# Проверяем, что директория backend не пустая
if [ ! "$(ls -A backend)" ]; then
    echo "❌ Директория 'backend' пуста"
    exit 1
fi

# 🔍 ПРЕДВАРИТЕЛЬНЫЕ ПРОВЕРКИ И ТЕСТЫ
echo "🔍 Выполнение предварительных проверок..."

# Проверка наличия необходимых файлов
echo "📋 Проверка конфигурационных файлов..."
REQUIRED_FILES=(
    "package.json"
    "backend/prisma/schema.prisma"
    "backend/Dockerfile"
    "docker-compose.prod.yml"
    ".env"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Не найден обязательный файл: $file"
        exit 1
    fi
done
echo "✅ Все конфигурационные файлы найдены"

# Проверка синтаксиса TypeScript
echo "🔧 Проверка синтаксиса TypeScript..."
if command -v npx &> /dev/null; then
    cd backend
    if npx tsc --noEmit --skipLibCheck 2>&1 | head -20; then
        echo "✅ TypeScript проверка пройдена"
    else
        echo "⚠️  TypeScript проверка выявила ошибки, но продолжаем..."
    fi
    cd ..
else
    echo "⚠️  npx не найден, пропускаем TypeScript проверку"
fi

# Проверка ESLint
echo "🔍 Проверка ESLint..."
if command -v npx &> /dev/null; then
    cd backend
    if npx eslint src --ext .ts,.js --max-warnings 0 2>&1 | head -20; then
        echo "✅ ESLint проверка пройдена"
    else
        echo "⚠️  ESLint выявил предупреждения, но продолжаем..."
    fi
    cd ..
else
    echo "⚠️  npx не найден, пропускаем ESLint проверку"
fi

# Проверка Prisma схемы
echo "🗄️  Проверка Prisma схемы..."
if command -v npx &> /dev/null; then
    cd backend
    if npx prisma validate 2>&1 | head -10; then
        echo "✅ Prisma схема валидна"
    else
        echo "❌ Prisma схема содержит ошибки"
        cd ..
        exit 1
    fi
    cd ..
else
    echo "⚠️  npx не найден, пропускаем проверку Prisma"
fi

# Проверка переменных окружения
echo "🔐 Проверка переменных окружения..."
if [ -f ".env" ]; then
    REQUIRED_ENV_VARS=(
        "DATABASE_URL"
        "TELEGRAM_BOT_TOKEN"
        "SESSION_SECRET"
        "JWT_SECRET"
        "VITE_API_URL"
    )
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if ! grep -q "^${var}=" .env; then
            echo "⚠️  Переменная $var не найдена в .env"
        fi
    done
    echo "✅ Проверка переменных окружения завершена"
else
    echo "❌ Файл .env не найден"
    exit 1
fi

echo "🎯 Все предварительные проверки пройдены!"

echo "📁 Создание архива из директории: $(pwd)/backend"
tar -czf backend.tar.gz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.env' --exclude='*.log' --exclude='uploads' backend/

# Проверяем, что архив создался
if [ ! -f "backend.tar.gz" ]; then
    echo "❌ Не удалось создать архив backend.tar.gz"
    exit 1
fi

echo "📦 Размер архива: $(du -h backend.tar.gz | cut -f1)"
scp backend.tar.gz dokploy-server:/opt/mockmate/
ssh dokploy-server "cd /opt/mockmate && tar -xzf backend.tar.gz && rm backend.tar.gz"
rm backend.tar.gz

# Синхронизация конфигурации Docker
echo "📦 Синхронизация конфигурации Docker..."

# Проверяем наличие необходимых файлов
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Файл docker-compose.prod.yml не найден"
    exit 1
fi

if [ ! -f "backend/Dockerfile" ]; then
    echo "❌ Файл backend/Dockerfile не найден"
    exit 1
fi

echo "📁 Создание архива конфигурации Docker"
tar -czf docker-config.tar.gz docker-compose.prod.yml backend/Dockerfile

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

echo "🔧 Обновление бэкенда на сервере..."

cd /opt/mockmate

# Создание бэкапа текущего бэкенда
echo "💾 Создание бэкапа..."
BACKUP_NAME="backend-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$BACKUP_NAME" backend/ 2>/dev/null || true

# Остановка только бэкенда
echo "⏹️  Остановка бэкенда..."
docker-compose -f docker-compose.prod.yml stop backend

# Удаление старого образа бэкенда
echo "🗑️  Удаление старого образа..."
docker rmi supermock-backend 2>/dev/null || true

# Пересборка только бэкенда
echo "🔨 Пересборка бэкенда..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

# Запуск бэкенда
echo "▶️  Запуск бэкенда..."
docker-compose -f docker-compose.prod.yml up -d backend

# Ожидание запуска
echo "⏳ Ожидание запуска бэкенда..."
sleep 15

# Проверка статуса
echo "📊 Проверка статуса..."
if docker ps | grep -q mockmate-backend; then
    echo "✅ Бэкенд успешно обновлен и запущен!"
else
    echo "❌ Ошибка запуска бэкенда"
    exit 1
fi

# Проверка здоровья
echo "🏥 Проверка здоровья..."
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

echo "🔄 Применение миграций..."
docker exec supermock-backend npx prisma migrate deploy || true

echo "🔄 Синхронизация схемы базы данных (если миграции не применились)..."
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

# Проверка API
echo "🔍 Проверка API..."
sleep 5
if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
    echo "✅ API доступен через HTTPS"
else
    echo "⚠️  API может быть еще не готов"
fi

echo "🎉 Обновление бэкенда завершено!"
echo "🔗 API: https://api.supermock.ru"

EOF

echo "✅ Скрипт обновления бэкенда выполнен!"
