#!/bin/bash

# Скрипт для деплоя системы синхронизации времени
# Запуск: bash scripts/deploy/deploy-timezone-sync.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
SERVER_IP="217.198.6.238"
SSH_KEY="~/.ssh/id_rsa"
PROJECT_DIR="/opt/mockmate"
BACKUP_DIR="/root/backups"

# Функции для вывода
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция для выполнения команд на сервере
run_on_server() {
    local cmd="$1"
    log_info "Выполняем на сервере: $cmd"
    ssh -i $SSH_KEY root@$SERVER_IP "$cmd"
}

# Функция для создания бэкапа
create_backup() {
    log_info "Создание бэкапа..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="timezone_sync_backup_$timestamp"
    
    run_on_server "mkdir -p $BACKUP_DIR"
    run_on_server "cd $PROJECT_DIR && tar -czf $BACKUP_DIR/$backup_name.tar.gz --exclude=node_modules --exclude=.git ."
    
    log_success "Бэкап создан: $BACKUP_DIR/$backup_name.tar.gz"
}

# Функция для проверки статуса сервера
check_server_status() {
    log_info "Проверка статуса сервера..."
    
    # Проверяем доступность сервера
    if ! ping -c 1 $SERVER_IP > /dev/null 2>&1; then
        log_error "Сервер недоступен: $SERVER_IP"
        exit 1
    fi
    
    # Проверяем статус контейнеров
    local containers_status=$(run_on_server "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'")
    log_info "Статус контейнеров:"
    echo "$containers_status"
    
    log_success "Сервер доступен и работает"
}

# Функция для деплоя фронтенда
deploy_frontend() {
    log_info "Деплой фронтенда с системой синхронизации времени..."
    
    # Собираем фронтенд локально
    log_info "Сборка фронтенда..."
    cd frontend
    npm run build
    cd ..
    
    # Создаем архив фронтенда
    log_info "Создание архива фронтенда..."
    tar -czf frontend-timezone-sync.tar.gz -C frontend/dist .
    
    # Копируем на сервер
    log_info "Копирование на сервер..."
    scp -i $SSH_KEY frontend-timezone-sync.tar.gz root@$SERVER_IP:$PROJECT_DIR/
    
    # Распаковываем на сервере
    run_on_server "cd $PROJECT_DIR && tar -xzf frontend-timezone-sync.tar.gz -C frontend/dist/ --strip-components=0"
    run_on_server "cd $PROJECT_DIR && rm frontend-timezone-sync.tar.gz"
    
    # Очищаем локальный архив
    rm frontend-timezone-sync.tar.gz
    
    log_success "Фронтенд обновлен"
}

# Функция для деплоя бэкенда
deploy_backend() {
    log_info "Деплой бэкенда с системой синхронизации времени..."
    
    # Копируем обновленные файлы бэкенда
    log_info "Копирование файлов бэкенда..."
    scp -i $SSH_KEY backend/server/index.js root@$SERVER_IP:$PROJECT_DIR/backend/server/
    
    # Перезапускаем бэкенд контейнер
    log_info "Перезапуск бэкенд контейнера..."
    run_on_server "cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml restart backend"
    
    # Ждем запуска
    log_info "Ожидание запуска бэкенда..."
    sleep 10
    
    # Проверяем статус
    local backend_status=$(run_on_server "cd $PROJECT_DIR && docker-compose ps backend")
    if echo "$backend_status" | grep -q "Up"; then
        log_success "Бэкенд успешно перезапущен"
    else
        log_error "Ошибка перезапуска бэкенда"
        exit 1
    fi
}

# Функция для тестирования системы
test_timezone_sync() {
    log_info "Тестирование системы синхронизации времени..."
    
    # Проверяем доступность API
    local api_status=$(curl -s "https://supermock.ru/api/dev/status" || echo "ERROR")
    if [ "$api_status" != "ERROR" ]; then
        log_success "API доступен"
    else
        log_warning "API недоступен, проверяем локально..."
        local local_api_status=$(curl -s "http://$SERVER_IP:3000/api/dev/status" || echo "ERROR")
        if [ "$local_api_status" != "ERROR" ]; then
            log_success "API доступен локально"
        else
            log_error "API недоступен"
            return 1
        fi
    fi
    
    # Тестируем enhanced API
    log_info "Тестирование enhanced API..."
    local enhanced_api_status=$(curl -s "https://supermock.ru/api/slots/enhanced?role=candidate&timezone=Europe/Moscow" || echo "ERROR")
    if [ "$enhanced_api_status" != "ERROR" ]; then
        log_success "Enhanced API работает"
    else
        log_warning "Enhanced API недоступен, проверяем локально..."
        local local_enhanced_status=$(curl -s "http://$SERVER_IP:3000/api/slots/enhanced?role=candidate&timezone=Europe/Moscow" || echo "ERROR")
        if [ "$local_enhanced_status" != "ERROR" ]; then
            log_success "Enhanced API работает локально"
        else
            log_error "Enhanced API недоступен"
            return 1
        fi
    fi
}

# Функция для создания тестовых данных на продакшене
create_production_test_data() {
    log_info "Создание тестовых данных на продакшене..."
    
    # Копируем скрипт тестирования
    scp -i $SSH_KEY create-timezone-test-users.js root@$SERVER_IP:$PROJECT_DIR/
    
    # Запускаем создание тестовых пользователей
    run_on_server "cd $PROJECT_DIR && node create-timezone-test-users.js"
    
    log_success "Тестовые данные созданы"
}

# Функция для проверки логов
check_logs() {
    log_info "Проверка логов..."
    
    # Логи бэкенда
    log_info "Логи бэкенда (последние 20 строк):"
    run_on_server "cd $PROJECT_DIR && docker-compose logs --tail=20 backend"
    
    # Логи фронтенда
    log_info "Логи фронтенда (последние 20 строк):"
    run_on_server "cd $PROJECT_DIR && docker-compose logs --tail=20 frontend"
}

# Основная функция
main() {
    echo "🌍 Деплой системы синхронизации времени на продакшен"
    echo "=================================================="
    
    # Проверяем статус сервера
    check_server_status
    
    # Создаем бэкап
    create_backup
    
    # Деплоим фронтенд
    deploy_frontend
    
    # Деплоим бэкенд
    deploy_backend
    
    # Проверяем логи
    check_logs
    
    # Тестируем систему
    test_timezone_sync
    
    # Создаем тестовые данные
    create_production_test_data
    
    echo ""
    echo "🎉 Деплой завершен успешно!"
    echo ""
    echo "📋 Что было сделано:"
    echo "✅ Создан бэкап системы"
    echo "✅ Обновлен фронтенд с системой синхронизации времени"
    echo "✅ Обновлен бэкенд с enhanced API"
    echo "✅ Протестирована работоспособность"
    echo "✅ Созданы тестовые пользователи"
    echo ""
    echo "🌐 Доступные URL:"
    echo "• Основной сайт: https://supermock.ru"
    echo "• API статус: https://supermock.ru/api/dev/status"
    echo "• Enhanced API: https://supermock.ru/api/slots/enhanced"
    echo ""
    echo "💡 Для мониторинга используйте:"
    echo "• bash scripts/deploy/health-check.sh"
    echo "• bash scripts/deploy/deploy-interactive.sh"
}

# Обработка ошибок
trap 'log_error "Ошибка в строке $LINENO. Выход."; exit 1' ERR

# Запуск
main "$@"
