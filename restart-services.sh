#!/bin/bash

# Скрипт для перезапуска сервисов после изменений конфигурации

echo "Перезапуск сервисов после изменений конфигурации..."

# Останавливаем контейнеры Docker
echo "Останавливаем контейнеры Docker..."
docker-compose down

# Перезапускаем контейнеры Docker
echo "Перезапускаем контейнеры Docker..."
docker-compose up -d

# Проверяем, есть ли команда systemctl (для Linux)
if command -v systemctl &> /dev/null; then
    # Перезапускаем Nginx
    echo "Перезапускаем Nginx..."
    sudo systemctl restart nginx

    # Проверяем статус Nginx
    echo "Проверяем статус Nginx..."
    sudo systemctl status nginx | grep Active
else
    echo "Команда systemctl не найдена. Пропускаем перезапуск Nginx."
    echo "Если вы работаете на Windows или macOS, перезапустите Nginx вручную."
fi

# Проверяем статус сервисов
echo "Проверяем статус контейнеров Docker..."
docker-compose ps

echo "Перезапуск сервисов завершен."
echo "Проверьте логи для диагностики проблем:"
echo "- Логи бэкенда: docker logs supermock-backend"
echo "- Логи MongoDB: docker logs supermock-mongo"
echo "- Логи Redis: docker logs supermock-redis"

# Добавляем задержку перед проверкой подключения
echo "Ожидаем 5 секунд для инициализации сервисов..."
sleep 5

# Проверяем доступность API
echo "Проверяем доступность API..."
API_RESPONSE=$(curl -s http://localhost:9092/api)
if [ -z "$API_RESPONSE" ]; then
    echo "ОШИБКА: API недоступен"
else
    echo "$API_RESPONSE"
fi

# Проверяем подключение к MongoDB
echo "Проверяем подключение к MongoDB..."
# Получаем ID контейнера бэкенда
BACKEND_CONTAINER=$(docker ps -q -f name=supermock-backend)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo "ОШИБКА: Контейнер бэкенда не найден. Убедитесь, что он запущен."
else
    echo "ID контейнера бэкенда: $BACKEND_CONTAINER"
    
    # Проверяем переменные окружения в контейнере
    echo "Проверка переменных окружения в контейнере..."
    docker exec $BACKEND_CONTAINER env | grep MONGO
    
    # Проверяем логи MongoDB для подтверждения успешного запуска
    echo "Проверка логов MongoDB..."
    MONGO_LOGS=$(docker logs supermock-mongo --tail 10)
    if echo "$MONGO_LOGS" | grep -q "Waiting for connections"; then
        echo "MongoDB успешно запущена и ожидает подключений"
    else
        echo "ПРЕДУПРЕЖДЕНИЕ: MongoDB может быть не готова к подключениям. Проверьте логи:"
        echo "$MONGO_LOGS"
    fi
    
    # Проверяем логи бэкенда на наличие успешного подключения к MongoDB
    echo "Проверка логов бэкенда на подключение к MongoDB..."
    BACKEND_LOGS=$(docker logs supermock-backend --tail 20)
    if echo "$BACKEND_LOGS" | grep -q "Connected to MongoDB"; then
        echo "Бэкенд успешно подключился к MongoDB"
    elif echo "$BACKEND_LOGS" | grep -q "MongoDB connection"; then
        echo "Найдена информация о подключении к MongoDB в логах бэкенда:"
        echo "$BACKEND_LOGS" | grep "MongoDB" | tail -5
    else
        echo "ПРЕДУПРЕЖДЕНИЕ: Не найдена информация о подключении к MongoDB в логах бэкенда"
    fi
fi

# Проверяем подключение к Redis
echo "Проверяем подключение к Redis..."
REDIS_CONTAINER=$(docker ps -q -f name=supermock-redis)

if [ -z "$REDIS_CONTAINER" ]; then
    echo "ОШИБКА: Контейнер Redis не найден. Убедитесь, что он запущен."
else
    echo "ID контейнера Redis: $REDIS_CONTAINER"
    
    # Проверяем подключение к Redis из контейнера бэкенда
    if [ ! -z "$BACKEND_CONTAINER" ]; then
        # Проверяем логи Redis для подтверждения успешного запуска
        echo "Проверка логов Redis..."
        REDIS_LOGS=$(docker logs supermock-redis --tail 10)
        if echo "$REDIS_LOGS" | grep -q "Ready to accept connections"; then
            echo "Redis успешно запущен и готов принимать подключения"
        else
            echo "ПРЕДУПРЕЖДЕНИЕ: Redis может быть не готов к подключениям. Проверьте логи:"
            echo "$REDIS_LOGS"
        fi
        
        # Проверяем логи бэкенда на наличие успешного подключения к Redis
        echo "Проверка логов бэкенда на подключение к Redis..."
        if echo "$BACKEND_LOGS" | grep -q "Connected to Redis"; then
            echo "Бэкенд успешно подключился к Redis"
        elif echo "$BACKEND_LOGS" | grep -q "Redis"; then
            echo "Найдена информация о Redis в логах бэкенда:"
            echo "$BACKEND_LOGS" | grep "Redis" | tail -5
        else
            echo "ПРЕДУПРЕЖДЕНИЕ: Не найдена информация о подключении к Redis в логах бэкенда"
        fi
    fi
fi

echo ""
echo "Если проблемы с подключением сохраняются, проверьте:"
echo "1. Правильность настроек подключения к MongoDB в docker-compose.yml и .env.production"
echo "2. Доступность MongoDB из контейнера бэкенда"
echo "3. Правильность настроек nginx для проксирования запросов"
echo "4. Логи контейнеров для более подробной информации:"
echo "   - docker logs supermock-backend"
echo "   - docker logs supermock-mongo"
echo "   - docker logs supermock-redis"