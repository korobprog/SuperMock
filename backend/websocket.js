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
  const io = socketIO(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Настройка Redis адаптера, если доступен
  if (redisAdapter && redis) {
    try {
      // Проверяем, нужно ли использовать Redis (по умолчанию - нет)
      const useRedis = process.env.USE_REDIS === 'true';

      if (useRedis) {
        // Получаем параметры подключения из переменных окружения или используем значения по умолчанию
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = process.env.REDIS_PORT || 6379;
        const redisPassword = process.env.REDIS_PASSWORD;
        const redisUrl = `redis://${
          redisPassword ? `:${redisPassword}@` : ''
        }${redisHost}:${redisPort}`;

        console.log(
          `Попытка подключения к Redis (${redisHost}:${redisPort})...`
        );

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

  // Middleware для аутентификации WebSocket соединений
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Требуется аутентификация'));
    }

    try {
      // Верифицируем JWT-токен
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.user.id;
      next();
    } catch (error) {
      console.error('Ошибка аутентификации WebSocket:', error.message);
      next(new Error('Недействительный токен'));
    }
  });

  // Обработка подключения клиента
  io.on('connection', (socket) => {
    console.log(
      `WebSocket подключение установлено: ${socket.id}, пользователь: ${socket.userId}`
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

module.exports = {
  initializeWebSocket,
  notifySessionUpdated,
  notifyRoleSelected,
  notifyFeedbackRequired,
  notifyFeedbackUpdated,
};
