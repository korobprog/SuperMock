#!/bin/bash

# Удобный скрипт для быстрого доступа к деплою
# Использование: ./deploy.sh [frontend|backend|all|menu]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR/scripts/deploy"

# Проверка аргументов
if [ $# -eq 0 ]; then
    echo "🚀 Скрипты деплоя Super Mock"
    echo ""
    echo "Использование:"
    echo "  ./deploy.sh menu     - интерактивное меню (рекомендуется)"
    echo "  ./deploy.sh frontend - обновить только фронтенд"
    echo "  ./deploy.sh backend  - обновить только бэкенд"
    echo "  ./deploy.sh all      - обновить фронтенд и бэкенд"
    echo ""
    echo "📖 Документация: $DEPLOY_DIR/README.md"
    echo ""
    echo "💡 Для интерактивного меню запустите: ./deploy.sh menu"
    exit 1
fi

# Переход в папку скриптов
cd "$DEPLOY_DIR"

# Выполнение соответствующего скрипта
case "$1" in
    "menu")
        echo "🎯 Запуск интерактивного меню..."
        ./deploy-interactive.sh
        ;;
    "frontend")
        echo "🎯 Запуск обновления фронтенда..."
        ./deploy-frontend.sh
        ;;
    "backend")
        echo "🎯 Запуск обновления бэкенда..."
        ./deploy-backend.sh
        ;;
    "all")
        echo "🎯 Запуск полного обновления..."
        ./deploy-all.sh
        ;;
    *)
        echo "❌ Неизвестная команда: $1"
        echo "Доступные команды: menu, frontend, backend, all"
        exit 1
        ;;
esac
