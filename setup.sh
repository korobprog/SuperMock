#!/bin/bash

# Скрипт для настройки и запуска проекта SuperMock
# Этот скрипт настраивает и запускает фронтенд и бэкенд в Docker-контейнерах

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

# Проверка наличия Docker и Docker Compose
log "Проверка наличия Docker и Docker Compose..."
if ! command -v docker &> /dev/null; then
  error "Docker не установлен. Пожалуйста, установите Docker и повторите попытку."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  error "Docker Compose не установлен. Пожалуйста, установите Docker Compose и повторите попытку."
  exit 1
fi

log "Docker и Docker Compose установлены."

# Проверка наличия SSL-сертификатов
log "Проверка наличия SSL-сертификатов..."
if [ ! -f "/etc/letsencrypt/live/supermock.ru/fullchain.pem" ] || [ ! -f "/etc/letsencrypt/live/supermock.ru/privkey.pem" ]; then
  warn "SSL-сертификаты не найдены по указанным путям."
  warn "Убедитесь, что сертификаты доступны по следующим путям:"
  warn "  - /etc/letsencrypt/live/supermock.ru/fullchain.pem"
  warn "  - /etc/letsencrypt/live/supermock.ru/privkey.pem"
  
  read -p "Продолжить без проверки сертификатов? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Установка прервана."
    exit 1
  fi
else
  log "SSL-сертификаты найдены."
fi

# Создание .env файла, если он не существует
log "Создание .env файла..."
if [ ! -f ".env" ]; then
  echo "JWT_SECRET=your_jwt_secret_key" > .env
  log ".env файл создан с JWT_SECRET по умолчанию."
  warn "Рекомендуется изменить JWT_SECRET на более безопасный."
else
  log ".env файл уже существует."
fi

# Сборка и запуск контейнеров
log "Сборка и запуск контейнеров..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
sleep 5
if docker-compose ps | grep -q "Exit"; then
  error "Некоторые контейнеры завершили работу с ошибкой. Проверьте логи:"
  docker-compose logs
  exit 1
fi

# Вывод информации о запущенных контейнерах
log "Контейнеры успешно запущены:"
docker-compose ps

# Проверка доступности сервисов
log "Проверка доступности сервисов..."
sleep 5

# Проверка фронтенда
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
  log "Фронтенд доступен на порту 3000."
else
  warn "Фронтенд недоступен. Проверьте логи:"
  docker-compose logs frontend
fi

# Проверка бэкенда
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api | grep -q "200\|301\|302"; then
  log "Бэкенд доступен на порту 8080."
else
  warn "Бэкенд недоступен. Проверьте логи:"
  docker-compose logs backend
fi

# Напоминание о необходимости настройки Nginx
log "ВАЖНО: Не забудьте настроить Nginx на сервере!"
log "Файл конфигурации Nginx: nginx-server-config.conf"
log "Скопируйте его в /etc/nginx/sites-available/ и создайте символическую ссылку:"
log "  sudo cp nginx-server-config.conf /etc/nginx/sites-available/supermock.ru"
log "  sudo ln -s /etc/nginx/sites-available/supermock.ru /etc/nginx/sites-enabled/"
log "  sudo nginx -t"
log "  sudo systemctl reload nginx"

# Вывод инструкций
log "Установка завершена!"
log "Вы можете получить доступ к приложению по следующим URL:"
log "  - Фронтенд: https://supermock.ru/"
log "  - API: https://supermock.ru/api/"

log "Для просмотра логов используйте следующие команды:"
log "  - Все логи: docker-compose logs"
log "  - Логи фронтенда: docker-compose logs frontend"
log "  - Логи бэкенда: docker-compose logs backend"

log "Для остановки контейнеров используйте команду:"
log "  docker-compose down"

log "Для перезапуска контейнеров используйте команду:"
log "  docker-compose restart"

log "Для обновления контейнеров используйте команду:"
log "  docker-compose down && docker-compose build --no-cache && docker-compose up -d"

log "Спасибо за использование SuperMock!"