# Изоляция доменов SuperMock

## 🎯 Проблема

Ранее у нас был конфликт между двумя системами маршрутизации:
- **Traefik** (Docker Compose) - обрабатывал `app.supermock.ru` и `api.supermock.ru`
- **Nginx** (отдельная конфигурация) - также пытался обрабатывать те же домены

Это создавало конфликт, потому что оба сервиса пытались захватить порты 80 и 443.

## ✅ Решение

Создана изолированная архитектура с разделением ответственности:

### Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    Пользователь                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Nginx (порты 80/443)                    │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  supermock.ru   │  │  app.supermock.ru              │  │
│  │  (лендинг)      │  │  api.supermock.ru              │  │
│  │                 │  │  ↓ проксирует на Traefik       │  │
│  │  ┌─────────────┐│  │  (порты 8080/8443)            │  │
│  │  │Frontend     ││  │                                │  │
│  │  │Landing      ││  │                                │  │
│  │  └─────────────┘│  │                                │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Traefik (порты 8080/8443)                 │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  app.supermock.ru│  │  api.supermock.ru              │  │
│  │                 │  │                                 │  │
│  │  ┌─────────────┐│  │  ┌─────────────────────────────┐│  │
│  │  │Frontend App ││  │  │Backend API                  ││  │
│  │  │Container    ││  │  │Container                    ││  │
│  │  └─────────────┘│  │  └─────────────────────────────┘│  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Разделение ответственности

1. **supermock.ru** (основной домен)
   - Обрабатывается **Nginx** напрямую
   - Служит лендингом/маркетинговым сайтом
   - Порт: 80 (HTTP) / 443 (HTTPS)

2. **app.supermock.ru** и **api.supermock.ru** (поддомены)
   - Обрабатываются **Traefik** в Docker
   - Nginx проксирует запросы на Traefik
   - Порты Traefik: 8080 (HTTP) / 8443 (HTTPS)

## 📁 Файлы конфигурации

### Новые файлы

1. **`docker-compose.subdomains.yml`** - Docker Compose только для поддоменов
2. **`nginx/nginx-landing-only.conf`** - Nginx конфигурация только для основного домена
3. **`scripts/deploy-isolated-domains.sh`** - Скрипт деплоя с изолированными доменами
4. **`.github/workflows/deploy-isolated-domains.yml`** - GitHub Actions для деплоя

### Изменения в существующих файлах

- **`docker-compose.prod-multi.yml`** - остается для совместимости, но не используется
- **`nginx/nginx-multi.conf`** - остается для совместимости, но не используется

## 🚀 Деплой

### Автоматический деплой (GitHub Actions)

1. Запушьте изменения в ветку `main`
2. GitHub Actions автоматически запустит workflow `deploy-isolated-domains.yml`
3. Деплой будет выполнен с изолированными доменами

### Ручной деплой

```bash
# Запустите скрипт деплоя
./scripts/deploy-isolated-domains.sh
```

### Локальный тест

```bash
# Запустите только поддомены локально
docker-compose -f docker-compose.subdomains.yml up -d

# Проверьте доступность
curl http://localhost:8080  # Traefik HTTP
curl http://localhost:8443  # Traefik HTTPS
```

## 🔧 Настройка

### Переменные окружения

Убедитесь, что в `production.env` настроены:

```env
# Основные настройки
POSTGRES_PASSWORD=krishna1284
JWT_SECRET=052aa937e3faf8542efe8c091a7ff830
TELEGRAM_BOT_TOKEN=8464088869:AAFcZb7HmYQJa6vaYjfTDCjfr187p9hhk2o
TELEGRAM_BOT_NAME=SuperMock_bot

# Домены
FRONTEND_URL=https://app.supermock.ru
BACKEND_URL=https://api.supermock.ru
CORS_ORIGIN=https://app.supermock.ru
```

### SSL сертификаты

1. **supermock.ru** - сертификат для Nginx
2. **app.supermock.ru** и **api.supermock.ru** - сертификаты для Traefik (автоматически через Let's Encrypt)

## 📊 Мониторинг

### Проверка статуса сервисов

```bash
# Контейнеры Docker
docker ps --filter "name=supermock"

# Nginx
systemctl status nginx

# Логи
docker logs supermock-backend
docker logs supermock-traefik
tail -f /var/log/nginx/error.log
```

### Проверка доступности

```bash
# Основной домен (лендинг)
curl -I https://supermock.ru

# Приложение
curl -I https://app.supermock.ru

# API
curl -I https://api.supermock.ru/api/health
```

## 🐛 Устранение неполадок

### Проблема: Конфликт портов

**Симптомы:** Ошибки "Address already in use" на портах 80/443

**Решение:**
```bash
# Остановите все сервисы
docker-compose -f docker-compose.prod-multi.yml down
systemctl stop nginx

# Освободите порты
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp

# Запустите изолированную конфигурацию
docker-compose -f docker-compose.subdomains.yml up -d
systemctl start nginx
```

### Проблема: Поддомены не работают

**Симптомы:** 502 Bad Gateway для app.supermock.ru и api.supermock.ru

**Решение:**
```bash
# Проверьте, что Traefik запущен
docker ps | grep traefik

# Проверьте логи Traefik
docker logs supermock-traefik

# Проверьте, что Nginx проксирует на правильные порты
curl http://localhost:8080  # Traefik HTTP
curl http://localhost:8443  # Traefik HTTPS
```

### Проблема: SSL сертификаты

**Симптомы:** Ошибки SSL для поддоменов

**Решение:**
```bash
# Проверьте сертификаты Traefik
docker exec supermock-traefik ls -la /letsencrypt/

# Перезапустите Traefik для обновления сертификатов
docker restart supermock-traefik
```

## 🔄 Откат

Если нужно вернуться к старой конфигурации:

```bash
# Остановите изолированную конфигурацию
docker-compose -f docker-compose.subdomains.yml down
systemctl stop nginx

# Запустите старую конфигурацию
docker-compose -f docker-compose.prod-multi.yml up -d
```

## 📈 Преимущества изолированной архитектуры

1. **Нет конфликтов портов** - каждый сервис использует свои порты
2. **Четкое разделение ответственности** - Nginx для лендинга, Traefik для приложения
3. **Лучшая масштабируемость** - можно независимо масштабировать компоненты
4. **Упрощенная отладка** - легче найти источник проблем
5. **Гибкость** - можно легко изменить конфигурацию одного компонента

## 🎯 Результат

После внедрения изолированной архитектуры:

- ✅ **supermock.ru** работает через Nginx (лендинг)
- ✅ **app.supermock.ru** работает через Traefik (приложение)
- ✅ **api.supermock.ru** работает через Traefik (API)
- ✅ Нет конфликтов портов
- ✅ Каждый сервис изолирован и независим
- ✅ Упрощенная диагностика и отладка
