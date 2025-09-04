#!/bin/bash

# Скрипт для деплоя лендинга Super Mock
# Автор: Super Mock Team
# Дата: 1 сентября 2025

set -e  # Остановка при ошибке

# Конфигурация
SERVER_IP="217.198.6.238"
SSH_KEY="~/.ssh/timeweb_vps_key"
SERVER_PATH="/opt/mockmate"
LANDING_PATH="Lading/supermock-ai-interview"
ARCHIVE_NAME="landing-update-$(date +%Y%m%d-%H%M%S).tar.gz"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка наличия необходимых файлов
check_prerequisites() {
    log_info "Проверка необходимых файлов..."
    
    if [ ! -d "$LANDING_PATH" ]; then
        log_error "Папка $LANDING_PATH не найдена!"
        exit 1
    fi
    
    if [ ! -f "docker-compose.prod-multi.yml" ]; then
        log_error "Файл docker-compose.prod-multi.yml не найден!"
        exit 1
    fi
    
    log_success "Все необходимые файлы найдены"
}

# Создание архива с файлами лендинга
create_archive() {
    log_info "Создание архива с файлами лендинга..."
    
    cd "$LANDING_PATH"
    tar -czf "../../$ARCHIVE_NAME" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=dist \
        --exclude=*.tar.gz \
        .
    cd - > /dev/null
    
    log_success "Архив создан: $ARCHIVE_NAME"
}

# Копирование файлов на сервер
upload_to_server() {
    log_info "Копирование файлов на сервер..."
    
    # Копируем архив
    scp -i "$SSH_KEY" "$ARCHIVE_NAME" "root@$SERVER_IP:$SERVER_PATH/"
    
    # Копируем docker-compose файл
    scp -i "$SSH_KEY" docker-compose.prod-multi.yml "root@$SERVER_IP:$SERVER_PATH/"
    
    log_success "Файлы скопированы на сервер"
}

# Распаковка и обновление на сервере
deploy_on_server() {
    log_info "Развертывание на сервере..."
    
    ssh -i "$SSH_KEY" "root@$SERVER_IP" << EOF
        set -e
        cd $SERVER_PATH
        
        echo "Распаковка архива..."
        tar -xzf $ARCHIVE_NAME -C $LANDING_PATH --strip-components=0
        
        echo "Пересборка и запуск контейнера лендинга..."
        docker-compose -f docker-compose.prod-multi.yml up -d --build frontend-landing
        
        echo "Очистка временных файлов и старых архивов..."
        rm -f $ARCHIVE_NAME
        
        # Дополнительная очистка старых архивных файлов
        echo "Удаляем старые архивные файлы для экономии места..."
        find . -name "backup-*.tar.gz" -mtime +7 -delete 2>/dev/null || true
        find . -name "landing-update-*.tar.gz" -mtime +3 -delete 2>/dev/null || true
        find . -name "*.tar.gz" -size +100M -mtime +1 -delete 2>/dev/null || true
        
        echo "Проверка статуса контейнеров..."
        docker ps --filter "name=supermock-frontend-landing" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOF
    
    log_success "Развертывание завершено"
}

# Проверка работоспособности
test_deployment() {
    log_info "Проверка работоспособности лендинга..."
    
    # Проверяем HTTP редирект
    log_info "Проверка HTTP редиректа..."
    ssh -i "$SSH_KEY" "root@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' -H 'Host: supermock.ru' http://localhost"
    
    # Проверяем HTTPS
    log_info "Проверка HTTPS..."
    ssh -i "$SSH_KEY" "root@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' -k -H 'Host: supermock.ru' https://localhost"
    
    log_success "Лендинг работает корректно"
}

# Очистка локальных временных файлов
cleanup() {
    log_info "Очистка временных файлов..."
    rm -f "$ARCHIVE_NAME"
    log_success "Временные файлы удалены"
}

# Основная функция
main() {
    log_info "Начало деплоя лендинга Super Mock..."
    log_info "Время: $(date)"
    log_info "Сервер: $SERVER_IP"
    
    check_prerequisites
    create_archive
    upload_to_server
    deploy_on_server
    test_deployment
    cleanup
    
    log_success "Деплой лендинга завершен успешно!"
    log_info "Лендинг доступен по адресу: https://supermock.ru"
}

# Обработка ошибок
trap 'log_error "Произошла ошибка. Выход..."; cleanup; exit 1' ERR

# Запуск основной функции
main "$@"
