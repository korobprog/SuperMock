#!/bin/bash

# Скрипт для остановки всех баз данных

# Переходим в директорию backend
cd "$(dirname "$0")/.." || exit

echo "Останавливаем все базы данных..."

# Останавливаем тестовую базу данных
if docker ps | grep -q "mongo-dev"; then
  echo "Останавливаем тестовую базу данных..."
  docker-compose -f docker-compose.dev.yml down
fi

# Останавливаем продакшен базу данных
if docker ps | grep -q "mongo-prod"; then
  echo "Останавливаем продакшен базу данных..."
  docker-compose -f docker-compose.prod.yml down
fi

echo "Все базы данных остановлены!"