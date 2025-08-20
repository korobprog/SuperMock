# Telegram Mini Apps - Полноэкранный режим

## Обзор

Этот документ описывает настройку полноэкранного режима для Telegram Mini Apps в проекте Super Mock.

## Функции

### `setupTelegramFullscreen()`

Основная функция для настройки полноэкранного режима в Telegram Mini Apps.

**Расположение:** `frontend/src/lib/utils.ts`

**Функциональность:**

- Вызывает `tg.ready()` для уведомления Telegram о готовности приложения
- Вызывает `tg.expand()` для разворачивания приложения на максимальную высоту
- Вызывает `tg.requestFullscreen()` для перехода в полноэкранный режим (Bot API 8.0+)
- Настраивает тему приложения с помощью `setThemeParams()`
- Добавляет обработчики событий `fullscreenChanged` и `fullscreenFailed`

**Параметры темы:**

```typescript
{
  bg_color: '#ffffff',        // Цвет фона
  text_color: '#000000',      // Цвет текста
  hint_color: '#999999',      // Цвет подсказок
  link_color: '#2481cc',      // Цвет ссылок
  button_color: '#2481cc',    // Цвет кнопок
  button_text_color: '#ffffff' // Цвет текста кнопок
}
```

### `useTelegramFullscreen()`

React хук для автоматической настройки полноэкранного режима.

**Расположение:** `frontend/src/hooks/use-telegram-fullscreen.ts`

**Использование:**

```tsx
import { useTelegramFullscreen } from '@/hooks/use-telegram-fullscreen';

export function MyComponent() {
  // Автоматически настраивает полноэкранный режим при монтировании компонента
  const { isFullscreen, exitFullscreen } = useTelegramFullscreen();

  return (
    <div>
      <div>Мой компонент</div>
      {isFullscreen && (
        <button onClick={exitFullscreen}>Выйти из полноэкранного режима</button>
      )}
    </div>
  );
}
```

**Возвращаемые значения:**

- `isFullscreen: boolean` - текущее состояние полноэкранного режима
- `isSupported: boolean` - поддерживается ли полноэкранный режим в данной версии Telegram
- `exitFullscreen: () => void` - функция для выхода из полноэкранного режима

## Интеграция в компоненты

### Автоматическая интеграция

Следующие компоненты уже используют полноэкранный режим:

1. **Index.tsx** - Главная страница
2. **LanguageSelection.tsx** - Выбор языка
3. **Interview.tsx** - Страница интервью
4. **Profile.tsx** - Профиль пользователя

### Добавление в новые компоненты

Для добавления полноэкранного режима в новый компонент:

```tsx
import { useTelegramFullscreen } from '@/hooks/use-telegram-fullscreen';

export function NewComponent() {
  // Добавляем хук в начало компонента
  useTelegramFullscreen();

  // Остальной код компонента...
}
```

## API Telegram Mini Apps

### Основные методы

- **`ready()`** - Уведомляет Telegram о готовности приложения
- **`expand()`** - Разворачивает приложение на максимальную высоту
- **`requestFullscreen()`** - Переводит приложение в полноэкранный режим (Bot API 8.0+)
- **`exitFullscreen()`** - Выходит из полноэкранного режима (Bot API 8.0+)
- **`setThemeParams(params)`** - Устанавливает тему приложения

### События полноэкранного режима

- **`fullscreenChanged`** - Срабатывает при изменении состояния полноэкранного режима
- **`fullscreenFailed`** - Срабатывает при ошибке перехода в полноэкранный режим

### Дополнительные возможности

В `frontend/src/lib/utils.ts` также доступны функции для:

- **Кнопки навигации:**

  - `showTelegramBackButton(callback)` - Показать кнопку "Назад"
  - `hideTelegramBackButton()` - Скрыть кнопку "Назад"

- **Главная кнопка:**

  - `showTelegramMainButton(text, callback)` - Показать главную кнопку
  - `hideTelegramMainButton()` - Скрыть главную кнопку

- **Полноэкранный режим:**

  - `exitTelegramFullscreen()` - Выйти из полноэкранного режима
  - `isTelegramFullscreen()` - Проверить, находится ли приложение в полноэкранном режиме
  - `isFullscreenSupported()` - Проверить поддержку полноэкранного режима в данной версии Telegram

- **Тема:**
  - `setTelegramHeaderColor(color)` - Установить цвет заголовка
  - `getTelegramTheme()` - Получить текущую тему

## Проверка работы

### В браузере (разработка)

- Откройте DevTools
- В консоли должно появиться сообщение: `✅ Telegram Mini Apps настроен в полноэкранном режиме`

### В Telegram

- Приложение должно автоматически развернуться на весь экран
- Тема должна соответствовать настройкам Telegram

## Устранение неполадок

### Приложение не разворачивается

1. Проверьте, что скрипт Telegram WebApp загружен
2. Убедитесь, что приложение запущено в Telegram
3. Проверьте консоль на наличие ошибок

### Полноэкранный режим не работает

1. Убедитесь, что используется Telegram версии с поддержкой Bot API 8.0+
2. Проверьте, что методы `requestFullscreen` и `exitFullscreen` доступны
3. Проверьте консоль на наличие ошибок `fullscreenFailed`
4. Убедитесь, что устройство поддерживает полноэкранный режим
5. В старых версиях Telegram (6.0) будет использоваться только развернутый режим (expand)

### Совместимость версий

- **Telegram 6.0+**: Поддерживается только развернутый режим (`expand()`)
- **Telegram 8.0+**: Поддерживается полноэкранный режим (`requestFullscreen()`)
- **Автоматическое определение**: Приложение автоматически определяет версию и использует доступные возможности

### Тема не применяется

1. Проверьте, что `setThemeParams` доступен
2. Убедитесь, что параметры темы корректны
3. Проверьте версию Telegram

## Ссылки

- [Официальная документация Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps#initializing-web-apps)
