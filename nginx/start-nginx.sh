#!/bin/bash

# Скрипт для запуска Nginx с балансировкой нагрузки

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

# Создаем директорию для SSL сертификатов, если она не существует
log "Проверка директории для SSL сертификатов..."
mkdir -p ssl/live/supermock.ru

# Проверяем наличие SSL сертификатов
if [ ! -f ssl/live/supermock.ru/fullchain.pem ] || [ ! -f ssl/live/supermock.ru/privkey.pem ]; then
  warn "SSL сертификаты не найдены. Будет использован самоподписанный сертификат для разработки."
  
  # Создаем самоподписанный сертификат для разработки
  log "Создание самоподписанного сертификата..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/live/supermock.ru/privkey.pem \
    -out ssl/live/supermock.ru/fullchain.pem \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=SuperMock/CN=supermock.ru" \
    -addext "subjectAltName = DNS:supermock.ru,DNS:www.supermock.ru"
  
  # Создаем chain.pem (для разработки это копия fullchain.pem)
  cp ssl/live/supermock.ru/fullchain.pem ssl/live/supermock.ru/chain.pem
  
  log "Самоподписанный сертификат создан."
else
  log "SSL сертификаты найдены."
fi

# Проверяем, запущен ли уже Nginx
if docker ps | grep -q "nginx-lb"; then
  warn "Nginx уже запущен. Останавливаем..."
  docker-compose -f docker-compose.yml down
fi

# Запускаем Nginx с балансировкой нагрузки
log "Запуск Nginx с балансировкой нагрузки..."
docker-compose -f docker-compose.yml up -d

# Проверяем статус
log "Проверка статуса..."
docker-compose -f docker-compose.yml ps

log "Nginx с балансировкой нагрузки успешно запущен."
log "Доступен по адресу: https://supermock.ru"