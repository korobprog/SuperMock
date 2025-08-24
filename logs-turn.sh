#!/usr/bin/env bash

# Скрипт для просмотра логов TURN сервера
# Использование: ./logs-turn.sh [tail]

set -e

# Цвета для вывода
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}📡 Просмотр логов TURN сервера...${NC}"

# Проверка подключения к серверу
if ! ssh dokploy-server "echo 'Сервер доступен'" > /dev/null 2>&1; then
    echo "❌ Сервер недоступен. Проверьте SSH подключение."
    exit 1
fi

# Проверка статуса TURN сервера
echo -e "${GREEN}🔍 Проверка статуса TURN сервера...${NC}"
ssh dokploy-server "docker ps | grep supermock-turn"

echo
echo -e "${GREEN}📋 Логи TURN сервера:${NC}"

# Показ логов
if [ "$1" = "tail" ]; then
    echo "Режим tail (слежение за логами в реальном времени)"
    echo "Для выхода нажмите Ctrl+C"
    echo
    ssh dokploy-server "docker logs -f supermock-turn"
else
    ssh dokploy-server "docker logs supermock-turn --tail 50"
fi
