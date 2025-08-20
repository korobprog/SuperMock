const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

// Проверяем наличие пакетов для Redis
let redisAdapter;
let redis;
try {
  redisAdapter = require('@socket.io/redis-adapter');
  redis = require('redis');
  console.log('Redis адаптер для Socket.IO доступен');
} catch (error) {
  console.log('Redis адаптер не установлен. Используется стандартный адаптер.');
  console.log(
    'Для масштабирования установите: npm install @socket.io/redis-adapter redis'
  );
}

// Хранилище активных соединений
const activeConnections = new Map();

// Инициализация Socket.IO сервера
function initializeWebSocket(server) {
  console.log('=== ИНИЦИАЛИЗАЦИЯ WEBSOCKET СЕРВЕРА ===');

  // Определяем разрешенные источники для CORS
  const corsOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost',
  ];

  // Добавляем дополнительные источники для production
  if (process.env.NODE_ENV === 'production') {
    corsOrigins.push('https://supermock.ru');
    corsOrigins.push('https://www.supermock.ru');
    corsOrigins.push('http://supermock.ru');
    corsOrigins.push('http://www.supermock.ru');

    // Добавляем текущий origin из запроса для отладки
    console.log('Добавляем все источники для отладки CORS');
    corsOrigins.push('*');

    // Добавляем домен VPS, если он задан
    const vpsDomain = process.env.VPS_DOMAIN;
    if (vpsDomain) {
      corsOrigins.push(`http://${vpsDomain}`);
      corsOrigins.push(`https://${vpsDomain}`);
      console.log(`Добавлен домен VPS в CORS: ${vpsDomain}`);
    }
  }

  console.log('=== РАСШИРЕННОЕ ЛОГИРОВАНИЕ WEBSOCKET CORS ===');
  console.log('WebSocket CORS настроен для следующих источников:');
  corsOrigins.forEach((origin, index) => {
    console.log(`  ${index + 1}. ${origin}`);
  });
  console.log('Текущее окружение:', process.env.NODE_ENV);
  console.log('Текущий порт сервера:', process.env.PORT || 'не определен');

  // Расширенное логирование для отладки
  console.log('=== РАСШИРЕННАЯ ОТЛАДКА CORS И WEBSOCKET ===');
  console.log('Текущий NODE_ENV:', process.env.NODE_ENV);
  console.log('Текущий порт сервера:', process.env.PORT);
  console.log('Разрешенные CORS источники:', corsOrigins);

  const io = socketIO(server, {
    cors: {
      origin: '*', // Временно разрешаем все источники для отладки
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
  });

  console.log('Socket.IO настроен с параметрами:', {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
  });

  // Настройка Redis адаптера, если доступен
  if (redisAdapter && redis) {
    try {
      // Проверяем, нужно ли использовать Redis (по умолчанию - нет)
      const useRedis = process.env.USE_REDIS === 'true';
      console.log(
        `Использование Redis: ${
          useRedis ? 'включено' : 'отключено'
        } (USE_REDIS=${process.env.USE_REDIS})`
      );

      if (useRedis) {
        // Получаем параметры подключения из переменных окружения или используем значения по умолчанию
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = process.env.REDIS_PORT || 6379;
        const redisPassword = process.env.REDIS_PASSWORD;
        const redisUrl = `redis://${
          redisPassword ? `:${redisPassword}@` : ''
        }${redisHost}:${redisPort}`;

        console.log('=== НАСТРОЙКА REDIS ДЛЯ WEBSOCKET ===');
        console.log(
          `Попытка подключения к Redis (${redisHost}:${redisPort})...`
        );
        console.log(`Redis URL: ${redisUrl.replace(/:[^:]*@/, ':***@')}`);

        // Создаем клиенты Redis для публикации и подписки (новый API Redis v5+)
        const pubClient = redis.createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              // Максимум 3 попытки переподключения
              if (retries > 3) {
                console.log(
                  'Превышено максимальное количество попыток подключения к Redis'
                );
                return false; // прекращаем попытки переподключения
              }
              return Math.min(retries * 100, 3000); // увеличиваем интервал между попытками
            },
          },
        });

        const subClient = pubClient.duplicate();

        // Ограничиваем время ожидания подключения
        const connectTimeout = setTimeout(() => {
          console.log('Превышено время ожидания подключения к Redis');
          console.log('Используется стандартный адаптер Socket.IO');
        }, 5000);

        // Подключаем клиенты Redis
        Promise.all([pubClient.connect(), subClient.connect()])
          .then(() => {
            clearTimeout(connectTimeout);
            // Подключаем Redis адаптер к Socket.IO
            io.adapter(redisAdapter(pubClient, subClient));
            console.log(
              `Redis адаптер успешно подключен (${redisHost}:${redisPort})`
            );
          })
          .catch((error) => {
            clearTimeout(connectTimeout);
            console.log(
              'Ошибка при подключении к Redis, используется стандартный адаптер Socket.IO'
            );
          });

        // Обработка ошибок подключения к Redis
        pubClient.on('error', (error) => {
          // Логируем только первую ошибку для каждого клиента
          if (!pubClient.hasLoggedError) {
            console.log(
              'Ошибка Redis pub клиента, используется стандартный адаптер Socket.IO'
            );
            pubClient.hasLoggedError = true;
          }
        });

        subClient.on('error', (error) => {
          if (!subClient.hasLoggedError) {
            console.log(
              'Ошибка Redis sub клиента, используется стандартный адаптер Socket.IO'
            );
            subClient.hasLoggedError = true;
          }
        });
      } else {
        console.log('Redis отключен в настройках (USE_REDIS != true)');
        console.log('Используется стандартный адаптер Socket.IO');
      }
    } catch (error) {
      console.error('Ошибка при настройке Redis адаптера:', error);
      console.log('Используется стандартный адаптер Socket.IO');
    }
  }

  // Добавляем обработчик для отладки соединений
  io.engine.on('connection', (socket) => {
    console.log('=== НОВОЕ RAW SOCKET.IO СОЕДИНЕНИЕ ===');
    console.log('Socket ID:', socket.id);
    console.log('Транспорт:', socket.transport.name);
    console.log('Заголовки запроса:', socket.request.headers);
    console.log('Origin запроса:', socket.request.headers.origin);
    console.log(
      'Разрешен ли Origin:',
      corsOrigins.includes(socket.request.headers.origin)
    );
    console.log('URL запроса:', socket.request.url);
  });

  // Middleware для аутентификации WebSocket соединений
  io.use((socket, next) => {
    console.log('=== WEBSOCKET АУТЕНТИФИКАЦИЯ ===');
    console.log('Новое WebSocket соединение, проверка аутентификации');
    console.log(
      'Заголовки запроса:',
      JSON.stringify(socket.handshake.headers, null, 2)
    );
    console.log('Origin запроса:', socket.handshake.headers.origin);
    console.log(
      'Разрешен ли Origin:',
      corsOrigins.includes(socket.handshake.headers.origin)
    );

    const token = socket.handshake.auth.token;
    console.log(
      'Токен аутентификации:',
      token ? 'присутствует' : 'отсутствует'
    );

    if (!token) {
      console.log('Ошибка: токен аутентификации отсутствует');
      return next(new Error('Требуется аутентификация'));
    }

    try {
      // Верифицируем JWT-токен
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.user.id;
      console.log(
        `Аутентификация успешна, пользователь ID: ${decoded.user.id}`
      );
      next();
    } catch (error) {
      console.error('Ошибка аутентификации WebSocket:', error.message);
      console.log('Детали ошибки:', error);
      next(new Error('Недействительный токен'));
    }
  });

  // Обработка подключения клиента
  io.on('connection', (socket) => {
    console.log('=== НОВОЕ WEBSOCKET СОЕДИНЕНИЕ ===');
    console.log(
      `WebSocket подключение установлено: ${socket.id}, пользователь: ${socket.userId}`
    );
    console.log(
      `Информация о соединении: IP=${socket.handshake.address}, транспорт=${socket.conn.transport.name}`
    );

    // Сохраняем соединение в хранилище
    activeConnections.set(socket.userId, socket);

    // Подписываем пользователя на личный канал
    socket.join(`user:${socket.userId}`);

    // Обработка отключения клиента
    socket.on('disconnect', () => {
      console.log(
        `WebSocket отключен: ${socket.id}, пользователь: ${socket.userId}`
      );
      activeConnections.delete(socket.userId);
    });

    // Подписка на сессию
    socket.on('join-session', (sessionId) => {
      console.log(
        `Пользователь ${socket.userId} подписался на сессию ${sessionId}`
      );
      socket.join(`session:${sessionId}`);
    });

    // Отписка от сессии
    socket.on('leave-session', (sessionId) => {
      console.log(
        `Пользователь ${socket.userId} отписался от сессии ${sessionId}`
      );
      socket.leave(`session:${sessionId}`);
    });
  });

  // Возвращаем экземпляр Socket.IO для использования в других модулях
  return io;
}

