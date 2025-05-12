#!/bin/bash

# Скрипт для обновления развертывания на удаленном сервере и исправления проблемы с сертификатами
# Автор: Roo
# Дата: 13.05.2025

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Проверка наличия скриптов
if [ ! -f "deploy-remote.sh" ]; then
  error "Скрипт deploy-remote.sh не найден. Убедитесь, что вы находитесь в корневой директории проекта."
fi

if [ ! -f "fix-ssl-symlinks-remote.sh" ]; then
  error "Скрипт fix-ssl-symlinks-remote.sh не найден. Убедитесь, что вы находитесь в корневой директории проекта."
fi

# Проверка прав на выполнение скриптов
if [ ! -x "deploy-remote.sh" ]; then
  log "Делаем скрипт deploy-remote.sh исполняемым..."
  chmod +x deploy-remote.sh
fi

if [ ! -x "fix-ssl-symlinks-remote.sh" ]; then
  log "Делаем скрипт fix-ssl-symlinks-remote.sh исполняемым..."
  chmod +x fix-ssl-symlinks-remote.sh
fi

# Шаг 1: Обновление развертывания на удаленном сервере
log "Шаг 1: Обновление развертывания на удаленном сервере..."
./deploy-remote.sh

if [ $? -ne 0 ]; then
  error "Ошибка при обновлении развертывания на удаленном сервере."
fi

# Шаг 2: Исправление проблемы с сертификатами
log "Шаг 2: Исправление проблемы с сертификатами..."
./fix-ssl-symlinks-remote.sh

if [ $? -ne 0 ]; then
  error "Ошибка при исправлении проблемы с сертификатами."
fi

log "Обновление развертывания на удаленном сервере и исправление проблемы с сертификатами успешно завершено!"
log "Приложение доступно по адресу: https://supermock.ru"