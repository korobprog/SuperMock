#!/bin/bash

# Скрипт для перезапуска контейнеров с обновленными настройками

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

# Переменные
SERVER_USER="root"           # Имя пользователя сервера
SERVER_HOST="217.198.6.238"  # IP-адрес сервера
SERVER_PATH="/root/supermock"           # Путь к приложению на сервере

# Проверка незамененных переменных
if [ "$SERVER_USER" = "user" ]; then
  error "SERVER_USER не изменен с значения по умолчанию. Пожалуйста, укажите имя пользователя сервера."
fi

if [ "$SERVER_HOST" = "server_ip" ]; then
  error "SERVER_HOST не изменен с значения по умолчанию. Пожалуйста, укажите IP-адрес или хост сервера."
fi

if [ "$SERVER_PATH" = "/path/to/app" ]; then
  error "SERVER_PATH не изменен с значения по умолчанию. Пожалуйста, укажите путь к приложению на сервере."
fi

# Копирование обновленных файлов на сервер
log "Копирование обновленных файлов на сервер ($SERVER_USER@$SERVER_HOST:$SERVER_PATH)..."
log "Копирование всех необходимых файлов бэкенда..."
scp -v -r backend/.env.production react-frontend/.env.production backend/src/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/

# Проверка успешности копирования
if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер. Проверьте подключение и права доступа."
fi

# Подключение к серверу и перезапуск контейнеров
log "Перезапуск контейнеров на сервере ($SERVER_USER@$SERVER_HOST)..."
ssh -v $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  echo 'Текущая директория: \$(pwd)' && \
  echo '=== Остановка контейнеров ===' && \
  docker-compose down && \
  echo 'Контейнеры остановлены' && \
  echo '=== Копирование обновленных файлов ===' && \
  cp .env.production .env && \
  echo '=== Проверка структуры директорий ===' && \
  ls -la && \
  echo '=== Проверка содержимого директории backend ===' && \
  ls -la backend/ || mkdir -p backend && \
  echo '=== Проверка содержимого директории backend/src ===' && \
  ls -la backend/src/ || echo 'Директория backend/src не существует' && \
  echo '=== Запуск контейнеров с обновленными настройками ===' && \
  docker-compose up -d && \
  echo 'Контейнеры запущены' && \
  docker ps"

# Проверка успешности запуска
if [ $? -ne 0 ]; then
  error "Ошибка при перезапуске контейнеров на сервере."
fi

log "Перезапуск успешно завершен!"
log "Сайт должен быть доступен по адресу: http://$SERVER_HOST:9091"
log "API должен быть доступен по адресу: http://$SERVER_HOST:9092/api"