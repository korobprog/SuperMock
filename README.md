# Super Mock - AI Interview Assistant

Super Mock - это AI-ассистент для подготовки к собеседованиям, интегрированный с Telegram.

## 🚀 Быстрый старт

### 🚀 Деплой на продакшн сервер

Для быстрого обновления проекта на продакшн сервере используйте удобные скрипты:

#### 🎯 Интерактивное меню (рекомендуется)

```bash
./deploy.sh menu
```

#### 🔧 Прямые команды

```bash
# Обновить только фронтенд
./deploy.sh frontend

# Обновить только бэкенд
./deploy.sh backend

# Обновить фронтенд и бэкенд
./deploy.sh all
```

**Windows:**

```cmd
deploy.bat frontend
deploy.bat backend
deploy.bat all
```

📖 Подробная документация: [`scripts/deploy/README.md`](scripts/deploy/README.md)

### Production развертывание

#### Вариант 1: С SSL (рекомендуется)

```bash
# 1. Настройте переменные окружения
cp production.env .env
# Отредактируйте .env файл

# 2. Создайте директории для SSL
mkdir -p nginx/ssl nginx/www

# 3. Запустите с SSL
docker-compose -f docker-compose.prod.yml --env-file .env up -d
```

#### Вариант 2: Без SSL (для тестирования)

```bash
# 1. Настройте переменные окружения
cp production-simple.env .env
# Отредактируйте .env файл

# 2. Запустите без SSL
docker-compose -f docker-compose.prod-simple.yml --env-file .env up -d
```

### Development развертывание

```bash
# 1. Настройте переменные окружения
cp dev.env.example .env
# Отредактируйте .env файл

# 2. Запустите в dev режиме
docker-compose -f docker-compose.dev.yml --env-file .env up -d
```

## 📋 Обязательные переменные окружения

```bash
# База данных
POSTGRES_PASSWORD=your_secure_password

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
VITE_TELEGRAM_BOT_NAME=your_bot_name

# Безопасность
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret

# URLs (замените на ваши домены)
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80/443)│────│   Frontend      │    │   Backend       │
│   Reverse Proxy │    │   (React/Vite)  │    │   (Node.js API) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                └───────────────────────┘
                                │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   PostgreSQL    │    │   Redis         │
                    │   Database      │    │   Cache         │
                    └─────────────────┘    └─────────────────┘
```

## 📁 Структура проекта

```
Super Mock-telegram/
├── backend/                 # Node.js API сервер
│   ├── prisma/             # Схема базы данных
│   └── server/             # API код
├── frontend/               # React/Vite приложение
│   ├── src/               # Исходный код
│   └── public/            # Статические файлы
├── scripts/               # Скрипты управления
│   └── deploy/            # Скрипты деплоя и синхронизации
├── DOCKS/                 # 📚 Техническая документация
├── nginx/                 # Конфигурация Nginx
├── docker-compose.prod.yml        # Production с SSL
├── docker-compose.prod-simple.yml # Production без SSL
├── docker-compose.dev.yml         # Development
├── production.env                 # Production переменные
├── production-simple.env          # Production переменные (без SSL)
└── README.md
```

## 📚 Документация

Вся техническая документация проекта находится в папке [`DOCKS/`](./DOCKS/):

- **[Настройка dev окружения](./DOCKS/DEV_SETUP.md)** - Инструкции по запуску в режиме разработки
- **[Развертывание](./DOCKS/DEPLOY_README.md)** - Подробные инструкции по деплою
- **[Настройка Telegram бота](./DOCKS/TELEGRAM_BOT_SETUP.md)** - Инструкции по настройке бота
- **[API документация](./DOCKS/api-endpoints.md)** - Документация API endpoints
- **[Система матчинга](./DOCKS/PERSONALIZED_MATCHING_SYSTEM.md)** - Описание системы персонализированного матчинга

Полный список документов см. в [DOCKS/README.md](./DOCKS/README.md).

## 🔧 Управление

### Проверка статуса

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs backend
```

### Обновление

```bash
# Остановка
docker-compose -f docker-compose.prod.yml down

# Пересборка и запуск
docker-compose -f docker-compose.prod.yml up -d --build
```

### Резервное копирование БД

```bash
# Создание бэкапа
docker exec Super Mock-postgres pg_dump -U Super Mock Super Mock > backup.sql

# Восстановление
docker exec -i Super Mock-postgres psql -U Super Mock Super Mock < backup.sql
```

## 🚀 Скрипты деплоя

Все скрипты деплоя находятся в папке `scripts/deploy/`. Подробное описание см. в [scripts/deploy/README.md](scripts/deploy/README.md).

### Основные команды:

```bash
# Деплой на сервер
./scripts/deploy/deploy.sh

# Синхронизация кода
./scripts/deploy/sync-code.sh

# Быстрая синхронизация
./scripts/deploy/quick-sync.sh

# Проверка статуса деплоя
./scripts/deploy/check-deployment.sh

# Перезапуск продакшн сервера
./scripts/deploy/restart-production.sh
```

### Для Windows PowerShell:

```powershell
# Деплой на сервер
.\scripts\deploy\deploy.ps1

# Синхронизация кода
.\scripts\deploy\sync-code.ps1

# Упрощенная синхронизация
.\scripts\deploy\sync-code-simple.ps1
```

## 🔒 Безопасность

- Все сервисы работают в изолированной сети
- SSL/TLS шифрование (в production версии)
- Security headers
- Rate limiting
- CORS настройки
- Пароли и секреты в переменных окружения

## 📊 Мониторинг

- Health checks для всех сервисов
- Логирование
- Метрики на порту 9090

## 🚀 Portainer развертывание

Подробные инструкции по развертыванию в Portainer см. в [PORTAINER_DEPLOYMENT.md](PORTAINER_DEPLOYMENT.md)

## 📝 Лицензия

MIT License
