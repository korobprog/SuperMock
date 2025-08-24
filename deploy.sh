#!/usr/bin/env bash

# 🚀 Интерактивный скрипт деплоя SuperMock
# Автор: SuperMock Team
# Версия: 1.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Функции для красивого вывода
print_header() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    🚀 SuperMock Deployer                    ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

print_step() {
    echo -e "${CYAN}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Проверка подключения к серверу
check_server_connection() {
    print_step "Проверка подключения к серверу..."
    if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
        print_error "Сервер недоступен. Проверьте SSH подключение."
        exit 1
    fi
    print_success "Сервер доступен"
}

# Проверка наличия необходимых файлов
check_required_files() {
    print_step "Проверка необходимых файлов..."
    
    REQUIRED_FILES=(
        "docker-compose.prod.yml"
        "frontend/Dockerfile"
        "backend/Dockerfile"
        ".env"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Не найден обязательный файл: $file"
            exit 1
        fi
    done
    
    print_success "Все необходимые файлы найдены"
}

# Меню выбора
show_menu() {
    echo
    echo -e "${YELLOW}Выберите действие:${NC}"
    echo -e "${CYAN}1)${NC} 🚀 Полный деплой (Frontend + Backend)"
    echo -e "${CYAN}2)${NC} 🎨 Деплой только Frontend"
    echo -e "${CYAN}3)${NC} ⚙️  Деплой только Backend"
    echo -e "${CYAN}4)${NC} 🔄 Перезапуск всех сервисов"
    echo -e "${CYAN}5)${NC} 📊 Статус сервисов"
    echo -e "${CYAN}6)${NC} 📝 Логи сервисов"
    echo -e "${CYAN}7)${NC} 🧹 Очистка и пересборка"
    echo -e "${CYAN}8)${NC} 🚪 Выход"
    echo
}

# Полный деплой
full_deploy() {
    print_header
    print_step "Начинаем полный деплой SuperMock..."
    
    check_server_connection
    check_required_files
    
    # Создание архива проекта
    print_step "Создание архива проекта..."
    tar -czf supermock-deploy.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='*.log' \
        --exclude='.env.local' \
        .
    
    print_success "Архив создан: supermock-deploy.tar.gz"
    
    # Загрузка на сервер
    print_step "Загрузка файлов на сервер..."
    scp supermock-deploy.tar.gz dokploy-server:/opt/mockmate/
    scp docker-compose.prod.yml dokploy-server:/opt/mockmate/
    scp .env dokploy-server:/opt/mockmate/
    
    print_success "Файлы загружены на сервер"
    
    # Выполнение деплоя на сервере
    print_step "Выполнение деплоя на сервере..."
    ssh dokploy-server << 'EOF'
        cd /opt/mockmate
        
        echo "🧹 Очистка старых файлов..."
        rm -rf frontend backend
        
        echo "📦 Распаковка архива..."
        tar -xzf supermock-deploy.tar.gz
        rm supermock-deploy.tar.gz
        
        echo "🛑 Остановка старых контейнеров..."
        docker compose -f docker-compose.prod.yml down
        
        echo "🗑️ Удаление старых образов..."
        docker rmi supermock-frontend supermock-backend 2>/dev/null || true
        
        echo "🔨 Сборка новых образов..."
        docker compose -f docker-compose.prod.yml build
        
        echo "▶️ Запуск сервисов..."
        docker compose -f docker-compose.prod.yml up -d
        
        echo "⏳ Ожидание запуска..."
        sleep 15
        
        echo "📊 Проверка статуса..."
        if docker ps | grep -q supermock-frontend && docker ps | grep -q supermock-backend; then
            echo "✅ Все сервисы запущены успешно!"
        else
            echo "❌ Ошибка запуска сервисов"
            docker compose -f docker-compose.prod.yml logs --tail 20
            exit 1
        fi
EOF
    
    # Очистка локального архива
    rm -f supermock-deploy.tar.gz
    
    print_success "Полный деплой завершен!"
}

# Деплой только Frontend
deploy_frontend() {
    print_header
    print_step "Деплой только Frontend..."
    
    check_server_connection
    check_required_files
    
    # Создание архива фронтенда
    print_step "Создание архива фронтенда..."
    tar -czf frontend-deploy.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        frontend/
    
    print_success "Архив фронтенда создан"
    
    # Загрузка на сервер
    print_step "Загрузка фронтенда на сервер..."
    scp frontend-deploy.tar.gz dokploy-server:/opt/mockmate/
    scp docker-compose.prod.yml dokploy-server:/opt/mockmate/
    
    # Выполнение деплоя фронтенда
    ssh dokploy-server << 'EOF'
        cd /opt/mockmate
        
        echo "🧹 Очистка старого фронтенда..."
        rm -rf frontend
        
        echo "📦 Распаковка фронтенда..."
        tar -xzf frontend-deploy.tar.gz
        rm frontend-deploy.tar.gz
        
        echo "🛑 Остановка фронтенда..."
        docker compose -f docker-compose.prod.yml stop frontend
        
        echo "🗑️ Удаление старого образа фронтенда..."
        docker rmi supermock-frontend 2>/dev/null || true
        
        echo "🔨 Сборка нового образа фронтенда..."
        docker compose -f docker-compose.prod.yml build frontend
        
        echo "▶️ Запуск фронтенда..."
        docker compose -f docker-compose.prod.yml up -d frontend
        
        echo "⏳ Ожидание запуска..."
        sleep 10
        
        if docker ps | grep -q supermock-frontend; then
            echo "✅ Фронтенд запущен успешно!"
        else
            echo "❌ Ошибка запуска фронтенда"
            exit 1
        fi
EOF
    
    rm -f frontend-deploy.tar.gz
    print_success "Деплой фронтенда завершен!"
}

# Деплой только Backend
deploy_backend() {
    print_header
    print_step "Деплой только Backend..."
    
    check_server_connection
    check_required_files
    
    # Создание архива бэкенда
    print_step "Создание архива бэкенда..."
    tar -czf backend-deploy.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        backend/
    
    print_success "Архив бэкенда создан"
    
    # Загрузка на сервер
    print_step "Загрузка бэкенда на сервер..."
    scp backend-deploy.tar.gz dokploy-server:/opt/mockmate/
    scp docker-compose.prod.yml dokploy-server:/opt/mockmate/
    scp .env dokploy-server:/opt/mockmate/
    
    # Выполнение деплоя бэкенда
    ssh dokploy-server << 'EOF'
        cd /opt/mockmate
        
        echo "🧹 Очистка старого бэкенда..."
        rm -rf backend
        
        echo "📦 Распаковка бэкенда..."
        tar -xzf backend-deploy.tar.gz
        rm backend-deploy.tar.gz
        
        echo "🛑 Остановка бэкенда..."
        docker compose -f docker-compose.prod.yml stop backend
        
        echo "🗑️ Удаление старого образа бэкенда..."
        docker rmi supermock-backend 2>/dev/null || true
        
        echo "🔨 Сборка нового образа бэкенда..."
        docker compose -f docker-compose.prod.yml build backend
        
        echo "▶️ Запуск бэкенда..."
        docker compose -f docker-compose.prod.yml up -d backend
        
        echo "⏳ Ожидание запуска..."
        sleep 15
        
        if docker ps | grep -q supermock-backend; then
            echo "✅ Бэкенд запущен успешно!"
        else
            echo "❌ Ошибка запуска бэкенда"
            exit 1
        fi
EOF
    
    rm -f backend-deploy.tar.gz
    print_success "Деплой бэкенда завершен!"
}

# Перезапуск сервисов
restart_services() {
    print_header
    print_step "Перезапуск всех сервисов..."
    
    check_server_connection
    
    ssh dokploy-server << 'EOF'
        cd /opt/mockmate
        
        echo "🔄 Перезапуск всех сервисов..."
        docker compose -f docker-compose.prod.yml restart
        
        echo "⏳ Ожидание запуска..."
        sleep 10
        
        echo "📊 Проверка статуса..."
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOF
    
    print_success "Сервисы перезапущены!"
}

# Статус сервисов
show_status() {
    print_header
    print_step "Статус сервисов на сервере..."
    
    check_server_connection
    
    ssh dokploy-server << 'EOF'
        echo "🐳 Статус контейнеров:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo
        echo "📊 Использование ресурсов:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
        
        echo
        echo "🌐 Проверка доступности:"
        echo "Frontend (HTTP):"
        curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" http://localhost:80 || echo "Недоступен"
        
        echo "Backend API:"
        curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" http://localhost:3000/api/health || echo "Недоступен"
        
        echo "TURN Server:"
        ss -tuln | grep -E '3478|5349' | head -3 || echo "Недоступен"
EOF
}

# Логи сервисов
show_logs() {
    print_header
    print_step "Просмотр логов сервисов..."
    
    check_server_connection
    
    echo -e "${YELLOW}Выберите сервис для просмотра логов:${NC}"
    echo "1) Frontend"
    echo "2) Backend"
    echo "3) Database"
    echo "4) Traefik"
    echo "5) TURN Server"
    echo "6) Все сервисы"
    echo "7) Назад"
    
    read -p "Выберите опцию (1-7): " log_choice
    
    case $log_choice in
        1)
            ssh dokploy-server "docker logs supermock-frontend --tail 50"
            ;;
        2)
            ssh dokploy-server "docker logs supermock-backend --tail 50"
            ;;
        3)
            ssh dokploy-server "docker logs supermock-postgres --tail 30"
            ;;
        4)
            ssh dokploy-server "docker logs traefik --tail 30"
            ;;
        5)
            ssh dokploy-server "docker logs supermock-turn --tail 50"
            ;;
        6)
            ssh dokploy-server "docker compose -f /opt/mockmate/docker-compose.prod.yml logs --tail 30"
            ;;
        7)
            return
            ;;
        *)
            print_error "Неверный выбор"
            return
            ;;
    esac
}

