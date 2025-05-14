#!/bin/bash

# Скрипт для запуска продакшен базы данных

# Переходим в директорию backend
cd "$(dirname "$0")/.." || exit

# Останавливаем тестовую базу данных, если она запущена
echo "Проверяем, запущена ли тестовая база данных..."
if docker ps | grep -q "mongo-dev"; then
  echo "Останавливаем тестовую базу данных..."
  docker-compose -f docker-compose.dev.yml down
fi

# Запускаем продакшен базу данных
echo "Запускаем продакшен базу данных..."
docker-compose -f docker-compose.prod.yml up -d

# Копируем .env.prod в .env
echo "Применяем конфигурацию продакшен среды..."
cp .env.prod .env

echo "Продакшен база данных запущена и готова к использованию!"
echo "MongoDB доступна по адресу: mongodb://admin:${MONGO_PROD_PASSWORD:-prod-password}@localhost:27017/supermock_prod?authSource=admin"
echo "Redis доступен по адресу: localhost:6379 с паролем: ${REDIS_PROD_PASSWORD:-prod-password}"