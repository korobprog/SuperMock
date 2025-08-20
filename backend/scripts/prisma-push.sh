#!/bin/bash

# Скрипт для пуша схемы Prisma в MongoDB, запущенную в Docker

# Переходим в директорию backend
cd "$(dirname "$0")/.." || exit

echo "=== Проверка статуса MongoDB ==="
# Проверяем, запущен ли контейнер mongo-dev
if ! docker ps | grep -q "mongo-dev"; then
  echo "MongoDB контейнер не запущен. Запускаем..."
  npm run db:dev
else
  echo "MongoDB контейнер уже запущен."
fi

echo "=== Генерация Prisma клиента ==="
npx prisma generate

echo "=== Пуш схемы Prisma в MongoDB ==="
# Для MongoDB используется prisma db push вместо migrate
# Добавляем --skip-generate, чтобы избежать проблем с правами доступа
npx prisma db push --skip-generate

echo "=== Проверка соединения с базой данных ==="
# Создаем временный скрипт для проверки соединения
cat > ./scripts/temp-db-check.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Проверяем соединение
    await prisma.$connect();
    console.log('Соединение с базой данных успешно установлено');
    
    // Получаем количество пользователей
    const userCount = await prisma.user.count();
    console.log(`Количество пользователей в базе данных: ${userCount}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при подключении к базе данных:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
EOF

# Запускаем скрипт проверки
echo "Проверяем соединение с базой данных..."
node ./scripts/temp-db-check.js

# Удаляем временный скрипт
rm ./scripts/temp-db-check.js

echo "=== Процесс завершен ==="