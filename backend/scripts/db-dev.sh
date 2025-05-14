#!/bin/bash

# Скрипт для запуска тестовой базы данных

# Переходим в директорию backend
cd "$(dirname "$0")/.." || exit

# Останавливаем продакшен базу данных, если она запущена
echo "Проверяем, запущена ли продакшен база данных..."
if docker ps | grep -q "mongo-prod"; then
  echo "Останавливаем продакшен базу данных..."
  docker-compose -f docker-compose.prod.yml down
fi

# Запускаем тестовую базу данных
echo "Запускаем тестовую базу данных..."
docker-compose -f docker-compose.dev.yml up -d

# Копируем .env.dev в .env
echo "Применяем конфигурацию тестовой среды..."
cp .env.dev .env

echo "Тестовая база данных запущена и готова к использованию!"
echo "MongoDB доступна по адресу: mongodb://admin:dev-password@localhost:27018/supermock_dev?authSource=admin"
echo "Redis доступен по адресу: localhost:6380 с паролем: dev-password"