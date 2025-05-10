import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import passport from 'passport';
import dotenv from 'dotenv';
import { initializeWebSocket } from '../src/websocket';
import { BACKEND_PORT, FRONTEND_PORT } from './config/app';

// Загружаем переменные окружения из файла .env
dotenv.config();

// Добавляем расширенное логирование для отладки
console.log('=== ЗАПУСК СЕРВЕРА ===');
console.log(`Текущий порт: ${process.env.PORT || 9999}`);
console.log(`Текущая директория: ${__dirname}`);
console.log('Переменные окружения:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_PORT: process.env.FRONTEND_PORT,
});
console.log('Импортированные константы:', {
  BACKEND_PORT,
  FRONTEND_PORT,
});

// Импортируем конфигурацию Passport
import './config/passport';

// Импортируем маршруты
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import feedbackRoutes from './routes/feedback';
import calendarRoutes from './routes/calendar';

// Инициализация приложения Express
const app = express();
const server = http.createServer(app);
const PORT = BACKEND_PORT; // Используем порт из конфигурации

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
      // HTTP варианты
      `http://localhost:${FRONTEND_PORT}`,
      `http://127.0.0.1:${FRONTEND_PORT}`,
      // HTTPS варианты
      `https://localhost:${FRONTEND_PORT}`,
      `https://127.0.0.1:${FRONTEND_PORT}`,
      // Добавляем несколько соседних портов на случай, если основной порт занят
      `http://localhost:${Number(FRONTEND_PORT) + 1}`,
      `http://127.0.0.1:${Number(FRONTEND_PORT) + 1}`,
      `https://localhost:${Number(FRONTEND_PORT) + 1}`,
      `https://127.0.0.1:${Number(FRONTEND_PORT) + 1}`,
      `http://localhost:${Number(FRONTEND_PORT) + 2}`,
      `http://127.0.0.1:${Number(FRONTEND_PORT) + 2}`,
      `https://localhost:${Number(FRONTEND_PORT) + 2}`,
      `https://127.0.0.1:${Number(FRONTEND_PORT) + 2}`,
      `http://localhost:${Number(FRONTEND_PORT) + 3}`,
      `http://127.0.0.1:${Number(FRONTEND_PORT) + 3}`,
      `https://localhost:${Number(FRONTEND_PORT) + 3}`,
      `https://127.0.0.1:${Number(FRONTEND_PORT) + 3}`,
      `http://localhost:${Number(FRONTEND_PORT) + 4}`,
      `http://127.0.0.1:${Number(FRONTEND_PORT) + 4}`,
      `https://localhost:${Number(FRONTEND_PORT) + 4}`,
      `https://127.0.0.1:${Number(FRONTEND_PORT) + 4}`,
      // Добавляем порты, на которых может работать фронтенд
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'https://localhost:5174',
      'https://127.0.0.1:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'https://localhost:5175',
      'https://127.0.0.1:5175',
      'http://localhost:5176',
      'http://127.0.0.1:5176',
      'https://localhost:5176',
      'https://127.0.0.1:5176',
      // В режиме разработки разрешаем запросы с любого порта
      'http://localhost:*',
      'http://127.0.0.1:*',
      'https://localhost:*',
      'https://127.0.0.1:*',
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
app.use('/api', authRoutes); // Этот маршрут также обрабатывает корневой URL '/' для Google OAuth
app.use('/api/sessions', sessionRoutes);
app.use('/api', feedbackRoutes);
app.use('/api/calendar', calendarRoutes);

// Обработка ошибок API
app.use(
  '/api',
  (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('API ошибка:', err.stack);
    console.error('Детали запроса:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      protocol: req.protocol,
      secure: req.secure,
      originalUrl: req.originalUrl,
    });
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
  const address = server.address();
  const actualPort =
    typeof address === 'object' && address ? address.port : PORT;

  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Фактический порт сервера: ${actualPort}`);
  console.log(`WebSocket сервер инициализирован на порту ${actualPort}`);

  if (actualPort !== Number(PORT)) {
    console.warn(
      `ВНИМАНИЕ: Фактический порт (${actualPort}) отличается от запрошенного (${PORT})`
    );
  }
});

// Обработчики для корректного завершения процесса
process.on('SIGINT', () => {
  console.log('Получен сигнал SIGINT. Закрытие сервера...');
  server.close(() => {
    console.log('Сервер закрыт.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM. Закрытие сервера...');
  server.close(() => {
    console.log('Сервер закрыт.');
    process.exit(0);
  });
});

// Экспортируем app для тестирования
export default app;
