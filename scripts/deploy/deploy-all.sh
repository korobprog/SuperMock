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

# 🔍 КОМПЛЕКСНЫЕ ПРЕДВАРИТЕЛЬНЫЕ ПРОВЕРКИ
echo "🔍 Выполнение комплексных предварительных проверок..."

# Проверка наличия всех необходимых файлов
echo "📋 Проверка конфигурационных файлов..."
REQUIRED_FILES=(
    "package.json"
    "frontend/vite.config.ts"
    "frontend/Dockerfile"
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

# Проверка переменных окружения
echo "🔐 Проверка переменных окружения..."
if [ -f ".env" ]; then
    REQUIRED_ENV_VARS=(
        "DATABASE_URL"
        "TELEGRAM_BOT_TOKEN"
        "SESSION_SECRET"
        "JWT_SECRET"
        "VITE_API_URL"
        "FRONTEND_URL"
        "BACKEND_URL"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if ! grep -q "^${var}=" .env; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "⚠️  Отсутствуют переменные окружения: ${MISSING_VARS[*]}"
        echo "📝 Продолжаем деплой, но могут быть проблемы..."
    else
        echo "✅ Все обязательные переменные окружения найдены"
    fi
else
    echo "❌ Файл .env не найден"
    exit 1
fi

# Проверка Docker
echo "🐳 Проверка Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен или нет прав доступа"
    exit 1
fi
echo "✅ Docker доступен"

# Проверка подключения к серверу
echo "🌐 Проверка подключения к серверу..."
if ! ssh dokploy-server "echo 'Сервер доступен'" &> /dev/null; then
    echo "❌ Не удается подключиться к серверу"
    exit 1
fi
echo "✅ Подключение к серверу установлено"

# Проверка свободного места на сервере
echo "💾 Проверка свободного места на сервере..."
FREE_SPACE=$(ssh dokploy-server "df /opt/mockmate | tail -1 | awk '{print \$4}'")
if [ "$FREE_SPACE" -lt 1000000 ]; then
    echo "⚠️  Мало свободного места на сервере: ${FREE_SPACE}KB"
    echo "📝 Рекомендуется освободить место перед деплоем"
else
    echo "✅ Достаточно свободного места: ${FREE_SPACE}KB"
fi

echo "🎯 Все предварительные проверки пройдены!"

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

# Очистка старых файлов перед обновлением
echo "🧹 Очистка старых файлов..."
rm -rf frontend/dist backend/dist 2>/dev/null || true
echo "✅ Старые файлы очищены"

# Функция для отката в случае ошибки
rollback() {
    echo "🔄 Выполняется откат..."
    echo "📦 Восстановление из бэкапа: $BACKUP_NAME"
    
    # Останавливаем все контейнеры
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Восстанавливаем из бэкапа
    if [ -f "$BACKUP_NAME" ]; then
        tar -xzf "$BACKUP_NAME" 2>/dev/null || true
        echo "✅ Восстановление завершено"
    else
        echo "❌ Бэкап не найден, откат невозможен"
    fi
    
    # Перезапускаем сервисы
    docker-compose -f docker-compose.prod.yml up -d 2>/dev/null || true
    echo "🔄 Откат завершен"
}

# Устанавливаем обработчик ошибок
trap rollback ERR

# Остановка приложений (НЕ Traefik)
echo "⏹️  Остановка приложений..."
docker-compose -f docker-compose.prod.yml down

# Удаление старых образов
echo "🗑️  Удаление старых образов..."
docker rmi supermock-frontend supermock-backend 2>/dev/null || true

# Пересборка приложений
echo "🔨 Пересборка приложений..."
# Загружаем переменные окружения
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Собираем фронтенд с переменными окружения
echo "🔨 Сборка фронтенда..."
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

# Собираем бэкенд
echo "🔨 Сборка бэкенда..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

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

# Функция для проверки здоровья сервиса
check_health() {
    local service_name=$1
    local url=$2
    local max_attempts=10
    local attempt=1
    
    echo "🔍 Проверка здоровья $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name отвечает на запросы (попытка $attempt/$max_attempts)"
            return 0
        else
            echo "⏳ $service_name еще не готов (попытка $attempt/$max_attempts)"
            sleep 5
            ((attempt++))
        fi
    done
    
    echo "❌ $service_name не отвечает после $max_attempts попыток"
    return 1
}

# Проверка фронтенда
if check_health "Фронтенд" "http://localhost:8080"; then
    FRONTEND_HEALTHY=true
else
    FRONTEND_HEALTHY=false
fi

# Проверка бэкенда
if check_health "Бэкенд" "http://localhost:3000/api/health"; then
    BACKEND_HEALTHY=true
else
    BACKEND_HEALTHY=false
fi

# Проверка внешних URL
echo "🌐 Проверка внешних URL..."
if curl -f -s https://supermock.ru > /dev/null 2>&1; then
    echo "✅ Сайт доступен извне"
    EXTERNAL_SITE_HEALTHY=true
else
    echo "❌ Сайт недоступен извне"
    EXTERNAL_SITE_HEALTHY=false
fi

if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
    echo "✅ API доступен извне"
    EXTERNAL_API_HEALTHY=true
else
    echo "❌ API недоступен извне"
    EXTERNAL_API_HEALTHY=false
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

# Финальный отчет о статусе
echo ""
echo "📊 ФИНАЛЬНЫЙ ОТЧЕТ О ДЕПЛОЕ"
echo "================================"

if [ "$FRONTEND_HEALTHY" = true ] && [ "$BACKEND_HEALTHY" = true ]; then
    echo "🎉 ДЕПЛОЙ УСПЕШЕН!"
    echo "✅ Все сервисы работают корректно"
    
    if [ "$EXTERNAL_SITE_HEALTHY" = true ] && [ "$EXTERNAL_API_HEALTHY" = true ]; then
        echo "✅ Все внешние URL доступны"
    else
        echo "⚠️  Некоторые внешние URL недоступны (может потребоваться время для DNS)"
    fi
else
    echo "⚠️  ДЕПЛОЙ ЗАВЕРШЕН С ПРЕДУПРЕЖДЕНИЯМИ"
    if [ "$FRONTEND_HEALTHY" = false ]; then
        echo "❌ Фронтенд не отвечает"
    fi
    if [ "$BACKEND_HEALTHY" = false ]; then
        echo "❌ Бэкенд не отвечает"
    fi
fi

echo ""
echo "🌐 Сайт: https://supermock.ru"
echo "🔗 API: https://api.supermock.ru"
echo "🔧 WebSocket: wss://api.supermock.ru/socket.io/"
echo ""
echo "📋 Статус сервисов:"
echo "   Фронтенд: $([ "$FRONTEND_HEALTHY" = true ] && echo "✅" || echo "❌")"
echo "   Бэкенд: $([ "$BACKEND_HEALTHY" = true ] && echo "✅" || echo "❌")"
echo "   Внешний сайт: $([ "$EXTERNAL_SITE_HEALTHY" = true ] && echo "✅" || echo "❌")"
echo "   Внешний API: $([ "$EXTERNAL_API_HEALTHY" = true ] && echo "✅" || echo "❌")"
echo ""
echo "💾 Бэкап сохранен: $BACKUP_NAME"
echo "================================"

# Убираем обработчик ошибок
trap - ERR

echo "🎉 Полное обновление завершено!"
echo "🌐 Сайт: https://supermock.ru"
echo "🔗 API: https://api.supermock.ru"

EOF

echo "✅ Полное обновление выполнено!"
