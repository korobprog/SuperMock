#!/bin/bash

# Скрипт для быстрой проверки статуса Telegram бота

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции вывода
success() { printf "${GREEN}✅ %s${NC}\n" "$*"; }
error() { printf "${RED}❌ %s${NC}\n" "$*"; }
warning() { printf "${YELLOW}⚠️  %s${NC}\n" "$*"; }
info() { printf "${BLUE}ℹ️  %s${NC}\n" "$*"; }

# Загружаем переменные окружения
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8464088869:AAFcZb7HmYQJa6vaYjfTDCjfr187p9hhk2o}"
API_URL="${API_DOMAIN:-api.supermock.ru}"

echo "🤖 Проверка статуса Telegram бота SuperMock"
echo "=========================================="

# 1. Проверка бота
info "1. Проверка доступности бота..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
if echo "$BOT_INFO" | grep -q '"ok":true'; then
    success "Бот доступен"
    BOT_NAME=$(echo "$BOT_INFO" | grep -o '"first_name":"[^"]*"' | cut -d'"' -f4)
    BOT_USERNAME=$(echo "$BOT_INFO" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "   Имя: $BOT_NAME"
    echo "   Username: @$BOT_USERNAME"
else
    error "Бот недоступен"
    echo "$BOT_INFO"
    exit 1
fi

# 2. Проверка webhook
info "2. Проверка webhook..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
if echo "$WEBHOOK_INFO" | grep -q '"ok":true'; then
    WEBHOOK_URL=$(echo "$WEBHOOK_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    PENDING_COUNT=$(echo "$WEBHOOK_INFO" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)
    LAST_ERROR=$(echo "$WEBHOOK_INFO" | grep -o '"last_error_message":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$WEBHOOK_URL" ]; then
        success "Webhook настроен"
        echo "   URL: $WEBHOOK_URL"
        echo "   Ожидающие обновления: $PENDING_COUNT"
        if [ -n "$LAST_ERROR" ]; then
            warning "Последняя ошибка: $LAST_ERROR"
        fi
    else
        warning "Webhook не настроен"
    fi
else
    error "Ошибка получения информации о webhook"
    echo "$WEBHOOK_INFO"
fi

# 3. Проверка API сервера
info "3. Проверка API сервера..."
API_STATUS=$(curl -s "https://${API_URL}/api/telegram-bot-status")
if echo "$API_STATUS" | grep -q '"available":true'; then
    success "API сервер доступен"
else
    error "API сервер недоступен"
    echo "$API_STATUS"
fi

# 4. Тест webhook эндпоинта
info "4. Тест webhook эндпоинта..."
WEBHOOK_TEST=$(curl -s "https://${API_URL}/api/telegram-webhook")
if echo "$WEBHOOK_TEST" | grep -q '"status":"ok"'; then
    success "Webhook эндпоинт работает"
else
    error "Webhook эндпоинт не отвечает"
    echo "$WEBHOOK_TEST"
fi

echo ""
success "Проверка завершена!"
echo ""
info "Для тестирования бота:"
echo "1. Откройте Telegram"
echo "2. Найдите бота: @$BOT_USERNAME"
echo "3. Отправьте команду: /start"
echo "4. Проверьте, что бот отвечает с кнопкой '🚀 Открыть SuperMock'"
