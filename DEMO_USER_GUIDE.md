# 🧪 Руководство по демо пользователю в dev режиме

## Проблема
Демо пользователь не работает в dev режиме из-за отсутствия переменной окружения `VITE_ENABLE_DEV_TEST_ACCOUNTS=true`.

## ✅ Решение

### 1. Автоматическое исправление
Запустите скрипт исправления:
```bash
NODE_ENV=development ./fix-demo-user.sh
```

### 2. Ручное исправление
Добавьте в файл `frontend/.env.local`:
```env
VITE_ENABLE_DEV_TEST_ACCOUNTS=true
```

## 🚀 Использование демо пользователя

### Способ 1: Через DevBanner
1. Откройте http://localhost:5173
2. В dev режиме вы увидите оранжевый баннер "Development Mode"
3. Нажмите кнопку "🧪 Enable Demo" для включения демо пользователя
4. Нажмите "🗑️ Clear Demo" для очистки

### Способ 2: Через DevTest страницу
1. Перейдите на http://localhost:5173/dev-test
2. В разделе "Тестовые аккаунты" выберите нужный аккаунт
3. Нажмите "Применить"

### Способ 3: Быстрое включение на главной странице
1. На главной странице в dev режиме появится синий блок
2. Нажмите "Включить демо" или "Очистить демо"

### Способ 4: Через консоль браузера
```javascript
// Включить демо пользователя
const demoUser = {
  telegramUser: {
    id: 123456789,
    first_name: 'Test',
    last_name: 'Candidate',
    username: 'test_candidate',
    photo_url: 'https://t.me/i/userpic/320/test_candidate.jpg',
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'dev_test_candidate_hash',
  },
  userId: 123456789,
  role: 'candidate',
  profession: 'Frontend Developer',
  language: 'ru',
};

localStorage.setItem('dev_test_account', JSON.stringify(demoUser));
localStorage.setItem('dev_test_account_timestamp', Date.now().toString());
sessionStorage.setItem('dev_test_account_active', 'true');
window.location.reload();
```

## 📋 Доступные тестовые аккаунты

### 1. Кандидат (Candidate)
- **ID**: 123456789
- **Имя**: Test Candidate
- **Роль**: candidate
- **Профессия**: Frontend Developer
- **Язык**: ru

### 2. Интервьюер (Interviewer)
- **ID**: 987654321
- **Имя**: Test Interviewer
- **Роль**: interviewer
- **Профессия**: Senior Developer
- **Язык**: ru

### 3. Демо пользователь (Demo User)
- **ID**: 555666777
- **Имя**: Demo User
- **Роль**: candidate
- **Профессия**: Full Stack Developer
- **Язык**: en

## 🔧 Технические детали

### Файлы системы демо пользователей
- `frontend/src/lib/dev-test-account.ts` - основная логика
- `frontend/src/components/ui/dev-test-accounts.tsx` - UI компонент
- `frontend/src/pages/DevTest.tsx` - страница управления
- `frontend/src/components/ui/dev-banner.tsx` - баннер с кнопками

### Переменные окружения
- `VITE_ENABLE_DEV_TEST_ACCOUNTS=true` - включает систему демо пользователей
- `NODE_ENV=development` - включает dev режим

### localStorage ключи
- `dev_test_account` - данные тестового аккаунта
- `dev_test_account_timestamp` - время создания аккаунта
- `telegram_user` - данные пользователя Telegram

### sessionStorage ключи
- `dev_test_account_active` - флаг активности тестового аккаунта

## 🐛 Отладка

### Проверка статуса
```javascript
// Проверить активен ли демо пользователь
console.log('Active:', sessionStorage.getItem('dev_test_account_active'));
console.log('Account:', localStorage.getItem('dev_test_account'));
```

### Очистка всех данных
```javascript
localStorage.removeItem('dev_test_account');
localStorage.removeItem('dev_test_account_timestamp');
localStorage.removeItem('telegram_user');
sessionStorage.removeItem('dev_test_account_active');
window.location.reload();
```

## 📝 Примечания

1. Демо пользователи работают только в dev режиме (`NODE_ENV=development`)
2. При перезагрузке страницы демо пользователь восстанавливается автоматически
3. Демо пользователи имеют срок действия 24 часа
4. Система автоматически очищает устаревшие аккаунты

## 🔄 Перезапуск

Если изменения не применились автоматически:
```bash
# Остановить процессы
pkill -f "vite\|ts-node"

# Запустить заново
pnpm dev
```

## 🔌 WebSocket соединение

### Проблема с WebSocket в dev режиме

В dev режиме WebSocket должен подключаться к локальному серверу `ws://localhost:3000`, а не к продакшн серверу `wss://supermock.ru`.

### Исправления WebSocket:

1. **Обновлена конфигурация** в `frontend/src/lib/config.ts`:
   - Добавлен `wsURL` для правильного WebSocket URL в dev режиме
   - В dev режиме: `ws://localhost:3000`
   - В prod режиме: `wss://supermock.ru`

2. **Обновлены компоненты**:
   - `frontend/src/pages/Interview.tsx`
   - `frontend/src/pages/Notifications.tsx`
   - `frontend/src/components/ui/compact-chat.tsx`

### Тестирование WebSocket:

1. Откройте `test-websocket.html` в браузере
2. Нажмите "🔌 Тест локального WebSocket"
3. Проверьте, что соединение успешно

### Проверка WebSocket в интервью:

1. Включите демо пользователя
2. Перейдите на страницу интервью
3. Откройте консоль браузера (F12)
4. Проверьте, что нет ошибок WebSocket
5. Должно быть: `WebSocket connection to 'ws://localhost:3000/socket.io/...'`

## 🚨 Решение проблем

### Приложение зависло на спиннере определения языка

1. **Проверьте статус сервисов:**
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:5173
   ```

2. **Очистите localStorage в браузере:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   window.location.reload();
   ```

3. **Проверьте переменные окружения:**
   ```bash
   cat frontend/.env.local
   ```

4. **Перезапустите приложение:**
   ```bash
   pkill -f "vite\|ts-node"
   pnpm dev
   ```

### Ошибки с базой данных

В dev режиме используется InMemoryUser модель, которая не требует базы данных. Если появляются ошибки Prisma:

1. Убедитесь, что `USE_MONGODB=false` в переменных окружения
2. Проверьте, что все роуты правильно обрабатывают InMemoryUser режим
3. Перезапустите backend

### Быстрое включение демо пользователя

Выполните в консоли браузера:
```javascript
// Копируйте код из файла test-demo-quick.js
```
