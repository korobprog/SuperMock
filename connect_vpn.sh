#!/bin/bash

echo "Настройка VPN подключения..."

# Проверяем, запущен ли NekoRay
if ! pgrep -f "nekoray" > /dev/null; then
    echo "Запускаем NekoRay..."
    "/home/korobprog/Загрузки/nekoray-4.0.1-2024-12-12-linux-x64(1).AppImage" &
    sleep 3
fi

echo "Данные для настройки в NekoRay:"
echo "Тип: Shadowsocks"
echo "Сервер: 45.147.183.137"
echo "Порт: 8000"
echo "Пароль: hzL6pN"
echo "Метод шифрования: aes-256-gcm"
echo ""
echo "1. Откройте NekoRay"
echo "2. Нажмите '+' для добавления сервера"
echo "3. Выберите 'Shadowsocks'"
echo "4. Введите данные выше"
echo "5. Нажмите 'Connect'"
echo ""
echo "Или импортируйте файл vpn_config.json в NekoRay"
