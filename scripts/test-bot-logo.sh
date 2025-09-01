#!/bin/bash

# Скрипт для тестирования отправки логотипа в Telegram боте

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

LOGO_PATH="${TELEGRAM_BOT_LOGO_PATH:-/home/korobprog/Документы/supermock/frontend/dist/logo_flag.gif}"
API_URL="${API_DOMAIN:-api.supermock.ru}"

echo "🎨 Тестирование отправки логотипа в Telegram боте"
echo "================================================"

# 1. Проверка существования файла логотипа
info "1. Проверка файла логотипа..."
if [ -f "$LOGO_PATH" ]; then
    success "Логотип найден"
    echo "   Путь: $LOGO_PATH"
    echo "   Размер: $(du -h "$LOGO_PATH" | cut -f1)"
else
    error "Логотип не найден"
    echo "   Ожидаемый путь: $LOGO_PATH"
    exit 1
fi

# 2. Проверка API сервера
info "2. Проверка API сервера..."
API_STATUS=$(curl -s "https://${API_URL}/api/telegram-bot-status")
if echo "$API_STATUS" | grep -q '"available":true'; then
    success "API сервер доступен"
else
    error "API сервер недоступен"
    echo "$API_STATUS"
    exit 1
fi

# 3. Тест отправки команды /start
info "3. Тест отправки команды /start..."
TEST_RESPONSE=$(curl -s -X POST "https://${API_URL}/api/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 999999999,
    "message": {
      "message_id": 999,
      "from": {
        "id": 999999999,
        "first_name": "LogoTest",
        "username": "logotest"
      },
      "chat": {
        "id": 999999999,
        "type": "private"
      },
      "date": 1756696314,
      "text": "/start"
    }
  }')

if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    success "Команда /start обработана успешно"
    echo "   Ответ: $TEST_RESPONSE"
else
    error "Ошибка обработки команды /start"
    echo "   Ответ: $TEST_RESPONSE"
fi

echo ""
success "Тестирование завершено!"
echo ""
info "Для проверки в Telegram:"
echo "1. Откройте Telegram"
echo "2. Найдите бота: @SuperMock_bot"
echo "3. Отправьте команду: /start"
echo "4. Проверьте, что бот отправляет логотип с приветственным сообщением"
