#!/bin/bash

# Скрипт для синхронизации Prisma с MongoDB в Docker

# Переходим в директорию backend
cd "$(dirname "$0")/.." || exit

echo "=== Начинаем синхронизацию Prisma с MongoDB в Docker ==="

# Делаем скрипты исполняемыми
chmod +x ./scripts/prisma-push.sh

# Запускаем скрипт для пуша схемы
echo "Шаг 1: Пуш схемы Prisma в MongoDB..."
./scripts/prisma-push.sh

# Проверяем результат выполнения
if [ $? -ne 0 ]; then
  echo "Ошибка при выполнении prisma-push.sh. Прерываем процесс."
  exit 1
fi

# Запрашиваем у пользователя, нужно ли заполнять базу тестовыми данными
echo ""
echo "Шаг 2: Заполнение базы данных тестовыми данными"
read -p "Хотите заполнить базу данных тестовыми данными? (y/n): " answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
  echo "Заполняем базу данных тестовыми данными..."
  node ./scripts/prisma-seed.js
  
  # Проверяем результат выполнения
  if [ $? -ne 0 ]; then
    echo "Ошибка при заполнении базы данных. Прерываем процесс."
    exit 1
  fi
else
  echo "Пропускаем заполнение базы данных тестовыми данными."
fi

echo ""
echo "=== Синхронизация Prisma с MongoDB в Docker завершена успешно ==="
echo "Схема Prisma успешно применена к базе данных MongoDB в Docker."
echo "База данных готова к использованию."