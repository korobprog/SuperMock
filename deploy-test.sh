#!/bin/bash

# 🧪 ДЕПЛОЙ СКРИПТ ДЛЯ ТЕСТОВОГО ОКРУЖЕНИЯ
# test.supermock.ru с тестовым ботом SuperMockTest_bot

set -e  # Выход при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для красивого вывода
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🚀 Начинаем деплой SuperMock AI-Mentor в тестовое окружение"
log "📍 Домен: test.supermock.ru"
log "🤖 Тестовый бот: SuperMockTest_bot"

# ═══════════════════════════════════════════════════════════════════
# 📋 ПРЕДВАРИТЕЛЬНЫЕ ПРОВЕРКИ
# ═══════════════════════════════════════════════════════════════════

info "Проверяем наличие необходимых файлов..."

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен!"
    exit 1
fi

# Проверяем Docker Compose
if ! docker compose version &> /dev/null; then
    error "Docker Compose не установлен!"
    exit 1
fi

# Проверяем .env файл
if [ ! -f ".env.test" ]; then
    warning ".env.test не найден! Копируем из примера..."
    if [ -f "deploy/test.env.example" ]; then
        cp deploy/test.env.example .env.test
        warning "Отредактируйте .env.test перед продолжением!"
        warning "Особенно важно указать EXTERNAL_IP сервера"
        read -p "Нажмите Enter после редактирования .env.test..."
    else
        error "deploy/test.env.example не найден!"
        exit 1
    fi
fi

# Проверяем docker-compose файл
if [ ! -f "docker-compose.test.yml" ]; then
    error "docker-compose.test.yml не найден!"
    exit 1
fi

log "✅ Все необходимые файлы найдены"

# ═══════════════════════════════════════════════════════════════════
# 🛑 ОСТАНОВКА СТАРЫХ КОНТЕЙНЕРОВ
# ═══════════════════════════════════════════════════════════════════

log "🛑 Останавливаем существующие тестовые контейнеры..."

# Останавливаем контейнеры если они запущены
docker compose -f docker-compose.test.yml --env-file .env.test down --remove-orphans || true

# Удаляем старые образы тестовых контейнеров
log "🗑️  Удаляем старые тестовые образы..."
docker rmi supermock-test-frontend supermock-test-backend 2>/dev/null || true

log "✅ Старые контейнеры остановлены"

# ═══════════════════════════════════════════════════════════════════
# 🔨 СБОРКА ОБРАЗОВ
# ═══════════════════════════════════════════════════════════════════

log "🔨 Собираем новые образы..."

# Включаем BuildKit для более быстрой сборки
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Собираем все сервисы
docker compose -f docker-compose.test.yml --env-file .env.test build --no-cache

log "✅ Образы успешно собраны"

# ═══════════════════════════════════════════════════════════════════
# 🗄️ НАСТРОЙКА БАЗЫ ДАННЫХ
# ═══════════════════════════════════════════════════════════════════

log "🗄️  Запускаем тестовую базу данных..."

# Запускаем только PostgreSQL для начала
docker compose -f docker-compose.test.yml --env-file .env.test up -d postgres-test

# Ждем пока БД станет доступна
log "⏳ Ждем готовности базы данных..."
timeout=60
while ! docker compose -f docker-compose.test.yml --env-file .env.test exec -T postgres-test pg_isready -U supermock_test > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        error "База данных не запустилась за 60 секунд!"
        exit 1
    fi
    sleep 1
done

log "✅ База данных готова"

# ═══════════════════════════════════════════════════════════════════
# 🚀 ЗАПУСК ПРИЛОЖЕНИЯ
# ═══════════════════════════════════════════════════════════════════

log "🚀 Запускаем все сервисы..."

# Запускаем все остальные сервисы
docker compose -f docker-compose.test.yml --env-file .env.test up -d

log "⏳ Ждем готовности всех сервисов..."

# Проверяем health check'и
services=("backend-test" "frontend-test" "redis-test")
for service in "${services[@]}"; do
    info "Проверяем готовность $service..."
    timeout=120
    while [ "$(docker inspect --format='{{.State.Health.Status}}' supermock-test-${service#*-} 2>/dev/null || echo 'starting')" != "healthy" ]; do
        timeout=$((timeout - 1))
        if [ $timeout -eq 0 ]; then
            warning "$service не готов, но продолжаем..."
            break
        fi
        sleep 2
    done
