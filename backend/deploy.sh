#!/bin/bash

# Скрипт для ручного деплоя бэкенда на сервер

# Переменные (настроены для вашего сервера)
DOCKER_USERNAME="makstreid"  # Имя пользователя Docker Hub
SERVER_USER="root"           # Имя пользователя сервера
SERVER_HOST="217.198.6.238"  # IP-адрес сервера
SERVER_PATH="/app"           # Путь к приложению на сервере

# Проверка незамененных переменных
if [ "$DOCKER_USERNAME" = "username" ]; then
  error "DOCKER_USERNAME не изменен с значения по умолчанию. Пожалуйста, укажите ваше имя пользователя Docker Hub."
fi

if [ "$SERVER_USER" = "user" ]; then
  error "SERVER_USER не изменен с значения по умолчанию. Пожалуйста, укажите имя пользователя сервера."
fi

if [ "$SERVER_HOST" = "server_ip" ]; then
  error "SERVER_HOST не изменен с значения по умолчанию. Пожалуйста, укажите IP-адрес или хост сервера."
fi

if [ "$SERVER_PATH" = "/path/to/app" ]; then
  error "SERVER_PATH не изменен с значения по умолчанию. Пожалуйста, укажите путь к приложению на сервере."
fi

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
log "Используем Docker username: $DOCKER_USERNAME"
docker build -t $DOCKER_USERNAME/mock-interviews-backend ./ --no-cache

# Проверка успешности сборки
if [ $? -ne 0 ]; then
  error "Ошибка при сборке Docker образа."
fi

# Отправка образа в Docker Hub
log "Отправка образа в Docker Hub ($DOCKER_USERNAME/mock-interviews-backend)..."
docker push $DOCKER_USERNAME/mock-interviews-backend

# Проверка успешности отправки
if [ $? -ne 0 ]; then
  error "Ошибка при отправке образа в Docker Hub. Проверьте, что вы авторизованы (docker login)."
fi

# Проверка наличия необходимых файлов
if [ ! -f "docker-compose.yml" ]; then
  error "Файл docker-compose.yml не найден в текущей директории. Убедитесь, что вы запускаете скрипт из директории backend."
fi

if [ ! -f ".env.production" ]; then
  error "Файл .env.production не найден в текущей директории. Убедитесь, что вы запускаете скрипт из директории backend."
fi

# Проверка содержимого .env.production
if grep -q "<username>" .env.production || grep -q "<password>" .env.production || grep -q "<cluster>" .env.production; then
  error "В файле .env.production найдены незамененные плейсхолдеры. Пожалуйста, замените <username>, <password> и <cluster> на реальные значения."
fi

if ! grep -q "DOCKER_USERNAME" .env.production; then
  warn "В файле .env.production не найдена переменная DOCKER_USERNAME. Рекомендуется добавить её для использования в docker-compose.yml."
fi

# Копирование docker-compose.yml и .env.production на сервер
log "Копирование файлов на сервер ($SERVER_USER@$SERVER_HOST:$SERVER_PATH)..."
scp -v docker-compose.yml .env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Проверка успешности копирования
if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер. Проверьте подключение и права доступа."
fi

# Подключение к серверу и запуск контейнеров
log "Запуск контейнеров на сервере ($SERVER_USER@$SERVER_HOST)..."
ssh -v $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  echo 'Текущая директория: \$(pwd)' && \
  mv .env.production .env && \
  echo 'Файл .env создан' && \
  docker pull $DOCKER_USERNAME/mock-interviews-backend && \
  echo 'Образ успешно загружен' && \
  docker-compose down && \
  echo 'Старые контейнеры остановлены' && \
  docker-compose up -d && \
  echo 'Новые контейнеры запущены' && \
  docker image prune -af && \
  echo 'Неиспользуемые образы удалены' && \
  docker ps | grep mock-interviews"

# Проверка успешности запуска
if [ $? -ne 0 ]; then
  error "Ошибка при запуске контейнеров на сервере."
fi

log "Деплой успешно завершен!"