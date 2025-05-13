#!/bin/bash

# Скрипт для исправления проблемы с портами в backend контейнере
# Автор: Roo
# Дата: 13.05.2025

# Выводим информацию о текущем состоянии
echo "=== Текущее состояние ==="
echo "Проверка docker-compose.prod.yml..."
grep -n "PORT=" docker-compose.prod.yml

# Создаем резервную копию docker-compose.prod.yml
echo "Создание резервной копии docker-compose.prod.yml..."
cp docker-compose.prod.yml docker-compose.prod.yml.bak

# Изменяем переменную окружения PORT в docker-compose.prod.yml
echo "Изменение переменной окружения PORT в docker-compose.prod.yml..."
sed -i 's/PORT=${PORT:-9095}/PORT=${PORT:-4000}/g' docker-compose.prod.yml

# Проверяем, что изменения были применены
echo "Проверка изменений..."
grep -n "PORT=" docker-compose.prod.yml

# Перезапускаем контейнеры
echo "Перезапуск контейнеров..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Проверяем статус контейнеров
echo "Проверка статуса контейнеров..."
docker ps

echo "=== Исправление завершено ==="
echo "Теперь backend приложение должно слушать порт 4000 внутри контейнера,"
echo "что соответствует экспортируемому порту в docker-compose.prod.yml."
echo "Проверьте доступность сайта по адресу https://supermock.ru/"