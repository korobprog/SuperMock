#!/bin/bash

# Скрипт для деплоя приложения на сервер без локальной сборки образов
# Использует уже существующие образы из Docker Hub

# Переменные (настройте под ваш сервер)
SERVER_USER="root"           # Имя пользователя сервера
SERVER_HOST="217.198.6.238"  # IP-адрес сервера
SERVER_PATH="/root/supermock" # Путь к приложению на сервере
DOCKER_USERNAME="makstreid"  # Имя пользователя Docker Hub

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

# Копирование файлов на сервер
log "Копирование файлов на сервер..."
scp docker-compose.prod.yml .env $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер."
fi

# Копирование .env.production в директорию backend на сервере
log "Копирование .env.production в директорию backend на сервере..."
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH/backend"
scp backend/.env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/

if [ $? -ne 0 ]; then
  error "Ошибка при копировании .env.production на сервер."
fi

# Создание директории для Nginx на сервере
log "Создание директории для Nginx на сервере..."
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH/nginx"

if [ $? -ne 0 ]; then
  error "Ошибка при создании директории для Nginx на сервере."
fi

# Копирование конфигурации Nginx на сервер
log "Копирование конфигурации Nginx на сервер..."
scp nginx/nginx.conf $SERVER_USER@$SERVER_HOST:$SERVER_PATH/nginx/

if [ $? -ne 0 ]; then
  error "Ошибка при копировании конфигурации Nginx на сервер."
fi

# Копирование SSL-сертификатов на сервер (если они есть)
if [ -d "backend/letsencrypt" ]; then
  log "Копирование SSL-сертификатов на сервер..."
  ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH/backend/letsencrypt"
  scp -r backend/letsencrypt/* $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/letsencrypt/

  if [ $? -ne 0 ]; then
    warn "Ошибка при копировании SSL-сертификатов на сервер. Продолжаем без них."
  fi
fi

# Запуск контейнеров на сервере
log "Запуск контейнеров на сервере..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  # Переименование файлов
  cp docker-compose.prod.yml docker-compose.yml && \
  cp backend/.env.production backend/.env && \
  
  # Экспорт переменных окружения
  export DOCKER_USERNAME=$DOCKER_USERNAME && \
  
  # Проверка запущенных контейнеров
  echo '=== Проверка запущенных контейнеров ===' && \
  docker ps -a && \
  
  # Остановка всех контейнеров
  echo '=== Остановка всех контейнеров ===' && \
  docker stop \$(docker ps -a -q) || echo 'Нет запущенных контейнеров' && \
  
  # Удаление всех контейнеров
  echo '=== Удаление всех контейнеров ===' && \
  docker rm \$(docker ps -a -q) || echo 'Нет контейнеров для удаления' && \
  
  # Удаление неиспользуемых образов
  echo '=== Удаление неиспользуемых образов ===' && \
  docker image prune -af && \
  
  # Загрузка новых образов
  echo '=== Загрузка новых образов ===' && \
  docker-compose pull && \
  
  # Запуск новых контейнеров
  echo '=== Запуск новых контейнеров ===' && \
  docker-compose up -d && \
  
  # Проверка статуса контейнеров
  echo '=== Проверка статуса контейнеров ===' && \
  docker-compose ps && \
  
  # Проверка логов контейнеров
  echo '=== Проверка логов контейнеров ===' && \
  docker-compose logs --tail=20"

if [ $? -ne 0 ]; then
  error "Ошибка при запуске контейнеров на сервере."
fi

# Проверка доступности приложения
log "Проверка доступности приложения..."
ssh $SERVER_USER@$SERVER_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:9095/api/health || echo 'Сервис недоступен'"

log "Деплой успешно завершен!"
log "Приложение доступно по адресу: https://supermock.ru"