// Функция для отправки уведомления об обновлении сессии
function notifySessionUpdated(io, sessionId, session) {
  io.to(`session:${sessionId}`).emit('session-updated', {
    sessionId,
    session,
  });
}

// Функция для отправки уведомления о выборе роли
function notifyRoleSelected(io, sessionId, userId, role) {
  io.to(`session:${sessionId}`).emit('role-selected', {
    sessionId,
    userId,
    role,
  });
}

// Функция для отправки напоминания о необходимости заполнить форму обратной связи
function notifyFeedbackRequired(io, userId, sessionId) {
  io.to(`user:${userId}`).emit('feedback-required', {
    sessionId,
  });
}

// Функция для отправки уведомления об обновлении обратной связи
function notifyFeedbackUpdated(
  io,
  sessionId,
  feedbackId,
  updates,
  newFeedback = null
) {
  io.to(`session:${sessionId}`).emit('feedback-updated', {
    sessionId,
    feedbackId,
    updates,
    newFeedback,
    timestamp: new Date().toISOString(),
  });
}

// Функция для отправки уведомления об обновлении статуса ссылки на видеозвонок
function notifyVideoLinkStatusUpdated(
  io,
  sessionId,
  videoLink,
  videoLinkStatus
) {
  io.to(`session:${sessionId}`).emit('video-link-updated', {
    sessionId,
    videoLink,
    videoLinkStatus,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  initializeWebSocket,
  notifySessionUpdated,
  notifyRoleSelected,
  notifyFeedbackRequired,
  notifyFeedbackUpdated,
  notifyVideoLinkStatusUpdated,
};
