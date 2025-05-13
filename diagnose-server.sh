#!/bin/bash

# Скрипт для диагностики сервера и проверки конфигурации Nginx

echo "=== Диагностика сервера ==="
echo ""

# Проверяем статус контейнеров Docker
echo "=== Статус контейнеров Docker ==="
docker ps
echo ""

# Проверяем сети Docker
echo "=== Сети Docker ==="
docker network ls
echo ""

# Проверяем сеть app-network
echo "=== Информация о сети app-network ==="
docker network inspect app-network
echo ""

# Проверяем конфигурацию Nginx
echo "=== Конфигурация Nginx ==="
docker exec nginx cat /etc/nginx/conf.d/default.conf
echo ""

# Проверяем логи Nginx
echo "=== Логи Nginx ==="
docker logs nginx --tail 50
echo ""

# Проверяем доступность backend
echo "=== Проверка доступности backend ==="
docker exec nginx curl -I http://backend:4000
echo ""

# Проверяем доступность frontend
echo "=== Проверка доступности frontend ==="
docker exec nginx curl -I http://frontend:3000
echo ""

# Проверяем порты, которые прослушивает Nginx
echo "=== Порты, которые прослушивает Nginx ==="
docker exec nginx netstat -tulpn | grep nginx
echo ""

# Проверяем DNS-разрешение внутри контейнера Nginx
echo "=== DNS-разрешение внутри контейнера Nginx ==="
docker exec nginx ping -c 3 backend
docker exec nginx ping -c 3 frontend
echo ""

echo "=== Диагностика завершена ==="