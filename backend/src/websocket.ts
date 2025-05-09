import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth';

// Типы для Redis адаптера
interface RedisAdapter {
  (pubClient: any, subClient: any): any;
}

// Проверяем наличие пакетов для Redis
let redisAdapter: RedisAdapter | undefined;
let redis: any;

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

// Интерфейс для расширения Socket
interface AuthenticatedSocket extends Socket {
  userId: string;
}

// Хранилище активных соединений
const activeConnections = new Map<string, AuthenticatedSocket>();

// Инициализация Socket.IO сервера
function initializeWebSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'http://localhost:5177',
        'http://127.0.0.1:5177',
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
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
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
            reconnectStrategy: (retries: number) => {
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
          .catch((error: Error) => {
            clearTimeout(connectTimeout);
            console.log(
              'Ошибка при подключении к Redis, используется стандартный адаптер Socket.IO'
            );
          });

        // Расширяем интерфейс для клиентов Redis
        interface RedisClientWithError
          extends ReturnType<typeof redis.createClient> {
          hasLoggedError?: boolean;
        }

        // Обработка ошибок подключения к Redis
        (pubClient as RedisClientWithError).on(
          'error',
          (error: Error): void => {
            // Логируем только первую ошибку для каждого клиента
            if (!(pubClient as RedisClientWithError).hasLoggedError) {
              console.log(
                'Ошибка Redis pub клиента, используется стандартный адаптер Socket.IO'
              );
              (pubClient as RedisClientWithError).hasLoggedError = true;
            }
          }
        );

        (subClient as RedisClientWithError).on(
          'error',
          (error: Error): void => {
            if (!(subClient as RedisClientWithError).hasLoggedError) {
              console.log(
                'Ошибка Redis sub клиента, используется стандартный адаптер Socket.IO'
              );
              (subClient as RedisClientWithError).hasLoggedError = true;
            }
          }
        );
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
  io.use((socket: Socket, next): void => {
    const token = socket.handshake.auth.token;

    if (!token) {
      next(new Error('Требуется аутентификация'));
      return;
    }

    try {
      // Верифицируем JWT-токен
      const decoded = jwt.verify(token, JWT_SECRET) as { user: { id: string } };
      (socket as AuthenticatedSocket).userId = decoded.user.id;
      next();
    } catch (error) {
      console.error(
        'Ошибка аутентификации WebSocket:',
        (error as Error).message
      );
      next(new Error('Недействительный токен'));
    }
  });

  // Обработка подключения клиента
  io.on('connection', (socket: Socket): void => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(
      `WebSocket подключение установлено: ${authSocket.id}, пользователь: ${authSocket.userId}`
    );

    // Сохраняем соединение в хранилище
    activeConnections.set(authSocket.userId, authSocket);

    // Подписываем пользователя на личный канал
    authSocket.join(`user:${authSocket.userId}`);

    // Обработка отключения клиента
    authSocket.on('disconnect', (): void => {
      console.log(
        `WebSocket отключен: ${authSocket.id}, пользователь: ${authSocket.userId}`
      );
      activeConnections.delete(authSocket.userId);
    });

    // Подписка на сессию
    authSocket.on('join-session', (sessionId: string): void => {
      console.log(
        `Пользователь ${authSocket.userId} подписался на сессию ${sessionId}`
      );
      authSocket.join(`session:${sessionId}`);
    });

    // Отписка от сессии
    authSocket.on('leave-session', (sessionId: string): void => {
      console.log(
        `Пользователь ${authSocket.userId} отписался от сессии ${sessionId}`
      );
      authSocket.leave(`session:${sessionId}`);
    });
  });

  // Возвращаем экземпляр Socket.IO для использования в других модулях
  return io;
}

// Интерфейс для сессии
interface Session {
  id: string;
  [key: string]: any;
}

// Функция для отправки уведомления об обновлении сессии
function notifySessionUpdated(
  io: SocketIOServer,
  sessionId: string,
  session: Session
): void {
  io.to(`session:${sessionId}`).emit('session-updated', {
    sessionId,
    session,
  });
}

// Функция для отправки уведомления о выборе роли
function notifyRoleSelected(
  io: SocketIOServer,
  sessionId: string,
  userId: string,
  role: string
): void {
  io.to(`session:${sessionId}`).emit('role-selected', {
    sessionId,
    userId,
    role,
  });
}

// Функция для отправки напоминания о необходимости заполнить форму обратной связи
function notifyFeedbackRequired(
  io: SocketIOServer,
  userId: string,
  sessionId: string
): void {
  io.to(`user:${userId}`).emit('feedback-required', {
    sessionId,
  });
}

// Интерфейс для обновлений обратной связи
interface FeedbackUpdates {
  [key: string]: any;
}

// Функция для отправки уведомления об обновлении обратной связи
function notifyFeedbackUpdated(
  io: SocketIOServer,
  sessionId: string,
  feedbackId: string,
  updates: FeedbackUpdates,
  newFeedback: any = null
): void {
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
  io: SocketIOServer,
  sessionId: string,
  videoLink: string,
  videoLinkStatus: string
): void {
  io.to(`session:${sessionId}`).emit('video-link-updated', {
    sessionId,
    videoLink,
    videoLinkStatus,
    timestamp: new Date().toISOString(),
  });
}

export {
  initializeWebSocket,
  notifySessionUpdated,
  notifyRoleSelected,
  notifyFeedbackRequired,
  notifyFeedbackUpdated,
  notifyVideoLinkStatusUpdated,
};
