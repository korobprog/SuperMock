import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import passport from 'passport';
import dotenv from 'dotenv';
import fs from 'fs'; // Добавляем импорт fs для проверки наличия директории

// Добавляем расширенное логирование для отладки импортов
console.log('=== ОТЛАДКА ИМПОРТОВ ===');
try {
  console.log('Проверка наличия файлов:');
  const files = [
    path.join(__dirname, './websocket.ts'),
    path.join(__dirname, './config/app.ts'),
    path.join(__dirname, './middleware/cors.ts'),
    path.join(__dirname, './routes/auth.ts'),
    path.join(__dirname, './routes/sessions.ts'),
    path.join(__dirname, './routes/feedback.ts'),
    path.join(__dirname, './routes/calendar.ts'),
  ];

  files.forEach((file) => {
    const exists = fs.existsSync(file);
    console.log(`Файл ${file}: ${exists ? 'найден' : 'НЕ НАЙДЕН'}`);
  });
} catch (error) {
  console.error('Ошибка при проверке файлов:', error);
}

import { initializeWebSocket } from './websocket'; // Импорт из локального файла в той же директории
import { BACKEND_PORT, FRONTEND_PORT } from './config/app';
import { setupCors } from './middleware/cors'; // Импортируем наш middleware CORS

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
  const envPath = path.join(__dirname, '../../.env');
  const envExists = fs.existsSync(envPath);
  console.log(
    `.env файл в корневой директории: ${envExists ? 'найден' : 'не найден'}`
  );

  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
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
  BACKEND_PORT,
  FRONTEND_PORT,
});

// Добавляем расширенное логирование для отладки портов
console.log('=== КОНФИГУРАЦИЯ ПОРТОВ ===');
console.log(`- Порт бэкенда (BACKEND_PORT): ${BACKEND_PORT}`);
console.log(`- Порт фронтенда (FRONTEND_PORT): ${FRONTEND_PORT}`);
console.log(
  `- Порт из переменной окружения (PORT): ${process.env.PORT || 'не определен'}`
);
console.log(
  `- Порт, который будет использоваться: ${process.env.PORT || BACKEND_PORT}`
);

// Добавляем отладочную информацию о портах на хостинге
console.log('=== ОТЛАДКА ПОРТОВ ХОСТИНГА ===');
console.log('Текущие настройки порта бэкенда:');
console.log(`- BACKEND_PORT: ${BACKEND_PORT}`);
console.log(`- PORT: ${process.env.PORT || 'не определен'}`);
console.log('Ожидаемые настройки на хостинге:');
console.log('- Бэкенд порт: 49226');

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
      // Добавляем домен Netlify
      'https://supermock.netlify.app',
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
app.use(setupCors);

