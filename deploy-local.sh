#!/bin/bash

# Локальная версия скрипта deploy-remote.sh без SSH-подключения
# Для запуска в Windows используйте команду: bash deploy-local.sh

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
}

# Проверка наличия Docker
log "Проверка наличия Docker..."
if ! command -v docker &> /dev/null; then
  error "Docker не установлен. Установите Docker перед запуском скрипта."
  exit 1
fi

# Проверка наличия docker-compose
log "Проверка наличия docker-compose..."
if ! command -v docker-compose &> /dev/null; then
  error "docker-compose не установлен. Установите docker-compose перед запуском скрипта."
  exit 1
fi

# Проверка наличия необходимых файлов
log "Проверка наличия необходимых файлов..."
if [ ! -f "docker-compose.yml" ]; then
  error "Файл docker-compose.yml не найден."
  exit 1
fi

if [ ! -f ".env" ]; then
  warn "Файл .env не найден. Создайте файл .env с необходимыми переменными окружения."
fi

if [ ! -f "backend/.env.production" ]; then
  warn "Файл backend/.env.production не найден. Убедитесь, что он существует для продакшн-окружения."
fi

# Запуск контейнеров локально
log "Запуск контейнеров локально..."

# Проверка запущенных контейнеров
log "Проверка запущенных контейнеров..."
docker ps -a

# Остановка всех контейнеров
log "Остановка всех контейнеров..."
docker stop $(docker ps -a -q) || log "Нет запущенных контейнеров"

# Удаление всех контейнеров
log "Удаление всех контейнеров..."
docker rm $(docker ps -a -q) || log "Нет контейнеров для удаления"

# Удаление неиспользуемых образов
log "Удаление неиспользуемых образов..."
docker image prune -af

# Запуск новых контейнеров
log "Запуск новых контейнеров..."
docker-compose up -d

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker-compose ps

# Проверка логов контейнеров
log "Проверка логов контейнеров..."
docker-compose logs --tail=20

# Проверка доступности приложения
log "Проверка доступности приложения..."
curl -s -o /dev/null -w '%{http_code}' http://localhost:9095/api/health || log "Сервис недоступен"

log "Деплой успешно завершен!"
log "Приложение доступно локально"