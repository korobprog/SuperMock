#!/bin/bash

# Скрипт для развертывания баз данных MongoDB и Redis на сервере
# Использование: ./deploy-db.sh <username> <server>
# Пример: ./deploy-db.sh user c641b068463c.vps.myjino.ru

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функции для вывода сообщений
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

# Проверка аргументов
if [ $# -lt 2 ]; then
  error "Недостаточно аргументов. Использование: ./deploy-db.sh <username> <server>"
fi

USERNAME=$1
SERVER=$2
REMOTE_DIR="/home/$USERNAME/supermook-db"

log "Начинаем развертывание баз данных на сервере $SERVER..."

# Создаем временную директорию
TEMP_DIR=$(mktemp -d)
log "Создана временная директория: $TEMP_DIR"

# Создаем docker-compose.yml
cat > $TEMP_DIR/docker-compose.yml << 'EOF'
version: '3.8'
services:
  mongo:
    image: mongo:5
    ports:
      # Изменено с '27017:27017' на '127.0.0.1:27017:27017' для безопасности
      # Это ограничит доступ только с локального хоста
      - '127.0.0.1:27017:27017'
    volumes:
      - mongo-data:/data/db
    networks:
      - db-network
    restart: always
    # Добавляем аутентификацию для MongoDB
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-password}
    # Улучшаем безопасность
    command: ["--auth", "--bind_ip", "0.0.0.0"]

  redis:
    image: redis:7-alpine
    ports:
      # Изменено с '6379:6379' на '127.0.0.1:6379:6379' для безопасности
      # Это ограничит доступ только с локального хоста
      - '127.0.0.1:6379:6379'
    volumes:
      - redis-data:/data
    networks:
      - db-network
    restart: always
    # Добавляем пароль для Redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-password}

volumes:
  mongo-data:
  redis-data:

networks:
  db-network:
    driver: bridge
EOF

log "Файл docker-compose.yml создан"

# Создаем .env файл
cat > $TEMP_DIR/.env << 'EOF'
# Переменные окружения для MongoDB и Redis
MONGO_USER=admin
MONGO_PASSWORD=password
REDIS_PASSWORD=password
EOF

log "Файл .env создан"

# Создаем скрипт для установки Docker на сервере
cat > $TEMP_DIR/install-docker.sh << 'EOF'
#!/bin/bash

# Проверяем, установлен ли Docker
if command -v docker &> /dev/null; then
    echo "Docker уже установлен"
else
    echo "Устанавливаем Docker..."
    sudo apt update
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt update
    sudo apt install -y docker-ce
fi

# Проверяем, установлен ли Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "Docker Compose уже установлен"
else
    echo "Устанавливаем Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER
echo "Пользователь $USER добавлен в группу docker"
echo "Для применения изменений выйдите из системы и войдите снова или выполните: newgrp docker"
EOF

chmod +x $TEMP_DIR/install-docker.sh
log "Скрипт install-docker.sh создан"

# Создаем скрипт для запуска контейнеров на сервере
cat > $TEMP_DIR/start-containers.sh << 'EOF'
#!/bin/bash

# Создаем директорию для проекта, если она не существует
mkdir -p ~/supermook-db
cd ~/supermook-db

# Запускаем контейнеры
docker-compose up -d

# Проверяем статус контейнеров
echo "Статус контейнеров:"
docker-compose ps

# Проверяем логи MongoDB
echo "Логи MongoDB:"
docker-compose logs --tail=20 mongo

# Проверяем логи Redis
echo "Логи Redis:"
docker-compose logs --tail=20 redis

# Получаем информацию о подключении
echo "Информация о подключении к MongoDB:"
echo "URI: mongodb://admin:${MONGO_PASSWORD}@localhost:27017/mock_interviews?authSource=admin"
echo "Для внешнего подключения замените localhost на IP-адрес сервера"

echo "Информация о подключении к Redis:"
echo "Host: localhost"
echo "Port: 6379"
echo "Password: ${REDIS_PASSWORD}"
echo "Для внешнего подключения замените localhost на IP-адрес сервера"
EOF

chmod +x $TEMP_DIR/start-containers.sh
log "Скрипт start-containers.sh создан"

# Копируем файлы на сервер
log "Копируем файлы на сервер $SERVER..."
ssh $USERNAME@$SERVER "mkdir -p $REMOTE_DIR"
scp $TEMP_DIR/docker-compose.yml $TEMP_DIR/.env $TEMP_DIR/install-docker.sh $TEMP_DIR/start-containers.sh $USERNAME@$SERVER:$REMOTE_DIR/

# Устанавливаем Docker на сервере
log "Устанавливаем Docker на сервере $SERVER..."
ssh $USERNAME@$SERVER "cd $REMOTE_DIR && chmod +x install-docker.sh && ./install-docker.sh"

# Запускаем контейнеры на сервере
log "Запускаем контейнеры на сервере $SERVER..."
ssh $USERNAME@$SERVER "cd $REMOTE_DIR && chmod +x start-containers.sh && ./start-containers.sh"

# Удаляем временную директорию
rm -rf $TEMP_DIR
log "Временная директория удалена"

log "Развертывание баз данных на сервере $SERVER завершено!"
log "Для подключения к серверу используйте: ssh $USERNAME@$SERVER"
log "Директория с файлами: $REMOTE_DIR"