// Добавляем middleware для логирования запросов
app.use((req: Request, res: Response, next: NextFunction): void => {
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

  // Добавляем расширенную отладку подключения к MongoDB
  console.log('=== РАСШИРЕННАЯ ОТЛАДКА MONGODB ===');
  console.log(
    'URI MongoDB:',
    process.env.MONGO_URI
      ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')
      : 'не определен'
  );
  console.log(
    'Используемая модель данных:',
    'InMemoryUser (несмотря на USE_MONGODB=true)'
  );
  console.log(
    'Это несоответствие может быть причиной ошибки подключения к базе данных'
  );

  // Проверка подключения к MongoDB
  try {
    const { MongoClient } = require('mongodb');
    console.log(
      'MONGO_URI:',
      process.env.MONGO_URI
        ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')
        : 'не определен'
    );
    console.log(
      'Хост MongoDB из URI:',
      process.env.MONGO_URI
        ? new URL(process.env.MONGO_URI.replace('mongodb://', 'http://'))
            .hostname
        : 'не определен'
    );
    console.log(
      'Порт MongoDB из URI:',
      process.env.MONGO_URI
        ? new URL(process.env.MONGO_URI.replace('mongodb://', 'http://')).port
        : 'не определен'
    );

    const client = new MongoClient(process.env.MONGO_URI);
    console.log('Попытка подключения к MongoDB...');
    console.log('Детали подключения:');
    console.log('- USE_MONGODB:', process.env.USE_MONGODB);
    console.log(
      '- MONGO_URI (скрыто):',
      process.env.MONGO_URI ? '***скрыто***' : 'не определен'
    );
    console.log(
      '- Имя хоста MongoDB:',
      process.env.MONGO_URI
        ? new URL(process.env.MONGO_URI.replace('mongodb://', 'http://'))
            .hostname
        : 'не определен'
    );
    console.log(
      '- Порт MongoDB:',
      process.env.MONGO_URI
        ? new URL(process.env.MONGO_URI.replace('mongodb://', 'http://')).port
        : 'не определен'
    );
    console.log(
      '- Имя базы данных:',
      process.env.MONGO_URI
        ? new URL(
            process.env.MONGO_URI.replace('mongodb://', 'http://')
          ).pathname.substring(1)
        : 'не определен'
    );

    client
      .connect()
      .then(() => {
        console.log('Успешное подключение к MongoDB');
        console.log('Проверка доступности базы данных через ping...');
        // Проверяем доступность базы данных
        return client.db().admin().ping();
      })
      .then(() => {
        console.log('MongoDB пинг успешен - база данных отвечает');
        client.close();
      })
      .catch((err: Error) => {
        console.error('Ошибка подключения к MongoDB:', err);
        console.error('Детали ошибки:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });

        // Дополнительная диагностика
        console.error('=== ДОПОЛНИТЕЛЬНАЯ ДИАГНОСТИКА ОШИБКИ MONGODB ===');
        console.error('Проверка сетевой доступности MongoDB...');
        try {
          const { exec } = require('child_process');

          // Проверяем наличие MONGO_URI перед использованием
          if (!process.env.MONGO_URI) {
            console.error('MONGO_URI не определен в переменных окружения');
            return;
          }

          console.log(
            'Используем MONGO_URI для диагностики:',
            process.env.MONGO_URI ? '***скрыто***' : 'не определено'
          );

          const mongoHost = new URL(
            process.env.MONGO_URI.replace('mongodb://', 'http://')
          ).hostname;
          const mongoPort = new URL(
            process.env.MONGO_URI.replace('mongodb://', 'http://')
          ).port;

          exec(
            `ping -c 1 ${mongoHost}`,
            (error: any, stdout: string, stderr: string) => {
              console.error(
                `Результат ping ${mongoHost}:`,
                error ? `Ошибка: ${error.message}` : 'Успешно'
              );
              console.error(stdout);

              // Проверка порта
              exec(
                `nc -zv ${mongoHost} ${mongoPort} 2>&1 || echo "Порт недоступен"`,
                (ncError: any, ncStdout: string, ncStderr: string) => {
                  console.error(
                    `Результат проверки порта ${mongoPort}:`,
                    ncError ? `Ошибка: ${ncError.message}` : 'Успешно'
                  );
                  console.error(ncStdout || ncStderr);
                }
              );
            }
          );
        } catch (diagError) {
          console.error('Ошибка при выполнении диагностики:', diagError);
        }
      });
  } catch (error) {
    console.error('Ошибка при проверке MongoDB:', error);
    if (error instanceof Error) {
      console.error('Детали ошибки:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
  }
} else {
  console.log('=== НАСТРОЙКА БАЗЫ ДАННЫХ ===');
  console.log('Используется хранилище пользователей в памяти (InMemoryUser)');
  console.log('Флаг USE_MONGODB не установлен или равен false');
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

    // Добавляем расширенное логирование для отладки ошибок
    console.error('Дополнительная информация об ошибке:', {
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack,
    });

    // Проверяем подключение к MongoDB, если используется
    if (process.env.USE_MONGODB === 'true') {
      console.error('Проверка подключения к MongoDB при ошибке API...');
      console.error(
        'MONGO_URI:',
        process.env.MONGO_URI
          ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')
          : 'не определено'
      );

      // Добавляем проверку подключения к MongoDB при ошибке
      try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(process.env.MONGO_URI);
        console.error('Попытка подключения к MongoDB при ошибке API...');
        client
          .connect()
          .then(() => {
            console.error('Успешное подключение к MongoDB при ошибке API');
            return client.db().admin().ping();
          })
          .then(() => {
            console.error('MongoDB пинг успешен при ошибке API');
            client.close();
          })
          .catch((mongoErr: Error) => {
            console.error(
              'Ошибка подключения к MongoDB при ошибке API:',
              mongoErr
            );
            console.error('Детали ошибки MongoDB:', {
              name: mongoErr.name,
              message: mongoErr.message,
              stack: mongoErr.stack,
            });
          });
      } catch (mongoCheckError) {
        console.error(
          'Ошибка при проверке MongoDB при ошибке API:',
          mongoCheckError
        );
      }
    }

    // Проверяем подключение к Redis, если используется
    if (process.env.USE_REDIS === 'true') {
      console.error('Проверка подключения к Redis...');
      console.error('REDIS_HOST:', process.env.REDIS_HOST);
      console.error('REDIS_PORT:', process.env.REDIS_PORT);
    }

    // Отправляем более информативный ответ об ошибке
    res.status(500).json({
      message: 'Что-то пошло не так на сервере!',
      error: {
        name: err.name,
        message: err.message,
      },
    });
  }
);

// Проверяем наличие директории с фронтендом
const frontendDistPath = path.join(__dirname, '../../react-frontend/dist');
console.log('=== ОТЛАДКА ФРОНТЕНДА ===');
console.log(`Проверка пути к фронтенду: ${frontendDistPath}`);
console.log(`__dirname: ${__dirname}`);
console.log(`Абсолютный путь: ${path.resolve(frontendDistPath)}`);

// Проверяем наличие директории
const frontendExists = fs.existsSync(frontendDistPath);
console.log(`Директория с фронтендом существует: ${frontendExists}`);

// Проверяем альтернативные пути
const alternativePaths = [
  path.join(__dirname, '../react-frontend/dist'),
  path.join(__dirname, '../../../react-frontend/dist'),
  path.join(__dirname, '../../dist'),
  path.join(__dirname, '../dist'),
  '/usr/share/nginx/html',
  '/app/react-frontend/dist',
  '/app/dist',
];

console.log('Проверка альтернативных путей:');
alternativePaths.forEach((path) => {
  const exists = fs.existsSync(path);
  console.log(`- ${path}: ${exists ? 'существует' : 'не существует'}`);

  if (exists) {
    try {
      const files = fs.readdirSync(path);
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
    const files = fs.readdirSync(frontendDistPath);
    console.log(`Содержимое директории фронтенда (${files.length} файлов):`);
    console.log(
      files.slice(0, 10).join(', ') + (files.length > 10 ? '...' : '')
    );

    // Проверяем наличие index.html
    const hasIndexHtml = files.includes('index.html');
    console.log(`index.html: ${hasIndexHtml ? 'найден' : 'не найден'}`);

    if (hasIndexHtml) {
      // Проверяем содержимое index.html
      const indexHtmlPath = path.join(frontendDistPath, 'index.html');
      const indexHtmlStats = fs.statSync(indexHtmlPath);
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
  app.use(express.static(frontendDistPath));

  // Базовый маршрут для всех остальных запросов - отдаем фронтенд
  app.get('*', (req: Request, res: Response): void => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.log(
    'Директория с фронтендом не найдена. Сервер будет обслуживать только API.'
  );
  console.log('Ожидаемый путь к фронтенду:', frontendDistPath);
  console.log('Фронтенд должен обслуживаться через Netlify или другой сервис.');

  // Проверяем наличие директории react-frontend
  const reactFrontendPath = path.join(__dirname, '../../react-frontend');
  const reactFrontendExists = fs.existsSync(reactFrontendPath);
  console.log(`Директория react-frontend существует: ${reactFrontendExists}`);

  if (reactFrontendExists) {
    try {
      const files = fs.readdirSync(reactFrontendPath);
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
  app.get('*', (req: Request, res: Response): void => {
    res.status(404).json({
      message:
        'Фронтенд не найден на сервере. Используйте API-эндпоинты или перейдите на https://supermock.netlify.app',
    });
  });
}

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

  // Добавляем информацию о конфигурации CORS
  console.log('=== КОНФИГУРАЦИЯ CORS ===');
  console.log('CORS настроен для следующих источников:');
  // Выводим список источников, которые мы явно указали в настройках CORS
  [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `https://localhost:${FRONTEND_PORT}`,
    `https://127.0.0.1:${FRONTEND_PORT}`,
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
export default app;
