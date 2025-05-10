### Задача
Создай конфигурации и скрипты для деплоя приложения тренировочных собеседований. Бэкенд (Node.js, TypeScript, WebSocket) должен быть контейнеризирован в Docker (версия 26) и размещен на сервере. Фронтенд (React, Vite, TypeScript) должен быть задеплоен на Netlify с автоматическим деплоем через GitHub. Реализуй механизм отправки Docker-образа бэкенда с локальной машины на сервер через Docker Hub и настрой переключение между локальной и удаленной базой данных MongoDB с помощью переменных окружения.

### Требования

#### 1. Бэкенд (Node.js, TypeScript)
- **Docker**:
  - Создай `Dockerfile` для бэкенда, включающий:
    - Базовый образ `node:18`.
    - Копирование кода (`backend/`), установку зависимостей (`npm ci`), сборку TypeScript (`tsc`).
    - Запуск сервера (`node dist/server.js`).
  - Создай `docker-compose.yml` для локального и серверного окружения:
    - Сервис `backend`: использует Docker-образ, порт `3000`, переменные окружения (`MONGO_URI`, `JWT_SECRET`).
    - Сервис `mongo` (для локального окружения): образ `mongo:5`, порт `27017`.
- **База данных**:
  - Замени in-memory хранилище (`Map`) на MongoDB.
  - Создай модель `Session` с полями: `{ id: string, interviewerId: string | null, intervieweeId: string | null, observerIds: string[], videoLink: string | null, videoLinkStatus: string, startTime: Date, creatorId: string }`.
  - Используй `mongoose` для подключения к MongoDB.
  - Настрой подключение через переменную `MONGO_URI` (локально: `mongodb://localhost:27017/mock_interviews`, удаленно: например, MongoDB Atlas URL).
  - Создай `.env` файлы:
    - `backend/.env.local`: `MONGO_URI=mongodb://mongo:27017/mock_interviews`, `JWT_SECRET=secret`.
    - `backend/.env.production`: `MONGO_URI=<atlas-url>`, `JWT_SECRET=secret`.
- **Эндпоинты**:
  - Сохрани эндпоинты из предыдущего промта (`POST /api/sessions`, `POST /api/sessions/:id/roles`, `POST /api/sessions/:id/video`, `GET /api/sessions/:id`, `GET /api/calendar`, `GET /api/sessions/:id/webrtc`).
  - Обнови логику для работы с MongoDB вместо `Map`.
- **WebSocket**:
  - Сохрани WebSocket (`ws`) для уведомлений и WebRTC-сигнализации.
  - Убедись, что порт `3000` открыт для WebSocket.
- **CI/CD**:
  - Создай GitHub Actions workflow (`backend/.github/workflows/deploy.yml`):
    - Сборка Docker-образа.
    - Пуш в Docker Hub (`<username>/mock-interviews-backend`).
    - SSH-доступ к серверу, pull образа, запуск с `docker-compose`.
  - Создай скрипт `backend/deploy.sh` для ручной отправки:
    - Сборка: `docker build -t <username>/mock-interviews-backend .`.
    - Пуш: `docker push <username>/mock-interviews-backend`.
    - SSH: копирование `docker-compose.yml` и `.env.production`, pull и запуск (`docker-compose up -d`).

#### 2. Фронтенд (React, Vite, TypeScript)
- **Netlify**:
  - Создай `netlify.toml` для деплоя:
    - Команда сборки: `npm run build`.
    - Папка публикации: `dist`.
    - Переменные окружения: `VITE_BACKEND_URL=https://<server-ip>:3000`.
  - Настрой автоматический деплой через GitHub:
    - Подключить репозиторий фронтенда к Netlify.
    - Указать ветку `main` для деплоя.
- **Конфигурация**:
  - Создай `.env` файлы:
    - `frontend/.env.development`: `VITE_BACKEND_URL=http://localhost:3000`.
    - `frontend/.env.production`: `VITE_BACKEND_URL=https://<server-ip>:3000`.
  - Обнови `vite.config.ts` для поддержки TypeScript и CORS (если нужно).
- **Компоненты**:
  - Сохрани компоненты (`SessionList`, `RoleSelector`, `VideoChat`, `Calendar`) из предыдущего промта.
  - Убедись, что запросы (`fetch`) используют `VITE_BACKEND_URL`.

#### 3. Примерный код

**Бэкенд (`backend/Dockerfile`)**:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Бэкенд (`backend/docker-compose.yml`)**:
```yaml
version: '3.8'
services:
  backend:
    image: <username>/mock-interviews-backend:latest
    ports:
      - '3000:3000'
    environment:
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
  mongo:
    image: mongo:5
    ports:
      - '27017:27017'
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:
```

