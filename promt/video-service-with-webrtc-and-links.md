### Задача
Обнови функционал видеоинтеграции для приложения тренировочных собеседований. Вместо Google Meet реализуй поддержку вставки ссылок на видео (YouTube, Vimeo, Zoom и т.д.) пользователями с ролью «Собеседующий», хранение ссылок в календаре (in-memory) и WebRTC-видеочат (до 4 участников, видео/аудио, демонстрация экрана, управление микрофоном/камерой). Используй React (Vite, TypeScript) для фронтенда и Node.js (TypeScript, WebSocket) для бэкенда. Данные хранятся в памяти (без базы данных). Уведомления через WebSocket включают ссылки на видео и возможность присоединиться.

### Требования

#### 1. Бэкенд (Node.js, TypeScript)
- **Хранение данных**:
  - Создай in-memory хранилище (Map) для сеансов: `{ id: string, interviewerId: string | null, intervieweeId: string | null, observerIds: string[], videoLink: string | null, videoLinkStatus: 'active' | 'pending' | 'manual', startTime: Date, creatorId: string }`.
  - Создай in-memory календарь (Map) для встреч: `{ sessionId: string, videoLink: string | null, startTime: Date, participants: string[] }`.
- **Аутентификация**:
  - Используй JWT для авторизации (без Google OAuth).
  - Эндпоинт `POST /api/login`: возвращает JWT с `{ userId: string }` для тестового пользователя (например, `email: test@example.com, password: test`).
- **Эндпоинты**:
  - **`POST /api/sessions`**:
    - Создает сеанс: `{ id: uuid, interviewerId: null, intervieweeId: null, observerIds: [], videoLink: null, videoLinkStatus: 'pending', startTime: Date, creatorId: userId }`.
    - Добавляет запись в календарь: `{ sessionId: id, videoLink: null, startTime, participants: [creatorId] }`.
    - Отправляет WebSocket-уведомление: `{ event: 'sessionCreated', session }`.
  - **`POST /api/sessions/:id/roles`**:
    - Принимает `{ role: 'interviewer' | 'interviewee' | 'observer' }`.
    - Для `interviewer`:
      - Проверять, что `interviewerId === null`, иначе вернуть `{ message: 'Роль Собеседующего занята' }` (400).
      - Установить `interviewerId = userId`.
    - Для `interviewee`: аналогично.
    - Для `observer`: добавить `userId` в `observerIds`.
    - Обновить календарь: добавить `userId` в `participants`.
    - Отправить WebSocket-уведомление: `{ event: 'roleSelected', sessionId, role, userId }`.
  - **`POST /api/sessions/:id/video`**:
    - Доступно только для `interviewerId === userId`.
    - Принимает `{ videoLink: string }` (YouTube, Vimeo, Zoom и т.д.).
    - Если `videoLinkStatus === 'active'`, вернуть `{ message: 'Ссылка уже активна', videoLink }`.
    - Установить `videoLink` и `videoLinkStatus = 'manual'`.
    - Обновить календарь: `{ videoLink, startTime, participants }`.
    - Отправить WebSocket-уведомление: `{ event: 'videoLinkUpdated', sessionId, videoLink, startTime }`.
  - **`GET /api/sessions/:id`**:
    - Возвращает сеанс: `{ id, interviewerId, intervieweeId, observerIds, videoLink, videoLinkStatus, startTime }`.
  - **`GET /api/calendar`**:
    - Возвращает список встреч: `[{ sessionId, videoLink, startTime, participants }]`.
- **WebRTC**:
  - Реализуй сигнализацию через WebSocket для WebRTC (до 4 участников).
  - Эндпоинт `GET /api/sessions/:id/webrtc`: возвращает список текущих участников (до 4) для инициализации P2P-соединений.
  - WebSocket-события:
    - `webrtc-offer`: отправляет SDP-offer от одного участника.
    - `webrtc-answer`: отправляет SDP-answer.
    - `webrtc-ice`: отправляет ICE-кандидаты.
- **WebSocket**:
  - Реализуй сервер WebSocket (`ws`) для уведомлений и WebRTC-сигнализации.
  - Аутентификация: проверять JWT при подключении.
  - События: `sessionCreated`, `roleSelected`, `videoLinkUpdated`, `webrtc-offer`, `webrtc-answer`, `webrtc-ice`.

#### 2. Фронтенд (React, Vite, TypeScript)
- **Настройка**:
  - Используй Vite с TypeScript и React.
  - Подключи Tailwind CSS через `npm`.
- **Компоненты**:
  - **`Login`**:
    - Форма логина (`email`, `password`).
    - Отправляет `POST /api/login`, сохраняет JWT в `localStorage`.
  - **`SessionList`**:
    - Отображает сеансы (карточки): дата, статус, роли, `videoLink`, `videoLinkStatus`.
    - Если `videoLinkStatus === 'pending'`:
      - Для не-Собеседующих: «Ссылка будет доступна после выбора Собеседующего».
      - Для Собеседующего: поле ввода `videoLink` и кнопка «Добавить ссылку» (`POST /api/sessions/:id/video`).
    - Если `videoLinkStatus === 'manual'`, показывать кнопку «Присоединиться» (открывает `videoLink`).
    - Для Наблюдателей: метка «Только просмотр».
  - **`RoleSelector`**:
    - Кнопки для выбора роли: «Собеседующий», «Отвечающий», «Наблюдатель».
    - Если `interviewerId !== null`, показывать «Роль Собеседующего занята» (Tailwind: `text-red-500`).
    - Отправляет `POST /api/sessions/:id/roles`.
  - **`VideoChat`**:
    - Реализуй WebRTC-видеочат с `simple-peer` (до 4 участников).
    - Интерфейс: видео участников, кнопки вкл/