#!/bin/bash

# Скрипт для деплоя полной Docker-инфраструктуры на сервер

# Переменные (настроены для вашего сервера)
DOCKER_USERNAME="makstreid"  # Имя пользователя Docker Hub
DOCKER_PASSWORD=""           # Пароль Docker Hub (оставьте пустым для интерактивного ввода)
SERVER_ALIAS="supermock"     # Алиас SSH для подключения к серверу
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

# Проверка наличия необходимых файлов
log "Проверка наличия необходимых файлов..."
FILES_TO_CHECK=("docker-compose.yml" "nginx/nginx.conf" "backend/Dockerfile" "react-frontend/Dockerfile" ".env" "backend/.env.production" "react-frontend/.env.production")

for file in "${FILES_TO_CHECK[@]}"; do
  if [ ! -f "$file" ]; then
    error "Файл $file не найден. Убедитесь, что вы запускаете скрипт из корневой директории проекта."
  fi
done

# Сборка Docker образа для бэкенда
log "Сборка Docker образа для бэкенда..."
cd backend
docker build -t $DOCKER_USERNAME/supermock-backend .
if [ $? -ne 0 ]; then
  error "Ошибка при сборке Docker образа для бэкенда."
fi
cd ..

# Сборка Docker образа для фронтенда
log "Сборка Docker образа для фронтенда..."
cd react-frontend
docker build -t $DOCKER_USERNAME/supermock-frontend .
if [ $? -ne 0 ]; then
  error "Ошибка при сборке Docker образа для фронтенда."
fi
cd ..

# Аутентификация в Docker Hub
log "Аутентификация в Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u $DOCKER_USERNAME --password-stdin
if [ $? -ne 0 ]; then
  error "Ошибка аутентификации в Docker Hub. Проверьте учетные данные."
fi

# Отправка образов в Docker Hub
log "Отправка образов в Docker Hub..."
docker push $DOCKER_USERNAME/supermock-backend
if [ $? -ne 0 ]; then
  error "Ошибка при отправке образа бэкенда в Docker Hub."
fi

docker push $DOCKER_USERNAME/supermock-frontend
if [ $? -ne 0 ]; then
  error "Ошибка при отправке образа фронтенда в Docker Hub."
fi

# Создание временной директории для файлов деплоя
log "Создание временной директории для файлов деплоя..."
TEMP_DIR=$(mktemp -d)
log "Временная директория: $TEMP_DIR"

# Копирование необходимых файлов во временную директорию
log "Копирование необходимых файлов во временную директорию..."
cp docker-compose.yml $TEMP_DIR/
cp .env $TEMP_DIR/.env.production
cp -r nginx $TEMP_DIR/
mkdir -p $TEMP_DIR/backend
cp backend/.env.production $TEMP_DIR/backend/
mkdir -p $TEMP_DIR/react-frontend
cp react-frontend/.env.production $TEMP_DIR/react-frontend/

