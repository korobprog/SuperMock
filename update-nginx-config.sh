#!/bin/bash

# Скрипт для обновления конфигурации Nginx на сервере и перезапуска контейнера

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

# Проверка наличия файла конфигурации Nginx
log "Проверка наличия файла конфигурации Nginx..."
if [ ! -f "nginx/nginx.conf" ]; then
  error "Файл nginx/nginx.conf не найден!"
fi

# Копирование файла конфигурации на сервер
log "Копирование файла конфигурации на сервер..."
scp nginx/nginx.conf $SERVER_USER@$SERVER_HOST:$SERVER_PATH/nginx/

if [ $? -ne 0 ]; then
  error "Ошибка при копировании файла конфигурации на сервер."
fi

# Перезапуск контейнера Nginx на сервере
log "Перезапуск контейнера Nginx на сервере..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && docker-compose restart nginx"

if [ $? -ne 0 ]; then
  error "Ошибка при перезапуске контейнера Nginx на сервере."
fi

# Проверка статуса контейнера Nginx
log "Проверка статуса контейнера Nginx..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && docker-compose ps nginx"

if [ $? -ne 0 ]; then
  error "Ошибка при проверке статуса контейнера Nginx на сервере."
fi

# Проверка логов контейнера Nginx
log "Проверка логов контейнера Nginx..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && docker-compose logs --tail=20 nginx"

if [ $? -ne 0 ]; then
  error "Ошибка при проверке логов контейнера Nginx на сервере."
fi

log "Обновление конфигурации Nginx успешно завершено!"
log "Проверьте доступность сайта в браузере: https://supermock.ru"