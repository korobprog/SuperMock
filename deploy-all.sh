#!/bin/bash

# Скрипт для деплоя всего приложения на сервер

# Переменные (настроены для вашего сервера)
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

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
  error "Docker не установлен. Установите Docker и повторите попытку."
fi

# Проверка статуса Docker
log "Проверка статуса Docker..."
docker info &> /dev/null
if [ $? -ne 0 ]; then
  error "Docker не запущен или не настроен правильно. Убедитесь, что Docker Desktop запущен."
fi

# Проверка Docker Engine
log "Проверка Docker Engine..."
docker version --format '{{.Server.Os}}-{{.Server.Arch}}' &> /dev/null
if [ $? -ne 0 ]; then
  error "Не удалось подключиться к Docker Engine. Убедитесь, что Docker Desktop запущен и правильно настроен."
fi

# Проверка аутентификации в Docker Hub
log "Проверка аутентификации в Docker Hub..."
docker info | grep "Username" > /dev/null
if [ $? -ne 0 ]; then
  log "Аутентификация в Docker Hub не обнаружена. Выполняется вход..."
  echo "$DOCKER_PASSWORD" | docker login -u $DOCKER_USERNAME --password-stdin
  if [ $? -ne 0 ]; then
    error "Ошибка аутентификации в Docker Hub. Проверьте учетные данные."
  fi
  log "Аутентификация в Docker Hub успешна"
fi

# Сборка и отправка образа бэкенда
log "Сборка образа бэкенда..."
cd backend
docker build -t $DOCKER_USERNAME/mock-interviews-backend ./ --no-cache
if [ $? -ne 0 ]; then
  error "Ошибка при сборке образа бэкенда."
fi

log "Отправка образа бэкенда в Docker Hub..."
docker push $DOCKER_USERNAME/mock-interviews-backend
if [ $? -ne 0 ]; then
  error "Ошибка при отправке образа бэкенда в Docker Hub."
fi
cd ..

# Сборка и отправка образа фронтенда
log "Сборка образа фронтенда..."
cd react-frontend
docker build -t $DOCKER_USERNAME/mock-interviews-frontend ./ --no-cache
if [ $? -ne 0 ]; then
  error "Ошибка при сборке образа фронтенда."
fi

log "Отправка образа фронтенда в Docker Hub..."
docker push $DOCKER_USERNAME/mock-interviews-frontend
if [ $? -ne 0 ]; then
  error "Ошибка при отправке образа фронтенда в Docker Hub."
fi
cd ..

# Проверка наличия необходимых файлов
if [ ! -f "docker-compose.yml" ]; then
  error "Файл docker-compose.yml не найден в текущей директории."
fi

# Создание docker-compose.prod.yml для продакшн-среды
log "Создание docker-compose.prod.yml для продакшн-среды..."
cat > docker-compose.prod.yml << EOL
version: '3.8'
services:
  # Фронтенд контейнер
  frontend:
    image: $DOCKER_USERNAME/mock-interviews-frontend
    container_name: supermock-frontend
    ports:
      - '9091:80' # Экспортируем порт 80 контейнера на порт 9091 хоста
    environment:
      - VITE_BACKEND_URL=http://$SERVER_HOST:9091
      - VITE_API_URL=http://$SERVER_HOST:9092/api
      - VITE_WS_URL=http://$SERVER_HOST:9092
    networks:
      - app-network
    restart: always
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  # Бэкенд контейнер
  backend:
    image: $DOCKER_USERNAME/mock-interviews-backend
    container_name: supermock-backend
    ports:
      - '9092:9092' # Экспортируем порт 9092 контейнера на порт 9092 хоста
    environment:
      - MONGO_URI=mongodb://admin:krishna1284radha@mongo:27017/mock_interviews?authSource=admin
      - JWT_SECRET=9b6ecece4b5db27805f484e5b68f039f4eab9bb9f492d3ca97b11dc682818ac2
      - USE_MONGODB=true
      - FRONTEND_URL=https://supermock.ru
      - USE_REDIS=true
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=krishna1284radha
      - PORT=9092
      - NODE_ENV=production
      - HOST=0.0.0.0
    depends_on:
      - mongo
      - redis
    networks:
      - app-network
    restart: always
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  # MongoDB контейнер
  mongo:
    image: mongo:5
    container_name: supermock-mongo
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=krishna1284radha
    networks:
      - app-network
    restart: always
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  # Redis контейнер
  redis:
    image: redis:7-alpine
    container_name: supermock-redis
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: always
    command: redis-server --appendonly yes --requirepass krishna1284radha
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

volumes:
  mongo-data:
  redis-data:

networks:
  app-network:
    driver: bridge
EOL

# Копирование файлов на сервер
log "Копирование файлов на сервер ($SERVER_USER@$SERVER_HOST:$SERVER_PATH)..."
scp docker-compose.prod.yml $SERVER_USER@$SERVER_HOST:$SERVER_PATH/docker-compose.yml
if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер. Проверьте подключение и права доступа."
fi

# Подключение к серверу и запуск контейнеров
log "Запуск контейнеров на сервере ($SERVER_USER@$SERVER_HOST)..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  echo 'Текущая директория: \$(pwd)' && \
  echo '=== Проверка запущенных контейнеров ===' && \
  docker ps -a && \
  echo '=== Остановка всех контейнеров ===' && \
  docker stop \$(docker ps -a -q) || echo 'Нет запущенных контейнеров' && \
  echo '=== Удаление всех контейнеров ===' && \
  docker rm \$(docker ps -a -q) || echo 'Нет контейнеров для удаления' && \
  echo '=== Остановка контейнеров через docker-compose ===' && \
  docker-compose down && \
  echo 'Старые контейнеры остановлены' && \
  echo '=== Аутентификация в Docker Hub ===' && \
  echo "$DOCKER_PASSWORD" | docker login -u $DOCKER_USERNAME --password-stdin && \
  if [ \$? -ne 0 ]; then
    echo 'Ошибка аутентификации в Docker Hub. Проверьте учетные данные.' && exit 1
  fi && \
  echo 'Аутентификация в Docker Hub успешна' && \
  echo '=== Запуск новых контейнеров ===' && \
  docker pull $DOCKER_USERNAME/mock-interviews-frontend && \
  docker pull $DOCKER_USERNAME/mock-interviews-backend && \
  echo 'Образы успешно загружены' && \
  docker-compose up -d && \
  echo 'Новые контейнеры запущены' && \
  docker image prune -af && \
  echo 'Неиспользуемые образы удалены' && \
  docker ps"

# Проверка успешности запуска
if [ $? -ne 0 ]; then
  error "Ошибка при запуске контейнеров на сервере."
fi

log "Деплой успешно завершен!"
log "Фронтенд доступен по адресу: http://$SERVER_HOST:9091"
log "API доступен по адресу: http://$SERVER_HOST:9092/api"