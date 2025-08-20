#!/bin/bash

# Скрипт для запуска системы мониторинга

# Определяем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Загружаем переменные окружения из .env файла, если он существует
if [ -f "${SCRIPT_DIR}/../.env" ]; then
    source "${SCRIPT_DIR}/../.env"
fi

# Переменные
LOG_FILE="${SCRIPT_DIR}/logs/monitoring_$(date +%Y%m%d_%H%M%S).log"

# Создаем директорию для логов
mkdir -p "${SCRIPT_DIR}/logs"

# Функция логирования
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

log "Запуск системы мониторинга"

# Проверяем наличие docker-compose
if ! command -v docker-compose &> /dev/null; then
    log "ОШИБКА: docker-compose не установлен"
    exit 1
fi

# Проверяем наличие docker
if ! command -v docker &> /dev/null; then
    log "ОШИБКА: docker не установлен"
    exit 1
fi

# Проверяем, запущен ли docker
if ! docker info &> /dev/null; then
    log "ОШИБКА: docker не запущен или у пользователя нет прав"
    exit 1
fi

# Создаем директории для логов, если они не существуют
log "Создание директорий для логов"
mkdir -p /var/log/backend
mkdir -p /var/log/mongodb
mkdir -p /var/log/redis

# Запускаем мониторинг
log "Запуск контейнеров мониторинга"
cd $SCRIPT_DIR && docker-compose up -d

# Проверяем статус
log "Проверка статуса контейнеров"
docker-compose ps

# Проверяем доступность Prometheus
log "Проверка доступности Prometheus"
if curl -s -f -o /dev/null "http://localhost:9090/-/healthy"; then
    log "Prometheus доступен"
else
    log "ПРЕДУПРЕЖДЕНИЕ: Prometheus недоступен"
fi

# Проверяем доступность Grafana
log "Проверка доступности Grafana"
if curl -s -f -o /dev/null "http://localhost:3000/api/health"; then
    log "Grafana доступна"
else
    log "ПРЕДУПРЕЖДЕНИЕ: Grafana недоступна"
fi

# Проверяем доступность Loki
log "Проверка доступности Loki"
if curl -s -f -o /dev/null "http://localhost:3100/ready"; then
    log "Loki доступен"
else
    log "ПРЕДУПРЕЖДЕНИЕ: Loki недоступен"
fi

log "Система мониторинга запущена"
log "Grafana доступна по адресу: http://localhost:3000"
log "Prometheus доступен по адресу: http://localhost:9090"

exit 0