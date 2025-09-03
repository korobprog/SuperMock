# Настройка Telegram Login для разработки

## Установка

Библиотека `react-telegram-login` уже установлена в проекте:

```bash
pnpm add react-telegram-login
```

## Важные ограничения

### 1. Домен
- **НЕ работает на `localhost` или `127.0.0.1`**
- Требуется зарегистрированный домен у @BotFather
- Для локальной разработки можно использовать `yourdomain.local`

### 2. Порт
- **Требуется порт 80** (стандартный HTTP порт)
- При использовании Vite: `sudo pnpm run dev` (порт 80)
- Или настройте nginx для проксирования

## Настройка для локальной разработки

### Вариант 1: Настройка hosts файла

1. Отредактируйте `/etc/hosts` (Linux/Mac) или `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 supermock.local
127.0.0.1 yourdomain.local
```

2. Запустите проект на порту 80:

```bash
sudo pnpm run dev
```

3. Откройте `http://supermock.local` в браузере

### Вариант 2: Настройка nginx

1. Установите nginx
2. Создайте конфигурацию:

```nginx
server {
    listen 80;
    server_name supermock.local;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. Запустите проект на порту 3000:

```bash
pnpm run dev
```

## Настройка бота

1. Создайте бота через @BotFather
2. Добавьте домен в настройки бота:

```
/setdomain
@your_bot_name
supermock.local
```

## Тестирование

1. Запустите проект на правильном домене и порту
2. Откройте компонент `TestTelegramLogin`
3. Нажмите кнопку "Login with Telegram"
4. Проверьте консоль браузера на наличие ошибок

## Компоненты

- `TelegramLoginButtonComponent` - основной компонент для авторизации
- `AuthRequiredMessage` - обновлен для использования нового компонента
- `TestTelegramLogin` - тестовый компонент для проверки

## Параметры виджета

```jsx
<TelegramLoginButton
  dataOnauth={handleTelegramResponse}
  botName="SuperMock_bot"
  dataSize="large"           // Размер кнопки
  dataRadius="8"             // Радиус скругления
  dataRequestAccess="write"  // Запрашиваемые права
  dataUserpic="false"        // Показывать ли аватар
  dataLang="ru"              // Язык интерфейса
/>
```

## Устранение проблем

### Ошибка "Widget not found"
- Проверьте, что домен зарегистрирован у @BotFather
- Убедитесь, что используете правильный `botName`

### Ошибка "Invalid domain"
- Убедитесь, что не используете `localhost`
- Проверьте настройки hosts файла
- Перезапустите браузер после изменения hosts

### Виджет не загружается
- Проверьте консоль браузера на ошибки
- Убедитесь, что проект запущен на порту 80
- Проверьте доступность домена: `ping supermock.local`
