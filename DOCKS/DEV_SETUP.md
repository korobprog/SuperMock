# Настройка и запуск Dev окружения

## Быстрый старт

### 1. Полный запуск (с базой данных)

```bash
pnpm run dev
```

Этот скрипт:

- Запускает PostgreSQL и Redis в Docker
- Применяет миграции базы данных
- Запускает бэкенд на порту 3000
- Запускает фронтенд на порту 5173

### 2. Быстрый запуск (без базы данных)

```bash
pnpm run dev:fast
```

Этот скрипт запускает только бэкенд и фронтенд (предполагается, что база данных уже запущена).

## Проблемы и решения

### Проблема: Ошибка 500 при вызове /api/init

**Решение**: Убедитесь, что:

1. База данных запущена: `docker-compose -f docker-compose.dev.yml ps`
2. Миграции применены: `pnpm prisma migrate deploy --schema=backend/prisma/schema.prisma`
3. Файл .env существует и содержит правильные DATABASE_URL

### Проблема: Порт уже занят

**Решение**: Скрипт автоматически освобождает порты 3000 и 5173 перед запуском.

### Проблема: Неправильные имена пользователей в базе данных

**Решение**: Используются правильные имена:

- `supermock` вместо `Super Mock`
- `supermock2` вместо `Super Mock2`

## Структура портов

- **Бэкенд**: http://localhost:3000
- **Фронтенд**: http://localhost:5173
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Переменные окружения

Основные переменные в файле `.env`:

```env
DATABASE_URL=postgresql://supermock:postgres@localhost:5432/supermock
DATABASE_URL_SECONDARY=postgresql://supermock2:postgres@localhost:5433/supermock_secondary
VITE_API_URL=http://localhost:3000
```

## Полезные команды

```bash
# Остановить все контейнеры
docker-compose -f docker-compose.dev.yml down

# Просмотр логов базы данных
docker-compose -f docker-compose.dev.yml logs postgres

# Применить миграции
pnpm prisma migrate deploy --schema=backend/prisma/schema.prisma

# Открыть Prisma Studio
pnpm prisma studio --schema=backend/prisma/schema.prisma
```
