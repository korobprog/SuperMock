#!/bin/bash

# Скрипт для полного деплоя Super Mock
# Автор: Super Mock Team
# Дата: 1 сентября 2025

set -e  # Остановка при ошибке

# Конфигурация
SERVER_IP="217.198.6.238"
SSH_KEY="~/.ssh/timeweb_vps_key"
SERVER_PATH="/opt/mockmate"
PROJECT_NAME="supermock-full-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

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
    
    required_files=(
        "docker-compose.prod-multi.yml"
        "frontend/"
        "backend/"
        "Lading/supermock-ai-interview/"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "Файл/папка $file не найден!"
            exit 1
        fi
    done
    
    log_success "Все необходимые файлы найдены"
}

# Создание архива с файлами проекта
create_archive() {
    log_info "Создание архива с файлами проекта..."
    
    tar -czf "$PROJECT_NAME" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=dist \
        --exclude=*.tar.gz \
        --exclude=*.log \
        --exclude=.env \
        --exclude=production.env \
        docker-compose.prod-multi.yml \
        frontend/ \
        backend/ \
        Lading/ \
        scripts/ \
        media/ \
        materials/ \
        deploy/
    
    log_success "Архив создан: $PROJECT_NAME"
}

# Копирование файлов на сервер
upload_to_server() {
    log_info "Копирование файлов на сервер..."
    
    # Очищаем старые архивные файлы на сервере для экономии места
    ssh -i "$SSH_KEY" "root@$SERVER_IP" "cd $SERVER_PATH && find . -name 'backup-*.tar.gz' -mtime +7 -delete 2>/dev/null || true; find . -name 'supermock-full-deploy-*.tar.gz' -mtime +3 -delete 2>/dev/null || true"
    
    # Копируем новый архив
    scp -i "$SSH_KEY" "$PROJECT_NAME" "root@$SERVER_IP:$SERVER_PATH/"
    
    log_success "Файлы скопированы на сервер"
}

# Развертывание на сервере
deploy_on_server() {
    log_info "Развертывание на сервере..."
    
    ssh -i "$SSH_KEY" "root@$SERVER_IP" << EOF
        set -e
        cd $SERVER_PATH
        
        echo "Остановка текущих контейнеров..."
        docker-compose -f docker-compose.prod-multi.yml down || true
        
        echo "Распаковка архива..."
        tar -xzf $PROJECT_NAME
        
        echo "Очистка старых образов..."
        docker image prune -f
        
        echo "Запуск всех сервисов..."
        docker-compose -f docker-compose.prod-multi.yml up -d --build
        
        echo "Ожидание запуска сервисов..."
        sleep 30
        
        echo "Проверка статуса контейнеров..."
        docker ps --filter "name=supermock" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo "Очистка временных файлов и старых архивов..."
        rm -f $PROJECT_NAME
        
        # Дополнительная очистка старых архивных файлов
        echo "Удаляем старые архивные файлы для экономии места..."
        find . -name "backup-*.tar.gz" -mtime +7 -delete 2>/dev/null || true
        find . -name "supermock-full-deploy-*.tar.gz" -mtime +3 -delete 2>/dev/null || true
        find . -name "*.tar.gz" -size +100M -mtime +1 -delete 2>/dev/null || true
        echo "Очистка завершена"
EOF
    
    log_success "Развертывание завершено"
}

# Проверка работоспособности всех сервисов
test_deployment() {
    log_info "Проверка работоспособности всех сервисов..."
    
    # Проверяем API
    log_info "Проверка API (api.supermock.ru)..."
    api_status=$(ssh -i "$SSH_KEY" "root@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' -H 'Host: api.supermock.ru' http://localhost/api/health")
    if [ "$api_status" = "200" ]; then
        log_success "API работает (HTTP $api_status)"
    else
        log_warning "API вернул статус: $api_status"
    fi
    
    # Проверяем Frontend App
    log_info "Проверка Frontend App (app.supermock.ru)..."
    app_status=$(ssh -i "$SSH_KEY" "root@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' -H 'Host: app.supermock.ru' http://localhost")
    if [ "$app_status" = "308" ] || [ "$app_status" = "200" ]; then
        log_success "Frontend App работает (HTTP $app_status)"
    else
        log_warning "Frontend App вернул статус: $app_status"
    fi
    
    # Проверяем Landing
    log_info "Проверка Landing (supermock.ru)..."
    landing_status=$(ssh -i "$SSH_KEY" "root@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' -H 'Host: supermock.ru' http://localhost")
    if [ "$landing_status" = "308" ] || [ "$landing_status" = "200" ]; then
        log_success "Landing работает (HTTP $landing_status)"
    else
        log_warning "Landing вернул статус: $landing_status"
    fi
    
    log_success "Проверка завершена"
}

# Очистка локальных временных файлов
cleanup() {
    log_info "Очистка временных файлов..."
    rm -f "$PROJECT_NAME"
    log_success "Временные файлы удалены"
}

# Основная функция
main() {
    log_info "Начало полного деплоя Super Mock..."
    log_info "Время: $(date)"
    log_info "Сервер: $SERVER_IP"
    
    check_prerequisites
    create_archive
    upload_to_server
    deploy_on_server
    test_deployment
    cleanup
    
    log_success "Полный деплой завершен успешно!"
    log_info "Сервисы доступны по адресам:"
    log_info "  - https://supermock.ru (Лендинг)"
    log_info "  - https://app.supermock.ru (Приложение)"
    log_info "  - https://api.supermock.ru (API)"
}

# Обработка ошибок
trap 'log_error "Произошла ошибка. Выход..."; cleanup; exit 1' ERR

# Запуск основной функции
main "$@"
