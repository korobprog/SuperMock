# 🔧 Исправление проблемы с WebSocket чатом в продакшене

## 🚨 Проблема
Чат между участниками на странице ожидания не работает в продакшене.

## 🔍 Причина
**Неправильная конфигурация WebSocket URL** в продакшене:

- **Frontend** пытается подключиться к `wss://app.supermock.ru` (frontend домен)
- **Но WebSocket сервер** запущен в backend контейнере, доступном по адресу `wss://api.supermock.ru`

## ✅ Решение

### 1. Исправлена конфигурация WebSocket URL

**Файл:** `frontend/src/lib/config.ts`
```typescript
// Было:
wsURL: import.meta.env.DEV 
  ? 'ws://localhost:3000'
  : 'wss://app.supermock.ru', // ❌ Неправильно!

// Стало:
wsURL: import.meta.env.DEV 
  ? 'ws://localhost:3000'
  : (import.meta.env.VITE_WS_URL || 'wss://api.supermock.ru'), // ✅ Правильно!
```

### 2. Добавлена переменная окружения

**Файл:** `production.env`
```bash
VITE_WS_URL=wss://api.supermock.ru
```

### 3. Обновлен docker-compose.prod-multi.yml

**Frontend контейнер:**
```yaml
environment:
  - VITE_WS_URL=wss://api.supermock.ru
```

### 4. Улучшено логирование WebSocket

**Файл:** `backend/server/index.mjs`
- Добавлено детальное логирование всех WebSocket событий
- Логирование подключений, отключений, присоединений к комнатам
- Логирование сообщений чата

## 🚀 Деплой исправлений

### Автоматический деплой через GitHub Actions
```bash
git add .
git commit -m "fix: исправлен WebSocket URL для чата в продакшене

- Исправлен WebSocket URL с app.supermock.ru на api.supermock.ru
- Добавлена переменная окружения VITE_WS_URL
- Улучшено логирование WebSocket событий
- Обновлен docker-compose для передачи переменных окружения"
git push origin main
```

### Ручной деплой на сервер
```bash
# Подключение к серверу
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238

# Переход в директорию проекта
cd /opt/mockmate

# Остановка контейнеров
docker-compose -f docker-compose.prod-multi.yml down

# Обновление файлов
# (скопировать исправленные файлы)

# Запуск контейнеров
docker-compose -f docker-compose.prod-multi.yml up -d --build

# Проверка логов
docker logs supermock-backend --tail 100 | grep -E '(socket|websocket|chat_message|join_room)'
```

## 🧪 Тестирование

### 1. Тестовый файл
Используйте `websocket-test.html` для проверки WebSocket соединения:

1. Откройте файл в браузере
2. Выберите `wss://api.supermock.ru`
3. Нажмите "Подключиться"
4. Проверьте логи в консоли браузера

### 2. Проверка в приложении
1. Откройте страницу ожидания в продакшене
2. Откройте DevTools → Console
3. Проверьте логи WebSocket соединения
4. Попробуйте отправить сообщение в чат

### 3. Проверка логов сервера
```bash
# Подключение к серверу
ssh -i ~/.ssh/timeweb_vps_key root@217.198.6.238

# Просмотр логов backend
docker logs supermock-backend --tail 100 | grep -E '(socket|websocket|chat_message|join_room)'

# Просмотр всех логов
docker logs supermock-backend --tail 200
```

## 📋 Чек-лист проверки

- [ ] WebSocket URL исправлен на `wss://api.supermock.ru`
- [ ] Переменная `VITE_WS_URL` добавлена в `production.env`
- [ ] Docker-compose обновлен для передачи переменной
- [ ] Код задеплоен на сервер
- [ ] Контейнеры перезапущены
- [ ] WebSocket соединение работает (проверено через тест)
- [ ] Чат работает в приложении
- [ ] Логи показывают успешные WebSocket события

## 🔍 Диагностика проблем

### Если WebSocket все еще не работает:

1. **Проверьте CORS настройки** в backend
2. **Проверьте переменные окружения** в контейнерах
3. **Проверьте логи Traefik** для проблем с маршрутизацией
4. **Проверьте SSL сертификаты** для WebSocket соединений

### Полезные команды для диагностики:
```bash
# Проверка переменных окружения в контейнере
docker exec supermock-backend env | grep VITE

# Проверка сетевых соединений
docker exec supermock-backend netstat -tlnp

# Проверка CORS заголовков
curl -H "Origin: https://app.supermock.ru" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.supermock.ru/api/health
```

## 📚 Дополнительные ресурсы

- [Socket.IO документация](https://socket.io/docs/)
- [WebSocket CORS настройки](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [Docker Compose переменные окружения](https://docs.docker.com/compose/environment-variables/)
