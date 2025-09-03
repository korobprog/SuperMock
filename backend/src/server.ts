/**
 * Основной файл сервера
 */

import express, { Request, Response } from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import passport from 'passport';

// Импортируем сервисы
import logger from './services/loggerService';
import databaseService from './services/databaseService';
import fileSystemService from './services/fileSystemService';
import frontendService from './services/frontendService';

// Импортируем middleware
import { corsOptions, setupCors } from './middleware/cors';
import requestLogger from './middleware/requestLogger';
import errorHandler from './middleware/errorHandler';
import { healthCheck, simpleHealthCheck } from './middleware/healthCheck';

// Импортируем конфигурацию и модули
import { initializeWebSocket } from './websocket';
import config from './config';
import './config/passport';

// Импортируем маршруты
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import feedbackRoutes from './routes/feedback';
import calendarRoutes from './routes/calendar';
import userDataCheckRoutes from './routes/user-data-check';
import userRoutes from './routes/user';
import historyRoutes from './routes/history';
import userToolsRoutes from './routes/userTools';
import materialsRoutes from './routes/materials';
import profileRoutes from './routes/profile';
import notificationRoutes from './routes/notifications';
import initRoutes from './routes/init';
import slotsRoutes from './routes/slots';
import preferencesRoutes from './routes/preferences';
import userSettingsRoutes from './routes/userSettings';
import telegramAuthRoutes from './routes/telegram-auth';
import telegramOAuthRoutes from './routes/telegram-oauth';
import telegramCallbackRoutes from './routes/telegram-callback';
import filesRoutes from './routes/files';

// Инициализация приложения Express
const app = express();
const server = http.createServer(app);
const PORT = config.server.port; // Используем порт из конфигурации

// Настройка логирования
logger.info('=== ЗАПУСК СЕРВЕРА ===');
logger.info(`Сервер запускается на порту ${PORT}`);

// Проверка конфигурации
logger.debug('Проверка конфигурации', {
  NODE_ENV: config.server.env,
  PORT: config.server.port,
  HOST: config.server.host,
});

// Проверка файла .env
const envCheck = fileSystemService.checkEnvFile(__dirname);
if (envCheck.exists) {
  logger.debug('.env файл найден');
} else {
  logger.warn('.env файл не найден');
}

// Инициализация Socket.IO
const io = initializeWebSocket(server);

// Делаем io доступным для маршрутов
app.set('io', io);

// Middleware для парсинга JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Инициализация Passport
app.use(passport.initialize());

// Настройка CORS - используем только один middleware
// app.use(cors(corsOptions)); // Закомментировано для избежания конфликта
app.use(setupCors); // Используем только наш кастомный middleware

// Добавляем middleware для логирования запросов
app.use(requestLogger);

// Проверяем, нужно ли использовать MongoDB
if (config.mongodb.enabled) {
  logger.info('=== НАСТРОЙКА БАЗЫ ДАННЫХ ===');
  logger.info('Проверка подключения к MongoDB...');

  // Асинхронно проверяем подключение к MongoDB
  databaseService
    .checkMongoDBConnection()
    .then((result) => {
      if (result.success) {
        logger.info('Успешное подключение к MongoDB');
      } else {
        logger.error('Ошибка подключения к MongoDB:', result.message);

        // Если есть проблемы с подключением, проверяем сетевую доступность
        return databaseService.checkMongoDBNetworkConnectivity();
      }
    })
    .catch((err) => {
      logger.error('Ошибка при проверке MongoDB:', err);
    });
} else {
  logger.info('=== НАСТРОЙКА БАЗЫ ДАННЫХ ===');
  logger.info('Используется хранилище пользователей в памяти (InMemoryUser)');
  logger.info('Флаг USE_MONGODB не установлен или равен false');
}

// API маршруты
app.get('/api', (req: Request, res: Response): void => {
  res.json({ message: 'Сервер работает' });
});

// Подключаем маршруты
app.use('/api', authRoutes); // Этот маршрут также обрабатывает корневой URL '/' для Google OAuth
app.use('/api/sessions', sessionRoutes);
app.use('/api', feedbackRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/user-data-check', userDataCheckRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/init', initRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/user-tools', userToolsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api', telegramAuthRoutes);
app.use('/api/auth', telegramOAuthRoutes);
app.use('/', telegramCallbackRoutes); // Подключаем на корневой путь для /auth/callback

// Маршруты для health-check
app.get('/health', healthCheck);
app.get('/health/simple', simpleHealthCheck);

// Обработка ошибок API
app.use('/api', errorHandler.apiErrorHandler);

// Маршрут для файлов (должен быть перед настройкой фронтенда)
app.use('/', filesRoutes);

// Настройка фронтенда
frontendService.setupFrontend(app, __dirname);

// Обработка общих ошибок
app.use(errorHandler.generalErrorHandler);

// Запуск сервера
server.listen(PORT, (): void => {
  const address = server.address();
  const actualPort =
    typeof address === 'object' && address ? address.port : PORT;

  logger.info(`Сервер запущен на порту ${actualPort}`);
  logger.info(`WebSocket сервер инициализирован на порту ${actualPort}`);

  if (actualPort !== Number(PORT)) {
    logger.warn(
      `ВНИМАНИЕ: Фактический порт (${actualPort}) отличается от запрошенного (${PORT})`
    );
  }
});

// Обработчики для корректного завершения процесса
process.on('SIGINT', () => {
  logger.info('Получен сигнал SIGINT. Закрытие сервера...');
  server.close(() => {
    logger.info('Сервер закрыт.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Получен сигнал SIGTERM. Закрытие сервера...');
  server.close(() => {
    logger.info('Сервер закрыт.');
    process.exit(0);
  });
});

// Экспортируем app для тестирования
export default app;
