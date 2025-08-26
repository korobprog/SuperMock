#!/bin/bash

echo "🔧 Обновление переменных окружения..."

cd /opt/mockmate

# Добавляем недостающие переменные в .env
echo "TURN_REALM=supermock.ru" >> .env
echo "TURN_AUTH_SECRET=supermock_turn_secret_2024_very_long_and_secure_key_for_webrtc" >> .env
echo "TURN_SERVER_HOST=217.198.6.238" >> .env

echo "✅ Переменные окружения обновлены!"

# Показываем содержимое .env
echo "📋 Содержимое .env:"
tail -10 .env
