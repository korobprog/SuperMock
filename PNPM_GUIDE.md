# Руководство по использованию pnpm в проекте SuperMock

## Обзор

Этот проект настроен для использования **pnpm** в качестве менеджера пакетов. pnpm обеспечивает более быструю установку зависимостей и более эффективное использование дискового пространства.

## Основные команды

### Установка зависимостей
```bash
pnpm install
```

### Добавление новых зависимостей
```bash
# Добавить в корневой проект
pnpm add -w <package-name>

# Добавить в backend
pnpm add -C backend <package-name>

# Добавить dev зависимость
pnpm add -D <package-name>
```

### Запуск скриптов
```bash
# Сборка проекта
pnpm run build

# Запуск в режиме разработки
pnpm run dev

# Запуск только frontend
pnpm run dev:frontend

# Запуск только backend
pnpm run dev:backend

# Деплой frontend
pnpm run deploy:frontend

# Деплой backend
pnpm run deploy:backend
```

## Конфигурация VS Code

Проект настроен для работы с pnpm в VS Code:

- **Терминал по умолчанию**: Bash (вместо Gemini Console)
- **Менеджер пакетов**: pnpm
- **Задачи**: Настроены для использования pnpm
- **Рекомендуемые расширения**: pnpm.pnpm

## Структура workspace

```
supermock/
├── package.json          # Корневой package.json
├── pnpm-workspace.yaml   # Конфигурация workspace
├── .npmrc               # Настройки pnpm
├── frontend/            # Frontend приложение
└── backend/             # Backend приложение
```

## Полезные команды

### Просмотр всех доступных скриптов
```bash
pnpm run
```

### Проверка версии pnpm
```bash
pnpm --version
```

### Очистка кэша
```bash
pnpm store prune
```

### Обновление lockfile
```bash
pnpm install --frozen-lockfile=false
```

## Troubleshooting

### Если VS Code все еще использует npm
1. Перезапустите VS Code
2. Убедитесь, что в настройках установлен `"npm.packageManager": "pnpm"`
3. Используйте терминал Bash вместо Gemini Console

### Если возникают проблемы с зависимостями
```bash
# Удалить node_modules и переустановить
rm -rf node_modules
pnpm install
```

### Если нужно переключиться между менеджерами пакетов
```bash
# Удалить lockfile и node_modules
rm pnpm-lock.yaml
rm -rf node_modules

# Переустановить с pnpm
pnpm install
```

## Преимущества pnpm

1. **Быстрота**: Установка зависимостей происходит быстрее
2. **Эффективность**: Экономия дискового пространства
3. **Безопасность**: Строгая изоляция зависимостей
4. **Workspace поддержка**: Отличная поддержка монорепозиториев
5. **Совместимость**: Полная совместимость с npm
