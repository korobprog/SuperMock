# 🤖 Telegram Auth - Полное руководство по авторизации

## 📋 Содержание

1. [Обзор системы](#обзор-системы)
2. [Быстрый старт](#быстрый-старт)
3. [Настройка Telegram бота](#настройка-telegram-бота)
4. [Конфигурация](#конфигурация)
5. [API документация](#api-документация)
6. [Frontend интеграция](#frontend-интеграция)
7. [Безопасность](#безопасность)
8. [Обработка ошибок](#обработка-ошибок)
9. [Тестирование](#тестирование)
10. [Развертывание](#развертывание)

## 🎯 Обзор системы

Система авторизации через Telegram использует существующего бота для отправки кодов верификации. Пользователь вводит номер телефона на сайте, получает код в чате с ботом, вводит код и получает JWT токен для доступа к приложению.

### Архитектура

```
Frontend (React) → Backend API → Telegram Bot → User
     ↓                ↓              ↓
  JWT Token ← User Data ← Verification Code
```

### Преимущества

- ✅ Не требует API ключей от my.telegram.org
- ✅ Использует существующего бота
- ✅ Простая настройка
- ✅ Безопасная авторизация
- ✅ Автоматическая очистка истекших кодов

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
pnpm install
```

### 2. Настройка бота

```bash
node scripts/setup-telegram-bot.js
```

### 3. Запуск сервера

```bash
pnpm dev
```

### 4. Тестирование

```bash
node scripts/test-telegram-auth.js
```

## 🤖 Настройка Telegram бота

### Создание бота

1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте полученный токен

### Настройка бота

```bash
# Запустите скрипт настройки
node scripts/setup-telegram-bot.js

# Введите токен бота
# Введите номер телефона для тестирования
# Укажите URL фронтенда
```

### Команды бота

Добавьте следующие команды через BotFather:

```
start - Начать работу с ботом
help - Получить помощь
```

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `.env` в папке `backend/`:

```env
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# JWT Secret (сгенерировать случайную строку)
JWT_SECRET=your_jwt_secret_here

# URL фронтенда
FRONTEND_URL=https://app.supermock.ru

# Настройки безопасности
MAX_VERIFICATION_ATTEMPTS=3
VERIFICATION_CODE_EXPIRY=5
JWT_EXPIRY_DAYS=30
VERIFICATION_CODE_LENGTH=6
```

### Генерация JWT Secret

```bash
# Генерация случайного секрета
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📡 API документация

### Endpoints

#### POST `/api/telegram-auth/send-code`

Отправка кода верификации через Telegram бота.

**Request:**
```json
{
  "phoneNumber": "+79991234567",
  "telegramUserId": "123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Код верификации отправлен в Telegram",
  "codeId": "unique_code_id",
  "expiresIn": 300
}
```

#### POST `/api/telegram-auth/verify-code`

Проверка кода верификации.

**Request:**
```json
{
  "codeId": "unique_code_id",
  "code": "123456",
  "userInfo": {
    "firstName": "Иван",
    "lastName": "Иванов",
    "username": "ivan_ivanov"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Авторизация успешна",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "phoneNumber": "+79991234567",
    "firstName": "Иван",
    "lastName": "Иванов",
    "username": "ivan_ivanov",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/telegram-auth/me`

Получение информации о текущем пользователе.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "phoneNumber": "+79991234567",
    "firstName": "Иван",
    "lastName": "Иванов",
    "username": "ivan_ivanov",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Пользователь найден"
}
```

#### POST `/api/telegram-auth/refresh-token`

Обновление JWT токена.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "token": "new_jwt_token_here",
  "user": { ... },
  "message": "Токен успешно обновлен"
}
```

#### GET `/api/telegram-auth/stats`

Получение статистики (для отладки).

**Response:**
```json
{
  "success": true,
  "stats": {
    "activeCodes": 5,
    "totalUsers": 100,
    "expiredCodes": 2
  },
  "message": "Статистика получена"
}
```

## 🎨 Frontend интеграция

### Использование компонента авторизации

```tsx
import TelegramAuth from '@/components/TelegramAuth';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

function AuthPage() {
  const { login } = useTelegramAuth();

  const handleAuthSuccess = (token: string, user: any) => {
    login(token, user);
    // Редирект на главную страницу
  };

  const handleAuthError = (error: string) => {
    console.error('Ошибка авторизации:', error);
  };

  return (
    <TelegramAuth
      onSuccess={handleAuthSuccess}
      onError={handleAuthError}
    />
  );
}
```

### Защита маршрутов

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Защищенный контент</div>
    </ProtectedRoute>
  );
}
```

### Использование хука авторизации

```tsx
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

function UserProfile() {
  const { user, isAuthenticated, logout } = useTelegramAuth();

  if (!isAuthenticated) {
    return <div>Не авторизован</div>;
  }

  return (
    <div>
      <h1>Привет, {user?.firstName}!</h1>
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
```

### Авторизованные запросы

```tsx
import { useAuthenticatedFetch } from '@/hooks/useTelegramAuth';

function DataComponent() {
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchData = async () => {
    const response = await authenticatedFetch('/api/protected/data');
    const data = await response.json();
    return data;
  };

  // ...
}
```

## 🔒 Безопасность

### Рекомендации

1. **JWT Secret**: Используйте криптографически стойкий секрет
2. **HTTPS**: Всегда используйте HTTPS в продакшене
3. **Rate Limiting**: Ограничьте количество запросов
4. **Валидация**: Проверяйте все входящие данные
5. **Логирование**: Ведите логи всех операций

### Настройки безопасности

```env
# Максимум попыток ввода кода
MAX_VERIFICATION_ATTEMPTS=3

# Время жизни кода (в минутах)
VERIFICATION_CODE_EXPIRY=5

# Время жизни JWT токена (в днях)
JWT_EXPIRY_DAYS=30

# Автоматическая очистка истекших кодов
CODE_CLEANUP_INTERVAL=5
```

### Middleware для авторизации

```typescript
import { requireTelegramAuth } from '@/middleware/telegramAuth';

// Защищенный маршрут
router.get('/protected', requireTelegramAuth, (req, res) => {
  // req.user содержит данные пользователя
  res.json({ user: req.user });
});
```

## ⚠️ Обработка ошибок

### Типы ошибок

1. **Валидация**: Неверный формат данных
2. **Авторизация**: Неверный токен или код
3. **Сеть**: Проблемы с Telegram API
4. **Сервер**: Внутренние ошибки

### Обработка на фронтенде

```tsx
const handleAuthError = (error: string) => {
  switch (error) {
    case 'Неверный код':
      setError('Проверьте правильность введенного кода');
      break;
    case 'Код истек':
      setError('Код истек. Запросите новый код');
      break;
    case 'Превышено количество попыток':
      setError('Слишком много попыток. Попробуйте позже');
      break;
    default:
      setError('Произошла ошибка. Попробуйте еще раз');
  }
};
```

### Логирование ошибок

```typescript
// В сервисе
console.error('❌ Ошибка при отправке кода:', error);

// В middleware
console.error('❌ Ошибка авторизации:', error);
```

## 🧪 Тестирование

### Автоматическое тестирование

```bash
# Запуск тестов
node scripts/test-telegram-auth.js
```

### Ручное тестирование

1. Запустите сервер: `pnpm dev`
2. Откройте страницу авторизации
3. Введите номер телефона
4. Проверьте получение кода в Telegram
5. Введите код и проверьте авторизацию

### Тестирование API

```bash
# Отправка кода
curl -X POST http://localhost:3000/api/telegram-auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+79991234567", "telegramUserId": "test"}'

# Проверка кода
curl -X POST http://localhost:3000/api/telegram-auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"codeId": "code_id", "code": "123456"}'
```

## 🚀 Развертывание

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

```env
# Production
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_production_bot_token
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-domain.com
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📚 Примеры использования

### Полный пример авторизации

```tsx
import React, { useState } from 'react';
import TelegramAuth from '@/components/TelegramAuth';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

function App() {
  const { isAuthenticated, user, logout } = useTelegramAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleAuthSuccess = (token: string, user: any) => {
    console.log('Авторизация успешна:', user);
    setShowAuth(false);
  };

  const handleAuthError = (error: string) => {
    console.error('Ошибка авторизации:', error);
  };

  if (isAuthenticated) {
    return (
      <div>
        <h1>Добро пожаловать, {user?.firstName}!</h1>
        <p>Номер: {user?.phoneNumber}</p>
        <button onClick={logout}>Выйти</button>
      </div>
    );
  }

  if (showAuth) {
    return (
      <TelegramAuth
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />
    );
  }

  return (
    <div>
      <h1>SuperMock</h1>
      <button onClick={() => setShowAuth(true)}>
        Войти через Telegram
      </button>
    </div>
  );
}

export default App;
```

### Пример защищенного API

```typescript
import { requireTelegramAuth } from '@/middleware/telegramAuth';

// Защищенный маршрут
router.get('/api/user/profile', requireTelegramAuth, async (req, res) => {
  try {
    const user = req.user!;
    
    // Получаем данные пользователя из базы
    const userData = await getUserData(user.id);
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных пользователя'
    });
  }
});
```

## 🔧 Troubleshooting

### Частые проблемы

1. **Бот не отвечает**
   - Проверьте токен бота
   - Убедитесь, что бот запущен
   - Проверьте логи сервера

2. **Код не приходит**
   - Проверьте, что пользователь начал диалог с ботом
   - Убедитесь, что telegramUserId корректный
   - Проверьте настройки бота

3. **Ошибка авторизации**
   - Проверьте JWT_SECRET
   - Убедитесь, что токен не истек
   - Проверьте формат токена

### Логи и отладка

```bash
# Включить подробные логи
LOG_LEVEL=debug pnpm dev

# Проверить статистику
curl http://localhost:3000/api/telegram-auth/stats
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи сервера
2. Убедитесь в правильности конфигурации
3. Запустите тесты: `node scripts/test-telegram-auth.js`
4. Проверьте документацию Telegram Bot API

---

**Удачной разработки! 🚀**
