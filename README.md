# Super Mock - AI Interview Assistant V.01

Super Mock - это AI-ассистент для подготовки к собеседованиям, интегрированный с Telegram.

## 🚀 Быстрый старт

### 🚀 Деплой на продакшн сервер

Для быстрого обновления проекта на продакшн сервере используйте удобные скрипты:

#### 🎯 Автоматизированные скрипты (рекомендуется)

```bash
# Деплой только лендинга (supermock.ru)
pnpm run deploy:landing

# Полный деплой всего проекта
pnpm run deploy:full

# Управление multi-domain конфигурацией
pnpm run prod:multi:up      # Запуск всех сервисов
pnpm run prod:multi:down    # Остановка всех сервисов
pnpm run prod:multi:ps      # Статус контейнеров
pnpm run prod:multi:logs    # Просмотр логов
pnpm run prod:multi:build   # Пересборка всех образов
```

#### 🔧 Интерактивное меню (legacy)

```bash
./deploy.sh menu
```

#### 🔧 Прямые команды (legacy)

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

📖 Подробная документация: [`scripts/README.md`](scripts/README.md)

#### 📋 Все доступные команды

```bash
# Development
pnpm run dev                    # Запуск dev окружения
pnpm run dev:stop              # Остановка dev окружения
pnpm run dev:backend           # Запуск только backend
pnpm run dev:frontend          # Запуск только frontend

# Production (legacy)
pnpm run prod:up               # Запуск production
pnpm run prod:down             # Остановка production
pnpm run prod:ps               # Статус контейнеров
pnpm run prod:logs             # Просмотр логов
pnpm run prod:build            # Сборка образов

# Multi-Domain Production
pnpm run prod:multi:up         # Запуск multi-domain
pnpm run prod:multi:down       # Остановка multi-domain
pnpm run prod:multi:ps         # Статус контейнеров
pnpm run prod:multi:logs       # Просмотр логов
pnpm run prod:multi:build      # Сборка образов
pnpm run prod:multi:restart    # Перезапуск всех сервисов

# Деплой
pnpm run deploy:landing        # Деплой лендинга
pnpm run deploy:full           # Полный деплой
```

### Production развертывание

#### 🏗️ Multi-Domain конфигурация (рекомендуется)

Проект поддерживает multi-domain архитектуру с автоматическим SSL:

- **supermock.ru** - Лендинг
- **app.supermock.ru** - Основное приложение  
- **api.supermock.ru** - Backend API

```bash
# 1. Настройте переменные окружения
cp production.env .env
# Отредактируйте .env файл

# 2. Запустите multi-domain конфигурацию
pnpm run prod:multi:up

# 3. Проверьте статус
pnpm run prod:multi:ps
```

#### Вариант 1: С SSL (legacy)

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

## 💰 Оценка стоимости проекта

### 📊 **Общая оценка: $15,000 - $25,000**

SuperMock - это готовый к продакшену AI-ассистент для подготовки к собеседованиям с интеграцией Telegram и WebRTC видеозвонками.

### 🎯 **Технические характеристики:**

- **55,464 строк кода** (TypeScript/JavaScript)
- **251 файл** с исходным кодом
- **15+ таблиц** в PostgreSQL базе данных
- **Микросервисная архитектура** с Docker контейнеризацией
- **AI-интеграция** (OpenAI, Google AI)
- **Telegram Bot** интеграция
- **WebRTC** для видеозвонков
- **Real-time** функциональность (WebSocket)

### 🏗️ **Архитектура:**

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **База данных:** PostgreSQL с полной схемой
- **Кэширование:** Redis
- **Контейнеризация:** Docker + Docker Compose
- **Reverse Proxy:** Nginx + Traefik
- **SSL/TLS:** Let's Encrypt
- **WebRTC:** TURN/STUN серверы

### 🚀 **Ключевые функции:**

- 🤖 **AI-ассистент** для подготовки к собеседованиям
- 📱 **Telegram Bot** интеграция
- 🎥 **Видеозвонки** через WebRTC
- 👥 **Система матчинга** кандидатов и интервьюеров
- 📚 **Обучающие материалы** с многоязычной поддержкой
- 📈 **AI-анализ** фидбека и рекомендации
- 🔔 **Система уведомлений**
- 📊 **Прогресс трекинг** навыков

### 💡 **Потенциал для увеличения стоимости ($30,000-40,000):**

#### **До продажи:**
1. **Добавить платежную систему** (Stripe/PayPal)
2. **Создать мобильное приложение** (React Native)
3. **Добавить аналитику** (Google Analytics, Mixpanel)
4. **Настроить email-маркетинг** (Mailchimp/SendGrid)
5. **Добавить админ-панель** для управления контентом
6. **Создать API документацию** (Swagger)
7. **Добавить тесты** (unit/integration tests)

#### **Маркетинговые материалы:**
- 📹 **Демо-видео** функциональности
- 📊 **Презентация** возможностей
- 📈 **Бизнес-план** с монетизацией
- 🎯 **Анализ рынка** и конкурентов

### 📊 **Сравнение с рынком:**

- **Простые SaaS проекты:** $5,000-15,000
- **AI-интегрированные проекты:** $15,000-30,000
- **Telegram Bot проекты:** $10,000-25,000
- **Образовательные платформы:** $20,000-50,000

### 🎯 **Рекомендации:**

**Текущая стоимость:** $15,000-25,000
**Максимальная стоимость:** $30,000-40,000 (после улучшений)
**Время на подготовку к продаже:** 2-4 недели

---

## 📝 Лицензия korbprog

MIT License
# Тестовый коммит для проверки GitHub Actions
