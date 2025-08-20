#!/bin/bash

# Скрипт для резервного копирования MongoDB
# Запускать через cron, например: 0 2 * * * /path/to/backup-mongodb.sh

# Загружаем переменные окружения из .env файла, если он существует
if [ -f "../../.env" ]; then
    source "../../.env"
fi

# Переменные
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT:-/backups}/mongodb"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
MONGO_CONTAINER=${MONGO_CONTAINER_NAME:-mongo}
MONGO_USER=${MONGO_INITDB_ROOT_USERNAME:-admin}
MONGO_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
MONGO_DB=${MONGO_DB_NAME:-mock_interviews}
LOG_FILE="${BACKUP_ROOT:-/backups}/logs/mongodb_backup_${TIMESTAMP}.log"

# Создаем директории для бэкапа и логов
mkdir -p $BACKUP_DIR
mkdir -p "${BACKUP_ROOT:-/backups}/logs"

# Функция логирования
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

log "Начало резервного копирования MongoDB"

# Проверяем, запущен ли контейнер
if ! docker ps | grep -q $MONGO_CONTAINER; then
    log "ОШИБКА: Контейнер $MONGO_CONTAINER не запущен"
    exit 1
fi

# Создаем временную директорию для дампа
TEMP_DIR="/tmp/mongodb_dump_${TIMESTAMP}"
mkdir -p $TEMP_DIR

# Делаем бэкап
log "Создание дампа базы данных $MONGO_DB"
docker exec $MONGO_CONTAINER mongodump \
    --authenticationDatabase admin \
    --username $MONGO_USER \
    --password $MONGO_PASSWORD \
    --db $MONGO_DB \
    --out /dump

# Копируем бэкап из контейнера
log "Копирование дампа из контейнера"
docker cp $MONGO_CONTAINER:/dump $TEMP_DIR/

# Архивируем дамп
log "Архивирование дампа"
tar -czf "${BACKUP_DIR}/mongodb_${TIMESTAMP}.tar.gz" -C $TEMP_DIR .

# Удаляем временную директорию
log "Очистка временных файлов"
rm -rf $TEMP_DIR

# Удаляем старые бэкапы
log "Удаление бэкапов старше $RETENTION_DAYS дней"
find $BACKUP_DIR -name "mongodb_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# Проверяем успешность создания архива
if [ -f "${BACKUP_DIR}/mongodb_${TIMESTAMP}.tar.gz" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/mongodb_${TIMESTAMP}.tar.gz" | cut -f1)
    log "Резервное копирование успешно завершено. Размер бэкапа: $BACKUP_SIZE"
else
    log "ОШИБКА: Не удалось создать архив резервной копии"
    exit 1
fi

# Выводим список всех бэкапов
log "Список доступных бэкапов:"
ls -lh $BACKUP_DIR | grep mongodb | tee -a $LOG_FILE

exit 0