# SuperMook

SuperMook - приложение для проведения тренировочных собеседований с возможностью выбора ролей, обратной связи и интеграцией с Видео Чат.

## Описание проекта

SuperMook позволяет пользователям организовывать и участвовать в тренировочных собеседованиях. Пользователи могут выбирать роли (интервьюер, отвечающий, наблюдатель), проводить собеседования через Видео Чат и оставлять структурированную обратную связь.

### Основные возможности

- Регистрация и аутентификация пользователей
- Создание и управление сессиями собеседований
- Выбор ролей в сессиях (интервьюер, отвечающий, наблюдатель)
- Интеграция с Видео Чат для проведения видеозвонков
- Система обратной связи с оценками, комментариями и рекомендациями
- Обновление данных в реальном времени через WebSocket

## Структура проекта

Проект состоит из двух основных частей:

1. **Backend** - серверная часть на Node.js с Express
2. **Frontend** - клиентская часть на React с Vite

## Требования

- Node.js (версия 18.x или выше)
- npm (версия 9.x или выше)

## Установка и запуск

### Клонирование репозитория

```bash
git clone https://github.com/yourusername/SuperMook.git
cd SuperMook
```

### Установка зависимостей

Установка зависимостей для корневого проекта:

```bash
npm install
```

Установка зависимостей для бэкенда:

```bash
cd backend
npm install
cd ..
```

Установка зависимостей для фронтенда:

```bash
cd react-frontend
npm install
cd ..
```

### Запуск в режиме разработки

#### Запуск всего проекта одной командой

```bash
npm run dev
```

Эта команда запустит одновременно и бэкенд, и фронтенд в режиме разработки.

#### Запуск бэкенда отдельно

```bash
cd backend
npm run dev
```

Сервер будет запущен на порту 9876 (http://localhost:9876).

#### Запуск фронтенда отдельно

В отдельном терминале:

```bash
cd react-frontend
npm run dev
```

Фронтенд будет запущен на порту 5173 (http://localhost:5173).

### Сборка для продакшена

#### Сборка всего проекта

```bash
npm run build
```

Эта команда соберет и бэкенд, и фронтенд для продакшена.

#### Сборка фронтенда отдельно

```bash
cd react-frontend
npm run build
```

Собранные файлы будут находиться в директории `react-frontend/dist`.

#### Запуск в продакшен-режиме

```bash
npm start
```

Эта команда запустит и бэкенд, и фронтенд в продакшен-режиме.

Или можно запустить только бэкенд:

```bash
cd backend
npm start
```

Сервер будет обслуживать статические файлы фронтенда и API на порту 9876.

## API

API документация доступна в формате Swagger:

- Локальная разработка: http://localhost:9876/api-docs
- Или в файле [backend/swagger.yaml](backend/swagger.yaml)

## Архитектура

### Бэкенд

- **Express** - веб-фреймворк
- **Socket.IO** - библиотека для работы с WebSocket
- **JWT** - аутентификация на основе токенов
- **In-Memory хранилище** - для хранения данных (пользователи, сессии, обратная связь)

### Фронтенд

- **React** - библиотека для создания пользовательских интерфейсов
- **Vite** - инструмент сборки и разработки
- **Socket.IO Client** - клиент для работы с WebSocket
- **TailwindCSS** - утилитарный CSS-фреймворк для стилизации

## Структура данных

### Пользователи

- Email
- Пароль (хешированный)
- Статус обратной связи
- История ролей

### Сессии

- Ссылка на видеозвонок
- Время начала
- Статус (pending, active, completed)
- Участники (интервьюер, отвечающий, наблюдатели)

### Обратная связь

- Оценки (подготовка, коммуникация, технические навыки, решение проблем, общая оценка)
- Комментарии
- Рекомендации

## WebSocket события

- `session-updated` - обновление информации о сессии
- `role-selected` - выбор роли в сессии
- `feedback-required` - напоминание о необходимости заполнить обратную связь
- `feedback-updated` - обновление обратной связи

## Recent Updates

We have made several significant improvements to the SuperMook application:

1. **TypeScript Migration**: Migrated key components and backend services from JavaScript to TypeScript for improved type safety, better code organization, and enhanced developer experience.

2. **Calendar System**: Implemented a calendar functionality for scheduling and managing interview sessions, allowing users to plan and organize their mock interviews more efficiently.

3. **Authentication Enhancements**: Improved the login system with more robust authentication mechanisms and better security practices.

4. **Session Management**: Enhanced the session management system with more intuitive controls for creating, joining, and monitoring interview sessions.

5. **Role Selection System**: Refined the role selection interface to provide a more seamless experience when choosing between interviewer, interviewee, and observer roles.

6. **Feedback System**: Expanded the feedback functionality with improved data models and routing, allowing for more detailed and structured feedback after mock interviews.

## Последние обновления

Мы внесли несколько значительных улучшений в приложение SuperMook:

1. **Миграция на TypeScript**: Перенесли ключевые компоненты и серверные сервисы с JavaScript на TypeScript для улучшения типобезопасности, лучшей организации кода и повышения удобства разработки.

2. **Система календаря**: Реализовали функциональность календаря для планирования и управления сессиями собеседований, позволяющую пользователям более эффективно организовывать тренировочные интервью.

3. **Улучшения аутентификации**: Усовершенствовали систему входа с более надежными механизмами аутентификации и улучшенными практиками безопасности.

4. **Управление сессиями**: Расширили систему управления сессиями с более интуитивными элементами управления для создания, присоединения и мониторинга сессий собеседований.

5. **Система выбора ролей**: Улучшили интерфейс выбора ролей для обеспечения более удобного опыта при выборе между ролями интервьюера, от

## Дополнительная информация

Подробная документация по фронтенду доступна в [react-frontend/README.md](react-frontend/README.md).
