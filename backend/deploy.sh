#!/bin/bash

# Скрипт для ручного деплоя бэкенда на сервер

# Переменные (замените на свои значения)
DOCKER_USERNAME="username"  # Замените на свое имя пользователя Docker Hub
SERVER_USER="user"          # Замените на имя пользователя сервера
SERVER_HOST="server_ip"     # Замените на IP-адрес или хост сервера
SERVER_PATH="/path/to/app"  # Замените на путь к приложению на сервере

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

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
  error "Docker не установлен. Установите Docker и повторите попытку."
fi

# Сборка Docker образа
log "Сборка Docker образа..."
docker build -t $DOCKER_USERNAME/mock-interviews-backend ./

# Проверка успешности сборки
if [ $? -ne 0 ]; then
  error "Ошибка при сборке Docker образа."
fi

# Отправка образа в Docker Hub
log "Отправка образа в Docker Hub..."
docker push $DOCKER_USERNAME/mock-interviews-backend

# Проверка успешности отправки
if [ $? -ne 0 ]; then
  error "Ошибка при отправке образа в Docker Hub. Проверьте, что вы авторизованы (docker login)."
fi

# Копирование docker-compose.yml и .env.production на сервер
log "Копирование файлов на сервер..."
scp docker-compose.yml .env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Проверка успешности копирования
if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер. Проверьте подключение и права доступа."
fi

# Подключение к серверу и запуск контейнеров
log "Запуск контейнеров на сервере..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  mv .env.production .env && \
  docker pull $DOCKER_USERNAME/mock-interviews-backend && \
  docker-compose down && \
  docker-compose up -d && \
  docker image prune -af"

# Проверка успешности запуска
if [ $? -ne 0 ]; then
  error "Ошибка при запуске контейнеров на сервере."
fi

log "Деплой успешно завершен!"