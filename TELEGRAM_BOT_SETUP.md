# 🤖 Настройка Telegram бота с кнопкой START

## 📋 Обзор

Этот документ описывает настройку Telegram бота для SuperMock с большой кнопкой "START", которая открывает мини-приложение.

## 🚀 Возможности бота

- **Большая кнопка START** - открывает мини-приложение SuperMock
- **Команда /start** - показывает приветственное сообщение с кнопками
- **Команда /stats** - показывает статистику пользователя
- **Команда /help** - показывает справку по использованию
- **Уведомления** - отправляет уведомления о завершении собеседований

## ⚙️ Настройка

### 1. Создание бота через @BotFather

1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Введите имя бота (например, "SuperMock Interview Bot")
4. Введите username бота (например, "SuperMock_bot")
5. Сохраните полученный токен

### 2. Настройка переменных окружения

Добавьте в ваш `.env` файл:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_NAME=SuperMock_bot
VITE_TELEGRAM_BOT_NAME=SuperMock_bot
DOMAIN=supermock.ru
```

### 3. Настройка webhook'а

#### Автоматическая настройка (рекомендуется)

```bash
# Установите зависимости
pnpm install

# Настройте webhook
node scripts/setup-telegram-webhook.js
```

#### Ручная настройка

```bash
# Замените YOUR_BOT_TOKEN и YOUR_DOMAIN на реальные значения
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR_DOMAIN.com/api/telegram-webhook",
    "allowed_updates": ["callback_query", "message"],
    "drop_pending_updates": true
  }'
```

### 4. Проверка настройки

```bash
# Проверьте статус бота
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getMe"

# Проверьте webhook
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

## 🎯 Использование

### Команды бота

- `/start` - главное меню с кнопкой START
- `/stats` - ваша статистика собеседований
- `/help` - справка по использованию

### Кнопки

- **🚀 START** - открывает мини-приложение SuperMock
- **📊 Моя статистика** - показывает вашу статистику
- **❓ Помощь** - показывает справку

## 📱 Мини-приложение

При нажатии на кнопку "START" открывается мини-приложение SuperMock, где пользователи могут:

1. Выбрать профессию для практики
2. Выбрать роль (кандидат или интервьюер)
3. Найти собеседование
4. Провести собеседование через видеосвязь
5. Оставить фидбек

## 🔧 API Эндпоинты

### Проверка статуса бота

```
GET /api/telegram-bot-status
```

### Настройка webhook'а

```
POST /api/telegram-setup-webhook
```

### Информация о webhook'е

```
GET /api/telegram-webhook-info
```

### Webhook для обновлений

```
POST /api/telegram-webhook
```

## 🐛 Отладка

### Проверка логов

```bash
# Запустите сервер в режиме разработки
pnpm run dev

# Следите за логами webhook'а
tail -f logs/telegram-webhook.log
```

### Частые проблемы

1. **Webhook не работает**

   - Проверьте, что домен доступен из интернета
   - Убедитесь, что SSL сертификат валиден
   - Проверьте токен бота

2. **Кнопка START не открывает приложение**

   - Проверьте URL в настройках webhook'а
   - Убедитесь, что мини-приложение настроено в @BotFather

3. **Бот не отвечает на команды**
   - Проверьте, что webhook настроен правильно
   - Убедитесь, что сервер запущен и доступен

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения настроены
3. Проверьте статус бота через API
4. Обратитесь к документации Telegram Bot API

## 🔄 Обновления

Для обновления бота:

1. Остановите сервер
2. Обновите код
3. Перезапустите сервер
4. Проверьте работу webhook'а

```bash
# Перезапуск с проверкой webhook'а
pnpm run dev
node scripts/setup-telegram-webhook.js
```
