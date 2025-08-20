#!/bin/bash

# Скрипт для запуска всех бэкапов
# Запускать через cron, например: 0 1 * * * /path/to/run-all-backups.sh

# Определяем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Загружаем переменные окружения из .env файла, если он существует
if [ -f "${SCRIPT_DIR}/../../.env" ]; then
    source "${SCRIPT_DIR}/../../.env"
fi

# Переменные
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="${BACKUP_ROOT:-/backups}/logs"
LOG_FILE="${LOG_DIR}/backup_all_${TIMESTAMP}.log"

# Создаем директорию для логов
mkdir -p $LOG_DIR

# Функция логирования
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

# Делаем скрипты исполняемыми
chmod +x ${SCRIPT_DIR}/backup-mongodb.sh
chmod +x ${SCRIPT_DIR}/backup-redis.sh

log "Начало процесса резервного копирования всех сервисов"

# Запускаем бэкап MongoDB
log "Запуск бэкапа MongoDB"
${SCRIPT_DIR}/backup-mongodb.sh
if [ $? -ne 0 ]; then
    log "ОШИБКА: Бэкап MongoDB завершился с ошибкой"
else
    log "Бэкап MongoDB успешно завершен"
fi

# Запускаем бэкап Redis
log "Запуск бэкапа Redis"
${SCRIPT_DIR}/backup-redis.sh
if [ $? -ne 0 ]; then
    log "ОШИБКА: Бэкап Redis завершился с ошибкой"
else
    log "Бэкап Redis успешно завершен"
fi

# Проверяем наличие дополнительных скриптов бэкапа
for script in ${SCRIPT_DIR}/backup-*.sh; do
    if [[ "$script" != "${SCRIPT_DIR}/backup-mongodb.sh" && "$script" != "${SCRIPT_DIR}/backup-redis.sh" ]]; then
        log "Запуск дополнительного скрипта бэкапа: $script"
        $script
        if [ $? -ne 0 ]; then
            log "ОШИБКА: Скрипт $script завершился с ошибкой"
        else
            log "Скрипт $script успешно завершен"
        fi
    fi
done

log "Процесс резервного копирования всех сервисов завершен"

# Отправка уведомления, если настроено
if [ -n "$BACKUP_NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
    log "Отправка уведомления на $BACKUP_NOTIFICATION_EMAIL"
    mail -s "Backup Report: $(hostname) - $(date +%Y-%m-%d)" $BACKUP_NOTIFICATION_EMAIL < $LOG_FILE
fi

exit 0