#!/bin/bash

# Улучшенный скрипт для быстрого доступа к деплою
# Автоматически исправляет проблемы и использует fallback конфигурации

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/scripts/deploy"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_color() {
    local color=$1
    local text=$2
    echo -e "${color}${text}${NC}"
}

show_menu() {
    clear
    print_color $BLUE "🚀 Улучшенный деплой Super Mock"
    echo ""
    print_color $YELLOW "Выберите действие:"
    echo ""
    echo "1) 🎨 Обновить только фронтенд (с автоисправлениями)"
    echo "2) 🔧 Обновить только бэкенд (с автоисправлениями)"
    echo "3) 🌐 Обновить всё (фронтенд + бэкенд)"
    echo "4) 🔍 Проверить статус сервера"
    echo "5) 🛠️  Исправить проблемы на сервере"
    echo "6) 📊 Показать логи"
    echo "7) 🔄 Перезапустить все сервисы"
    echo "8) 🧹 Очистить Docker (осторожно!)"
    echo "9) 📋 Показать конфигурацию"
    echo "0) ❌ Выход"
    echo ""
}

check_server_status() {
    print_color $BLUE "🔍 Проверка статуса сервера..."
    
    if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
        print_color $RED "❌ Сервер недоступен"
        return 1
    fi
    
    ssh dokploy-server << 'EOF'
    echo "📊 Статус контейнеров:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "🔍 Проверка доступности сервисов:"
    
    # Проверка фронтенда
    if curl -f -s https://supermock.ru > /dev/null 2>&1; then
        echo "✅ Фронтенд доступен по HTTPS"
    elif curl -f -s http://supermock.ru > /dev/null 2>&1; then
        echo "⚠️  Фронтенд доступен только по HTTP"
    else
        echo "❌ Фронтенд недоступен"
    fi
    
    # Проверка бэкенда
    if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
        echo "✅ API доступен по HTTPS"
    elif curl -f -s http://api.supermock.ru/api/health > /dev/null 2>&1; then
        echo "⚠️  API доступен только по HTTP"
    else
        echo "❌ API недоступен"
    fi
    
    # Проверка Traefik
    if docker ps | grep -q "traefik"; then
        echo "✅ Traefik запущен"
    else
        echo "❌ Traefik не запущен"
    fi
    
    # Проверка базы данных
    if docker ps | grep -q "supermock-postgres"; then
        echo "✅ PostgreSQL запущен"
    else
        echo "❌ PostgreSQL не запущен"
    fi
    
    # Проверка Redis
    if docker ps | grep -q "supermock-redis"; then
        echo "✅ Redis запущен"
    else
        echo "❌ Redis не запущен"
    fi
EOF
}

fix_server_issues() {
    print_color $BLUE "🛠️  Исправление проблем на сервере..."
    
    ssh dokploy-server << 'EOF'
    echo "🔧 Выполнение автоматических исправлений..."
    
    cd /opt/mockmate
    
    # Исправление проблем с базой данных
    echo "🔧 Исправление конфигурации базы данных..."
    if grep -q "postgres_secondary" .env; then
        sed -i 's/DATABASE_URL_SECONDARY=.*/DATABASE_URL_SECONDARY=postgresql:\/\/supermock:krishna1284@postgres:5432\/supermock/' .env
        echo "✅ Конфигурация базы данных исправлена"
    fi
    
    # Проверка и исправление Traefik
    echo "🔧 Проверка Traefik..."
    if docker logs traefik --tail=20 2>/dev/null | grep -q "traefik-traefik"; then
        echo "⚠️  Обнаружены проблемы с Traefik, исправляем..."
        if [ -f "/opt/mockmate/traefik/docker-compose.yml" ]; then
            sed -i 's/traefik.enable=true/traefik.enable=false/' /opt/mockmate/traefik/docker-compose.yml
            cd /opt/mockmate/traefik && docker-compose down && docker-compose up -d
            cd /opt/mockmate
        fi
    fi
    
    # Проверка и запуск необходимых сервисов
    echo "🔧 Проверка необходимых сервисов..."
    
    if ! docker ps | grep -q "supermock-postgres"; then
        echo "⚠️  База данных не запущена, запускаем..."
        docker-compose -f docker-compose.prod.yml up -d postgres
        sleep 30
    fi
    
    if ! docker ps | grep -q "supermock-redis"; then
        echo "⚠️  Redis не запущен, запускаем..."
        docker-compose -f docker-compose.prod.yml up -d redis
        sleep 10
    fi
    
    # Попытка запуска с упрощенной конфигурацией
    echo "🔧 Попытка запуска с упрощенной конфигурацией..."
    if [ -f "docker-compose-simple.yml" ]; then
        docker-compose -f docker-compose-simple.yml up -d
        echo "✅ Сервисы запущены с упрощенной конфигурацией"
    else
        echo "❌ Упрощенная конфигурация не найдена"
    fi
    
    echo "🎉 Исправления завершены!"
EOF
}

