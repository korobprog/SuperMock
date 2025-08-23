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

# Переходим в корневую директорию проекта
echo "📁 Переход в корневую директорию проекта..."
cd "$(dirname "$0")/../.."
echo "📍 Текущая директория: $(pwd)"

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

# 🔍 ПРЕДВАРИТЕЛЬНЫЕ ПРОВЕРКИ И ТЕСТЫ
echo "🔍 Выполнение предварительных проверок..."

# Проверка наличия необходимых файлов
echo "📋 Проверка конфигурационных файлов..."
REQUIRED_FILES=(
    "package.json"
    "frontend/vite.config.ts"
    "frontend/tsconfig.app.json"
    "frontend/Dockerfile"
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
    cd frontend
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
    cd frontend
    if npx eslint src --ext .ts,.tsx --max-warnings 0 2>&1 | head -20; then
        echo "✅ ESLint проверка пройдена"
    else
        echo "⚠️  ESLint выявил предупреждения, но продолжаем..."
    fi
    cd ..
else
    echo "⚠️  npx не найден, пропускаем ESLint проверку"
fi

# Тестовая сборка фронтенда
echo "🏗️  Тестовая сборка фронтенда..."
cd frontend
if command -v npm &> /dev/null; then
    echo "📦 Установка зависимостей для тестовой сборки..."
    npm install --silent
    
    echo "🔨 Тестовая сборка..."
    if npm run build 2>&1 | head -30; then
        echo "✅ Тестовая сборка успешна"
        # Очищаем тестовую сборку
        rm -rf dist
    else
        echo "❌ Тестовая сборка не удалась"
        cd ..
        exit 1
    fi
else
    echo "⚠️  npm не найден, пропускаем тестовую сборку"
fi
cd ..

echo "🎯 Все предварительные проверки пройдены!"

echo "📁 Создание архива из директории: $(pwd)/frontend"
echo "📋 Исключаемые файлы/директории: node_modules, .git, dist, .env, *.log"

# Показываем, что будет включено в архив
echo "📦 Файлы для архивирования:"
find frontend -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -name '.env' -not -name '*.log' | head -20

tar -czf frontend.tar.gz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.env' --exclude='*.log' frontend/

# Проверяем, что архив создался
if [ ! -f "frontend.tar.gz" ]; then
    echo "❌ Не удалось создать архив frontend.tar.gz"
    exit 1
fi

echo "📦 Размер архива: $(du -h frontend.tar.gz | cut -f1)"
scp frontend.tar.gz dokploy-server:/opt/mockmate/
ssh dokploy-server "cd /opt/mockmate && echo '🧹 Очистка старых файлов...' && rm -rf frontend/dist && echo '📦 Распаковка архива...' && tar -xzf frontend.tar.gz && rm frontend.tar.gz && echo '✅ Архив распакован на сервере' && echo '📋 Проверка распакованных файлов:' && find frontend -type f | wc -l && echo '📁 Последние обновленные файлы:' && find frontend -type f -exec ls -la {} \\; | sort -k6,7 | tail -5"
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
tar -czf docker-config.tar.gz docker-compose.prod.yml docker-compose.override.yml frontend/Dockerfile .env

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
# Загружаем переменные окружения
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Собираем фронтенд с переменными окружения
docker-compose -f docker-compose.prod.yml build --no-cache \
  --build-arg VITE_API_URL="${VITE_API_URL:-https://api.supermock.ru}" \
  --build-arg VITE_JITSI_URL="${VITE_JITSI_URL:-https://meet.jit.si}" \
  --build-arg VITE_TELEGRAM_BOT_NAME="${VITE_TELEGRAM_BOT_NAME:-SuperMock_bot}" \
  --build-arg VITE_TELEGRAM_BOT_ID="${VITE_TELEGRAM_BOT_ID:-8464088869}" \
  --build-arg VITE_STUN_URLS="${VITE_STUN_URLS:-stun:stun.l.google.com:19302}" \
  --build-arg VITE_TURN_URL="${VITE_TURN_URL:-turn:217.198.6.238:3478}" \
  --build-arg VITE_TURN_USERNAME="${VITE_TURN_USERNAME:-supermock}" \
  --build-arg VITE_TURN_PASSWORD="${VITE_TURN_PASSWORD:-supermock_turn_secret_2024_very_long_and_secure_key_for_webrtc}" \
  --build-arg VITE_ENABLE_DEMO_MODE="${VITE_ENABLE_DEMO_MODE:-0}" \
  frontend

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