# Очистка и пересборка
clean_and_rebuild() {
    print_header
    print_step "Очистка и пересборка..."
    
    check_server_connection
    
    echo -e "${YELLOW}⚠️  Это действие остановит все сервисы и удалит все образы!${NC}"
    read -p "Продолжить? (y/N): " confirm
    
    if [[ $confirm != [yY] ]]; then
        print_info "Операция отменена"
        return
    fi
    
    ssh dokploy-server << 'EOF'
        cd /opt/mockmate
        
        echo "🛑 Остановка всех сервисов..."
        docker compose -f docker-compose.prod.yml down
        
        echo "🗑️ Удаление всех образов..."
        docker rmi supermock-frontend supermock-backend 2>/dev/null || true
        
        echo "🧹 Очистка неиспользуемых ресурсов..."
        docker system prune -f
        
        echo "🔨 Пересборка образов..."
        docker compose -f docker-compose.prod.yml build --no-cache
        
        echo "▶️ Запуск сервисов..."
        docker compose -f docker-compose.prod.yml up -d
        
        echo "⏳ Ожидание запуска..."
        sleep 20
        
        echo "📊 Проверка статуса..."
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOF
    
    print_success "Очистка и пересборка завершены!"
}

# Главное меню
main_menu() {
    while true; do
        show_menu
        read -p "Выберите опцию (1-8): " choice
        
        case $choice in
            1)
                full_deploy
                ;;
            2)
                deploy_frontend
                ;;
            3)
                deploy_backend
                ;;
            4)
                restart_services
                ;;
            5)
                show_status
                ;;
            6)
                show_logs
                ;;
            7)
                clean_and_rebuild
                ;;
            8)
                print_info "До свидания! 👋"
                exit 0
                ;;
            *)
                print_error "Неверный выбор. Попробуйте снова."
                ;;
        esac
        
        echo
        read -p "Нажмите Enter для продолжения..."
    done
}

# Запуск скрипта
main() {
    print_header
    print_info "Добро пожаловать в интерактивный деплойер SuperMock!"
    print_info "Этот скрипт поможет вам развернуть приложение на сервере."
    echo
    
    main_menu
}

# Запуск главной функции
main "$@"
