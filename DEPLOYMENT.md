# 🚀 Деплой SuperMock с изолированными доменами

## 📋 Обзор

Проект настроен для работы с изолированными поддоменами через Traefik:

- **`landing.supermock.ru`** → Лендинг страница
- **`app.supermock.ru`** → Frontend приложение  
- **`api.supermock.ru`** → Backend API

## 🔧 Архитектура

### Сети Docker
- **`traefik-network`** - общая сеть для всех проектов (external)
- **`app_net`** - изолированная сеть для frontend
- **`api_net`** - изолированная сеть для backend
- **`database_net`** - изолированная сеть для баз данных

### Безопасность
- ✅ Все сервисы изолированы в отдельных сетях
- ✅ PostgreSQL и Redis недоступны извне (только `expose`)
- ✅ Наружу торчит только Traefik (порты 80/443)
- ✅ Traefik видит сервисы только по правилам `Host(...)`

## 🚀 Деплой

### Автоматический деплой (GitHub Actions)
```bash
git push origin main
```

### Ручной деплой
```bash
# 1. Создать общую сеть traefik-network
./scripts/create-traefik-network.sh

# 2. Запустить деплой
./scripts/deploy-isolated-domains.sh
```

## 📁 Структура файлов

```
├── docker-compose.subdomains.yml    # Основная конфигурация
├── landing.html                     # Лендинг страница
├── scripts/
│   ├── create-traefik-network.sh   # Создание общей сети
│   └── deploy-isolated-domains.sh  # Скрипт деплоя
└── .github/workflows/
    └── deploy-isolated-domains.yml  # CI/CD pipeline
```

## 🌐 Доступные сервисы

После деплоя будут доступны:

- **https://landing.supermock.ru** - Лендинг страница
- **https://app.supermock.ru** - Frontend приложение
- **https://api.supermock.ru** - Backend API
- **https://api.supermock.ru/api/health** - Health check

## 🔐 Telegram Auth API

- `POST /api/telegram-auth/send-code` - Отправка кода
- `POST /api/telegram-auth/verify-code` - Проверка кода  
- `GET /api/telegram-auth/me` - Информация о пользователе
- `GET /api/telegram-auth/stats` - Статистика

## 🛠️ Локальная разработка

```bash
# Создать сеть traefik-network
docker network create traefik-network --driver bridge

# Запустить сервисы
docker-compose -f docker-compose.subdomains.yml up -d --build

# Проверить статус
docker ps --filter "name=supermock"
```

## 🔍 Мониторинг

```bash
# Логи Traefik
docker logs supermock-traefik

# Логи Backend
docker logs supermock-backend

# Логи Frontend
docker logs supermock-frontend-app

# Логи Landing
docker logs supermock-landing
```

## 🧹 Очистка

```bash
# Остановить все сервисы
docker-compose -f docker-compose.subdomains.yml down

# Удалить сети (осторожно!)
docker network rm traefik-network
```

## ⚠️ Важные замечания

1. **Сеть `traefik-network`** должна быть создана до запуска сервисов
2. **Все сервисы** работают только через поддомены
3. **Основной домен `supermock.ru`** больше не используется
4. **Nginx** больше не нужен - все работает через Traefik
5. **Порты 80/443** используются только Traefik

## 🎯 Преимущества новой архитектуры

- ✅ **Изоляция сервисов** - каждый в своей сети
- ✅ **Безопасность** - базы данных недоступны извне
- ✅ **Масштабируемость** - легко добавлять новые проекты
- ✅ **Единая точка входа** - все через Traefik
- ✅ **Автоматический SSL** - Let's Encrypt через Traefik
