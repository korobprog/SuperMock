# API Endpoints для проверки

## Основные endpoints:

### 1. Health Check

- `GET /api/health` - проверка работоспособности сервера

### 2. Telegram Bot

- `GET /api/telegram-bot-check` - проверка доступности Telegram бота
- `POST /api/telegram-auth` - авторизация через Telegram

### 3. Пользователи

- `GET /api/profile/:userId` - профиль пользователя
- `GET /api/user-settings/:userId` - настройки пользователя

### 4. Интервью и сессии

- `GET /api/slots` - доступные слоты для интервью
- `GET /api/my-bookings/:userId` - бронирования пользователя
- `GET /api/sessions/:id` - информация о сессии
- `GET /api/history/:userId` - история интервью

### 5. Уведомления

- `GET /api/notifications` - уведомления пользователя
- `GET /api/notifications/unread-count` - количество непрочитанных уведомлений

### 6. Отладка (только в development)

- `GET /api/dev/status` - статус разработки
- `GET /api/debug/user/:userId` - отладочная информация пользователя
- `GET /api/dev/latest-session` - последняя сессия

## Как проверить:

```bash
# Проверка health endpoint
curl https://api.supermock.ru/api/health

# Проверка Telegram bot
curl https://api.supermock.ru/api/telegram-bot-check

# Проверка профиля (замените USER_ID на реальный ID)
curl https://api.supermock.ru/api/profile/USER_ID
```
