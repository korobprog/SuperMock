#!/bin/bash

# Скрипт для запуска Docker Compose с учетом переменных окружения из разных .env файлов
# Использование: ./docker-compose-env.sh [окружение] [команда]
# Пример: ./docker-compose-env.sh production up -d

# Определяем текущую директорию скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Переходим в корневую директорию проекта (на уровень выше backend)
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
# Переходим в директорию backend
BACKEND_DIR="$PROJECT_ROOT/backend"

# Получаем окружение из первого аргумента или используем значение по умолчанию
ENV=${1:-development}
# Удаляем первый аргумент из списка аргументов
shift

# Если команда не указана, используем 'up -d'
if [ $# -eq 0 ]; then
  COMMAND="up -d"
else
  COMMAND="$@"
fi

# Определяем пути к файлам .env
DEFAULT_ENV_FILE="$PROJECT_ROOT/.env"
ENV_FILE="$PROJECT_ROOT/.env.$ENV"
LOCAL_ENV_FILE="$PROJECT_ROOT/.env.local"
ENV_LOCAL_FILE="$PROJECT_ROOT/.env.$ENV.local"

# Проверяем наличие файлов .env
if [ ! -f "$DEFAULT_ENV_FILE" ] && [ ! -f "$ENV_FILE" ] && [ ! -f "$LOCAL_ENV_FILE" ] && [ ! -f "$ENV_LOCAL_FILE" ]; then
  echo "Ошибка: Не найдены файлы .env, .env.$ENV, .env.local или .env.$ENV.local"
  echo "Создайте хотя бы один из этих файлов на основе .env.example"
  exit 1
fi

# Формируем команду для запуска Docker Compose
DOCKER_COMPOSE_CMD="docker-compose"

# Добавляем файлы .env в команду в порядке приоритета
# 1. .env (базовые настройки)
if [ -f "$DEFAULT_ENV_FILE" ]; then
  DOCKER_COMPOSE_CMD="$DOCKER_COMPOSE_CMD --env-file $DEFAULT_ENV_FILE"
fi

# 2. .env.[окружение] (настройки для конкретного окружения)
if [ -f "$ENV_FILE" ]; then
  DOCKER_COMPOSE_CMD="$DOCKER_COMPOSE_CMD --env-file $ENV_FILE"
fi

# 3. .env.local (локальные настройки, не включаемые в репозиторий)
if [ -f "$LOCAL_ENV_FILE" ]; then
  DOCKER_COMPOSE_CMD="$DOCKER_COMPOSE_CMD --env-file $LOCAL_ENV_FILE"
fi

# 4. .env.[окружение].local (локальные настройки для конкретного окружения)
if [ -f "$ENV_LOCAL_FILE" ]; then
  DOCKER_COMPOSE_CMD="$DOCKER_COMPOSE_CMD --env-file $ENV_LOCAL_FILE"
fi

# Добавляем путь к файлу docker-compose.yml и команду
DOCKER_COMPOSE_CMD="$DOCKER_COMPOSE_CMD -f $BACKEND_DIR/docker-compose.yml $COMMAND"

# Выводим информацию о запуске
echo "=== Запуск Docker Compose для окружения: $ENV ==="
echo "Используемые файлы .env:"
[ -f "$DEFAULT_ENV_FILE" ] && echo "- $DEFAULT_ENV_FILE"
[ -f "$ENV_FILE" ] && echo "- $ENV_FILE"
[ -f "$LOCAL_ENV_FILE" ] && echo "- $LOCAL_ENV_FILE"
[ -f "$ENV_LOCAL_FILE" ] && echo "- $ENV_LOCAL_FILE"
echo "Команда Docker Compose: $COMMAND"
echo "=== Выполнение команды ==="

# Выполняем команду
cd $BACKEND_DIR
eval $DOCKER_COMPOSE_CMD

# Выводим статус выполнения
if [ $? -eq 0 ]; then
  echo "=== Команда успешно выполнена ==="
else
  echo "=== Ошибка при выполнении команды ==="
  exit 1
fi