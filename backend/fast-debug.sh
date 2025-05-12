#!/bin/bash

# Скрипт для быстрой отладки и перезапуска контейнеров
# Оптимизирован для быстрой работы с минимальным логированием

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

# Парсинг аргументов командной строки
BACKEND_ONLY=false
FRONTEND_ONLY=false
COPY_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --backend)
      BACKEND_ONLY=true
      shift
      ;;
    --frontend)
      FRONTEND_ONLY=true
      shift
      ;;
    --copy-only)
      COPY_ONLY=true
      shift
      ;;
    *)
      warn "Неизвестный аргумент: $1"
      shift
      ;;
  esac
done

# Если указаны оба флага, то это эквивалентно их отсутствию
if [ "$BACKEND_ONLY" = true ] && [ "$FRONTEND_ONLY" = true ]; then
  BACKEND_ONLY=false
  FRONTEND_ONLY=false
fi

# Определяем, какие файлы копировать
COPY_BACKEND=true
COPY_FRONTEND=true

if [ "$BACKEND_ONLY" = true ]; then
  COPY_FRONTEND=false
  log "Режим: только бэкенд"
fi

if [ "$FRONTEND_ONLY" = true ]; then
  COPY_BACKEND=false
  log "Режим: только фронтенд"
fi

# Копирование обновленных файлов на сервер с использованием rsync
log "Быстрое копирование обновленных файлов на сервер ($SERVER_USER@$SERVER_HOST:$SERVER_PATH)..."

# Копируем только необходимые файлы
# Сначала создаем необходимые директории на сервере
log "Создание необходимых директорий на сервере..."
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH/backend/src $SERVER_PATH/react-frontend/src"

if [ "$COPY_BACKEND" = true ]; then
  log "Копирование файлов бэкенда..."
  scp -q .env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/
  scp -q -r ./src/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/
  
  # Копируем Dockerfile и package.json для бэкенда
  log "Копирование Dockerfile и package.json для бэкенда..."
  scp -q ./Dockerfile $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/
  scp -q ./package*.json $SERVER_USER@$SERVER_HOST:$SERVER_PATH/backend/
fi

if [ "$COPY_FRONTEND" = true ]; then
  log "Копирование файлов фронтенда..."
  scp -q ../docker-compose.yml $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
  scp -q ../react-frontend/.env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/react-frontend/
  scp -q -r ../react-frontend/src/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/react-frontend/
  
  # Копируем Dockerfile и другие необходимые файлы для фронтенда
  log "Копирование Dockerfile и конфигурационных файлов для фронтенда..."
  scp -q ../react-frontend/Dockerfile $SERVER_USER@$SERVER_HOST:$SERVER_PATH/react-frontend/
  scp -q ../react-frontend/nginx.conf $SERVER_USER@$SERVER_HOST:$SERVER_PATH/react-frontend/
  scp -q ../react-frontend/env.sh $SERVER_USER@$SERVER_HOST:$SERVER_PATH/react-frontend/
fi

# Проверка успешности копирования
if [ $? -ne 0 ]; then
  error "Ошибка при копировании файлов на сервер. Проверьте подключение и права доступа."
fi

# Если указан флаг --copy-only, то завершаем работу
if [ "$COPY_ONLY" = true ]; then
  log "Копирование завершено. Перезапуск контейнеров не выполняется (--copy-only)."
  exit 0
fi

# Подключение к серверу и перезапуск контейнеров с минимальным логированием
log "Перезапуск контейнеров на сервере ($SERVER_USER@$SERVER_HOST)..."

# Формируем команду для выполнения на сервере
SERVER_COMMAND="cd $SERVER_PATH && "

# Проверяем наличие контейнеров и запускаем их при необходимости
SERVER_COMMAND+="cd $SERVER_PATH && "
SERVER_COMMAND+="echo '=== ПРОВЕРКА НАЛИЧИЯ КОНТЕЙНЕРОВ ===' && "

if [ "$BACKEND_ONLY" = true ]; then
  # Проверяем и перезапускаем только контейнер бэкенда
  SERVER_COMMAND+="if docker ps -a | grep -q supermock-backend; then "
  SERVER_COMMAND+="  echo 'Контейнер supermock-backend найден, перезапускаем...' && "
  SERVER_COMMAND+="  docker restart supermock-backend; "
  SERVER_COMMAND+="else "
  SERVER_COMMAND+="  echo 'Контейнер supermock-backend не найден, запускаем все контейнеры...' && "
  SERVER_COMMAND+="  docker-compose up -d; "
  SERVER_COMMAND+="fi && "
  SERVER_COMMAND+="echo '=== ПРОВЕРКА ЗАПУЩЕННЫХ КОНТЕЙНЕРОВ ===' && "
  SERVER_COMMAND+="docker ps | grep supermock-backend && "
  SERVER_COMMAND+="echo '=== ПРОВЕРКА ЛОГОВ БЭКЕНДА ===' && "
  SERVER_COMMAND+="docker logs --tail 20 supermock-backend || echo 'Не удалось получить логи бэкенда'"
elif [ "$FRONTEND_ONLY" = true ]; then
  # Проверяем и перезапускаем только контейнер фронтенда
  SERVER_COMMAND+="if docker ps -a | grep -q supermock-frontend; then "
  SERVER_COMMAND+="  echo 'Контейнер supermock-frontend найден, перезапускаем...' && "
  SERVER_COMMAND+="  docker restart supermock-frontend; "
  SERVER_COMMAND+="else "
  SERVER_COMMAND+="  echo 'Контейнер supermock-frontend не найден, запускаем все контейнеры...' && "
  SERVER_COMMAND+="  docker-compose up -d; "
  SERVER_COMMAND+="fi && "
  SERVER_COMMAND+="echo '=== ПРОВЕРКА ЗАПУЩЕННЫХ КОНТЕЙНЕРОВ ===' && "
  SERVER_COMMAND+="docker ps | grep supermock-frontend && "
  SERVER_COMMAND+="echo '=== ПРОВЕРКА ЛОГОВ ФРОНТЕНДА ===' && "
  SERVER_COMMAND+="docker logs --tail 20 supermock-frontend || echo 'Не удалось получить логи фронтенда'"
else
  # Перезапускаем все контейнеры
  SERVER_COMMAND+="docker-compose down && "
  SERVER_COMMAND+="docker-compose up -d && "
  SERVER_COMMAND+="echo '=== ПРОВЕРКА ЗАПУЩЕННЫХ КОНТЕЙНЕРОВ ===' && "
  SERVER_COMMAND+="docker ps && "
  SERVER_COMMAND+="echo '=== ПРОВЕРКА ЛОГОВ БЭКЕНДА ===' && "
  SERVER_COMMAND+="docker logs --tail 20 supermock-backend || echo 'Не удалось получить логи бэкенда' && "
  SERVER_COMMAND+="echo '=== ПРОВЕРКА ЛОГОВ ФРОНТЕНДА ===' && "
  SERVER_COMMAND+="docker logs --tail 20 supermock-frontend || echo 'Не удалось получить логи фронтенда'"
fi

# Выполняем команду на сервере
ssh $SERVER_USER@$SERVER_HOST "$SERVER_COMMAND"

# Проверка успешности запуска
if [ $? -ne 0 ]; then
  error "Ошибка при перезапуске контейнеров на сервере."
fi

log "Перезапуск успешно завершен!"
log "Сайт должен быть доступен по адресу: http://$SERVER_HOST:9091"
log "API должен быть доступен по адресу: http://$SERVER_HOST:9092/api"