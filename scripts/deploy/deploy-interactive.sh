#!/bin/bash

# Интерактивный скрипт деплоя Super Mock
# Позволяет выбрать что обновлять через меню

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода цветного текста
print_color() {
    local color=$1
    local text=$2
    echo -e "${color}${text}${NC}"
}

# Функция для показа меню
show_menu() {
    clear
    print_color $BLUE "🚀 Интерактивный деплой Super Mock"
    echo ""
    print_color $YELLOW "Выберите действие:"
    echo ""
    echo "1) 🔄 Обновить только фронтенд"
    echo "2) 🔄 Обновить только бэкенд"
    echo "3) 🔄 Обновить фронтенд и бэкенд"
    echo "4) 📊 Проверить статус сервера"
    echo "5) 📋 Показать логи контейнеров"
    echo "6) 🧹 Очистить старые контейнеры/образы"
    echo "7) 🔍 Проверить доступность сайта"
    echo "8) 🔧 Исправить базу данных"
    echo "9) 🔧 Исправить WebSocket"
    echo "10) 🔧 Исправить CORS"
    echo "11) 🏥 Комплексная проверка здоровья"
    echo "12) 📖 Показать документацию"
    echo "0) ❌ Выход"
    echo ""
}

# Функция для проверки подключения к серверу
check_server_connection() {
    print_color $YELLOW "📡 Проверка подключения к серверу..."
    if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
        print_color $RED "❌ Сервер недоступен"
        return 1
    fi
    print_color $GREEN "✅ Сервер доступен"
    return 0
}

# Функция для обновления фронтенда
deploy_frontend() {
    print_color $BLUE "🎯 Обновление фронтенда..."
    if ! check_server_connection; then
        return 1
    fi
    
    bash scripts/deploy/deploy-frontend.sh
}

# Функция для обновления бэкенда
deploy_backend() {
    print_color $BLUE "🎯 Обновление бэкенда..."
    if ! check_server_connection; then
        return 1
    fi
    
    bash scripts/deploy/deploy-backend.sh
}

# Функция для полного обновления
deploy_all() {
    print_color $BLUE "🎯 Полное обновление..."
    if ! check_server_connection; then
        return 1
    fi
    
    bash scripts/deploy/deploy-all.sh
}

# Функция для проверки статуса сервера
check_server_status() {
    print_color $BLUE "📊 Проверка статуса сервера..."
    if ! check_server_connection; then
        return 1
    fi
    
    ssh dokploy-server << 'EOF'
echo "=== КОНТЕЙНЕРЫ ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(mockmate|traefik)" || echo "Нет контейнеров mockmate"
echo ""
echo "=== ОБРАЗЫ ==="
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "(mockmate|traefik)" || echo "Нет образов mockmate"
echo ""
echo "=== ДИСК ==="
df -h /opt/mockmate
EOF
}

# Функция для показа логов
show_logs() {
    print_color $BLUE "📋 Логи контейнеров..."
    if ! check_server_connection; then
        return 1
    fi
    
    echo "Выберите контейнер для просмотра логов:"
    echo "1) mockmate-frontend"
    echo "2) mockmate-backend"
    echo "3) mockmate-postgres"
    echo "4) mockmate-redis"
    echo "5) traefik"
    echo "0) Назад"
    
    read -p "Выбор: " log_choice
    
    case $log_choice in
        1) ssh dokploy-server "docker logs mockmate-frontend --tail 20" ;;
        2) ssh dokploy-server "docker logs mockmate-backend --tail 20" ;;
        3) ssh dokploy-server "docker logs mockmate-postgres --tail 10" ;;
        4) ssh dokploy-server "docker logs mockmate-redis --tail 10" ;;
        5) ssh dokploy-server "docker logs traefik --tail 10" ;;
        0) return ;;
        *) print_color $RED "Неверный выбор" ;;
    esac
}

# Функция для очистки старых контейнеров/образов
cleanup_old_containers() {
    print_color $BLUE "🧹 Очистка старых контейнеров и образов..."
    if ! check_server_connection; then
        return 1
    fi
    
    ssh dokploy-server << 'EOF'
echo "=== УДАЛЕНИЕ ОСТАНОВЛЕННЫХ КОНТЕЙНЕРОВ ==="
docker container prune -f

echo ""
echo "=== УДАЛЕНИЕ НЕИСПОЛЬЗУЕМЫХ ОБРАЗОВ ==="
docker image prune -a -f

echo ""
echo "=== УДАЛЕНИЕ НЕИСПОЛЬЗУЕМЫХ СЕТЕЙ ==="
docker network prune -f

echo ""
echo "=== РЕЗУЛЬТАТ ==="
echo "Контейнеры:"
docker ps -a --format "{{.Names}} {{.Status}}" | grep -E "(mockmate|traefik)" || echo "Нет контейнеров mockmate"
echo ""
echo "Образы:"
docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" | grep -E "(mockmate|traefik)" || echo "Нет образов mockmate"
EOF
}

# Функция для проверки доступности сайта
check_site_availability() {
    print_color $BLUE "🔍 Проверка доступности сайта..."
    
    echo "Проверяю https://supermock.ru..."
    if curl -f -s https://supermock.ru > /dev/null 2>&1; then
        print_color $GREEN "✅ Сайт доступен"
    else
        print_color $RED "❌ Сайт недоступен"
    fi
    
    echo "Проверяю https://api.supermock.ru/api/health..."
    if curl -f -s https://api.supermock.ru/api/health > /dev/null 2>&1; then
        print_color $GREEN "✅ API доступен"
    else
        print_color $RED "❌ API недоступен"
    fi
}

# Функция для исправления базы данных
fix_database() {
    print_color $BLUE "🔧 Исправление базы данных..."
    if ! check_server_connection; then
        return 1
    fi
    
    bash scripts/deploy/fix-database.sh
}

# Функция для исправления WebSocket
fix_websocket() {
    print_color $BLUE "🔧 Исправление WebSocket..."
    if ! check_server_connection; then
        return 1
    fi
    
    bash scripts/deploy/fix-websocket.sh
}

# Функция для исправления CORS
fix_cors() {
    print_color $BLUE "🔧 Исправление CORS..."
    if ! check_server_connection; then
        return 1
    fi
    
    bash scripts/deploy/fix-cors.sh
}

# Функция для комплексной проверки здоровья
health_check() {
    print_color $BLUE "🏥 Комплексная проверка здоровья..."
    if ! check_server_connection; then
        return 1
    fi
    
    bash scripts/deploy/health-check.sh
}

# Функция для показа документации
show_documentation() {
    print_color $BLUE "📖 Документация по деплою:"
    echo ""
    cat README.md
}

# Основной цикл меню
while true; do
    show_menu
    read -p "Выберите действие (0-12): " choice
    
    case $choice in
        1)
            deploy_frontend
            ;;
        2)
            deploy_backend
            ;;
        3)
            deploy_all
            ;;
        4)
            check_server_status
            ;;
        5)
            show_logs
            ;;
        6)
            cleanup_old_containers
            ;;
        7)
            check_site_availability
            ;;
        8)
            fix_database
            ;;
        9)
            fix_websocket
            ;;
        10)
            fix_cors
            ;;
        11)
            health_check
            ;;
        12)
            show_documentation
            ;;
        0)
            print_color $GREEN "👋 До свидания!"
            exit 0
            ;;
        *)
            print_color $RED "❌ Неверный выбор. Попробуйте снова."
            ;;
    esac
    
    echo ""
    read -p "Нажмите Enter для продолжения..."
done
