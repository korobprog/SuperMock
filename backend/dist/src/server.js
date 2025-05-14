'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
const path_1 = __importDefault(require('path'));
const http_1 = __importDefault(require('http'));
const cors_1 = __importDefault(require('cors'));
const passport_1 = __importDefault(require('passport'));
const dotenv_1 = __importDefault(require('dotenv'));
const fs_1 = __importDefault(require('fs')); // Добавляем импорт fs для проверки наличия директории
// Добавляем расширенное логирование для отладки импортов
console.log('=== ОТЛАДКА ИМПОРТОВ ===');
try {
  console.log('Проверка наличия файлов:');
  const files = [
    path_1.default.join(__dirname, './websocket.ts'),
    path_1.default.join(__dirname, './config/app.ts'),
    path_1.default.join(__dirname, './middleware/cors.ts'),
    path_1.default.join(__dirname, './routes/auth.ts'),
    path_1.default.join(__dirname, './routes/sessions.ts'),
    path_1.default.join(__dirname, './routes/feedback.ts'),
    path_1.default.join(__dirname, './routes/calendar.ts'),
  ];
  files.forEach((file) => {
    const exists = fs_1.default.existsSync(file);
    console.log(`Файл ${file}: ${exists ? 'найден' : 'НЕ НАЙДЕН'}`);
  });
} catch (error) {
  console.error('Ошибка при проверке файлов:', error);
}
const websocket_1 = require('./websocket'); // Импорт из локального файла в той же директории
const app_1 = require('./config/app');
const cors_2 = require('./middleware/cors'); // Импортируем наш middleware CORS
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
  VITE_API_URL: process.env.VITE_API_URL,
  VITE_WS_URL: process.env.VITE_WS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  USE_REDIS: process.env.USE_REDIS,
});
// Проверяем наличие файла .env
console.log('=== ПРОВЕРКА ФАЙЛОВ КОНФИГУРАЦИИ ===');
try {
  const envPath = path_1.default.join(__dirname, '../../.env');
  const envExists = fs_1.default.existsSync(envPath);
  console.log(
    `.env файл в корневой директории: ${envExists ? 'найден' : 'не найден'}`
  );
  if (envExists) {
    const envContent = fs_1.default.readFileSync(envPath, 'utf8');
    console.log('Содержимое .env файла (без секретов):');
    const envLines = envContent
      .split('\n')
      .filter((line) => !line.includes('SECRET') && !line.includes('PASSWORD'))
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
    console.log(envLines.join('\n'));
  }
} catch (error) {
  console.error('Ошибка при проверке .env файла:', error);
}
console.log('Импортированные константы:', {
  BACKEND_PORT: app_1.BACKEND_PORT,
  FRONTEND_PORT: app_1.FRONTEND_PORT,
});
// Добавляем расширенное логирование для отладки портов
console.log('=== КОНФИГУРАЦИЯ ПОРТОВ ===');
console.log(`- Порт бэкенда (BACKEND_PORT): ${app_1.BACKEND_PORT}`);
console.log(`- Порт фронтенда (FRONTEND_PORT): ${app_1.FRONTEND_PORT}`);
console.log(
  `- Порт из переменной окружения (PORT): ${process.env.PORT || 'не определен'}`
);
console.log(
  `- Порт, который будет использоваться: ${
    process.env.PORT || app_1.BACKEND_PORT
  }`
);
// Добавляем отладочную информацию о портах на хостинге
console.log('=== ОТЛАДКА ПОРТОВ ХОСТИНГА ===');
console.log('Текущие настройки порта бэкенда:');
console.log(`- BACKEND_PORT: ${app_1.BACKEND_PORT}`);
console.log(`- PORT: ${process.env.PORT || 'не определен'}`);
console.log('Ожидаемые настройки на хостинге:');
console.log('- Бэкенд порт: 49226');
// Импортируем конфигурацию Passport
require('./config/passport');
// Импортируем маршруты
const auth_1 = __importDefault(require('./routes/auth'));
const sessions_1 = __importDefault(require('./routes/sessions'));
const feedback_1 = __importDefault(require('./routes/feedback'));
const calendar_1 = __importDefault(require('./routes/calendar'));
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
app.use(
  (0, cors_1.default)({
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

      // Добавляем новый домен
      'https://supermock.ru',
      // Добавляем IP-адрес сервера с портами
      'http://217.198.6.238:9091',
      'http://217.198.6.238:9092',
      'http://217.198.6.238:8443',
      'https://217.198.6.238:9091',
      'https://217.198.6.238:9092',
      'https://217.198.6.238:8443',
    ], // Разрешаем запросы с Vite dev сервера
    credentials: true, // Разрешаем передачу куки и заголовков авторизации
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);
// Используем наш middleware CORS для дополнительной гибкости
app.use(cors_2.setupCors);
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
  console.log(
    'В docker-compose.yml настроен сервис mongo, но приложение использует InMemoryUser'
  );
  console.log(
    'Рекомендуется либо изменить код для использования MongoDB, либо удалить сервис mongo из docker-compose.yml'
  );
  // Добавляем отладку подключения к MongoDB
  console.log('=== ОТЛАДКА MONGODB ===');
  console.log(
    'URI MongoDB:',
    process.env.MONGO_URI
      ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')
      : 'не определен'
  );
  // Проверка подключения к MongoDB
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGO_URI);
    console.log('Попытка подключения к MongoDB...');
    client
      .connect()
      .then(() => {
        console.log('Успешное подключение к MongoDB');
        client.close();
      })
      .catch((err) => {
        console.error('Ошибка подключения к MongoDB:', err);
      });
  } catch (error) {
    console.error('Ошибка при проверке MongoDB:', error);
  }
} else {
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
  // Добавляем расширенное логирование для отладки ошибок
  console.error('Дополнительная информация об ошибке:', {
    errorName: err.name,
    errorMessage: err.message,
    errorStack: err.stack,
  });
  // Проверяем подключение к MongoDB, если используется
  if (process.env.USE_MONGODB === 'true') {
    console.error('Проверка подключения к MongoDB...');
    console.error(
      'MONGO_URI:',
      process.env.MONGO_URI ? '***скрыто***' : 'не определено'
    );
  }
  // Проверяем подключение к Redis, если используется
  if (process.env.USE_REDIS === 'true') {
    console.error('Проверка подключения к Redis...');
    console.error('REDIS_HOST:', process.env.REDIS_HOST);
    console.error('REDIS_PORT:', process.env.REDIS_PORT);
  }
  res.status(500).json({ message: 'Что-то пошло не так на сервере!' });
});
// Проверяем наличие директории с фронтендом
const frontendDistPath = path_1.default.join(
  __dirname,
  '../../react-frontend/dist'
);
console.log('=== ОТЛАДКА ФРОНТЕНДА ===');
console.log(`Проверка пути к фронтенду: ${frontendDistPath}`);
console.log(`__dirname: ${__dirname}`);
console.log(`Абсолютный путь: ${path_1.default.resolve(frontendDistPath)}`);
// Проверяем наличие директории
const frontendExists = fs_1.default.existsSync(frontendDistPath);
console.log(`Директория с фронтендом существует: ${frontendExists}`);
// Проверяем альтернативные пути
const alternativePaths = [
  path_1.default.join(__dirname, '../react-frontend/dist'),
  path_1.default.join(__dirname, '../../../react-frontend/dist'),
  path_1.default.join(__dirname, '../../dist'),
  path_1.default.join(__dirname, '../dist'),
  '/usr/share/nginx/html',
  '/app/react-frontend/dist',
  '/app/dist',
];
console.log('Проверка альтернативных путей:');
alternativePaths.forEach((path) => {
  const exists = fs_1.default.existsSync(path);
  console.log(`- ${path}: ${exists ? 'существует' : 'не существует'}`);
  if (exists) {
    try {
      const files = fs_1.default.readdirSync(path);
      console.log(
        `  Содержимое (${files.length} файлов): ${files
          .slice(0, 5)
          .join(', ')}${files.length > 5 ? '...' : ''}`
      );
      // Проверяем наличие index.html
      const hasIndexHtml = files.includes('index.html');
      console.log(`  index.html: ${hasIndexHtml ? 'найден' : 'не найден'}`);
    } catch (error) {
      console.log(
        `  Ошибка при чтении директории: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
});
if (frontendExists) {
  console.log(
    'Директория с фронтендом найдена. Настраиваем обслуживание статических файлов.'
  );
  try {
    const files = fs_1.default.readdirSync(frontendDistPath);
    console.log(`Содержимое директории фронтенда (${files.length} файлов):`);
    console.log(
      files.slice(0, 10).join(', ') + (files.length > 10 ? '...' : '')
    );
    // Проверяем наличие index.html
    const hasIndexHtml = files.includes('index.html');
    console.log(`index.html: ${hasIndexHtml ? 'найден' : 'не найден'}`);
    if (hasIndexHtml) {
      // Проверяем содержимое index.html
      const indexHtmlPath = path_1.default.join(frontendDistPath, 'index.html');
      const indexHtmlStats = fs_1.default.statSync(indexHtmlPath);
      console.log(`Размер index.html: ${indexHtmlStats.size} байт`);
    }
  } catch (error) {
    console.log(
      `Ошибка при чтении директории фронтенда: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  // Middleware для статических файлов - после API маршрутов
  app.use(express_1.default.static(frontendDistPath));
  // Базовый маршрут для всех остальных запросов - отдаем фронтенд
  app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(frontendDistPath, 'index.html'));
  });
} else {
  console.log(
    'Директория с фронтендом не найдена. Сервер будет обслуживать только API.'
  );
  console.log('Ожидаемый путь к фронтенду:', frontendDistPath);
  console.log('Фронтенд должен обслуживаться через Netlify или другой сервис.');
  // Проверяем наличие директории react-frontend
  const reactFrontendPath = path_1.default.join(
    __dirname,
    '../../react-frontend'
  );
  const reactFrontendExists = fs_1.default.existsSync(reactFrontendPath);
  console.log(`Директория react-frontend существует: ${reactFrontendExists}`);
  if (reactFrontendExists) {
    try {
      const files = fs_1.default.readdirSync(reactFrontendPath);
      console.log(
        `Содержимое директории react-frontend: ${files
          .slice(0, 10)
          .join(', ')}${files.length > 10 ? '...' : ''}`
      );
    } catch (error) {
      console.log(
        `Ошибка при чтении директории react-frontend: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  // Маршрут для всех остальных запросов, когда фронтенд отсутствует
  app.get('*', (req, res) => {
    res.status(404).json({
      message:
        'Фронтенд не найден на сервере. Используйте API-эндпоинты или перейдите на https://supermock.ru/',
    });
  });
}
// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так на сервере!' });
});
// Запуск сервера
server.listen(PORT, () => {
  const address = server.address();
  const actualPort =
    typeof address === 'object' && address ? address.port : PORT;
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
    'https://supermock.ru',
    // И другие порты, указанные в настройках
  ].forEach((origin, index) => {
    console.log(`  ${index + 1}. ${origin}`);
  });
  console.log('  ... и другие порты, включая динамически рассчитанные');
  console.log(
    'Также используется дополнительный middleware CORS для гибкой настройки'
  );
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
exports.default = app;
//# sourceMappingURL=server.js.map
