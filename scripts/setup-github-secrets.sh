#!/bin/bash

# 🔧 GitHub Secrets Setup Script
# Помогает настроить секреты для CI/CD

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

log "🔧 Настройка GitHub Secrets для CI/CD"

# Проверяем наличие gh CLI
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) не установлен!"
    warning "Установите GitHub CLI:"
    warning "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    warning "echo 'deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main' | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null"
    warning "sudo apt update && sudo apt install gh"
    exit 1
fi

# Проверяем авторизацию в GitHub
if ! gh auth status &> /dev/null; then
    error "Не авторизован в GitHub CLI!"
    warning "Выполните: gh auth login"
    exit 1
fi

# Получаем SSH ключ
SSH_KEY_PATH="$HOME/.ssh/timeweb_vps_key"
if [ ! -f "$SSH_KEY_PATH" ]; then
    error "SSH ключ не найден: $SSH_KEY_PATH"
    exit 1
fi

SSH_KEY_CONTENT=$(cat "$SSH_KEY_PATH")

log "📋 Добавляем секреты в GitHub репозиторий..."

# Добавляем секреты
info "Добавляем DEPLOY_HOST..."
echo "217.198.6.238" | gh secret set DEPLOY_HOST

info "Добавляем DEPLOY_USER..."
echo "root" | gh secret set DEPLOY_USER

info "Добавляем DEPLOY_SSH_KEY..."
echo "$SSH_KEY_CONTENT" | gh secret set DEPLOY_SSH_KEY

info "Добавляем DEPLOY_PATH..."
echo "/opt/mockmate" | gh secret set DEPLOY_PATH

log "✅ Все секреты добавлены успешно!"

# Проверяем секреты
log "🔍 Проверяем добавленные секреты..."

SECRETS=$(gh secret list)
echo "$SECRETS" | grep -E "(DEPLOY_HOST|DEPLOY_USER|DEPLOY_SSH_KEY|DEPLOY_PATH)" || warning "Некоторые секреты не найдены"

log "🎉 Настройка завершена!"
log ""
log "📋 Следующие шаги:"
log "1. Запушьте изменения в ветку main:"
log "   git add ."
log "   git commit -m 'Setup CI/CD pipeline'"
log "   git push origin main"
log ""
log "2. Или запустите workflow вручную:"
log "   - Перейдите в Actions на GitHub"
log "   - Выберите 'Deploy to Production Server'"
log "   - Нажмите 'Run workflow'"
log ""
log "3. Отслеживайте прогресс в разделе Actions"
