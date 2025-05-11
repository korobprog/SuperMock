# Руководство по настройке Google OAuth и Redis для удаленного сервера и Netlify

## Настройка Google OAuth

### 1. Обновление настроек в консоли Google Cloud для удаленного сервера

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите в "APIs & Services" > "Credentials"
4. Найдите ваш OAuth 2.0 Client ID и нажмите на него для редактирования
5. В разделе "Authorized JavaScript origins" добавьте:
   ```
   http://217.198.6.238
   https://217.198.6.238
   ```
6. В разделе "Authorized redirect URIs" добавьте:
   ```
   http://217.198.6.238/api/google/callback
   https://217.198.6.238/api/google/callback
   ```
7. Нажмите "Save"

### 2. Обновление настроек в консоли Google Cloud для Netlify

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите в "APIs & Services" > "Credentials"
4. Найдите ваш OAuth 2.0 Client ID и нажмите на него для редактирования
5. В разделе "Authorized JavaScript origins" добавьте:
   ```
   https://supermock.netlify.app
   ```
6. В разделе "Authorized redirect URIs" добавьте:
   ```
   https://supermock.netlify.app/api/google/callback
   ```
7. Нажмите "Save"

### 3. Обновление переменных окружения для удаленного сервера

Добавьте следующие переменные в файл `.env.production` для удаленного сервера:

```
GOOGLE_CLIENT_ID=ваш_client_id
GOOGLE_CLIENT_SECRET=ваш_client_secret
GOOGLE_CALLBACK_URL=http://217.198.6.238/api/google/callback
FRONTEND_URL=http://217.198.6.238
```

### 4. Обновление переменных окружения для Netlify

Добавьте следующие переменные в файл `.env.production` для деплоя на Netlify:

```
GOOGLE_CLIENT_ID=ваш_client_id
GOOGLE_CLIENT_SECRET=ваш_client_secret
GOOGLE_CALLBACK_URL=https://supermock.netlify.app/api/google/callback
FRONTEND_URL=https://supermock.netlify.app
```

## Настройка Redis

### 1. Проверка подключения к Redis

Если у вас возникают проблемы с подключением к Redis, проверьте:

1. **Доступность Redis по указанному адресу и порту**:

   ```bash
   telnet 217.198.6.238 6379
   ```

   Если подключение успешно, вы увидите пустой экран. Нажмите Ctrl+C для выхода.

2. **Проверка подключения с помощью redis-cli**:
   ```bash
   redis-cli -h 217.198.6.238 -p 6379 -a krishna1284radha ping
   ```
   Если подключение успешно, вы увидите ответ "PONG".

### 2. Возможные решения проблем с Redis

1. **Проверьте настройки брандмауэра**:

   - Убедитесь, что порт 6379 открыт для входящих подключений на сервере Redis
   - Проверьте, что ваш клиент имеет доступ к этому порту

2. **Проверьте настройки Redis**:

   - Убедитесь, что Redis настроен для принятия удаленных подключений
   - Проверьте файл конфигурации Redis (обычно `/etc/redis/redis.conf`)
   - Убедитесь, что параметр `bind` настроен правильно (например, `bind 0.0.0.0` для принятия подключений со всех адресов)
   - Проверьте, что параметр `protected-mode` установлен в `no` или настроена аутентификация

3. **Альтернативные настройки**:
   - Если проблемы с подключением к Redis продолжаются, вы можете отключить использование Redis, установив `USE_REDIS=false` в `.env.production`
   - Это приведет к использованию стандартного адаптера Socket.IO, который работает без Redis

### 3. Проверка логов

После запуска сервера проверьте логи на наличие ошибок подключения к Redis. Добавленные нами логи помогут определить причину проблемы.

## Проверка настроек

После внесения изменений запустите сервер и проверьте логи. Если вы видите ошибки, связанные с Google OAuth или Redis, используйте информацию из логов для дальнейшей отладки.

## Дополнительные ресурсы

- [Документация Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Документация Redis](https://redis.io/documentation)
- [Документация Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
