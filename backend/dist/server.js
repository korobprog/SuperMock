"use strict";
/**
 * Основной файл сервера
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const passport_1 = __importDefault(require("passport"));
// Импортируем сервисы
const loggerService_1 = __importDefault(require("./services/loggerService"));
const databaseService_1 = __importDefault(require("./services/databaseService"));
const fileSystemService_1 = __importDefault(require("./services/fileSystemService"));
const frontendService_1 = __importDefault(require("./services/frontendService"));
// Импортируем middleware
const cors_1 = require("./middleware/cors");
const requestLogger_1 = __importDefault(require("./middleware/requestLogger"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const healthCheck_1 = require("./middleware/healthCheck");
// Импортируем конфигурацию и модули
const websocket_1 = require("./websocket");
const config_1 = __importDefault(require("./config"));
require("./config/passport");
// Импортируем маршруты
const auth_1 = __importDefault(require("./routes/auth"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const user_data_check_1 = __importDefault(require("./routes/user-data-check"));
const user_1 = __importDefault(require("./routes/user"));
const history_1 = __importDefault(require("./routes/history"));
const userTools_1 = __importDefault(require("./routes/userTools"));
const materials_1 = __importDefault(require("./routes/materials"));
const profile_1 = __importDefault(require("./routes/profile"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const init_1 = __importDefault(require("./routes/init"));
const slots_1 = __importDefault(require("./routes/slots"));
const preferences_1 = __importDefault(require("./routes/preferences"));
const userSettings_1 = __importDefault(require("./routes/userSettings"));
const telegram_auth_1 = __importDefault(require("./routes/telegram-auth"));
const files_1 = __importDefault(require("./routes/files"));
// Инициализация приложения Express
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = config_1.default.server.port; // Используем порт из конфигурации
// Настройка логирования
loggerService_1.default.info('=== ЗАПУСК СЕРВЕРА ===');
loggerService_1.default.info(`Сервер запускается на порту ${PORT}`);
// Проверка конфигурации
loggerService_1.default.debug('Проверка конфигурации', {
    NODE_ENV: config_1.default.server.env,
    PORT: config_1.default.server.port,
    HOST: config_1.default.server.host,
});
// Проверка файла .env
const envCheck = fileSystemService_1.default.checkEnvFile(__dirname);
if (envCheck.exists) {
    loggerService_1.default.debug('.env файл найден');
}
else {
    loggerService_1.default.warn('.env файл не найден');
}
// Инициализация Socket.IO
const io = (0, websocket_1.initializeWebSocket)(server);
// Делаем io доступным для маршрутов
app.set('io', io);
// Middleware для парсинга JSON и URL-encoded данных
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Инициализация Passport
app.use(passport_1.default.initialize());
// Настройка CORS - используем только один middleware
// app.use(cors(corsOptions)); // Закомментировано для избежания конфликта
app.use(cors_1.setupCors); // Используем только наш кастомный middleware
// Добавляем middleware для логирования запросов
app.use(requestLogger_1.default);
// Проверяем, нужно ли использовать MongoDB
if (config_1.default.mongodb.enabled) {
    loggerService_1.default.info('=== НАСТРОЙКА БАЗЫ ДАННЫХ ===');
    loggerService_1.default.info('Проверка подключения к MongoDB...');
    // Асинхронно проверяем подключение к MongoDB
    databaseService_1.default
        .checkMongoDBConnection()
        .then((result) => {
        if (result.success) {
            loggerService_1.default.info('Успешное подключение к MongoDB');
        }
        else {
            loggerService_1.default.error('Ошибка подключения к MongoDB:', result.message);
            // Если есть проблемы с подключением, проверяем сетевую доступность
            return databaseService_1.default.checkMongoDBNetworkConnectivity();
        }
    })
        .catch((err) => {
        loggerService_1.default.error('Ошибка при проверке MongoDB:', err);
    });
}
else {
    loggerService_1.default.info('=== НАСТРОЙКА БАЗЫ ДАННЫХ ===');
    loggerService_1.default.info('Используется хранилище пользователей в памяти (InMemoryUser)');
    loggerService_1.default.info('Флаг USE_MONGODB не установлен или равен false');
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
app.use('/api/user-data-check', user_data_check_1.default);
app.use('/api/user', user_1.default);
app.use('/api/profile', profile_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/init', init_1.default);
app.use('/api/slots', slots_1.default);
app.use('/api/preferences', preferences_1.default);
app.use('/api/user-settings', userSettings_1.default);
app.use('/api/history', history_1.default);
app.use('/api/user-tools', userTools_1.default);
app.use('/api/materials', materials_1.default);
app.use('/api', telegram_auth_1.default);
// Маршруты для health-check
app.get('/health', healthCheck_1.healthCheck);
app.get('/health/simple', healthCheck_1.simpleHealthCheck);
// Обработка ошибок API
app.use('/api', errorHandler_1.default.apiErrorHandler);
// Маршрут для файлов (должен быть перед настройкой фронтенда)
app.use('/', files_1.default);
// Настройка фронтенда
frontendService_1.default.setupFrontend(app, __dirname);
// Обработка общих ошибок
app.use(errorHandler_1.default.generalErrorHandler);
// Запуск сервера
server.listen(PORT, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : PORT;
    loggerService_1.default.info(`Сервер запущен на порту ${actualPort}`);
    loggerService_1.default.info(`WebSocket сервер инициализирован на порту ${actualPort}`);
    if (actualPort !== Number(PORT)) {
        loggerService_1.default.warn(`ВНИМАНИЕ: Фактический порт (${actualPort}) отличается от запрошенного (${PORT})`);
    }
});
// Обработчики для корректного завершения процесса
process.on('SIGINT', () => {
    loggerService_1.default.info('Получен сигнал SIGINT. Закрытие сервера...');
    server.close(() => {
        loggerService_1.default.info('Сервер закрыт.');
        process.exit(0);
    });
});
process.on('SIGTERM', () => {
    loggerService_1.default.info('Получен сигнал SIGTERM. Закрытие сервера...');
    server.close(() => {
        loggerService_1.default.info('Сервер закрыт.');
        process.exit(0);
    });
});
// Экспортируем app для тестирования
exports.default = app;
//# sourceMappingURL=server.js.map