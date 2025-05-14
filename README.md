# SuperMock - Приложение для тренировочных собеседований

Это полнофункциональное приложение, состоящее из фронтенда на Next.js и бэкенда на Node.js/Express с TypeScript.

## Структура проекта

Проект имеет модульную архитектуру и состоит из следующих компонентов:

### Фронтенд (Next.js)

- `src/` - исходный код фронтенда
  - `app/` - компоненты приложения Next.js
- `public/` - статические файлы
- `assets/` - графические ресурсы проекта

### Бэкенд (Node.js/Express с TypeScript)

- `backend/src/` - исходный код бэкенда на TypeScript
  - `config/` - конфигурационные файлы
  - `middleware/` - промежуточные обработчики запросов
  - `models/` - модели данных
  - `routes/` - маршруты API
  - `services/` - сервисы бизнес-логики
- `backend/dist/` - скомпилированный JavaScript код для production
- `backend/prisma/` - схема и миграции Prisma ORM
- Подробнее о бэкенде можно узнать в [backend/README.md](backend/README.md)

### Инфраструктура и DevOps

#### Kubernetes (K8s)

- `kubernetes/` - конфигурации для развертывания в Kubernetes
  - `base/` - базовые конфигурации Kubernetes
  - `overlays/` - настройки для разных окружений (dev/prod)
  - `blue-green/` - конфигурации для Blue-Green Deployment

#### Мониторинг

- `monitoring/` - инструменты мониторинга
  - `prometheus/` - конфигурация Prometheus и правила оповещений
  - `grafana/` - конфигурация Grafana и источники данных
  - `promtail-config.yml` - конфигурация для сбора логов

#### Nginx

- `nginx/` - конфигурация веб-сервера Nginx

#### Тестирование производительности

- `performance-tests/` - скрипты и конфигурации для тестирования производительности

#### Управление секретами

- `vault/` - конфигурация HashiCorp Vault для управления секретами

### Скрипты и утилиты

- `backend/scripts/` - скрипты для управления бэкендом
  - `backup/` - скрипты для резервного копирования данных
  - `deploy.sh` - скрипт для развертывания бэкенда
  - Различные утилиты для работы с базами данных и конфигурацией

### Документация

- `docs/` - дополнительная документация
- `backend/DB-README.md` - документация по базе данных
- `backend/PRISMA-DOCKER.md` - инструкции по использованию Prisma с Docker
- `backend/redis-setup.md` - настройка Redis
- `backend/websocket-docs.md` - документация по WebSocket API

## Запуск проекта

### Режим разработки

```bash
# Установка зависимостей
npm run install:all

# Запуск в режиме разработки
npm run dev
```

Это запустит:

- Фронтенд на порту 3001 (по умолчанию)
- Бэкенд на порту 8080 (по умолчанию)

### Production режим

```bash
# Сборка проекта
npm run build

# Запуск в production режиме
npm run start
```

В production режиме:

- Фронтенд запускается через Next.js server
- Бэкенд использует скомпилированную JavaScript версию (`backend/dist/server.js`)

## Технический стек

### Фронтенд

- **Next.js** - React-фреймворк для серверного рендеринга
- **React** - библиотека для построения пользовательских интерфейсов
- **TypeScript** - типизированный JavaScript
- **CSS Modules** - изолированные стили компонентов

### Бэкенд

- **Node.js** - JavaScript-окружение для серверной разработки
- **Express** - веб-фреймворк для Node.js
- **TypeScript** - типизированный JavaScript
- **Socket.IO** - библиотека для WebSocket коммуникации
- **Passport.js** - аутентификация и авторизация
- **Prisma ORM** - ORM для работы с базами данных

### Базы данных

- **MongoDB** - NoSQL база данных для хранения данных пользователей и сессий
- **Redis** - in-memory хранилище для кэширования и управления сессиями

### Инфраструктура и DevOps

- **Docker** - контейнеризация приложения
- **Kubernetes** - оркестрация контейнеров
- **Nginx** - веб-сервер и обратный прокси
- **Prometheus** - мониторинг метрик
- **Grafana** - визуализация метрик
- **HashiCorp Vault** - управление секретами

## Безопасность

Проект включает следующие меры безопасности:

### Аутентификация и авторизация

- Защищенная аутентификация с использованием Passport.js
- Поддержка JWT (JSON Web Tokens)
- Управление сессиями с использованием Redis

### Защита данных

- Шифрование чувствительных данных
- Безопасное хранение секретов с использованием HashiCorp Vault
- Поддержка HTTPS с автоматическим обновлением сертификатов Let's Encrypt

### Защита от атак

- Защита от CSRF (Cross-Site Request Forgery)
- Защита от XSS (Cross-Site Scripting)
- Ограничение частоты запросов (Rate Limiting)
- Валидация входных данных

### Аудит и мониторинг

