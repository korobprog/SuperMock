#!/bin/bash

# 🚀 СКРИПТ ДЛЯ БЫСТРОЙ НАСТРОЙКИ СЕРВЕРА TEST.SUPERMOCK.RU

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Проверка прав администратора
if [ "$EUID" -ne 0 ]; then
    error "Этот скрипт должен быть запущен с правами администратора (sudo)"
    exit 1
fi

log "🚀 Начинаем настройку сервера для test.supermock.ru"

# 1. Обновление системы
log "📦 Обновляем систему..."
apt update && apt upgrade -y

# 2. Установка необходимых пакетов
log "🔧 Устанавливаем необходимые пакеты..."
apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx curl wget git

# 3. Запуск Docker
log "🐳 Запускаем Docker..."
systemctl enable docker
systemctl start docker

# 4. Создание директории проекта
log "📁 Создаем рабочую директорию..."
mkdir -p /opt/testsupermock
cd /opt/testsupermock

# 5. Копирование файлов проекта
log "📋 Копируем файлы проекта..."
if [ -d "/tmp/supermock" ]; then
    cp -r /tmp/supermock/* /opt/testsupermock/
else
    warn "Файлы проекта не найдены в /tmp/supermock"
    warn "Пожалуйста, скопируйте файлы проекта в /opt/testsupermock вручную"
fi

# 6. Настройка переменных окружения
log "🔑 Настраиваем переменные окружения..."
if [ ! -f ".env.test" ]; then
    if [ -f "deploy/test.env.example" ]; then
        cp deploy/test.env.example .env.test
        warn "Файл .env.test создан из примера. Пожалуйста, отредактируйте его:"
        warn "nano /opt/testsupermock/.env.test"
    else
        error "Файл deploy/test.env.example не найден!"
        exit 1
    fi
fi

# 7. Получение SSL сертификата
log "🔒 Получаем SSL сертификат..."
if ! certbot certificates | grep -q "test.supermock.ru"; then
    warn "Останавливаем nginx для получения сертификата..."
    systemctl stop nginx || true
    
    # Получаем сертификат
    certbot certonly --standalone -d test.supermock.ru --non-interactive --agree-tos --email admin@supermock.ru
    
    log "✅ SSL сертификат получен"
else
    log "✅ SSL сертификат уже существует"
fi

# 8. Настройка прав доступа к сертификатам
log "🔐 Настраиваем права доступа к сертификатам..."
chmod 644 /etc/letsencrypt/live/test.supermock.ru/fullchain.pem
chmod 600 /etc/letsencrypt/live/test.supermock.ru/privkey.pem

# 9. Запуск Docker контейнеров
log "🐳 Запускаем Docker контейнеры..."
if [ -f "deploy-test.sh" ]; then
    chmod +x deploy-test.sh
    ./deploy-test.sh
else
    error "Файл deploy-test.sh не найден!"
    exit 1
fi

# 10. Настройка автопродления SSL
log "🔄 Настраиваем автопродление SSL..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 11. Проверка работы
log "🔍 Проверяем работу сервисов..."

# Ждем немного для запуска контейнеров
sleep 30

# Проверяем доступность
if curl -s -f https://test.supermock.ru/api/health > /dev/null; then
    log "✅ HTTPS API работает"
else
    warn "⚠️ HTTPS API недоступен"
fi

if curl -s -f https://test.supermock.ru > /dev/null; then
    log "✅ HTTPS Frontend работает"
else
    warn "⚠️ HTTPS Frontend недоступен"
fi

# 12. Финальная информация
log "🎉 Настройка сервера завершена!"
echo ""
info "📋 Информация о сервере:"
info "   🌐 Домен: https://test.supermock.ru"
info "   🤖 Telegram бот: @SuperMockTest_bot"
info "   📁 Директория: /opt/testsupermock"
info "   📝 Логи: docker compose -f docker-compose.test.yml --env-file .env.test logs -f"
echo ""
info "🔧 Полезные команды:"
info "   Статус: docker compose -f docker-compose.test.yml --env-file .env.test ps"
info "   Логи: docker compose -f docker-compose.test.yml --env-file .env.test logs -f"
info "   Остановка: docker compose -f docker-compose.test.yml --env-file .env.test down"
info "   Перезапуск: ./deploy-test.sh"
echo ""
info "🔒 SSL сертификат будет автоматически продлеваться"
info "📊 Мониторинг: tail -f /var/log/nginx/test.supermock.ru.access.log"
echo ""
log "🎯 SuperMock AI-Mentor система готова к тестированию!"
