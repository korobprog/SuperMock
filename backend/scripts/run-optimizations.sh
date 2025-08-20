#!/bin/bash

# Скрипт для запуска всех оптимизаций

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Проверка наличия .env файла
if [ ! -f .env ]; then
  error "Файл .env не найден. Создайте файл .env и повторите попытку."
fi

# Запуск оптимизации MongoDB
log "Запуск оптимизации MongoDB..."
node scripts/optimize-mongodb.js
if [ $? -ne 0 ]; then
  error "Ошибка при оптимизации MongoDB."
fi
log "Оптимизация MongoDB успешно завершена."

# Запуск оптимизации Redis
log "Запуск оптимизации Redis..."
node scripts/optimize-redis.js
if [ $? -ne 0 ]; then
  error "Ошибка при оптимизации Redis."
fi
log "Оптимизация Redis успешно завершена."

# Перезапуск сервисов для применения оптимизаций
log "Перезапуск сервисов для применения оптимизаций..."

# Проверяем, запущены ли сервисы через Docker Compose
if docker-compose ps | grep -q "backend"; then
  log "Перезапуск сервисов через Docker Compose..."
  docker-compose restart
  log "Сервисы успешно перезапущены."
else
  warn "Сервисы не запущены через Docker Compose. Пропускаем перезапуск."
fi

log "Все оптимизации успешно выполнены."