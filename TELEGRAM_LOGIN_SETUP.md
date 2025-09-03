# Настройка Telegram Login для разработки

## 🚨 **ВАЖНО: Решение проблемы с исчезающим окном авторизации**

Если окно Telegram авторизации появляется и исчезает без возможности ввода телефона, выполните следующие шаги:

### 1. **Добавить домен в BotFather (ОБЯЗАТЕЛЬНО!)**

Отправьте боту @BotFather команду:
```
/setdomain
```

Выберите ваш бот `SuperMock_bot` и добавьте домен:
```
app.supermock.ru
```

### 2. **Проверить настройки бота**

Отправьте команду:
```
/mybots
```

Выберите `SuperMock_bot` → `Bot Settings` → `Domain` и убедитесь, что там указан `app.supermock.ru`

### 3. **Проверить активность бота**

Убедитесь, что бот активен и не заблокирован:
```
/start
```

## 🔧 **Текущие настройки бота:**

- **Имя бота:** `SuperMock_bot`
- **ID бота:** `8464088869`
- **Домен:** `app.supermock.ru`
- **Токен:** `8464088869:AAFcZb7HmYQJa6vaYjfTDCjfr187p9hhk2o`

## 📋 **Проверка настроек:**

1. **Домен зарегистрирован в BotFather** ✅
2. **Бот активен и работает** ✅
3. **Нет блокировщиков рекламы** ✅
4. **CSP настройки корректны** ✅

## 🐛 **Отладка:**

Если проблема остается, проверьте:
- Логи браузера на наличие ошибок CSP
- Логи nginx на наличие блокировки запросов
- Настройки бота в BotFather

---

## 📚 **Основная документация**

### Требования для работы Telegram Login Widget:

1. **Домен и порт:**
   - Работает только на зарегистрированных доменах (не localhost)
   - Требует порт 80/443 (HTTPS)
   - Домен должен быть добавлен в BotFather

2. **Настройка BotFather:**
   - Отправить `/setdomain` боту @BotFather
   - Выбрать ваш бот
   - Добавить домен (например: `yourdomain.com`)

3. **Локальная разработка:**
   - Использовать ngrok для создания публичного URL
   - Добавить ngrok URL в BotFather
   - Или настроить hosts файл с тестовым доменом

### Настройка hosts файла для локальной разработки:

```bash
# /etc/hosts (Linux/Mac) или C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 yourdomain.local
```

### Настройка Nginx для локальной разработки:

```nginx
server {
    listen 80;
    server_name yourdomain.local;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Команды для настройки:

```bash
# 1. Настроить hosts файл
sudo nano /etc/hosts

# 2. Перезапустить nginx
sudo systemctl restart nginx

# 3. Добавить домен в BotFather
# Отправить /setdomain и указать yourdomain.local

# 4. Проверить доступность
curl -H "Host: yourdomain.local" http://localhost
```

### Проверка настроек бота:

```bash
# Проверить статус бота
curl "https://api.telegram.org/bot${BOT_TOKEN}/getMe"

# Проверить webhook (если используется)
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

### Переменные окружения:

```bash
# .env файл
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_ID=your_bot_id_here
VITE_TELEGRAM_BOT_NAME=your_bot_name
VITE_TELEGRAM_BOT_ID=your_bot_id
```

### Компонент React:

```tsx
import { TelegramLoginButton } from 'react-telegram-login';

function TelegramLogin() {
  const handleAuth = (user) => {
    console.log('Авторизован:', user);
  };

  return (
    <TelegramLoginButton
      dataOnauth={handleAuth}
      botName="your_bot_name"
      dataSize="large"
      dataRadius="8"
      dataRequestAccess="write"
      dataUserpic="false"
      dataLang="ru"
    />
  );
}
```

### Возможные проблемы и решения:

1. **"Widget not found"**
   - Проверить имя бота в `botName`
   - Убедиться, что бот существует и активен

2. **"Domain not allowed"**
   - Добавить домен в BotFather через `/setdomain`
   - Использовать правильный протокол (http/https)

3. **"CSP violation"**
   - Настроить Content Security Policy для telegram.org
   - Разрешить frame-src для telegram.org

4. **"Port not allowed"**
   - Использовать порты 80 или 443
   - Для разработки использовать ngrok

### Полезные ссылки:

- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [BotFather Commands](https://core.telegram.org/bots#botfather)
- [Telegram Bot API](https://core.telegram.org/bots/api)