show_logs() {
    print_color $BLUE "📊 Показать логи..."
    
    echo "Выберите логи для просмотра:"
    echo "1) Фронтенд"
    echo "2) Бэкенд"
    echo "3) Traefik"
    echo "4) PostgreSQL"
    echo "5) Redis"
    echo "6) Все логи"
    
    read -p "Выберите (1-6): " log_choice
    
    case $log_choice in
        1)
            ssh dokploy-server "docker logs supermock-frontend --tail=50"
            ;;
        2)
            ssh dokploy-server "docker logs supermock-backend --tail=50"
            ;;
        3)
            ssh dokploy-server "docker logs traefik --tail=50"
            ;;
        4)
            ssh dokploy-server "docker logs supermock-postgres --tail=50"
            ;;
        5)
            ssh dokploy-server "docker logs supermock-redis --tail=50"
            ;;
        6)
            ssh dokploy-server "docker logs supermock-frontend --tail=20 && echo '---' && docker logs supermock-backend --tail=20 && echo '---' && docker logs traefik --tail=20"
            ;;
        *)
            echo "Неверный выбор"
            ;;
    esac
}

restart_services() {
    print_color $BLUE "🔄 Перезапуск всех сервисов..."
    
    ssh dokploy-server << 'EOF'
    cd /opt/mockmate
    
    echo "⏹️  Остановка всех сервисов..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker-compose -f docker-compose-simple.yml down 2>/dev/null || true
    
    echo "▶️  Запуск сервисов с упрощенной конфигурацией..."
    if [ -f "docker-compose-simple.yml" ]; then
        docker-compose -f docker-compose-simple.yml up -d
        echo "✅ Сервисы перезапущены"
    else
        echo "❌ Упрощенная конфигурация не найдена"
    fi
EOF
}

clean_docker() {
    print_color $RED "🧹 Очистка Docker (осторожно!)..."
    
    echo "Это действие удалит все неиспользуемые контейнеры, образы и сети."
    read -p "Продолжить? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        ssh dokploy-server << 'EOF'
        echo "🧹 Очистка Docker..."
        docker system prune -f
        docker volume prune -f
        docker network prune -f
        echo "✅ Очистка завершена"
EOF
    else
        echo "Очистка отменена"
    fi
}

show_config() {
    print_color $BLUE "📋 Показать конфигурацию..."
    
    ssh dokploy-server << 'EOF'
    echo "📋 Конфигурация сервера:"
    echo ""
    echo "📍 Текущая директория: $(pwd)"
    echo "📁 Файлы конфигурации:"
    ls -la *.yml *.env 2>/dev/null || echo "Файлы конфигурации не найдены"
    
    echo ""
    echo "🌐 Сетевые интерфейсы:"
    ip addr show | grep -E "inet.*eth0|inet.*ens"
    
    echo ""
    echo "📊 Использование диска:"
    df -h /
    
    echo ""
    echo "💾 Использование памяти:"
    free -h
EOF
}

# Основная логика
cd "$DEPLOY_DIR"

case "$1" in
    "menu"|"")
        while true; do
            show_menu
            read -p "Выберите опцию (0-9): " choice
            
            case $choice in
                1)
                    print_color $GREEN "🎨 Запуск обновления фронтенда..."
                    ./deploy-frontend-improved.sh
                    ;;
                2)
                    print_color $GREEN "🔧 Запуск обновления бэкенда..."
                    ./deploy-backend-improved.sh
                    ;;
                3)
                    print_color $GREEN "🌐 Запуск полного обновления..."
                    ./deploy-frontend-improved.sh
                    echo ""
                    ./deploy-backend-improved.sh
                    ;;
                4)
                    check_server_status
                    ;;
                5)
                    fix_server_issues
                    ;;
                6)
                    show_logs
                    ;;
                7)
                    restart_services
                    ;;
                8)
                    clean_docker
                    ;;
                9)
                    show_config
                    ;;
                0)
                    print_color $GREEN "👋 До свидания!"
                    exit 0
                    ;;
                *)
                    print_color $RED "❌ Неверный выбор"
                    ;;
            esac
            
            echo ""
            read -p "Нажмите Enter для продолжения..."
        done
        ;;
    "frontend")
        print_color $GREEN "🎨 Запуск обновления фронтенда..."
        ./deploy-frontend-improved.sh
        ;;
    "backend")
        print_color $GREEN "🔧 Запуск обновления бэкенда..."
        ./deploy-backend-improved.sh
        ;;
    "all")
        print_color $GREEN "🌐 Запуск полного обновления..."
        ./deploy-frontend-improved.sh
        echo ""
        ./deploy-backend-improved.sh
        ;;
    "status")
        check_server_status
        ;;
    "fix")
        fix_server_issues
        ;;
    "logs")
        show_logs
        ;;
    "restart")
        restart_services
        ;;
    "clean")
        clean_docker
        ;;
    "config")
        show_config
        ;;
    *)
        print_color $RED "❌ Неверный аргумент: $1"
        echo ""
        echo "Использование: $0 [frontend|backend|all|menu|status|fix|logs|restart|clean|config]"
        echo ""
        echo "Опции:"
        echo "  frontend  - Обновить только фронтенд"
        echo "  backend   - Обновить только бэкенд"
        echo "  all       - Обновить всё"
        echo "  menu      - Интерактивное меню"
        echo "  status    - Проверить статус сервера"
        echo "  fix       - Исправить проблемы на сервере"
        echo "  logs      - Показать логи"
        echo "  restart   - Перезапустить все сервисы"
        echo "  clean     - Очистить Docker"
        echo "  config    - Показать конфигурацию"
        exit 1
        ;;
esac