- Логирование всех действий пользователей
- Мониторинг подозрительной активности
- Оповещения о потенциальных угрозах безопасности

## Конфигурация и окружения

Проект использует различные файлы конфигурации для разных окружений:

- `.env.local` - локальные переменные окружения для фронтенда
- `.env.example` - пример конфигурации переменных окружения
- `.env.example.development` - пример конфигурации для разработки
- `backend/.env` - переменные окружения для бэкенда

### Управление секретами

Проект поддерживает несколько способов управления секретами:

- Стандартные файлы `.env`
- HashiCorp Vault для безопасного хранения секретов в production
- AWS Secrets Manager (через скрипт `backend/scripts/aws-secrets.js`)

## Docker

Проект полностью контейнеризирован и поддерживает различные конфигурации Docker:

### Бэкенд

- `backend/docker-compose.yml` - основная конфигурация Docker Compose
- `backend/docker-compose.dev.yml` - конфигурация для разработки
- `backend/docker-compose.prod.yml` - конфигурация для production
- `backend/docker-compose.db.yml` - конфигурация для баз данных

### Мониторинг

- `monitoring/docker-compose.yml` - конфигурация для системы мониторинга

### Nginx

- `nginx/docker-compose.yml` - конфигурация для веб-сервера Nginx

### Запуск с Docker

```bash
# Запуск бэкенда в режиме разработки
cd backend && docker-compose -f docker-compose.dev.yml up

# Запуск бэкенда в production режиме
cd backend && docker-compose -f docker-compose.prod.yml up

# Запуск только баз данных
cd backend && docker-compose -f docker-compose.db.yml up
```

## Мониторинг и логирование

Проект включает комплексную систему мониторинга и логирования:

### Компоненты мониторинга

- **Prometheus** - сбор метрик
- **Grafana** - визуализация метрик и создание дашбордов
- **Promtail** - сбор и отправка логов

### Запуск системы мониторинга

```bash
# Запуск всей системы мониторинга
cd monitoring && ./start-monitoring.sh
```

### Проверка работоспособности (Health Checks)

Бэкенд предоставляет эндпоинты для проверки работоспособности:

- `/health` - общая проверка работоспособности
- `/health/db` - проверка подключения к базе данных
- `/health/redis` - проверка подключения к Redis

### Тестирование производительности

```bash
# Запуск тестов производительности
cd performance-tests && ./run-performance-tests.sh
```

## Развертывание в Kubernetes

Проект поддерживает развертывание в Kubernetes с использованием Kustomize.

### Стандартное развертывание

```bash
# Развертывание в dev окружении
npm run deploy:k8s:dev

# Развертывание в prod окружении
npm run deploy:k8s:prod

# Откат развертывания
npm run rollback:k8s:dev
npm run rollback:k8s:prod
```

### Blue-Green Deployment

Проект поддерживает стратегию Blue-Green Deployment для обновления приложения с нулевым временем простоя.

```bash
# Развертывание Blue-Green в dev окружении
npm run deploy:blue-green:dev

# Развертывание Blue-Green в prod окружении
npm run deploy:blue-green:prod

# Переключение на blue версию
npm run switch:blue:dev
npm run switch:blue:prod

# Переключение на green версию
npm run switch:green:dev
npm run switch:green:prod

# Постепенное переключение (canary deployment)
npm run switch:canary:dev
npm run switch:canary:prod
```

Подробная документация по Blue-Green Deployment доступна в [kubernetes/blue-green/README.md](kubernetes/blue-green/README.md).

Информация о масштабировании и производительности доступна в [docs/scaling-and-performance.md](docs/scaling-and-performance.md).

## Дополнительная информация

### Документация API

Документация API доступна через Swagger UI по адресу `/api-docs` при запущенном бэкенде.

### Полезные ссылки

- [Документация Next.js](https://nextjs.org/docs)
- [Изучение Next.js](https://nextjs.org/learn)
- [Документация Express](https://expressjs.com/)
- [Документация Prisma](https://www.prisma.io/docs/)
- [Документация Kubernetes](https://kubernetes.io/docs/home/)

## Вклад в проект (Contributing)

Мы приветствуем вклад в развитие проекта! Если вы хотите внести свой вклад, пожалуйста, следуйте этим шагам:

1. Создайте форк репозитория
2. Создайте ветку для вашей функциональности (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте ваши изменения (`git commit -m 'Add some amazing feature'`)
4. Отправьте изменения в ваш форк (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Стандарты кода

- Используйте ESLint для проверки кода
- Следуйте принципам чистой архитектуры
- Пишите тесты для новой функциональности
- Документируйте публичные API и компоненты

### Сообщения о проблемах

Если вы обнаружили проблему или у вас есть предложение по улучшению, пожалуйста, создайте issue в репозитории проекта.

## Лицензия

Этот проект распространяется под лицензией MIT. Подробности можно найти в файле LICENSE.
