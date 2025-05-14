#!/bin/bash

# Скрипт для резервного копирования Redis
# Запускать через cron, например: 0 3 * * * /path/to/backup-redis.sh

# Загружаем переменные окружения из .env файла, если он существует
if [ -f "../../.env" ]; then
    source "../../.env"
fi

# Переменные
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT:-/backups}/redis"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
REDIS_CONTAINER=${REDIS_CONTAINER_NAME:-redis}
REDIS_PASSWORD=${REDIS_PASSWORD}
LOG_FILE="${BACKUP_ROOT:-/backups}/logs/redis_backup_${TIMESTAMP}.log"

# Создаем директории для бэкапа и логов
mkdir -p $BACKUP_DIR
mkdir -p "${BACKUP_ROOT:-/backups}/logs"

# Функция логирования
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

log "Начало резервного копирования Redis"

# Проверяем, запущен ли контейнер
if ! docker ps | grep -q $REDIS_CONTAINER; then
    log "ОШИБКА: Контейнер $REDIS_CONTAINER не запущен"
    exit 1
fi

# Создаем директорию для RDB файла
TEMP_DIR="/tmp/redis_backup_${TIMESTAMP}"
mkdir -p $TEMP_DIR

# Выполняем команду SAVE для создания RDB файла
log "Создание RDB файла"
if [ -n "$REDIS_PASSWORD" ]; then
    docker exec $REDIS_CONTAINER redis-cli -a $REDIS_PASSWORD SAVE
else
    docker exec $REDIS_CONTAINER redis-cli SAVE
fi

# Копируем RDB файл из контейнера
log "Копирование RDB файла из контейнера"
docker cp $REDIS_CONTAINER:/data/dump.rdb $TEMP_DIR/

# Архивируем RDB файл
log "Архивирование RDB файла"
tar -czf "${BACKUP_DIR}/redis_${TIMESTAMP}.tar.gz" -C $TEMP_DIR .

# Удаляем временную директорию
log "Очистка временных файлов"
rm -rf $TEMP_DIR

# Удаляем старые бэкапы
log "Удаление бэкапов старше $RETENTION_DAYS дней"
find $BACKUP_DIR -name "redis_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# Проверяем успешность создания архива
if [ -f "${BACKUP_DIR}/redis_${TIMESTAMP}.tar.gz" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/redis_${TIMESTAMP}.tar.gz" | cut -f1)
    log "Резервное копирование успешно завершено. Размер бэкапа: $BACKUP_SIZE"
else
    log "ОШИБКА: Не удалось создать архив резервной копии"
    exit 1
fi

# Выводим список всех бэкапов
log "Список доступных бэкапов:"
ls -lh $BACKUP_DIR | grep redis | tee -a $LOG_FILE

exit 0