# Копирование SSL-сертификатов
log "Копирование SSL-сертификатов..."
mkdir -p $TEMP_DIR/backend/letsencrypt/live/supermock.ru
mkdir -p $TEMP_DIR/backend/letsencrypt/archive/supermock.ru
cp -r backend/letsencrypt/archive/supermock.ru/* $TEMP_DIR/backend/letsencrypt/archive/supermock.ru/
cp backend/letsencrypt/options-ssl-nginx.conf $TEMP_DIR/backend/letsencrypt/
cp backend/letsencrypt/ssl-dhparams.pem $TEMP_DIR/backend/letsencrypt/

# Модификация docker-compose.yml для использования образов из Docker Hub
log "Модификация docker-compose.yml для использования образов из Docker Hub..."
sed -i "s|build: ./backend|image: $DOCKER_USERNAME/supermock-backend:latest|g" $TEMP_DIR/docker-compose.yml
sed -i "s|build: ./react-frontend|image: $DOCKER_USERNAME/supermock-frontend:latest|g" $TEMP_DIR/docker-compose.yml

# Добавление настроек HTTPS в docker-compose.yml
log "Добавление настроек HTTPS в docker-compose.yml..."
sed -i "s|'\\${NGINX_PORT:-80}:80'|'\\${NGINX_PORT:-80}:80'\\n      - '443:443'|g" $TEMP_DIR/docker-compose.yml
sed -i "s|- ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf|- ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf\\n      - ./backend/letsencrypt:/etc/letsencrypt|g" $TEMP_DIR/docker-compose.yml

# Копирование файлов на сервер
log "Копирование файлов на сервер ($SERVER_ALIAS:$SERVER_PATH)..."
ssh $SERVER_ALIAS "mkdir -p $SERVER_PATH/nginx $SERVER_PATH/backend $SERVER_PATH/react-frontend $SERVER_PATH/backend/letsencrypt/live/supermock.ru $SERVER_PATH/backend/letsencrypt/archive/supermock.ru"
scp $TEMP_DIR/docker-compose.yml $SERVER_ALIAS:$SERVER_PATH/
scp $TEMP_DIR/.env.production $SERVER_ALIAS:$SERVER_PATH/.env
scp $TEMP_DIR/nginx/nginx.conf $SERVER_ALIAS:$SERVER_PATH/nginx/
scp $TEMP_DIR/backend/.env.production $SERVER_ALIAS:$SERVER_PATH/backend/
scp $TEMP_DIR/react-frontend/.env.production $SERVER_ALIAS:$SERVER_PATH/react-frontend/

# Копирование SSL-сертификатов на сервер
log "Копирование SSL-сертификатов на сервер..."
scp $TEMP_DIR/backend/letsencrypt/archive/supermock.ru/* $SERVER_ALIAS:$SERVER_PATH/backend/letsencrypt/archive/supermock.ru/
scp $TEMP_DIR/backend/letsencrypt/options-ssl-nginx.conf $SERVER_ALIAS:$SERVER_PATH/backend/letsencrypt/
scp $TEMP_DIR/backend/letsencrypt/ssl-dhparams.pem $SERVER_ALIAS:$SERVER_PATH/backend/letsencrypt/

# Создание символических ссылок для сертификатов
log "Создание символических ссылок для сертификатов..."
ssh $SERVER_ALIAS "cd $SERVER_PATH/backend/letsencrypt/live/supermock.ru && \
  ln -sf ../../archive/supermock.ru/privkey1.pem privkey.pem && \
  ln -sf ../../archive/supermock.ru/fullchain1.pem fullchain.pem && \
  ln -sf ../../archive/supermock.ru/cert1.pem cert.pem && \
  ln -sf ../../archive/supermock.ru/chain1.pem chain.pem"

# Установка правильных прав доступа для сертификатов
log "Установка правильных прав доступа для сертификатов..."
ssh $SERVER_ALIAS "chmod -R 755 $SERVER_PATH/backend/letsencrypt"

# Удаление временной директории
log "Удаление временной директории..."
rm -rf $TEMP_DIR

# Подключение к серверу и запуск контейнеров
log "Запуск контейнеров на сервере..."
ssh $SERVER_ALIAS "cd $SERVER_PATH && \
  echo 'Текущая директория: \$(pwd)' && \
  echo '=== Проверка структуры директорий ===' && \
  ls -la && \
  echo '=== Проверка структуры директории backend/letsencrypt ===' && \
  ls -la backend/letsencrypt && \
  echo '=== Проверка структуры директории backend/letsencrypt/live/supermock.ru ===' && \
  ls -la backend/letsencrypt/live/supermock.ru && \
  echo '=== Проверка структуры директории backend/letsencrypt/archive/supermock.ru ===' && \
  ls -la backend/letsencrypt/archive/supermock.ru && \
  echo '=== Проверка содержимого docker-compose.yml ===' && \
  cat docker-compose.yml && \
  echo '=== Проверка содержимого nginx/nginx.conf ===' && \
  cat nginx/nginx.conf && \
  echo '=== Проверка запущенных контейнеров ===' && \
  docker ps -a && \
  echo '=== Остановка всех контейнеров ===' && \
  docker-compose down || echo 'Ошибка при остановке контейнеров' && \
  echo '=== Аутентификация в Docker Hub ===' && \
  echo '$DOCKER_PASSWORD' | docker login -u $DOCKER_USERNAME --password-stdin && \
  echo '=== Загрузка образов ===' && \
  docker pull $DOCKER_USERNAME/supermock-backend:latest && \
  docker pull $DOCKER_USERNAME/supermock-frontend:latest && \
  echo '=== Запуск новых контейнеров ===' && \
  docker-compose up -d && \
  echo '=== Проверка запущенных контейнеров ===' && \
  docker ps && \
  echo '=== Проверка логов контейнера nginx ===' && \
  docker logs nginx && \
  echo '=== Удаление неиспользуемых образов ===' && \
  docker image prune -f"

# Проверка успешности запуска
if [ $? -ne 0 ]; then
  error "Ошибка при запуске контейнеров на сервере."
fi

log "Деплой успешно завершен!"
log "Приложение доступно по адресу: http://$SERVER_HOST"