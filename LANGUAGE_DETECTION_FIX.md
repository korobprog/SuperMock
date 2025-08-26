# �� Исправление проблемы с зависанием при определении языка

## Проблема
При включении тестового пользователя в демо версии приложение зависало на этапе определения языка. Это происходило из-за запроса к внешнему API `https://ipapi.co/json/` без таймаута.

## Причина
Функция `getLanguageByIP()` в `frontend/src/lib/language-detection.ts` выполняла запрос к внешнему API без ограничения времени, что могло приводить к зависанию при:
- Медленном интернет-соединении
- Недоступности API сервиса
- Проблемах с DNS

## Решение

### 1. Добавлен таймаут для IP-геолокации
```typescript
// Создаем AbortController для таймаута
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

const response = await fetch('https://ipapi.co/json/', {
  method: 'GET',
  headers: {
    Accept: 'application/json',
  },
  signal: controller.signal,
});
```

### 2. Пропуск IP-геолокации в dev режиме
```typescript
// В dev режиме пропускаем IP-геолокацию для ускорения
if (import.meta.env.DEV) {
  console.log('🔧 Dev mode detected, skipping IP geolocation for faster startup');
  console.log('🔤 Using fallback language: ru');
  return 'ru';
}
```

### 3. Добавлен таймаут для инициализации приложения
```typescript
// Определяем язык с таймаутом
const languagePromise = detectUserLanguage();
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Language detection timeout')), 10000)
);

const detectedLanguage = await Promise.race([languagePromise, timeoutPromise]) as SupportedLanguage;
```

## Файлы, которые были изменены

1. `frontend/src/lib/language-detection.ts`
   - Добавлен таймаут 5 секунд для IP-геолокации
   - Пропуск IP-геолокации в dev режиме
   - Улучшена обработка ошибок

2. `frontend/src/pages/Index.tsx`
   - Добавлен таймаут 10 секунд для инициализации приложения
   - Импортирован тип `SupportedLanguage`
   - Улучшено логирование ошибок

## Тестирование

### Быстрое тестирование
1. Запустите скрипт исправления:
   ```bash
   NODE_ENV=development ./fix-language-detection.sh
   ```

2. Перезапустите frontend:
   ```bash
   pnpm dev:frontend
   ```

3. Откройте http://localhost:5173 и нажмите "🧪 Enable Demo"

### Ожидаемый результат
- Приложение должно загрузиться быстро (в течение 1-2 секунд)
- В консоли браузера не должно быть ошибок таймаута
- Тестовый пользователь должен активироваться без зависания
