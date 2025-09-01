#!/bin/bash

# 🔍 CI/CD Check Script
# Проверяет готовность проекта к деплою через GitHub Actions

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🔍 Проверяем готовность CI/CD..."

# Проверяем наличие необходимых файлов
info "Проверяем файлы..."

required_files=(
    ".github/workflows/deploy-production.yml"
    "docker-compose.prod-multi.yml"
    "backend/Dockerfile"
    "frontend/Dockerfile"
    "production.env"
    "package.json"
    "pnpm-lock.yaml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log "✅ $file"
    else
        error "❌ $file - НЕ НАЙДЕН!"
        exit 1
    fi
done

# Проверяем структуру проекта
info "Проверяем структуру проекта..."

if [ -d "frontend" ] && [ -d "backend" ]; then
    log "✅ Структура проекта корректна"
else
    error "❌ Неправильная структура проекта"
    exit 1
fi

# Проверяем package.json файлы
info "Проверяем package.json файлы..."

if [ -f "backend/package.json" ]; then
    log "✅ Backend package.json найден"
else
    error "❌ Backend package.json не найден"
    exit 1
fi

# Frontend использует корневой package.json
if [ -f "package.json" ]; then
    log "✅ Корневой package.json найден (для frontend)"
else
    error "❌ Корневой package.json не найден"
    exit 1
fi

# Проверяем SSH ключ
info "Проверяем SSH ключ..."

if [ -f "$HOME/.ssh/timeweb_vps_key" ]; then
    log "✅ SSH ключ найден: ~/.ssh/timeweb_vps_key"
else
    error "❌ SSH ключ не найден: ~/.ssh/timeweb_vps_key"
    exit 1
fi

# Проверяем права на SSH ключ
if [ "$(stat -c %a ~/.ssh/timeweb_vps_key)" = "600" ]; then
    log "✅ Права на SSH ключ корректны (600)"
else
    warning "⚠️ Права на SSH ключ должны быть 600"
    chmod 600 ~/.ssh/timeweb_vps_key
    log "✅ Права исправлены"
fi

# Проверяем подключение к серверу
info "Проверяем подключение к серверу..."

if ssh -i ~/.ssh/timeweb_vps_key -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@217.198.6.238 "echo 'SSH connection successful'" 2>/dev/null; then
    log "✅ SSH подключение к серверу работает"
else
    error "❌ Не удается подключиться к серверу по SSH"
    warning "Проверьте:"
    warning "1. Правильность IP адреса (217.198.6.238)"
    warning "2. SSH ключ добавлен на сервер"
    warning "3. Сервер доступен"
    exit 1
fi

# Проверяем директорию на сервере
info "Проверяем директорию на сервере..."

if ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "[ -d /opt/mockmate ]" 2>/dev/null; then
    log "✅ Директория /opt/mockmate существует на сервере"
else
    warning "⚠️ Директория /opt/mockmate не существует на сервере"
    read -p "Создать директорию? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "mkdir -p /opt/mockmate"
        log "✅ Директория создана"
    else
        error "❌ Необходимо создать директорию вручную"
        exit 1
    fi
fi

# Проверяем Docker на сервере
info "Проверяем Docker на сервере..."

if ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "docker --version" 2>/dev/null; then
    log "✅ Docker установлен на сервере"
else
    error "❌ Docker не установлен на сервере"
    exit 1
fi

# Проверяем Docker Compose на сервере
if ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238 "docker compose version" 2>/dev/null; then
    log "✅ Docker Compose установлен на сервере"
else
    error "❌ Docker Compose не установлен на сервере"
    exit 1
fi

# Проверяем переменные окружения
info "Проверяем переменные окружения..."

if [ -f "production.env" ]; then
    required_env_vars=(
        "POSTGRES_DB"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
        "TELEGRAM_BOT_TOKEN"
        "TELEGRAM_BOT_ID"
        "TELEGRAM_BOT_NAME"
    )
    
    missing_vars=()
    for var in "${required_env_vars[@]}"; do
        if ! grep -q "^${var}=" production.env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log "✅ Все необходимые переменные окружения найдены"
    else
        warning "⚠️ Отсутствуют переменные окружения:"
        for var in "${missing_vars[@]}"; do
            warning "  - $var"
        done
    fi
else
    error "❌ Файл production.env не найден"
    exit 1
fi

log "🎉 Все проверки пройдены успешно!"
log ""
log "📋 Следующие шаги:"
log "1. Добавьте секреты в GitHub репозиторий:"
log "   - DEPLOY_HOST: 217.198.6.238"
log "   - DEPLOY_USER: root"
log "   - DEPLOY_SSH_KEY: [содержимое ~/.ssh/timeweb_vps_key]"
log "   - DEPLOY_PATH: /opt/mockmate"
log ""
log "2. Запушьте изменения в ветку main для автоматического деплоя"
log "   или запустите workflow вручную в разделе Actions"
log ""
log "3. Отслеживайте прогресс в разделе Actions на GitHub"
