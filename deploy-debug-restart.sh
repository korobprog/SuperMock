#!/bin/bash

# Скрипт для копирования debug-restart-server.sh на сервер и его выполнения

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

# Переменные (настройте под ваш сервер)
SERVER_USER="root"           # Имя пользователя сервера
SERVER_HOST="217.198.6.238"  # IP-адрес сервера
SERVER_PATH="/root/supermock" # Путь к приложению на сервере

# Проверка наличия файла debug-restart-server.sh
if [ ! -f "debug-restart-server.sh" ]; then
  error "Файл debug-restart-server.sh не найден в текущей директории."
fi

# Проверка прав на выполнение
if [ ! -x "debug-restart-server.sh" ]; then
  log "Установка прав на выполнение для debug-restart-server.sh..."
  chmod +x debug-restart-server.sh
fi

# Копирование скрипта на сервер
log "Копирование debug-restart-server.sh на сервер ($SERVER_USER@$SERVER_HOST:$SERVER_PATH)..."
scp debug-restart-server.sh $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Проверка успешности копирования
if [ $? -ne 0 ]; then
  error "Ошибка при копировании скрипта на сервер. Проверьте подключение и права доступа."
fi

# Установка прав на выполнение на сервере
log "Установка прав на выполнение на сервере..."
ssh $SERVER_USER@$SERVER_HOST "chmod +x $SERVER_PATH/debug-restart-server.sh"

# Проверка успешности установки прав
if [ $? -ne 0 ]; then
  error "Ошибка при установке прав на выполнение на сервере."
fi

# Выполнение скрипта на сервере
log "Выполнение debug-restart-server.sh на сервере..."
ssh $SERVER_USER@$SERVER_HOST "$SERVER_PATH/debug-restart-server.sh"

# Проверка успешности выполнения
if [ $? -ne 0 ]; then
  error "Ошибка при выполнении скрипта на сервере."
fi

log "Скрипт debug-restart-server.sh успешно выполнен на сервере!"
log "Сайт должен быть доступен по адресу: http://$SERVER_HOST"
log "API должен быть доступен по адресу: http://$SERVER_HOST/api"