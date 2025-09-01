#!/bin/bash

# Скрипт для тестирования CI/CD workflow
# Автор: Super Mock Team
# Дата: 1 сентября 2025

set -e

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
    log_info "Проверка необходимых файлов для CI/CD..."
    
    required_files=(
        ".github/workflows/deploy-production.yml"
        "docker-compose.prod-multi.yml"
        "frontend/Dockerfile"
        "backend/Dockerfile"
        "Lading/supermock-ai-interview/Dockerfile"
        "production.env"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "Файл $file не найден!"
            exit 1
        fi
    done
    
    log_success "Все необходимые файлы найдены"
}

# Проверка синтаксиса YAML файлов
validate_yaml() {
    log_info "Проверка синтаксиса YAML файлов..."
    
    # Проверяем docker-compose файл
    if command -v docker-compose &> /dev/null; then
        if docker-compose -f docker-compose.prod-multi.yml config > /dev/null 2>&1; then
            log_success "docker-compose.prod-multi.yml синтаксис корректен"
        else
            log_error "docker-compose.prod-multi.yml содержит синтаксические ошибки"
            exit 1
        fi
    else
        log_warning "docker-compose не установлен, пропускаем проверку"
    fi
    
    # Проверяем GitHub Actions workflow
    if command -v yamllint &> /dev/null; then
        if yamllint .github/workflows/deploy-production.yml > /dev/null 2>&1; then
            log_success "deploy-production.yml синтаксис корректен"
        else
            log_error "deploy-production.yml содержит синтаксические ошибки"
            exit 1
        fi
    else
        log_warning "yamllint не установлен, пропускаем проверку синтаксиса workflow"
    fi
}

# Проверка переменных окружения
check_env_vars() {
    log_info "Проверка переменных окружения..."
    
    required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
        "TELEGRAM_BOT_TOKEN"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" production.env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log_success "Все необходимые переменные окружения найдены"
    else
        log_warning "Отсутствуют переменные: ${missing_vars[*]}"
        log_info "Добавьте их в production.env перед деплоем"
    fi
}

# Проверка Dockerfile'ов
check_dockerfiles() {
    log_info "Проверка Dockerfile'ов..."
    
    dockerfiles=(
        "frontend/Dockerfile"
        "backend/Dockerfile"
        "Lading/supermock-ai-interview/Dockerfile"
    )
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ -f "$dockerfile" ]; then
            log_success "$dockerfile найден"
        else
            log_error "$dockerfile не найден"
            exit 1
        fi
    done
}

# Проверка GitHub Secrets (только структуру)
check_github_secrets() {
    log_info "Проверка структуры GitHub Secrets..."
    
    log_info "Убедитесь, что в GitHub настроены следующие секреты:"
    echo "  - DEPLOY_HOST: 217.198.6.238"
    echo "  - DEPLOY_USER: root"
    echo "  - DEPLOY_SSH_KEY: ваш приватный SSH ключ"
    echo "  - DEPLOY_PATH: /opt/mockmate"
    
    log_warning "Для проверки секретов перейдите в:"
    echo "  GitHub Repository → Settings → Secrets and variables → Actions"
}

# Симуляция CI/CD процесса
simulate_cicd() {
    log_info "Симуляция CI/CD процесса..."
    
    # Проверяем, что мы в git репозитории
    if [ ! -d ".git" ]; then
        log_error "Не находимся в git репозитории"
        exit 1
    fi
    
    # Проверяем текущую ветку
    current_branch=$(git branch --show-current)
    log_info "Текущая ветка: $current_branch"
    
    if [ "$current_branch" = "main" ]; then
        log_success "Находимся в ветке main - CI/CD будет запущен автоматически"
    else
        log_warning "Находимся в ветке $current_branch - CI/CD запустится только после merge в main"
    fi
    
    # Проверяем статус git
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Есть несохраненные изменения:"
        git status --short
        log_info "Сохраните изменения перед push:"
        echo "  git add ."
        echo "  git commit -m 'ваше сообщение'"
        echo "  git push origin $current_branch"
    else
        log_success "Все изменения сохранены"
    fi
}

# Проверка доступности сервера
check_server_access() {
    log_info "Проверка доступности сервера..."
    
    if ping -c 1 217.198.6.238 > /dev/null 2>&1; then
        log_success "Сервер 217.198.6.238 доступен"
    else
        log_warning "Сервер 217.198.6.238 недоступен"
        log_info "Проверьте подключение к интернету и доступность сервера"
    fi
}

# Основная функция
main() {
    log_info "Начало проверки CI/CD конфигурации..."
    log_info "Время: $(date)"
    
    check_prerequisites
    validate_yaml
    check_env_vars
    check_dockerfiles
    check_github_secrets
    simulate_cicd
    check_server_access
    
    log_success "Проверка CI/CD завершена!"
    log_info "Для запуска деплоя:"
    echo "  1. Убедитесь, что все GitHub Secrets настроены"
    echo "  2. Сохраните изменения: git add . && git commit -m 'message'"
    echo "  3. Отправьте в main: git push origin main"
    echo "  4. Следите за процессом в GitHub Actions"
}

# Обработка ошибок
trap 'log_error "Произошла ошибка. Выход..."; exit 1' ERR

# Запуск основной функции
main "$@"
