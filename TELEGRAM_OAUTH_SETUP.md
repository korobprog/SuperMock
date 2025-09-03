# Telegram OAuth Setup для SuperMock

## Обзор

Этот документ описывает настройку авторизации через Telegram OAuth для сайта `https://app.supermock.ru` согласно официальной документации [Telegram Login Widget](https://core.telegram.org/widgets/login).

## Архитектура

### Фронтенд (React + TypeScript)
- **Telegram Login Widget** - официальный виджет Telegram для авторизации
- **Страница авторизации** (`/auth`) - страница с виджетом входа
- **Callback страница** (`/auth/callback`) - обработка результата авторизации

### Бэкенд (Node.js + Express)
- **Callback endpoint** (`/auth/callback`) - обработка данных от Telegram
- **Валидация подписи** - проверка HMAC-SHA256 с токеном бота
- **JWT токены** - выдача токенов авторизации
- **База данных** - создание/обновление пользователей

## Настройка

### 1. Создание Telegram Bot

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните **Bot Token** и **Username**

### 2. Настройка переменных окружения

#### Бэкенд (`.env`)
```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
JWT_SECRET=your_jwt_secret_here

# Frontend URL
FRONTEND_URL=https://app.supermock.ru

# Database Configuration
DATABASE_URL=your_database_url
```

#### Фронтенд (`.env`)
```bash
# Telegram Bot Configuration
VITE_TELEGRAM_BOT_NAME=your_bot_username

# API Configuration
VITE_API_URL=https://app.supermock.ru
```

### 3. Настройка домена в BotFather

1. Отправьте команду `/setdomain` боту @BotFather
2. Укажите домен: `app.supermock.ru`
3. Подтвердите настройку

### 4. Настройка Webhook (опционально)

Для получения обновлений от бота:
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://app.supermock.ru/api/telegram/webhook"}'
```

## Использование

### 1. Добавление виджета на страницу

```tsx
import { TelegramLoginWidget } from '@/components/ui/telegram-login-widget';

function AuthPage() {
  const handleAuth = (user: TelegramUser) => {
    console.log('User authenticated:', user);
    // Обработка успешной авторизации
  };

  const handleError = (error: string) => {
    console.error('Auth error:', error);
    // Обработка ошибки
  };

  return (
    <TelegramLoginWidget
      botName="your_bot_username"
      onAuth={handleAuth}
      onError={handleError}
      dataOnauth="https://app.supermock.ru/auth/callback"
      requestAccess={true}
      usePic={true}
      cornerRadius={8}
      lang="ru"
    />
  );
}
```

### 2. Обработка callback'а

```tsx
import { useSearchParams } from 'react-router-dom';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    
    if (token && userId) {
      // Сохранение токена и перенаправление
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_id', userId);
      navigate('/');
    }
  }, [searchParams]);
  
  // ... остальной код
}
```

## Безопасность

### 1. Валидация данных

Все данные от Telegram проходят проверку подписи:

```typescript
function validateTelegramAuth(data: any, botToken: string): boolean {
  const checkHash = data.hash;
  const dataToCheck = { ...data };
  delete dataToCheck.hash;

  const dataCheckString = Object.keys(dataToCheck)
    .sort()
    .map((key) => `${key}=${dataToCheck[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hash === checkHash;
}
```

### 2. Проверка времени

Данные авторизации действительны только 1 час:

```typescript
const authTime = Number(auth_date) * 1000;
const currentTime = Date.now();
const maxAge = 60 * 60 * 1000; // 1 час

if (currentTime - authTime > maxAge) {
  return res.status(401).json({
    error: 'Auth data expired',
    message: 'Данные авторизации устарели'
  });
}
```

### 3. JWT токены

Токены содержат:
- `userId` - ID пользователя в системе
- `tgId` - ID пользователя в Telegram
- `type` - тип авторизации ('telegram')
- `iat` - время создания
- `exp` - время истечения (30 дней)

## API Endpoints

### GET /auth/callback
Обработка callback'а от Telegram Login Widget.

**Query параметры:**
- `id` - ID пользователя в Telegram
- `first_name` - имя пользователя
- `last_name` - фамилия пользователя (опционально)
- `username` - username пользователя (опционально)
- `photo_url` - URL аватара (опционально)
- `auth_date` - время авторизации
- `hash` - подпись данных

**Ответ:** Редирект на frontend с токеном

### POST /api/auth/telegram/callback
Альтернативный endpoint для AJAX запросов.

**Body:** JSON с данными пользователя Telegram

**Ответ:** JSON с токеном и данными пользователя

### GET /api/auth/telegram/status
Проверка статуса авторизации по токену.

**Query параметры:**
- `token` - JWT токен

**Ответ:** JSON с данными пользователя

## Обработка ошибок

### Типичные ошибки

1. **Missing required fields** - отсутствуют обязательные поля
2. **Invalid auth data** - неверная подпись данных
3. **Auth data expired** - данные авторизации устарели
4. **Bot token not configured** - токен бота не настроен

### Логирование

Все операции логируются с эмодзи для удобства:
- ✅ Успешные операции
- ❌ Ошибки
- ⚠️ Предупреждения
- 🔍 Отладочная информация
- 🔐 Операции авторизации

## Тестирование

### 1. Локальное тестирование

```bash
# Запуск бэкенда
cd backend
pnpm dev

# Запуск фронтенда
cd frontend
pnpm dev
```

### 2. Проверка бота

```bash
# Проверка доступности бота
curl "http://localhost:3000/api/telegram-bot-check"
```

### 3. Тестирование виджета

1. Откройте страницу `/auth`
2. Нажмите на Telegram Login Widget
3. Авторизуйтесь в Telegram
4. Проверьте редирект на `/auth/callback`

## Развертывание

### 1. Production

```bash
# Сборка фронтенда
pnpm build:frontend

# Сборка бэкенда
pnpm build:backend

# Запуск через Docker
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Проверка

```bash
# Проверка статуса
docker-compose -f docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f
```

## Мониторинг

### 1. Логи

Все операции авторизации логируются в консоль сервера.

### 2. Метрики

Можно добавить метрики для:
- Количества успешных авторизаций
- Количества ошибок
- Времени ответа API

## Troubleshooting

### 1. Виджет не загружается

- Проверьте правильность имени бота
- Убедитесь, что домен настроен в BotFather
- Проверьте консоль браузера на ошибки

### 2. Ошибки валидации

- Проверьте токен бота в переменных окружения
- Убедитесь, что время сервера синхронизировано
- Проверьте логи сервера

### 3. Проблемы с callback'ом

- Проверьте URL callback'а в настройках виджета
- Убедитесь, что роут `/auth/callback` доступен
- Проверьте CORS настройки

## Дополнительные возможности

### 1. Кастомизация виджета

```tsx
<TelegramLoginWidget
  botName="your_bot"
  dataOnauth="https://app.supermock.ru/auth/callback"
  requestAccess={true}        // Запрос доступа к отправке сообщений
  usePic={true}              // Показывать аватар пользователя
  cornerRadius={8}           // Радиус углов
  lang="ru"                  // Язык интерфейса
/>
```

### 2. Обработка дополнительных данных

Можно расширить функционал для:
- Сохранения языка пользователя
- Обработки дополнительных разрешений
- Интеграции с другими сервисами

## Заключение

Telegram OAuth предоставляет безопасный и удобный способ авторизации пользователей. Реализация полностью соответствует официальной документации и включает все необходимые меры безопасности.

Для получения дополнительной помощи обратитесь к:
- [Официальной документации Telegram](https://core.telegram.org/widgets/login)
- [Документации Bot API](https://core.telegram.org/bots/api)
- Логам сервера для отладки
