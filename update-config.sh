#!/bin/bash

# Скрипт для быстрого обновления конфигурации на сервере без пересборки образов

# Переменные (настройте под ваш сервер)
SERVER_USER="root"           # Имя пользователя сервера
SERVER_HOST="217.198.6.238"  # IP-адрес сервера
SERVER_PATH="/root/supermock" # Путь к приложению на сервере

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

# Проверка SSH-соединения с сервером
log "Проверка SSH-соединения с сервером..."
ssh -q $SERVER_USER@$SERVER_HOST exit
if [ $? -ne 0 ]; then
  error "Не удалось подключиться к серверу. Проверьте SSH-соединение."
fi

# Копирование файлов конфигурации на сервер
log "Копирование файлов конфигурации на сервер..."
scp docker-compose.prod.yml .env $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
scp backend/.env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/

if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов конфигурации на сервер."
fi

# Перезапуск контейнеров на сервере
log "Перезапуск контейнеров на сервере..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  # Переименование файлов
  cp docker-compose.prod.yml docker-compose.yml && \
  cp backend/.env.production backend/.env && \
  
  # Перезапуск контейнеров
  docker-compose down && \
  docker-compose up -d && \
  
  # Проверка статуса контейнеров
  docker-compose ps"

if [ $? -ne 0 ]; then
  error "Ошибка при перезапуске контейнеров на сервере."
fi

log "Обновление конфигурации успешно завершено!"
log "Приложение доступно по адресу: https://supermock.ru"