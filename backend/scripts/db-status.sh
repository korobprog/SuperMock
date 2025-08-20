#!/bin/bash

# Скрипт для проверки статуса баз данных

# Переходим в директорию backend
cd "$(dirname "$0")/.." || exit

echo "=== Статус баз данных ==="
echo ""

# Проверяем статус тестовой базы данных
echo "Тестовая база данных (DEV):"
if docker ps | grep -q "mongo-dev"; then
  echo "✅ MongoDB (тестовая): Запущена"
else
  echo "❌ MongoDB (тестовая): Остановлена"
fi

if docker ps | grep -q "redis-dev"; then
  echo "✅ Redis (тестовая): Запущен"
else
  echo "❌ Redis (тестовая): Остановлен"
fi

echo ""

# Проверяем статус продакшен базы данных
echo "Продакшен база данных (PROD):"
if docker ps | grep -q "mongo-prod"; then
  echo "✅ MongoDB (продакшен): Запущена"
else
  echo "❌ MongoDB (продакшен): Остановлена"
fi

if docker ps | grep -q "redis-prod"; then
  echo "✅ Redis (продакшен): Запущен"
else
  echo "❌ Redis (продакшен): Остановлен"
fi

echo ""

# Проверяем текущую конфигурацию
echo "Текущая конфигурация:"
if grep -q "supermock_dev" .env; then
  echo "🔹 Активна тестовая среда (DEV)"
elif grep -q "supermock_prod" .env; then
  echo "🔸 Активна продакшен среда (PROD)"
else
  echo "❓ Неизвестная конфигурация"
fi

echo ""
echo "Для переключения на тестовую среду выполните: ./scripts/db-dev.sh"
echo "Для переключения на продакшен среду выполните: ./scripts/db-prod.sh"