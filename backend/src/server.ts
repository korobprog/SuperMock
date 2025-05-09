import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import passport from 'passport';
import dotenv from 'dotenv';
import { initializeWebSocket } from '../src/websocket';

// Загружаем переменные окружения из файла .env
dotenv.config();

// Импортируем конфигурацию Passport
import './config/passport';

// Импортируем маршруты
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import feedbackRoutes from './routes/feedback';

// Инициализация приложения Express
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 9877; // Изменяем порт на 9877, чтобы не конфликтовать с уже запущенными серверами

// Инициализация Socket.IO
const io = initializeWebSocket(server);

// Делаем io доступным для маршрутов
app.set('io', io);

// Middleware для парсинга JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Инициализация Passport
app.use(passport.initialize());

// Настройка CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:5177',
      'http://127.0.0.1:5177',
    ], // Разрешаем запросы с Vite dev сервера
    credentials: true, // Разрешаем передачу куки и заголовков авторизации
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

// Добавляем middleware для логирования запросов
app.use((req: Request, res: Response, next: NextFunction): void => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Заголовки запроса:', req.headers);
  next();
});

// Используем InMemoryUser вместо MongoDB
console.log('Используется хранилище пользователей в памяти');

// API маршруты
app.get('/api', (req: Request, res: Response): void => {
  res.json({ message: 'Сервер работает' });
});

// Подключаем маршруты
app.use('/api', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', feedbackRoutes);

// Обработка ошибок API
app.use(
  '/api',
  (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('API ошибка:', err.stack);
    res.status(500).json({ message: 'Что-то пошло не так на сервере!' });
  }
);

// Middleware для статических файлов - после API маршрутов
app.use(express.static(path.join(__dirname, '../../react-frontend/dist')));

// Базовый маршрут для всех остальных запросов - отдаем фронтенд
app.get('*', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../../react-frontend/dist/index.html'));
});

// Обработка ошибок
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так на сервере!' });
});

// Запуск сервера
server.listen(PORT, (): void => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`WebSocket сервер инициализирован`);
});

// Экспортируем app для тестирования
export default app;
