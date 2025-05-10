const express = require('express');
const path = require('path');
const http = require('http');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const feedbackRoutes = require('./routes/feedback');
const cors = require('cors');
const { initializeWebSocket } = require('./websocket');

// Инициализация приложения Express
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 9876; // Изменяем порт на 9876, чтобы не конфликтовать с уже запущенными серверами

// Инициализация Socket.IO
const io = initializeWebSocket(server);

// Делаем io доступным для маршрутов
app.set('io', io);

// Middleware для парсинга JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка CORS
app.use(
  cors({
    origin: ['https://localhost:5173', 'https://127.0.0.1:5173'], // Разрешаем запросы с Vite dev сервера
    credentials: true, // Разрешаем передачу куки и заголовков авторизации
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

// Добавляем middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Заголовки запроса:', req.headers);
  next();
});

// Используем InMemoryUser вместо MongoDB
console.log('Используется хранилище пользователей в памяти');

// API маршруты
app.get('/api', (req, res) => {
  res.json({ message: 'Сервер работает' });
});

// Маршруты аутентификации
app.use('/api', authRoutes);

// Маршруты сессий
app.use('/api/sessions', sessionRoutes);

// Маршруты обратной связи
app.use('/api', feedbackRoutes);

// Обработка ошибок API
app.use('/api', (err, req, res, next) => {
  console.error('API ошибка:', err.stack);
  res.status(500).json({ message: 'Что-то пошло не так на сервере!' });
});

// Middleware для статических файлов - после API маршрутов
app.use(express.static(path.join(__dirname, '../react-frontend/dist')));

// Базовый маршрут для всех остальных запросов - отдаем фронтенд
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../react-frontend/dist/index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так на сервере!' });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`WebSocket сервер инициализирован`);
});
