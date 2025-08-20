# Устранение проблем деплоя

## Проблемы после деплоя

### 1. Ошибка 404 "Page not found"

**Причина:** Конфликт имен образов Docker между старыми (`mockmate-*`) и новыми (`supermock-*`)

**Симптомы:**

- Traefik логи показывают ошибки: "Router cannot be linked automatically with multiple Services"
- Контейнеры используют образы `mockmate-*`, но называются `supermock-*`
- **Новая причина:** `docker-compose.override.yml` содержит старые имена `mockmate-*`

**Решение:**

```bash
# 1. Исправить docker-compose.override.yml (заменить mockmate-* на supermock-*)
# 2. Остановить контейнеры
docker-compose -f docker-compose.prod.yml --project-name supermock down

# 3. Удалить конфликтующие образы
docker rmi mockmate-frontend mockmate-backend supermock-frontend supermock-backend

# 4. Перезапустить с правильным именем проекта
docker-compose -f docker-compose.prod.yml --project-name supermock up -d

# 5. Перезапустить Traefik для очистки кэша
docker restart traefik
```

### 2. Проблемы с Traefik маршрутизацией

**Причина:** Traefik кэширует старые конфигурации

**Решение:**

```bash
# Перезапустить Traefik
docker restart traefik

# Проверить логи
docker logs traefik --tail 10
```

### 3. Проблемы с аутентификацией в десктопной версии

**Причина:** Неправильная обработка Telegram Login Widget

**Решение:**

- Убедиться, что пользователь аутентифицирован через Telegram Login Widget на `/profile`
- Проверить, что `initData` установлен в `'present'` для аутентифицированных пользователей

## Исправления в скриптах деплоя

### Обновленные команды:

**Вместо:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Использовать:**

```bash
docker-compose -f docker-compose.prod.yml --project-name supermock up -d
```

### Проверка статуса:

**Вместо:**

```bash
docker ps | grep mockmate-frontend
```

**Использовать:**

```bash
docker ps | grep supermock-frontend
```

## Профилактика проблем

1. **Всегда использовать `--project-name supermock`** в командах docker-compose
2. **Удалять старые образы** перед новым деплоем
3. **Перезапускать Traefik** после изменений конфигурации
4. **Проверять логи** всех сервисов после деплоя
5. **При конфликтах имен** - полностью останавливать контейнеры, удалять образы и пересоздавать с нуля
6. **Синхронизировать конфигурацию Docker** - скрипты деплоя теперь копируют `docker-compose.*.yml` файлы
7. **Проверять `docker-compose.override.yml`** - убедиться, что используются правильные имена сервисов

## Полное решение конфликтов имен

Если Traefik показывает ошибки с множественными сервисами:

```bash
# 1. Остановить все контейнеры
docker-compose -f docker-compose.prod.yml --project-name supermock down

# 2. Удалить все образы
docker rmi supermock-frontend supermock-backend 2>/dev/null || true

# 3. Пересоздать с нуля
docker-compose -f docker-compose.prod.yml --project-name supermock up -d --build

# 4. Перезапустить Traefik
docker restart traefik
```

## Команды для диагностики

```bash
# Проверить статус контейнеров
docker ps | grep supermock

# Проверить образы
docker images | grep -E '(mockmate|supermock)'

# Проверить логи Traefik
docker logs traefik --tail 10

# Проверить доступность сайта
curl -I https://supermock.ru

# Проверить доступность API
curl -I https://api.supermock.ru/api/health
```
