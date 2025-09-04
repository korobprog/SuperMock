# 🚀 Telegram Auth - Быстрый старт

## ✅ Что уже настроено

Ваш `production.env` уже содержит все необходимые настройки:

- ✅ **TELEGRAM_BOT_TOKEN** - токен вашего бота
- ✅ **JWT_SECRET** - секрет для JWT токенов  
- ✅ **FRONTEND_URL** - URL фронтенда
- ✅ **Настройки безопасности** - добавлены в production.env

## 🎯 Быстрый запуск

### 1. Проверка настроек

```bash
cd backend
node scripts/setup-telegram-auth-production.js
```

### 2. Тестирование

```bash
node scripts/test-telegram-auth.js
```

### 3. Запуск сервера

```bash
pnpm dev
```

## 📱 Как это работает

1. **Пользователь** вводит номер телефона на сайте
2. **Сервер** генерирует код и отправляет через вашего бота
3. **Пользователь** получает код в чате с @SuperMock_bot
4. **Пользователь** вводит код на сайте
5. **Сервер** проверяет код и выдает JWT токен

## 🔗 API Endpoints

- `POST /api/telegram-auth/send-code` - Отправка кода
- `POST /api/telegram-auth/verify-code` - Проверка кода  
- `GET /api/telegram-auth/me` - Информация о пользователе
- `GET /api/telegram-auth/stats` - Статистика

## 🎨 Frontend компоненты

- `TelegramAuth` - компонент авторизации
- `ProtectedRoute` - защита маршрутов
- `useTelegramAuth` - хук для работы с авторизацией

## 📋 Настройки в production.env

```env
# Telegram Auth настройки
MAX_VERIFICATION_ATTEMPTS=3
VERIFICATION_CODE_EXPIRY=5
JWT_EXPIRY_DAYS=30
VERIFICATION_CODE_LENGTH=6
CODE_CLEANUP_INTERVAL=5
MAX_CODES_PER_PHONE=3
```

## 🧪 Тестирование

### Автоматическое тестирование

```bash
node scripts/test-telegram-auth.js
```

### Ручное тестирование

1. Откройте https://app.supermock.ru/auth/telegram
2. Введите номер телефона
3. Проверьте получение кода в @SuperMock_bot
4. Введите код и проверьте авторизацию

## 🔧 Troubleshooting

### Бот не отвечает
- Проверьте токен в production.env
- Убедитесь, что бот запущен

### Код не приходит  
- Проверьте, что пользователь начал диалог с ботом
- Проверьте логи сервера

### API недоступен
- Убедитесь, что сервер запущен
- Проверьте BACKEND_URL в production.env

## 📞 Поддержка

Все настройки уже в `production.env` - просто запускайте и тестируйте! 🚀
