"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const dotenv_1 = __importDefault(require("dotenv"));
const websocket_1 = require("./websocket"); // Импорт из локального файла в той же директории
const app_1 = require("./config/app");
// Загружаем переменные окружения из файла .env
dotenv_1.default.config();
// Добавляем расширенное логирование для отладки
console.log('=== ЗАПУСК СЕРВЕРА ===');
console.log(`Текущий порт: ${process.env.PORT || 9999}`);
console.log(`Текущая директория: ${__dirname}`);
console.log('Переменные окружения:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    FRONTEND_PORT: process.env.FRONTEND_PORT,
    USE_MONGODB: process.env.USE_MONGODB,
    MONGO_URI: process.env.MONGO_URI ? '***скрыто***' : 'не определено',
    JWT_SECRET: process.env.JWT_SECRET ? '***скрыто***' : 'не определено',
    DOCKER_USERNAME: process.env.DOCKER_USERNAME,
});
console.log('Импортированные константы:', {
    BACKEND_PORT: app_1.BACKEND_PORT,
    FRONTEND_PORT: app_1.FRONTEND_PORT,
});
// Добавляем расширенное логирование для отладки портов
console.log('=== КОНФИГУРАЦИЯ ПОРТОВ ===');
console.log(`- Порт бэкенда (BACKEND_PORT): ${app_1.BACKEND_PORT}`);
console.log(`- Порт фронтенда (FRONTEND_PORT): ${app_1.FRONTEND_PORT}`);
console.log(`- Порт из переменной окружения (PORT): ${process.env.PORT || 'не определен'}`);
console.log(`- Порт, который будет использоваться: ${process.env.PORT || app_1.BACKEND_PORT}`);
// Добавляем отладочную информацию о портах на хостинге
console.log('=== ОТЛАДКА ПОРТОВ ХОСТИНГА ===');
console.log('Текущие настройки порта бэкенда:');
console.log(`- BACKEND_PORT: ${app_1.BACKEND_PORT}`);
console.log(`- PORT: ${process.env.PORT || 'не определен'}`);
console.log('Ожидаемые настройки на хостинге:');
console.log('- Бэкенд порт: 49226');
// Импортируем конфигурацию Passport
require("./config/passport");
// Импортируем маршруты
const auth_1 = __importDefault(require("./routes/auth"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const calendar_1 = __importDefault(require("./routes/calendar"));
// Инициализация приложения Express
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = app_1.BACKEND_PORT; // Используем порт из конфигурации
// Инициализация Socket.IO
const io = (0, websocket_1.initializeWebSocket)(server);
// Делаем io доступным для маршрутов
app.set('io', io);
// Middleware для парсинга JSON и URL-encoded данных
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Инициализация Passport
app.use(passport_1.default.initialize());
// Настройка CORS
app.use((0, cors_1.default)({
    origin: [
        // HTTP варианты
        `http://localhost:${app_1.FRONTEND_PORT}`,
        `http://127.0.0.1:${app_1.FRONTEND_PORT}`,
        // HTTPS варианты
        `https://localhost:${app_1.FRONTEND_PORT}`,
        `https://127.0.0.1:${app_1.FRONTEND_PORT}`,
        // Добавляем несколько соседних портов на случай, если основной порт занят
        `http://localhost:${Number(app_1.FRONTEND_PORT) + 1}`,
        `http://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 1}`,
        `https://localhost:${Number(app_1.FRONTEND_PORT) + 1}`,
        `https://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 1}`,
        `http://localhost:${Number(app_1.FRONTEND_PORT) + 2}`,
        `http://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 2}`,
        `https://localhost:${Number(app_1.FRONTEND_PORT) + 2}`,
        `https://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 2}`,
        `http://localhost:${Number(app_1.FRONTEND_PORT) + 3}`,
        `http://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 3}`,
        `https://localhost:${Number(app_1.FRONTEND_PORT) + 3}`,
        `https://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 3}`,
        `http://localhost:${Number(app_1.FRONTEND_PORT) + 4}`,
        `http://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 4}`,
        `https://localhost:${Number(app_1.FRONTEND_PORT) + 4}`,
        `https://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 4}`,
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
        // Добавляем домен Netlify
        'https://supermock.netlify.app',
    ], // Разрешаем запросы с Vite dev сервера
    credentials: true, // Разрешаем передачу куки и заголовков авторизации
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
// Добавляем middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Заголовки запроса:', req.headers);
    console.log('Протокол:', req.protocol);
    console.log('Secure:', req.secure);
    console.log('X-Forwarded-Proto:', req.get('X-Forwarded-Proto'));
    console.log('Origin:', req.get('Origin'));
    console.log('Referer:', req.get('Referer'));
    next();
});
// Проверяем, нужно ли использовать MongoDB
if (process.env.USE_MONGODB === 'true') {
    console.log('=== НАСТРОЙКА БАЗЫ ДАННЫХ ===');
    console.log('Флаг USE_MONGODB=true, но в коде используется InMemoryUser');
    console.log('ВНИМАНИЕ: Несоответствие между настройками и кодом!');
    console.log('В docker-compose.yml настроен сервис mongo, но приложение использует InMemoryUser');
    console.log('Рекомендуется либо изменить код для использования MongoDB, либо удалить сервис mongo из docker-compose.yml');
}
else {
    console.log('=== НАСТРОЙКА БАЗЫ ДАННЫХ ===');
    console.log('Используется хранилище пользователей в памяти (InMemoryUser)');
    console.log('Флаг USE_MONGODB не установлен или равен false');
}
// API маршруты
app.get('/api', (req, res) => {
    res.json({ message: 'Сервер работает' });
});
// Подключаем маршруты
app.use('/api', auth_1.default); // Этот маршрут также обрабатывает корневой URL '/' для Google OAuth
app.use('/api/sessions', sessions_1.default);
app.use('/api', feedback_1.default);
app.use('/api/calendar', calendar_1.default);
// Обработка ошибок API
app.use('/api', (err, req, res, next) => {
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
});
// Middleware для статических файлов - после API маршрутов
app.use(express_1.default.static(path_1.default.join(__dirname, '../../react-frontend/dist')));
// Базовый маршрут для всех остальных запросов - отдаем фронтенд
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../react-frontend/dist/index.html'));
});
// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Что-то пошло не так на сервере!' });
});
// Запуск сервера
server.listen(PORT, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : PORT;
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Фактический порт сервера: ${actualPort}`);
    console.log(`WebSocket сервер инициализирован на порту ${actualPort}`);
    // Добавляем информацию о конфигурации CORS
    console.log('=== КОНФИГУРАЦИЯ CORS ===');
    console.log('CORS настроен для следующих источников:');
    // Выводим список источников, которые мы явно указали в настройках CORS
    [
        `http://localhost:${app_1.FRONTEND_PORT}`,
        `http://127.0.0.1:${app_1.FRONTEND_PORT}`,
        `https://localhost:${app_1.FRONTEND_PORT}`,
        `https://127.0.0.1:${app_1.FRONTEND_PORT}`,
        // И другие порты, указанные в настройках
    ].forEach((origin, index) => {
        console.log(`  ${index + 1}. ${origin}`);
    });
    console.log('  ... и другие порты, включая динамически рассчитанные');
    if (actualPort !== Number(PORT)) {
        console.warn(`ВНИМАНИЕ: Фактический порт (${actualPort}) отличается от запрошенного (${PORT})`);
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
exports.default = app;
//# sourceMappingURL=server.js.map