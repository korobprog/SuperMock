#!/bin/bash

echo "=== Быстрое исправление проблем ==="

# 1. Исправляем права доступа
echo "1. Исправляем права доступа к acme.json..."
chmod 600 /opt/mockmate/traefik/acme/acme.json

# 2. Перезапускаем Traefik
echo "2. Перезапускаем Traefik..."
cd /opt/mockmate/traefik
docker-compose restart

# 3. Проверяем логи backend
echo "3. Проверяем логи backend..."
cd /opt/mockmate
docker logs supermock-backend --tail 20

# 4. Перезапускаем backend
echo "4. Перезапускаем backend..."
docker-compose -f docker-compose.prod.yml restart backend

# 5. Ждем и проверяем
echo "5. Ждем 30 секунд..."
sleep 30

# 6. Проверяем статус
echo "6. Проверяем статус контейнеров..."
docker ps

echo "=== Готово ==="
