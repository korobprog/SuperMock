#!/bin/bash

echo "🔍 Тестирование доступности сервера..."
echo ""

echo "📡 Проверка DNS:"
echo "api.supermock.ru -> $(nslookup api.supermock.ru | grep Address | tail -1)"
echo "supermock.ru -> $(nslookup supermock.ru | grep Address | tail -1)"
echo ""

echo "🌐 Проверка локальной доступности:"
echo "API (localhost):"
curl -s -H "Host: api.supermock.ru" http://localhost/api/health | jq . 2>/dev/null || echo "❌ Ошибка"
echo ""

echo "Frontend (localhost):"
curl -s -H "Host: supermock.ru" http://localhost/ | head -5
echo ""

echo "🔌 Проверка внешней доступности:"
echo "API (внешний IP):"
curl -s -I http://217.198.6.238/api/health
echo ""

echo "Frontend (внешний IP):"
curl -s -I http://217.198.6.238/
echo ""

echo "📊 Статус контейнеров:"
docker compose -f docker-compose.prod.yml ps
echo ""

echo "🔧 Статус Traefik:"
docker ps | grep traefik
echo ""

echo "📝 Логи Traefik (последние 5 строк):"
docker logs traefik --tail=5
