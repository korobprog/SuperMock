#!/bin/bash

# Скрипт для автоматического копирования конфигурации Nginx на сервер и перезапуска Nginx
# Параметры сервера
SERVER_IP="217.198.6.238"
SERVER_USER="root"
NGINX_CONFIG_PATH="/etc/nginx/sites-available/supermock.ru"

echo "Начинаем процесс деплоя конфигурации Nginx на сервер $SERVER_IP..."

# Проверяем наличие файла конфигурации Nginx
if [ ! -f "nginx-server-config.conf" ]; then
    echo "ОШИБКА: Файл nginx-server-config.conf не найден!"
    echo "Сначала запустите скрипт fix-nginx-config.sh для создания конфигурации."
    exit 1
fi

# Проверяем, что в файле конфигурации указан правильный порт
if ! grep -q "proxy_pass http://127.0.0.1:9095/" nginx-server-config.conf; then
    echo "ПРЕДУПРЕЖДЕНИЕ: В файле конфигурации не найден порт 9095!"
    echo "Запускаем скрипт fix-nginx-config.sh для исправления конфигурации..."
    ./fix-nginx-config.sh
    
    # Проверяем, что исправление выполнено успешно
    if ! grep -q "proxy_pass http://127.0.0.1:9095/" nginx-server-config.conf; then
        echo "ОШИБКА: Не удалось исправить конфигурацию!"
        exit 1
    fi
fi

echo "Копируем файл конфигурации на сервер..."
scp nginx-server-config.conf $SERVER_USER@$SERVER_IP:/tmp/nginx-server-config.conf

# Проверяем, что копирование выполнено успешно
if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось скопировать файл на сервер!"
    echo "Проверьте подключение к серверу и права доступа."
    exit 1
fi

echo "Файл успешно скопирован на сервер."
echo "Применяем конфигурацию и перезапускаем Nginx..."

# Выполняем команды на сервере через SSH
ssh $SERVER_USER@$SERVER_IP << EOF
    # Копируем файл в нужное место
    cp /tmp/nginx-server-config.conf $NGINX_CONFIG_PATH
    
    # Проверяем конфигурацию Nginx
    echo "Проверяем конфигурацию Nginx..."
    nginx -t
    
    # Если конфигурация корректна, перезапускаем Nginx
    if [ \$? -eq 0 ]; then
        echo "Конфигурация Nginx корректна. Перезапускаем Nginx..."
        systemctl restart nginx
        
        # Проверяем статус Nginx
        echo "Проверяем статус Nginx..."
        systemctl status nginx | grep Active
        
        # Проверяем, что порт 9095 прослушивается
        echo "Проверяем, что порт 9095 прослушивается..."
        ss -tuln | grep 9095
        
        # Проверяем логи Nginx на наличие ошибок
        echo "Проверяем логи Nginx на наличие ошибок..."
        tail -n 10 /var/log/nginx/supermock-error.log
    else
        echo "ОШИБКА: Конфигурация Nginx некорректна!"
        exit 1
    fi
EOF

# Проверяем, что команды на сервере выполнены успешно
if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось выполнить команды на сервере!"
    exit 1
fi

echo ""
echo "Деплой конфигурации Nginx завершен успешно!"
echo "Проверьте доступность сайта в браузере: https://supermock.ru"
echo ""
echo "Если проблемы сохраняются, проверьте логи Nginx на сервере:"
echo "ssh $SERVER_USER@$SERVER_IP 'tail -f /var/log/nginx/supermock-error.log'"