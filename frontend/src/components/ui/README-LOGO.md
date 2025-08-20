# Компоненты логотипа

## Logo

Основной компонент для отображения логотипа Super Mock.

### Пропсы:

- `size`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' - размер логотипа
- `variant`: 'text' | 'image' | 'both' - вариант отображения
- `responsive`: boolean - включить адаптивность
- `className`: string - дополнительные CSS классы

### Примеры использования:

```tsx
// Только изображение
<Logo size="xl" variant="image" />

// Только текст
<Logo size="lg" variant="text" />

// Изображение + текст
<Logo size="2xl" variant="both" />
```

## NavLogo

Компактный компонент для навигации.

### Пропсы:

- `size`: 'xs' | 'sm' | 'md' | 'lg' - размер логотипа
- `showText`: boolean - показывать ли текст (по умолчанию true)
- `className`: string - дополнительные CSS классы

### Примеры использования:

```tsx
// С текстом (скрывается на мобильных)
<NavLogo size="md" showText={true} />

// Только иконка
<NavLogo size="sm" showText={false} />
```

## CompactLogo

Компактный компонент для небольших мест.

### Пропсы:

- `size`: 'xs' | 'sm' | 'md' - размер логотипа
- `showText`: boolean - показывать ли текст
- `className`: string - дополнительные CSS классы

## Адаптивность

Все компоненты автоматически адаптируются под размер экрана:

- **Мобильные устройства** (< 640px): меньшие размеры
- **Планшеты** (640px - 768px): средние размеры
- **Десктопы** (> 768px): большие размеры

## CSS классы

Доступные CSS классы для логотипа:

- `.logo-image` - базовые стили для изображения
- `.logo-sm`, `.logo-md`, `.logo-lg`, `.logo-xl`, `.logo-2xl` - размеры

## Favicon

Favicon файлы находятся в `/favicon/` и включают:

- `favicon.ico` - основной favicon
- `favicon-16x16.png`, `favicon-32x32.png` - PNG версии
- `apple-touch-icon.png` - для iOS
- `android-chrome-192x192.png`, `android-chrome-512x512.png` - для Android
- `site.webmanifest` - манифест PWA

## StyledSubtitle

Компонент для стильного отображения подзаголовков с красивыми шрифтами.

### Пропсы:

- `variant`: 'default' | 'gradient' | 'mono' | 'tech' | 'elegant' - стиль подзаголовка
- `size`: 'sm' | 'md' | 'lg' | 'xl' - размер подзаголовка (по умолчанию 'md')
- `className`: string - дополнительные CSS классы

### Варианты стилей:

- **gradient** - градиентный текст (по умолчанию)
- **default** - простой стиль с градиентом
- **tech** - технологический стиль с подчеркиванием
- **elegant** - элегантный курсив
- **mono** - моноширинный шрифт

### Размеры:

- **sm** - маленький (0.875rem)
- **md** - средний (1.125rem) - по умолчанию
- **lg** - большой (1.375rem)
- **xl** - очень большой (1.625rem)

_Размеры автоматически адаптируются под устройство_

### Примеры использования:

```tsx
// Базовое использование
<StyledSubtitle variant="gradient">
  платформа для проведения mock-интервью
</StyledSubtitle>

// С указанием размера
<StyledSubtitle variant="tech" size="lg">
  Технологическое решение
</StyledSubtitle>

// Маленький размер для компактных мест
<StyledSubtitle variant="mono" size="sm">
  КОМПАКТНЫЙ ТЕКСТ
</StyledSubtitle>

// Большой размер для заголовков
<StyledSubtitle variant="elegant" size="xl">
  Элегантный заголовок
</StyledSubtitle>
```

### Используемые шрифты:

- **Inter** - основной sans-serif шрифт
- **Space Grotesk** - display шрифт для заголовков
- **JetBrains Mono** - моноширинный шрифт для кода
