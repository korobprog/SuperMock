# 🔐 Простая Telegram Авторизация - README

## 📋 Обзор

Создана простая и рабочая система авторизации через Telegram для веб-версии приложения. Система использует официальный Telegram Login Widget и работает как через виджет, так и через форму для тестирования.

## 🚀 Что работает

### ✅ Основные функции
- **Telegram Login Widget** - официальный виджет для авторизации
- **Автоматическая обработка** - данные отправляются на сервер и обрабатываются
- **JWT токены** - генерируются и сохраняются автоматически
- **Состояние приложения** - пользователь сохраняется в store
- **Форма тестирования** - для проверки API без виджета

### ✅ Backend endpoints
- `POST /api/telegram-auth-callback` - обработка данных от виджета
- `GET /api/telegram-auth-callback` - обработка GET callback (для совместимости)
- `GET /api/telegram-test` - тест доступности API
- `GET /api/telegram-bot-check` - проверка состояния бота

## 🎯 Как использовать

### 1. **Основная авторизация**
Перейдите на страницу `/telegram-auth-test` и используйте компонент `TelegramLoginSimple`:

```tsx
import { TelegramLoginSimple } from '@/components/ui/telegram-login-simple';

<TelegramLoginSimple
  onAuth={(user) => console.log('Пользователь авторизован:', user)}
  onLogout={() => console.log('Пользователь вышел')}
/>
```

### 2. **Тестирование API**
На той же странице есть форма `TelegramAuthForm` для отправки тестовых данных на сервер.

### 3. **Интеграция в другие компоненты**
```tsx
import { TelegramLoginSimple } from '@/components/ui/telegram-login-simple';
import { useAppStore } from '@/lib/store';

function MyComponent() {
  const { telegramUser, setTelegramUser } = useAppStore();
  
  return (
    <div>
      {!telegramUser ? (
        <TelegramLoginSimple
          onAuth={setTelegramUser}
          onLogout={() => setTelegramUser(null)}
        />
      ) : (
        <div>Привет, {telegramUser.first_name}!</div>
      )}
    </div>
  );
}
```

## ⚙️ Настройка

### Переменные окружения (Backend)
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_ID=your_bot_id_here
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://app.supermock.ru
```

### Переменные окружения (Frontend)
```bash
VITE_TELEGRAM_BOT_NAME=your_bot_name
VITE_TELEGRAM_BOT_ID=your_bot_id
VITE_API_URL=https://api.supermock.ru
```

### Настройка в BotFather
1. Откройте [@BotFather](https://t.me/botfather)
2. Отправьте `/setdomain`
3. Выберите вашего бота
4. Добавьте домен: `app.supermock.ru`

## 🔄 Процесс авторизации

1. **Пользователь нажимает кнопку "Войти через Telegram"**
2. **Открывается Telegram виджет**
3. **После авторизации данные отправляются на `/api/telegram-auth-callback`**
4. **Backend валидирует данные через HMAC-SHA256**
5. **Создается/обновляется пользователь и генерируется JWT токен**
6. **Frontend получает ответ и сохраняет пользователя в store**

## 🧪 Тестирование

### 1. **Через виджет**
- Откройте `/telegram-auth-test`
- Нажмите на виджет Telegram
- Авторизуйтесь через Telegram

### 2. **Через форму**
- На той же странице используйте форму тестирования
- Заполните поля и нажмите "Отправить на сервер"
- Проверьте ответ сервера

### 3. **API endpoints**
```bash
# Тест API
curl https://api.supermock.ru/api/telegram-test

# Проверка бота
curl https://api.supermock.ru/api/telegram-bot-check
```

## 🐛 Отладка

### Проблемы с виджетом
1. **Проверьте домен в BotFather**
2. **Убедитесь, что бот активен**
3. **Проверьте консоль браузера на ошибки**

### Проблемы с API
1. **Проверьте логи backend**
2. **Убедитесь, что все переменные окружения настроены**
3. **Проверьте доступность endpoints**

### Логирование
Backend логирует все этапы:
- Получение данных
- Валидация
- Обработка пользователя
- Генерация токена

## 🔒 Безопасность

- **HMAC-SHA256 валидация** всех данных от Telegram
- **JWT токены** с ограниченным сроком действия (30 дней)
- **Валидация обязательных полей**
- **Обработка ошибок** на всех этапах

## 📁 Структура файлов

### Backend
- `backend/src/routes/telegram-auth.ts` - основные маршруты

### Frontend
- `frontend/src/components/ui/telegram-login-simple.tsx` - основной компонент
- `frontend/src/components/ui/telegram-auth-form.tsx` - форма тестирования
- `frontend/src/pages/TelegramAuthTest.tsx` - страница тестирования

## 🚀 Деплой

1. **Закоммитьте изменения:**
   ```bash
   git add .
   git commit -m "feat: добавлена простая Telegram авторизация"
   git push origin main
   ```

2. **GitHub Actions автоматически задеплоит изменения**

3. **Проверьте работу на `/telegram-auth-test`**

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи backend
2. Проверьте консоль браузера
3. Убедитесь, что все переменные окружения настроены
4. Проверьте настройки в BotFather
5. Используйте форму тестирования для диагностики API

## 🎉 Готово!

Теперь у вас есть простая и рабочая система авторизации через Telegram, которая:
- ✅ Работает с официальным виджетом
- ✅ Обрабатывает данные на сервере
- ✅ Генерирует JWT токены
- ✅ Интегрируется с состоянием приложения
- ✅ Имеет форму для тестирования
- ✅ Логирует все этапы для отладки