**Бэкенд (`backend/src/server.ts`)**:
```typescript
import express from 'express';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import { Schema, model } from 'mongoose';

const app = express();
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/mock_interviews');

// Session model
const sessionSchema = new Schema({
  id: String,
  interviewerId: String,
  intervieweeId: String,
  observerIds: [String],
  videoLink: String,
  videoLinkStatus: String,
  startTime: Date,
  creatorId: String,
});
const Session = model('Session', sessionSchema);

// Routes (from previous prompt, updated for MongoDB)
const auth = (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Требуется авторизация' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'test@example.com' && password === 'test') {
    const token = jwt.sign({ userId: 'test-user' }, process.env.JWT_SECRET || 'secret');
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Неверные учетные данные' });
  }
});

app.post('/api/sessions', auth, async (req: any, res) => {
  const session = new Session({
    id: require('uuid').v4(),
    interviewerId: null,
    intervieweeId: null,
    observerIds: [],
    videoLink: null,
    videoLinkStatus: 'pending',
    startTime: new Date(req.body.startTime),
    creatorId: req.user.userId,
  });
  await session.save();
  wss.clients.forEach(client => client.send(JSON.stringify({ event: 'sessionCreated', session })));
  res.json(session);
});

// Other routes (POST /api/sessions/:id/roles, POST /api/sessions/:id/video, etc.) follow similarly, using MongoDB

server.listen(3000, () => console.log('Server running on port 3000'));
```

**Бэкенд (`backend/.github/workflows/deploy.yml`)**:
```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/mock-interviews-backend:latest
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USERNAME }}
          key: ${{ secrets.SSERVER_SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_USERNAME }}/mock-interviews-backend:latest
            cd /path/to/app
            docker-compose down
            docker-compose up -d
```

**Бэкенд (`backend/deploy.sh`)**:
```bash
#!/bin/bash
docker build -t <username>/mock-interviews-backend .
docker push <username>/mock-interviews-backend
scp backend/docker-compose.yml backend/.env.production user@server:/path/to/app/
ssh user@server "cd /path/to/app && docker pull <username>/mock-interviews-backend && docker-compose up -d"
```

**Фронтенд (`frontend/netlify.toml`)**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_BACKEND_URL = "https://<server-ip>:3000"
```

**Фронтенд (`frontend/vite.config.ts`)**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

**Фронтенд (`frontend/.env.development`)**:
```env
VITE_BACKEND_URL=http://localhost:3000
```

**Фронтенд (`frontend/.env.production`)**:
```env
VITE_BACKEND_URL=https://<server-ip>:3000
```

#### 4. Зависимости
- **Бэкенд**: `express`, `ws`, `jsonwebtoken`, `uuid`, `mongoose`.
- **Фронтенд**: `react`, `vite`, `typescript`, `simple-peer`, `tailwindcss`, `postcss`, `autoprefixer`.
- **Установка**:
  - Бэкенд: `npm i express ws jsonwebtoken uuid mongoose`.
  - Фронтенд: `npm i simple-peer tailwindcss postcss autoprefixer`.
  - Docker: Установлен на сервере (версия 26).

#### 5. Инструкции по деплою
- **Бэкенд**:
  1. Создай репозиторий на GitHub для `backend/`.
  2. Настрой секреты в GitHub: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_SSH_KEY`.
  3. Помести `docker-compose.yml` и `.env.production` на сервер в `/path/to/app`.
  4. Для ручного деплоя: выполни `backend/deploy.sh`.
  5. Для автоматического: пуш в `main` запускает GitHub Actions.
- **Фронтенд**:
  1. Создай репозиторий на GitHub для `frontend/`.
  2. Подключи репозиторий к Netlify через UI.
  3. Настрой переменную `VITE_BACKEND_URL` в Netlify (Settings > Environment variables).
  4. Пуш в `main` автоматически деплоит на Netlify.
- **База данных**:
  - Локально: MongoDB через `docker-compose` (сервис `mongo`).
  - Удаленно: Создай кластер в MongoDB Atlas, укажи URL в `.env.production`.

#### 6. Результат
- Бэкенд задеплоен на сервере в Docker, с поддержкой MongoDB (локальной/удаленной).
- Фронтенд задеплоен на Netlify с автоматическим деплоем.
- Docker-образ бэкенда отправляется на сервер через GitHub Actions или `deploy.sh`.
- Переключение базы данных через `MONGO_URI` в `.env` файлах.
- Интерфейс и функционал (WebRTC, ссылки на видео, календарь) работают как в предыдущем промте.

### Пояснение для ИИ
ИИ, этот промт описывает деплой приложения тренировочных собеседований. Создай `Dockerfile`, `docker-compose.yml`, GitHub Actions и скрипты для бэкенда, а также `netlify.toml` и конфигурации для фронтенда. Настрой MongoDB с переключением между локальной и удаленной базой через `.env`. Код должен быть совместим с предыдущим промтом (`768d51a7-7fa5-4d20-96df-1a566d9539ac`), использовать TypeScript и минимальные зависимости. Убедись, что инструкции для деплоя понятны, а CI/CD автоматизирован. Если что-то неясно, следуй структуре и логике из прошлых артефактов.