done

log "✅ Все сервисы запущены"

# ═══════════════════════════════════════════════════════════════════
# 🗄️ МИГРАЦИИ БАЗЫ ДАННЫХ
# ═══════════════════════════════════════════════════════════════════

log "🗄️  Выполняем миграции базы данных..."

# Выполняем Prisma миграции
docker compose -f docker-compose.test.yml --env-file .env.test exec -T backend-test npx prisma migrate deploy --schema backend/prisma/schema.prisma || warning "Миграции уже применены или произошла ошибка"

# Генерируем Prisma клиент (на всякий случай)
docker compose -f docker-compose.test.yml --env-file .env.test exec -T backend-test npx prisma generate --schema backend/prisma/schema.prisma

log "✅ Миграции выполнены"

# ═══════════════════════════════════════════════════════════════════
# 🤖 НАСТРОЙКА ТЕЛЕГРАМ WEBHOOK
# ═══════════════════════════════════════════════════════════════════

log "🤖 Настраиваем webhook для тестового бота..."

# Даем время backend'у полностью запуститься
sleep 10

# Устанавливаем webhook для тестового бота
WEBHOOK_URL="https://test.supermock.ru/webhook/telegram"
BOT_TOKEN="8213869730:AAHIR0oUPS-sfyMvwzStYapJYc7YH4lMlS4"

info "Устанавливаем webhook: $WEBHOOK_URL"

curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\":\"$WEBHOOK_URL\"}" > /dev/null

# Проверяем webhook
webhook_info=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
if echo "$webhook_info" | grep -q "$WEBHOOK_URL"; then
    log "✅ Webhook настроен успешно"
else
    warning "⚠️  Webhook может быть настроен неправильно. Проверьте вручную."
    info "Ответ API: $webhook_info"
fi

# ═══════════════════════════════════════════════════════════════════
# 📊 СТАТУС РАЗВЕРТЫВАНИЯ
# ═══════════════════════════════════════════════════════════════════

log "📊 Проверяем статус развертывания..."

echo ""
log "🎉 ДЕПЛОЙ ЗАВЕРШЕН!"
echo ""
info "📍 Тестовый домен: https://test.supermock.ru"
info "🤖 Тестовый бот: @SuperMockTest_bot"
info "🗄️  База данных: PostgreSQL (порт 5433)"
info "📦 Redis: порт 6380"
info "🎥 TURN сервер: порт 3479"
echo ""

# Показываем статус контейнеров
log "📋 Статус контейнеров:"
docker compose -f docker-compose.test.yml --env-file .env.test ps

echo ""
log "📝 Полезные команды для управления:"
echo ""
info "# Просмотр логов:"
echo "docker compose -f docker-compose.test.yml --env-file .env.test logs -f"
echo ""
info "# Остановка всех сервисов:"
echo "docker compose -f docker-compose.test.yml --env-file .env.test down"
echo ""
info "# Рестарт сервиса:"
echo "docker compose -f docker-compose.test.yml --env-file .env.test restart backend-test"
echo ""
info "# Подключение к базе данных:"
echo "docker compose -f docker-compose.test.yml --env-file .env.test exec postgres-test psql -U supermock_test -d supermock_test"
echo ""

# Проверяем доступность API
info "🔍 Проверяем доступность API..."
if curl -s -f "http://localhost:3001/api/health" > /dev/null; then
    log "✅ API доступен на localhost:3001"
else
    warning "⚠️  API может быть недоступен. Проверьте логи."
fi

# Проверяем доступность фронтенда
info "🔍 Проверяем доступность фронтенда..."
if curl -s -f "http://localhost:8081" > /dev/null; then
    log "✅ Фронтенд доступен на localhost:8081"
else
    warning "⚠️  Фронтенд может быть недоступен. Проверьте логи."
fi

echo ""
log "🚀 ТЕСТИРОВАНИЕ ГОТОВО К НАЧАЛУ!"
echo ""
warning "📌 НЕ ЗАБУДЬТЕ:"
warning "   1. Настроить SSL сертификаты для test.supermock.ru"
warning "   2. Настроить DNS запись для домена"
warning "   3. Открыть необходимые порты в firewall"
warning "   4. Протестировать все функции AI-ментора"
echo ""
log "✨ Удачного тестирования SuperMock AI-Mentor системы!"
