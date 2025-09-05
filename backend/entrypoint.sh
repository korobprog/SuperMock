#!/bin/sh

# Entrypoint script для генерации Prisma client при старте контейнера

echo "🚀 Запуск entrypoint script..."

# Генерируем Prisma client
echo "📦 Генерируем Prisma client..."
pnpm exec prisma generate --schema prisma/schema.prisma

if [ $? -eq 0 ]; then
    echo "✅ Prisma client успешно сгенерирован"
else
    echo "❌ Ошибка при генерации Prisma client"
    exit 1
fi

# Запускаем основное приложение
echo "🎯 Запускаем основное приложение..."
exec "$@"
