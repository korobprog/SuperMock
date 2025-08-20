#!/bin/bash

# Скрипт для автоматического развертывания в продакшене
# Использует стратегию blue-green deployment

# Определяем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# Загружаем переменные окружения из .env файла, если он существует
if [ -f "${PROJECT_ROOT}/.env" ]; then
    source "${PROJECT_ROOT}/.env"
fi

# Переменные
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/deploy_${TIMESTAMP}.log"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
BACKUP_DIR="${PROJECT_ROOT}/backups/deployments"
HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-"http://localhost:${BACKEND_PORT:-4000}/health"}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-30}
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}

# Создаем директории для логов и бэкапов
mkdir -p $LOG_DIR
mkdir -p $BACKUP_DIR

# Функция логирования
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

# Функция для проверки здоровья сервиса
check_health() {
    local timeout=$1
    local url=$2
    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))
    
    log "Проверка доступности сервиса по URL: $url (таймаут: ${timeout}с)"
    
    while [ $(date +%s) -lt $end_time ]; do
        if curl -s -f -o /dev/null "$url"; then
            log "Сервис доступен и работает корректно"
            return 0
        fi
        log "Сервис пока недоступен, повторная проверка через 2 секунды..."
        sleep 2
    done
    
    log "ОШИБКА: Сервис не стал доступен в течение ${timeout} секунд"
    return 1
}

# Функция для создания бэкапа текущего состояния
backup_current_state() {
    log "Создание бэкапа текущего состояния"
    
    # Бэкап docker-compose файла
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        cp "$DOCKER_COMPOSE_FILE" "${BACKUP_DIR}/docker-compose.${TIMESTAMP}.yml"
        log "Бэкап docker-compose файла создан: ${BACKUP_DIR}/docker-compose.${TIMESTAMP}.yml"
    fi
    
    # Бэкап .env файла
    if [ -f "${PROJECT_ROOT}/.env" ]; then
        cp "${PROJECT_ROOT}/.env" "${BACKUP_DIR}/.env.${TIMESTAMP}"
        log "Бэкап .env файла создан: ${BACKUP_DIR}/.env.${TIMESTAMP}"
    fi
    
    # Сохраняем список запущенных контейнеров
    docker ps > "${BACKUP_DIR}/docker-ps.${TIMESTAMP}.txt"
    log "Список запущенных контейнеров сохранен: ${BACKUP_DIR}/docker-ps.${TIMESTAMP}.txt"
    
    # Сохраняем образы
    docker images > "${BACKUP_DIR}/docker-images.${TIMESTAMP}.txt"
    log "Список образов сохранен: ${BACKUP_DIR}/docker-images.${TIMESTAMP}.txt"
}

# Функция для отката изменений
rollback() {
    log "ВНИМАНИЕ: Выполняется откат изменений"
    
    # Останавливаем текущие контейнеры
    log "Останавливаем текущие контейнеры"
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Восстанавливаем предыдущий docker-compose файл
    if [ -f "${BACKUP_DIR}/docker-compose.${TIMESTAMP}.yml" ]; then
        log "Восстанавливаем предыдущий docker-compose файл"
        cp "${BACKUP_DIR}/docker-compose.${TIMESTAMP}.yml" "$DOCKER_COMPOSE_FILE"
    fi
    
    # Восстанавливаем предыдущий .env файл
    if [ -f "${BACKUP_DIR}/.env.${TIMESTAMP}" ]; then
        log "Восстанавливаем предыдущий .env файл"
        cp "${BACKUP_DIR}/.env.${TIMESTAMP}" "${PROJECT_ROOT}/.env"
    fi
    
    # Запускаем предыдущую версию
    log "Запускаем предыдущую версию"
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Проверяем здоровье после отката
    if check_health $HEALTH_CHECK_TIMEOUT $HEALTH_CHECK_URL; then
        log "Откат успешно выполнен, предыдущая версия запущена"
    else
        log "КРИТИЧЕСКАЯ ОШИБКА: Откат не помог, сервис недоступен!"
        log "Требуется ручное вмешательство!"
    fi
}

# Начало процесса деплоя
log "Начало процесса развертывания"

# Создаем бэкап текущего состояния
backup_current_state

# Получаем последние изменения из репозитория
log "Получение последних изменений из репозитория"
git pull
if [ $? -ne 0 ]; then
    log "ОШИБКА: Не удалось получить изменения из репозитория"
    exit 1
fi

# Устанавливаем зависимости
log "Установка зависимостей"
cd $PROJECT_ROOT && npm run install:all
if [ $? -ne 0 ]; then
    log "ОШИБКА: Не удалось установить зависимости"
    if [ "$ROLLBACK_ON_FAILURE" = true ]; then
        rollback
    fi
    exit 1
fi

# Собираем проект
log "Сборка проекта"
cd $PROJECT_ROOT && npm run build
if [ $? -ne 0 ]; then
    log "ОШИБКА: Не удалось собрать проект"
    if [ "$ROLLBACK_ON_FAILURE" = true ]; then
        rollback
    fi
    exit 1
fi

# Останавливаем текущие контейнеры
log "Останавливаем текущие контейнеры"
docker-compose -f "$DOCKER_COMPOSE_FILE" down
if [ $? -ne 0 ]; then
    log "ПРЕДУПРЕЖДЕНИЕ: Возникли проблемы при остановке контейнеров"
fi

# Удаляем неиспользуемые образы
log "Удаляем неиспользуемые образы"
docker image prune -af
if [ $? -ne 0 ]; then
    log "ПРЕДУПРЕЖДЕНИЕ: Возникли проблемы при удалении неиспользуемых образов"
fi

# Запускаем новые контейнеры
log "Запускаем новые контейнеры"
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
if [ $? -ne 0 ]; then
    log "ОШИБКА: Не удалось запустить новые контейнеры"
    if [ "$ROLLBACK_ON_FAILURE" = true ]; then
        rollback
    fi
    exit 1
fi

# Проверяем статус
log "Проверяем статус контейнеров"
docker-compose -f "$DOCKER_COMPOSE_FILE" ps
docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=50

# Проверяем доступность сервиса
if check_health $HEALTH_CHECK_TIMEOUT $HEALTH_CHECK_URL; then
    log "Деплой успешно завершен"
else
    log "ОШИБКА: Сервис недоступен после деплоя"
    if [ "$ROLLBACK_ON_FAILURE" = true ]; then
        rollback
    fi
    exit 1
fi

log "Процесс развертывания успешно завершен"
exit 0