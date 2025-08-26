#!/bin/bash

echo "=== Проверка статуса сервисов ==="
echo "1. Контейнеры:"
docker ps -a

echo ""
echo "2. Сети:"
docker network ls

echo ""
echo "3. Логи Traefik:"
docker logs traefik --tail 10

echo ""
echo "4. Логи Frontend:"
docker logs supermock-frontend --tail 10 2>/dev/null || echo "Frontend контейнер не найден"

echo ""
echo "5. Логи Backend:"
docker logs supermock-backend --tail 10 2>/dev/null || echo "Backend контейнер не найден"
