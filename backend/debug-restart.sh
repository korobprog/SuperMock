#!/bin/bash

# Скрипт для отладки и перезапуска контейнеров с расширенным логированием

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
log "Копирование всех необходимых файлов..."
# Копируем всю директорию react-frontend вместо только .env.production
log "Копирование директории react-frontend..."
scp -v -r ../docker-compose.yml .env.production ../react-frontend $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Проверка успешности копирования
if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер. Проверьте подключение и права доступа."
fi

# Подключение к серверу и перезапуск контейнеров с расширенным логированием
log "Перезапуск контейнеров на сервере ($SERVER_USER@$SERVER_HOST) с расширенным логированием..."
ssh -v $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  echo '=== ТЕКУЩАЯ ДИРЕКТОРИЯ ===' && \
  pwd && \
  echo '=== ПРОВЕРКА СТРУКТУРЫ ДИРЕКТОРИЙ ===' && \
  ls -la && \
  echo '=== ПРОВЕРКА СОДЕРЖИМОГО DOCKER-COMPOSE.YML ===' && \
  cat docker-compose.yml | grep -A 5 'ports:' && \
  echo '=== ПРОВЕРКА СОДЕРЖИМОГО .ENV.PRODUCTION ===' && \
  cat backend/.env.production | grep -E 'PORT|HOST|MONGO_URI|REDIS_HOST' && \
  echo '=== ПРОВЕРКА ЗАПУЩЕННЫХ КОНТЕЙНЕРОВ ===' && \
  docker ps -a && \
  echo '=== ПРОВЕРКА ОТКРЫТЫХ ПОРТОВ ===' && \
  ss -tulpn | grep -E '9091|9092|27017|6379' || echo 'Команда ss не найдена' && \
  echo '=== ПРОВЕРКА СЕТЕВЫХ ИНТЕРФЕЙСОВ DOCKER ===' && \
  docker network ls && \
  docker network inspect app-network || echo 'Сеть app-network не найдена' && \
  echo '=== ОСТАНОВКА КОНТЕЙНЕРОВ ===' && \
  docker-compose down && \
  echo '=== УДАЛЕНИЕ КОНТЕЙНЕРОВ ===' && \
  docker rm -f \$(docker ps -a -q) || echo 'Нет контейнеров для удаления' && \
  echo '=== УДАЛЕНИЕ ОБРАЗОВ ===' && \
  docker rmi \$(docker images -q) || echo 'Нет образов для удаления' && \
  echo '=== УДАЛЕНИЕ ТОМОВ ===' && \
  docker volume rm \$(docker volume ls -q) || echo 'Нет томов для удаления' && \
  echo '=== УДАЛЕНИЕ СЕТЕЙ ===' && \
  docker network rm \$(docker network ls -q -f 'name=app-network') || echo 'Сеть app-network не найдена' && \
  echo '=== ПРОВЕРКА ПОСЛЕ ОЧИСТКИ ===' && \
  docker ps -a && \
  docker images && \
  docker volume ls && \
  docker network ls && \
  echo '=== ПРОВЕРКА НАЛИЧИЯ ДИРЕКТОРИИ REACT-FRONTEND ===' && \
  ls -la | grep react-frontend || echo 'Директория react-frontend не найдена!' && \
  if [ -d "react-frontend" ]; then
    echo "Директория react-frontend существует, продолжаем запуск контейнеров" && \
    echo '=== ЗАПУСК КОНТЕЙНЕРОВ С ОБНОВЛЕННЫМИ НАСТРОЙКАМИ ===' && \
    docker-compose up -d
  else
    echo "ОШИБКА: Директория react-frontend не существует! Контейнеры не будут запущены." && \
    exit 1
  fi && \
  echo '=== ПРОВЕРКА ЗАПУЩЕННЫХ КОНТЕЙНЕРОВ ===' && \
  docker ps && \
  echo '=== ПРОВЕРКА ЛОГОВ БЭКЕНДА ===' && \
  docker logs supermock-backend && \
  echo '=== ПРОВЕРКА ЛОГОВ ФРОНТЕНДА ===' && \
  docker logs supermock-frontend && \
  echo '=== ПРОВЕРКА ЛОГОВ MONGODB ===' && \
  docker logs supermock-mongo && \
  echo '=== ПРОВЕРКА ЛОГОВ REDIS ===' && \
  docker logs supermock-redis && \
  echo '=== ПРОВЕРКА ОТКРЫТЫХ ПОРТОВ ПОСЛЕ ЗАПУСКА ===' && \
  ss -tulpn | grep -E '9091|9092|27017|6379' || echo 'Команда ss не найдена' && \
  echo '=== ПРОВЕРКА ПОДКЛЮЧЕНИЯ К MONGODB ===' && \
  docker exec supermock-mongo mongo -u admin -p krishna1284radha --eval 'db.adminCommand({ ping: 1 })' && \
  echo '=== ПРОВЕРКА ПОДКЛЮЧЕНИЯ К REDIS ===' && \
  docker exec supermock-redis redis-cli -a krishna1284radha ping && \
  echo '=== ПРОВЕРКА ДОСТУПНОСТИ API ===' && \
  curl -v http://localhost:9092/api || echo 'API недоступен' && \
  echo '=== ПРОВЕРКА ДОСТУПНОСТИ ФРОНТЕНДА ===' && \
  curl -v http://localhost:9091 || echo 'Фронтенд недоступен'"

# Проверка успешности запуска
if [ $? -ne 0 ]; then
  error "Ошибка при перезапуске контейнеров на сервере."
fi

log "Перезапуск успешно завершен!"
log "Сайт должен быть доступен по адресу: http://$SERVER_HOST:9091"
log "API должен быть доступен по адресу: http://$SERVER_HOST:9092/api"