#!/bin/bash

# Скрипт для деплоя всей инфраструктуры на сервер

# Переменные (настройте под ваш сервер)
DOCKER_USERNAME="makstreid"  # Имя пользователя Docker Hub
DOCKER_PASSWORD=""           # Пароль Docker Hub (оставьте пустым для интерактивного ввода)
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

# Запрос пароля Docker Hub, если он не указан
if [ -z "$DOCKER_PASSWORD" ]; then
  read -sp "Введите пароль для Docker Hub ($DOCKER_USERNAME): " DOCKER_PASSWORD
  echo ""
fi

# Проверка Docker
log "Проверка Docker..."
if ! command -v docker &> /dev/null; then
  error "Docker не установлен. Установите Docker и повторите попытку."
fi

# Проверка Docker Compose
log "Проверка Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  error "Docker Compose не установлен. Установите Docker Compose и повторите попытку."
fi

# Сборка образов
log "Сборка образа для фронтенда..."
docker build -t $DOCKER_USERNAME/web-app-frontend:latest ./react-frontend

if [ $? -ne 0 ]; then
  error "Ошибка при сборке образа фронтенда."
fi

log "Сборка образа для бэкенда..."
docker build -t $DOCKER_USERNAME/web-app-backend:latest ./backend

if [ $? -ne 0 ]; then
  error "Ошибка при сборке образа бэкенда."
fi

# Аутентификация в Docker Hub
log "Аутентификация в Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u $DOCKER_USERNAME --password-stdin

if [ $? -ne 0 ]; then
  error "Ошибка аутентификации в Docker Hub. Проверьте учетные данные."
fi

# Отправка образов в Docker Hub
log "Отправка образов в Docker Hub..."
docker push $DOCKER_USERNAME/web-app-frontend:latest
docker push $DOCKER_USERNAME/web-app-backend:latest

if [ $? -ne 0 ]; then
  error "Ошибка при отправке образов в Docker Hub."
fi

# Создание директории на сервере, если она не существует
log "Создание директории на сервере..."
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH"

if [ $? -ne 0 ]; then
  error "Ошибка при создании директории на сервере."
fi

# Копирование файлов на сервер
log "Копирование файлов на сервер..."
scp docker-compose.yml .env nginx/nginx.conf $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер."
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

# Копирование SSL-сертификатов на сервер
log "Копирование SSL-сертификатов на сервер..."
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH/backend/letsencrypt"
scp -r backend/letsencrypt/* $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/letsencrypt/

if [ $? -ne 0 ]; then
  error "Ошибка при копировании SSL-сертификатов на сервер."
fi

# Запуск контейнеров на сервере
log "Запуск контейнеров на сервере..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  export DOCKER_USERNAME=$DOCKER_USERNAME && \
  docker-compose pull && \
  docker-compose down && \
  docker-compose up -d"

if [ $? -ne 0 ]; then
  error "Ошибка при запуске контейнеров на сервере."
fi

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && docker-compose ps"

if [ $? -ne 0 ]; then
  warn "Не удалось получить статус контейнеров."
fi

# Проверка логов контейнеров
log "Проверка логов контейнеров..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && docker-compose logs --tail=20"

if [ $? -ne 0 ]; then
  warn "Не удалось получить логи контейнеров."
fi

log "Деплой успешно завершен!"
log "Приложение доступно по адресу: https://$SERVER_HOST"