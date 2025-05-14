import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import {
  redis as redisConfig,
  frontend,
  server,
  websocket,
} from './config/index';
import {
  addParticipant,
  removeParticipant,
  getRoomInfo,
} from './services/webRTCService';

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

// Интерфейс для WebRTC сигналов
interface WebRTCSignal {
  type: string;
  sdp?: string;
  // Определяем структуру ICE кандидата без использования RTCIceCandidate
  candidate?: {
    candidate: string;
    sdpMid?: string;
    sdpMLineIndex?: number;
    usernameFragment?: string;
  };
  roomId: string;
  userId: string;
  targetUserId?: string;
}

// Хранилище активных соединений
const activeConnections = new Map<string, AuthenticatedSocket>();

// Инициализация Socket.IO сервера
function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  // Логируем настройки Redis из централизованной конфигурации
  console.log('=== НАСТРОЙКИ REDIS ===');
  console.log('USE_REDIS:', redisConfig.enabled);
  console.log('REDIS_HOST:', redisConfig.host);
  console.log('REDIS_PORT:', redisConfig.port);
  console.log(
    'REDIS_PASSWORD:',
    redisConfig.password ? '***скрыто***' : 'не указан'
  );

  // Добавляем отладочную информацию о портах на хостинге
  console.log('=== ОТЛАДКА ПОРТОВ ХОСТИНГА ===');
  console.log('Текущие настройки Redis:');
  console.log(`- REDIS_HOST: ${redisConfig.host}`);
  console.log(`- REDIS_PORT: ${redisConfig.port}`);
  console.log('Ожидаемые настройки Redis на хостинге:');
  console.log('- Redis хост: c641b068463c.vps.myjino.ru');
  console.log('- Redis порт: 49327');

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:
        server.env === 'production'
          ? '*' // В продакшн-режиме разрешаем подключения с любого домена
          : [
              `http://localhost:${frontend.port}`,
              `http://127.0.0.1:${frontend.port}`,
              // Добавляем несколько соседних портов на случай, если основной порт занят
              `http://localhost:${Number(frontend.port) + 1}`,
              `http://127.0.0.1:${Number(frontend.port) + 1}`,
              `http://localhost:${Number(frontend.port) + 2}`,
              `http://127.0.0.1:${Number(frontend.port) + 2}`,
              `http://localhost:${Number(frontend.port) + 3}`,
              `http://127.0.0.1:${Number(frontend.port) + 3}`,
              `http://localhost:${Number(frontend.port) + 4}`,
              `http://127.0.0.1:${Number(frontend.port) + 4}`,
              // Добавляем порты, на которых может работать фронтенд
              'http://localhost:5174',
              'http://127.0.0.1:5174',
              'http://localhost:5175',
              'http://127.0.0.1:5175',
              'http://localhost:5176',
              'http://127.0.0.1:5176',
              'http://localhost:5184',
              'http://127.0.0.1:5184',
              // Разрешаем подключения с любого порта в режиме разработки
              'http://localhost:*',
              'http://127.0.0.1:*',
              // Добавляем домен VPS Jino
              'http://c641b068463c.vps.myjino.ru',
              'https://c641b068463c.vps.myjino.ru',
            ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    },
    // Добавляем явные настройки для транспорта
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
  });

  // Настройка Redis адаптера, если доступен
  if (redisAdapter && redis) {
    try {
      // Проверяем, нужно ли использовать Redis из централизованной конфигурации
      if (redisConfig.enabled) {
        // Получаем параметры подключения из централизованной конфигурации
        const redisHost = redisConfig.host;
        const redisPort = redisConfig.port;
        const redisPassword = redisConfig.password;
        // Используем метод getUrl() из конфигурации Redis
        const redisUrl = redisConfig.getUrl();

        console.log(
          `Попытка подключения к Redis (${redisHost}:${redisPort})...`
        );
        console.log(
          'Redis URL:',
          redisUrl.replace(redisPassword || '', '***скрыто***')
        );
        console.log('Redis настройки из централизованной конфигурации:');
        console.log('- REDIS_HOST:', redisHost);
        console.log('- REDIS_PORT:', redisPort);
        console.log(
          '- REDIS_PASSWORD:',
          redisPassword ? '***скрыто***' : 'не установлен'
        );
        console.log('- USE_REDIS:', redisConfig.enabled);
        console.log('- NODE_ENV:', server.env);

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
            console.log('Детали ошибки Redis:', error.message);
            console.log('Параметры подключения Redis:', {
              host: redisHost,
              port: redisPort,
              password: redisPassword ? '***скрыто***' : 'не указан',
              url: redisUrl.replace(redisPassword || '', '***скрыто***'),
            });
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
              console.log('Детали ошибки Redis pub клиента:', error.message);
              console.log('Стек ошибки:', error.stack);
              console.log('Параметры подключения Redis:');
              console.log('- REDIS_HOST:', redisConfig.host);
              console.log('- REDIS_PORT:', redisConfig.port);
              console.log(
                '- REDIS_PASSWORD:',
                redisConfig.password ? '***скрыто***' : 'не установлен'
              );
              console.log('- USE_REDIS:', redisConfig.enabled);
              console.log('- NODE_ENV:', server.env);
              console.log('- Используемый redisHost:', redisHost);
              console.log('- Используемый redisPort:', redisPort);
              console.log(
                '- Используемый redisUrl:',
                redisUrl.replace(redisPassword || '', '***скрыто***')
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
              console.log('Детали ошибки Redis sub клиента:', error.message);
              console.log('Стек ошибки:', error.stack);
              console.log('Параметры подключения Redis:');
              console.log('- REDIS_HOST:', redisConfig.host);
              console.log('- REDIS_PORT:', redisConfig.port);
              console.log(
                '- REDIS_PASSWORD:',
                redisConfig.password ? '***скрыто***' : 'не установлен'
              );
              console.log('- USE_REDIS:', redisConfig.enabled);
              console.log('- NODE_ENV:', server.env);
              console.log('- Используемый redisHost:', redisHost);
              console.log('- Используемый redisPort:', redisPort);
              console.log(
                '- Используемый redisUrl:',
                redisUrl.replace(redisPassword || '', '***скрыто***')
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

  // Расширенное логирование для диагностики
  console.log('Инициализация WebSocket сервера с настройками:');
  // Используем безопасный способ логирования без доступа к приватным свойствам
  console.log(
    '- Порт сервера:',
    httpServer.address() ? (httpServer.address() as any).port : 'неизвестно'
  );
  console.log('- NODE_ENV:', server.env);
  console.log('- FRONTEND_PORT:', frontend.port);
  console.log('- Домен VPS:', 'c641b068463c.vps.myjino.ru');

  // Middleware для аутентификации WebSocket соединений
  io.use((socket: Socket, next): void => {
    console.log('=== Новое WebSocket соединение ===');
    console.log('ID соединения:', socket.id);
    console.log('IP клиента:', socket.handshake.address);
    console.log('Источник запроса (origin):', socket.handshake.headers.origin);
    console.log('User-Agent:', socket.handshake.headers['user-agent']);

    const token = socket.handshake.auth.token;
    console.log(
      'Получен токен для аутентификации WebSocket:',
      token ? `${token.substring(0, 10)}...` : 'отсутствует'
    );
    console.log('Транспорт соединения:', socket.conn.transport.name);
    console.log(
      'Заголовки запроса:',
      JSON.stringify(socket.handshake.headers, null, 2)
    );

    if (!token) {
      console.error('Ошибка: токен отсутствует');
      next(new Error('Требуется аутентификация'));
      return;
    }

    try {
      // Верифицируем JWT-токен
      const decoded = jwt.verify(token, server.jwtSecret) as {
        user: { id: string };
      };
      console.log(
        'Токен успешно верифицирован для пользователя:',
        decoded.user.id
      );
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

    // Подписка на обновления календаря
    authSocket.on('subscribe-calendar', (): void => {
      console.log(
        `Пользователь ${authSocket.userId} подписался на обновления календаря`
      );
      authSocket.join('calendar-subscribers');
    });

    // Отписка от обновлений календаря
    authSocket.on('unsubscribe-calendar', (): void => {
      console.log(
        `Пользователь ${authSocket.userId} отписался от обновлений календаря`
      );
      authSocket.leave('calendar-subscribers');
    });

    // WebRTC: Присоединение к комнате
    authSocket.on('join-room', (roomId: string): void => {
      console.log(
        `WebRTC: Пользователь ${authSocket.userId} присоединяется к комнате ${roomId}`
      );
      console.log(`WebRTC: ID сокета: ${authSocket.id}`);
      console.log(`WebRTC: Транспорт: ${authSocket.conn.transport.name}`);

      // Добавляем пользователя в комнату
      const room = addParticipant(roomId, authSocket.userId);

      if (!room) {
        console.log(`WebRTC: Комната ${roomId} не найдена`);
        authSocket.emit('room-error', { message: 'Комната не найдена' });
        return;
      }

      console.log(`WebRTC: Участники комнаты ${roomId}:`, room.participants);

      // Подписываем пользователя на канал комнаты
      authSocket.join(`room:${roomId}`);
      console.log(
        `WebRTC: Пользователь ${authSocket.userId} подписан на канал room:${roomId}`
      );

      // Отправляем информацию о комнате
      console.log(
        `WebRTC: Отправка события room-joined пользователю ${authSocket.userId}`
      );
      authSocket.emit('room-joined', {
        roomId,
        participants: room.participants,
        userId: authSocket.userId,
      });

      // Уведомляем других участников о новом пользователе
      console.log(
        `WebRTC: Отправка события user-joined другим участникам комнаты ${roomId}`
      );
      authSocket.to(`room:${roomId}`).emit('user-joined', {
        roomId,
        userId: authSocket.userId,
      });
    });

    // WebRTC: Выход из комнаты
    authSocket.on('leave-room', (roomId: string): void => {
      console.log(
        `Пользователь ${authSocket.userId} покидает комнату ${roomId}`
      );

      // Удаляем пользователя из комнаты
      removeParticipant(roomId, authSocket.userId);

      // Отписываем пользователя от канала комнаты
      authSocket.leave(`room:${roomId}`);

      // Уведомляем других участников об уходе пользователя
      authSocket.to(`room:${roomId}`).emit('user-left', {
        roomId,
        userId: authSocket.userId,
      });
    });

    // WebRTC: Обмен сигналами
    authSocket.on('webrtc-signal', (signal: WebRTCSignal): void => {
      console.log(
        `WebRTC: Получен сигнал от ${authSocket.userId} в комнате ${signal.roomId}`
      );
      console.log(`WebRTC: Тип сигнала: ${signal.type}`);
      console.log(
        `WebRTC: Целевой пользователь: ${
          signal.targetUserId || 'все участники'
        }`
      );

      if (signal.sdp) {
        console.log(
          `WebRTC: Сигнал содержит SDP (${signal.sdp.substring(0, 50)}...)`
        );
      }

      if (signal.candidate) {
        console.log(`WebRTC: Сигнал содержит ICE candidate`);
      }

      // Проверяем, что пользователь находится в комнате
      const room = getRoomInfo(signal.roomId);

      if (!room) {
        console.log(`WebRTC: Комната ${signal.roomId} не найдена`);
        return;
      }

      if (!room.participants.includes(authSocket.userId)) {
        console.log(
          `WebRTC: Пользователь ${authSocket.userId} не находится в комнате ${signal.roomId}`
        );
        console.log(
          `WebRTC: Участники комнаты: ${room.participants.join(', ')}`
        );
        return;
      }

      // Если указан конкретный получатель, отправляем сигнал только ему
      if (signal.targetUserId) {
        const targetSocket = activeConnections.get(signal.targetUserId);

        if (targetSocket) {
          console.log(
            `WebRTC: Отправка сигнала пользователю ${signal.targetUserId}`
          );
          try {
            targetSocket.emit('webrtc-signal', {
              ...signal,
              userId: authSocket.userId,
            });
            console.log(
              `WebRTC: Сигнал успешно отправлен пользователю ${signal.targetUserId}`
            );
          } catch (error) {
            console.error(`WebRTC: Ошибка при отправке сигнала:`, error);
          }
        } else {
          console.log(
            `WebRTC: Целевой пользователь ${signal.targetUserId} не найден в активных соединениях`
          );
          console.log(
            `WebRTC: Активные соединения:`,
            Array.from(activeConnections.keys())
          );
        }
      } else {
        // Иначе отправляем всем участникам комнаты, кроме отправителя
        console.log(
          `WebRTC: Отправка сигнала всем участникам комнаты ${signal.roomId}`
        );
        try {
          authSocket.to(`room:${signal.roomId}`).emit('webrtc-signal', {
            ...signal,
            userId: authSocket.userId,
          });
          console.log(
            `WebRTC: Сигнал успешно отправлен всем участникам комнаты ${signal.roomId}`
          );
        } catch (error) {
          console.error(
            `WebRTC: Ошибка при отправке сигнала всем участникам:`,
            error
          );
        }
      }
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

// Функция для отправки уведомления о WebRTC событии
function notifyWebRTCEvent(
  io: SocketIOServer,
  roomId: string,
  eventType: string,
  data: any
): void {
  io.to(`room:${roomId}`).emit(eventType, {
    roomId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Интерфейс для обновлений календаря
interface CalendarUpdate {
  calendarEntryId: string;
  sessionId: string;
  startTime: Date;
  videoLink?: string | null;
  participants?: string[];
  [key: string]: any;
}

// Функция для отправки уведомления об обновлении календаря
function notifyCalendarUpdated(
  io: SocketIOServer,
  calendarUpdate: CalendarUpdate
): void {
  // Отправляем уведомление всем подписчикам календаря
  io.to('calendar-subscribers').emit('calendar-updated', {
    ...calendarUpdate,
    timestamp: new Date().toISOString(),
  });

  // Если указан sessionId, отправляем уведомление всем участникам сессии
  if (calendarUpdate.sessionId) {
    io.to(`session:${calendarUpdate.sessionId}`).emit('calendar-updated', {
      ...calendarUpdate,
      timestamp: new Date().toISOString(),
    });
  }
}

export {
  initializeWebSocket,
  notifySessionUpdated,
  notifyRoleSelected,
  notifyFeedbackRequired,
  notifyFeedbackUpdated,
  notifyVideoLinkStatusUpdated,
  notifyWebRTCEvent,
  notifyCalendarUpdated,
};
