# Исправления проблем в продакшене

## Проблемы, которые были исправлены:

### 1. Favicon файлы не найдены (404 ошибки)
**Проблема:** Favicon файлы не копировались в Docker контейнер frontend
**Решение:** 
- Добавлено копирование папки `media` в `frontend/Dockerfile`
- Файлы теперь доступны по пути `/media/favicon/`

### 2. site.webmanifest синтаксическая ошибка
**Проблема:** Неправильные пути к иконкам в манифесте
**Решение:**
- Исправлены пути к иконкам в `media/favicon/site.webmanifest`
- Добавлена правильная информация о приложении

### 3. API конфигурация для домена app.supermock.ru
**Проблема:** API запросы не работали с домена `app.supermock.ru`
**Решение:**
- Добавлен домен `app.supermock.ru` в список разрешенных доменов
- Исправлен базовый URL API на `https://api.supermock.ru`

## Внесенные изменения:

### frontend/Dockerfile
```dockerfile
# Добавлено копирование папки media
COPY media ./media

# Добавлено копирование в runtime контейнер
COPY --from=build /app/media /usr/share/nginx/html/media
```

### media/favicon/site.webmanifest
```json
{
  "name": "Super Mock",
  "short_name": "SuperMock",
  "description": "Платформа для проведения mock-интервью с ИИ",
  "icons": [
    {
      "src": "/media/favicon/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/media/favicon/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#0088cc",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

### frontend/src/lib/config.ts
```typescript
// Добавлен домен app.supermock.ru
const isProductionDomain = window.location.hostname === 'supermock.ru' || 
                          window.location.hostname === 'www.supermock.ru' ||
                          window.location.hostname === 'app.supermock.ru' ||
                          window.location.hostname === 'api.supermock.ru';

// Исправлен базовый URL
const base = 'https://api.supermock.ru';
```

## Результат:
✅ Favicon файлы теперь загружаются корректно
✅ site.webmanifest работает без ошибок
✅ API запросы работают с домена app.supermock.ru
✅ Ошибка "Failed to fetch" исправлена

## Проверка:
Сайт доступен по адресу: https://app.supermock.ru
Все статические файлы (favicon, manifest) должны загружаться без ошибок 404.
