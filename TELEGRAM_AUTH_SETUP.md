# 🔐 Настройка Telegram Авторизации

## 📋 Обзор

Данный документ описывает настройку авторизации через Telegram для SuperMock приложения.

## 🚀 Что было исправлено

### 1. **Проблема с data-auth-url**
- **Было**: `data-auth-url="${currentOrigin}"` (указывал на корень домена)
- **Стало**: `data-auth-url="${currentOrigin}/telegram-auth-callback"` (указывает на конкретный endpoint)

### 2. **Создан Backend Endpoint**
- Новый маршрут `/api/telegram-auth-callback` для обработки callback от Telegram
- Валидация данных через Telegram API
- Создание/обновление пользователей в базе данных
- Генерация JWT токенов

### 3. **Исправлены ошибки 404 для фавиконок**
- Скопированы все файлы фавиконок в `frontend/public/favicon/`
- Исправлен `site.webmanifest` с правильными путями
- Добавлена страница успешной авторизации

## ⚙️ Требования

### Backend переменные окружения:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_ID=your_bot_id_here
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://app.supermock.ru
```

### Frontend переменные окружения:
```bash
VITE_TELEGRAM_BOT_NAME=your_bot_name
VITE_TELEGRAM_BOT_ID=your_bot_id
```

## 🔧 Настройка в BotFather

1. **Откройте [@BotFather](https://t.me/botfather) в Telegram**
2. **Создайте нового бота или выберите существующего**
3. **Настройте Domain для виджета:**
   ```
   /setdomain
   Выберите бота
   Введите: app.supermock.ru
   ```

## 📁 Структура файлов

### Backend:
- `backend/src/routes/telegram-auth.ts` - маршруты для Telegram авторизации
- `backend/src/server.ts` - подключение маршрутов

### Frontend:
- `frontend/src/components/ui/telegram-login.tsx` - компоненты авторизации
- `frontend/src/pages/TelegramAuthSuccess.tsx` - страница успешной авторизации
- `frontend/src/App.tsx` - маршрут `/telegram-auth-success`

### Фавиконки:
- `frontend/public/favicon/` - все иконки
- `frontend/public/site.webmanifest` - манифест приложения

## 🔄 Процесс авторизации

1. **Пользователь нажимает кнопку "Войти через Telegram"**
2. **Открывается Telegram виджет с правильным `data-auth-url`**
3. **После авторизации Telegram отправляет данные на `/api/telegram-auth-callback`**
4. **Backend валидирует данные и создает/обновляет пользователя**
5. **Пользователь перенаправляется на `/telegram-auth-success?token=...&userId=...`**
6. **Frontend сохраняет токен и перенаправляет на главную страницу**

## 🧪 Тестирование

### Проверка доступности бота:
```bash
curl https://api.supermock.ru/api/telegram-bot-check
```

### Проверка callback endpoint:
```bash
curl "https://api.supermock.ru/api/telegram-auth-callback?id=123&first_name=Test&auth_date=1234567890&hash=test_hash"
```

## 🚨 Возможные проблемы

### 1. **Кнопка не активна**
- Проверьте `VITE_TELEGRAM_BOT_NAME` в переменных окружения
- Убедитесь, что домен настроен в BotFather
- Проверьте консоль браузера на ошибки

### 2. **Ошибка 404 при callback**
- Убедитесь, что маршрут `/api/telegram-auth-callback` подключен в `server.ts`
- Проверьте, что backend запущен и доступен

### 3. **Ошибки валидации**
- Проверьте `TELEGRAM_BOT_TOKEN` в переменных окружения
- Убедитесь, что токен корректный и бот активен

### 4. **Ошибки с фавиконками**
- Проверьте, что файлы скопированы в `frontend/public/favicon/`
- Убедитесь, что `site.webmanifest` находится в `frontend/public/`

## 📝 Логирование

Backend логирует все этапы авторизации:
- Получение callback данных
- Валидация данных
- Создание/обновление пользователя
- Генерация токена
- Перенаправление

## 🔒 Безопасность

- Все данные от Telegram валидируются через HMAC-SHA256
- Используется JWT для аутентификации
- Токены имеют ограниченный срок действия (30 дней)
- CORS настроен только для разрешенных доменов

## 🚀 Деплой

После внесения изменений:

1. **Закоммитьте изменения:**
   ```bash
   git add .
   git commit -m "fix: улучшена Telegram авторизация и исправлены фавиконки"
   git push origin main
   ```

2. **GitHub Actions автоматически задеплоит изменения**

3. **Проверьте логи backend для диагностики**

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи backend
2. Проверьте консоль браузера
3. Убедитесь, что все переменные окружения настроены
4. Проверьте настройки в BotFather
