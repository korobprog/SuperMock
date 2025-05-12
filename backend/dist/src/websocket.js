"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = initializeWebSocket;
exports.notifySessionUpdated = notifySessionUpdated;
exports.notifyRoleSelected = notifyRoleSelected;
exports.notifyFeedbackRequired = notifyFeedbackRequired;
exports.notifyFeedbackUpdated = notifyFeedbackUpdated;
exports.notifyVideoLinkStatusUpdated = notifyVideoLinkStatusUpdated;
exports.notifyWebRTCEvent = notifyWebRTCEvent;
exports.notifyCalendarUpdated = notifyCalendarUpdated;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./middleware/auth");
const app_1 = require("./config/app");
const webRTCService_1 = require("./services/webRTCService");
// Проверяем наличие пакетов для Redis
let redisAdapter;
let redis;
try {
    redisAdapter = require('@socket.io/redis-adapter');
    redis = require('redis');
    console.log('Redis адаптер для Socket.IO доступен');
}
catch (error) {
    console.log('Redis адаптер не установлен. Используется стандартный адаптер.');
    console.log('Для масштабирования установите: npm install @socket.io/redis-adapter redis');
}
// Хранилище активных соединений
const activeConnections = new Map();
// Инициализация Socket.IO сервера
function initializeWebSocket(server) {
    // Логируем переменные окружения для Redis
    console.log('=== НАСТРОЙКИ REDIS ===');
    console.log('USE_REDIS:', process.env.USE_REDIS);
    console.log('REDIS_HOST:', process.env.REDIS_HOST);
    console.log('REDIS_PORT:', process.env.REDIS_PORT);
    console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***скрыто***' : 'не указан');
    // Добавляем отладочную информацию о портах на хостинге
    console.log('=== ОТЛАДКА ПОРТОВ ХОСТИНГА ===');
    console.log('Текущие настройки Redis:');
    console.log(`- REDIS_HOST: ${process.env.REDIS_HOST}`);
    console.log(`- REDIS_PORT: ${process.env.REDIS_PORT}`);
    console.log('Ожидаемые настройки Redis на хостинге:');
    console.log('- Redis хост: c641b068463c.vps.myjino.ru');
    console.log('- Redis порт: 49327');
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? '*' // В продакшн-режиме разрешаем подключения с любого домена
                : [
                    `http://localhost:${app_1.FRONTEND_PORT}`,
                    `http://127.0.0.1:${app_1.FRONTEND_PORT}`,
                    // Добавляем несколько соседних портов на случай, если основной порт занят
                    `http://localhost:${Number(app_1.FRONTEND_PORT) + 1}`,
                    `http://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 1}`,
                    `http://localhost:${Number(app_1.FRONTEND_PORT) + 2}`,
                    `http://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 2}`,
                    `http://localhost:${Number(app_1.FRONTEND_PORT) + 3}`,
                    `http://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 3}`,
                    `http://localhost:${Number(app_1.FRONTEND_PORT) + 4}`,
                    `http://127.0.0.1:${Number(app_1.FRONTEND_PORT) + 4}`,
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
            // Проверяем, нужно ли использовать Redis (по умолчанию - нет)
            const useRedis = process.env.USE_REDIS === 'true';
            if (useRedis) {
                // Получаем параметры подключения из переменных окружения или используем значения по умолчанию
                const redisHost = process.env.REDIS_HOST || 'localhost';
                const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
                const redisPassword = process.env.REDIS_PASSWORD;
                // Исправленное формирование URL для Redis
                const redisUrl = `redis://${redisPassword ? `default:${redisPassword}@` : ''}${redisHost}:${redisPort}`;
                console.log(`Попытка подключения к Redis (${redisHost}:${redisPort})...`);
                console.log('Redis URL:', redisUrl.replace(redisPassword || '', '***скрыто***'));
                console.log('Redis настройки из переменных окружения:');
                console.log('- REDIS_HOST:', process.env.REDIS_HOST || 'не установлен');
                console.log('- REDIS_PORT:', process.env.REDIS_PORT || 'не установлен');
                console.log('- REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***скрыто***' : 'не установлен');
                console.log('- USE_REDIS:', process.env.USE_REDIS || 'не установлен');
                console.log('- NODE_ENV:', process.env.NODE_ENV || 'не установлен');
                // Создаем клиенты Redis для публикации и подписки (новый API Redis v5+)
                const pubClient = redis.createClient({
                    url: redisUrl,
                    socket: {
                        reconnectStrategy: (retries) => {
                            // Максимум 3 попытки переподключения
                            if (retries > 3) {
                                console.log('Превышено максимальное количество попыток подключения к Redis');
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
                    console.log(`Redis адаптер успешно подключен (${redisHost}:${redisPort})`);
                })
                    .catch((error) => {
                    clearTimeout(connectTimeout);
                    console.log('Ошибка при подключении к Redis, используется стандартный адаптер Socket.IO');
                    console.log('Детали ошибки Redis:', error.message);
                    console.log('Параметры подключения Redis:', {
                        host: redisHost,
                        port: redisPort,
                        password: redisPassword ? '***скрыто***' : 'не указан',
                        url: redisUrl.replace(redisPassword || '', '***скрыто***'),
                    });
                });
                // Обработка ошибок подключения к Redis
                pubClient.on('error', (error) => {
                    // Логируем только первую ошибку для каждого клиента
                    if (!pubClient.hasLoggedError) {
                        console.log('Ошибка Redis pub клиента, используется стандартный адаптер Socket.IO');
                        console.log('Детали ошибки Redis pub клиента:', error.message);
                        console.log('Стек ошибки:', error.stack);
                        console.log('Параметры подключения Redis:');
                        console.log('- REDIS_HOST:', process.env.REDIS_HOST || 'не установлен');
                        console.log('- REDIS_PORT:', process.env.REDIS_PORT || 'не установлен');
                        console.log('- REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***скрыто***' : 'не установлен');
                        console.log('- USE_REDIS:', process.env.USE_REDIS || 'не установлен');
                        console.log('- NODE_ENV:', process.env.NODE_ENV || 'не установлен');
                        console.log('- Используемый redisHost:', redisHost);
                        console.log('- Используемый redisPort:', redisPort);
                        console.log('- Используемый redisUrl:', redisUrl.replace(redisPassword || '', '***скрыто***'));
                        pubClient.hasLoggedError = true;
                    }
                });
                subClient.on('error', (error) => {
                    if (!subClient.hasLoggedError) {
                        console.log('Ошибка Redis sub клиента, используется стандартный адаптер Socket.IO');
                        console.log('Детали ошибки Redis sub клиента:', error.message);
                        console.log('Стек ошибки:', error.stack);
                        console.log('Параметры подключения Redis:');
                        console.log('- REDIS_HOST:', process.env.REDIS_HOST || 'не установлен');
                        console.log('- REDIS_PORT:', process.env.REDIS_PORT || 'не установлен');
                        console.log('- REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***скрыто***' : 'не установлен');
                        console.log('- USE_REDIS:', process.env.USE_REDIS || 'не установлен');
                        console.log('- NODE_ENV:', process.env.NODE_ENV || 'не установлен');
                        console.log('- Используемый redisHost:', redisHost);
                        console.log('- Используемый redisPort:', redisPort);
                        console.log('- Используемый redisUrl:', redisUrl.replace(redisPassword || '', '***скрыто***'));
                        subClient.hasLoggedError = true;
                    }
                });
            }
            else {
                console.log('Redis отключен в настройках (USE_REDIS != true)');
                console.log('Используется стандартный адаптер Socket.IO');
            }
        }
        catch (error) {
            console.error('Ошибка при настройке Redis адаптера:', error);
            console.log('Используется стандартный адаптер Socket.IO');
        }
    }
    // Расширенное логирование для диагностики
    console.log('Инициализация WebSocket сервера с настройками:');
    // Используем безопасный способ логирования без доступа к приватным свойствам
    console.log('- Порт сервера:', server.address() ? server.address().port : 'неизвестно');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'не установлен');
    console.log('- FRONTEND_PORT:', app_1.FRONTEND_PORT);
    console.log('- Домен VPS:', 'c641b068463c.vps.myjino.ru');
    // Middleware для аутентификации WebSocket соединений
    io.use((socket, next) => {
        console.log('=== Новое WebSocket соединение ===');
        console.log('ID соединения:', socket.id);
        console.log('IP клиента:', socket.handshake.address);
        console.log('Источник запроса (origin):', socket.handshake.headers.origin);
        console.log('User-Agent:', socket.handshake.headers['user-agent']);
        const token = socket.handshake.auth.token;
        console.log('Получен токен для аутентификации WebSocket:', token ? `${token.substring(0, 10)}...` : 'отсутствует');
        console.log('Транспорт соединения:', socket.conn.transport.name);
        console.log('Заголовки запроса:', JSON.stringify(socket.handshake.headers, null, 2));
        if (!token) {
            console.error('Ошибка: токен отсутствует');
            next(new Error('Требуется аутентификация'));
            return;
        }
        try {
            // Верифицируем JWT-токен
            const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
            console.log('Токен успешно верифицирован для пользователя:', decoded.user.id);
            socket.userId = decoded.user.id;
            next();
        }
        catch (error) {
            console.error('Ошибка аутентификации WebSocket:', error.message);
            next(new Error('Недействительный токен'));
        }
    });
    // Обработка подключения клиента
    io.on('connection', (socket) => {
        const authSocket = socket;
        console.log(`WebSocket подключение установлено: ${authSocket.id}, пользователь: ${authSocket.userId}`);
        // Сохраняем соединение в хранилище
        activeConnections.set(authSocket.userId, authSocket);
        // Подписываем пользователя на личный канал
        authSocket.join(`user:${authSocket.userId}`);
        // Обработка отключения клиента
        authSocket.on('disconnect', () => {
            console.log(`WebSocket отключен: ${authSocket.id}, пользователь: ${authSocket.userId}`);
            activeConnections.delete(authSocket.userId);
        });
        // Подписка на сессию
        authSocket.on('join-session', (sessionId) => {
            console.log(`Пользователь ${authSocket.userId} подписался на сессию ${sessionId}`);
            authSocket.join(`session:${sessionId}`);
        });
        // Отписка от сессии
        authSocket.on('leave-session', (sessionId) => {
            console.log(`Пользователь ${authSocket.userId} отписался от сессии ${sessionId}`);
            authSocket.leave(`session:${sessionId}`);
        });
        // Подписка на обновления календаря
        authSocket.on('subscribe-calendar', () => {
            console.log(`Пользователь ${authSocket.userId} подписался на обновления календаря`);
            authSocket.join('calendar-subscribers');
        });
        // Отписка от обновлений календаря
        authSocket.on('unsubscribe-calendar', () => {
            console.log(`Пользователь ${authSocket.userId} отписался от обновлений календаря`);
            authSocket.leave('calendar-subscribers');
        });
        // WebRTC: Присоединение к комнате
        authSocket.on('join-room', (roomId) => {
            console.log(`WebRTC: Пользователь ${authSocket.userId} присоединяется к комнате ${roomId}`);
            console.log(`WebRTC: ID сокета: ${authSocket.id}`);
            console.log(`WebRTC: Транспорт: ${authSocket.conn.transport.name}`);
            // Добавляем пользователя в комнату
            const room = (0, webRTCService_1.addParticipant)(roomId, authSocket.userId);
            if (!room) {
                console.log(`WebRTC: Комната ${roomId} не найдена`);
                authSocket.emit('room-error', { message: 'Комната не найдена' });
                return;
            }
            console.log(`WebRTC: Участники комнаты ${roomId}:`, room.participants);
            // Подписываем пользователя на канал комнаты
            authSocket.join(`room:${roomId}`);
            console.log(`WebRTC: Пользователь ${authSocket.userId} подписан на канал room:${roomId}`);
            // Отправляем информацию о комнате
            console.log(`WebRTC: Отправка события room-joined пользователю ${authSocket.userId}`);
            authSocket.emit('room-joined', {
                roomId,
                participants: room.participants,
                userId: authSocket.userId,
            });
            // Уведомляем других участников о новом пользователе
            console.log(`WebRTC: Отправка события user-joined другим участникам комнаты ${roomId}`);
            authSocket.to(`room:${roomId}`).emit('user-joined', {
                roomId,
                userId: authSocket.userId,
            });
        });
        // WebRTC: Выход из комнаты
        authSocket.on('leave-room', (roomId) => {
            console.log(`Пользователь ${authSocket.userId} покидает комнату ${roomId}`);
            // Удаляем пользователя из комнаты
            (0, webRTCService_1.removeParticipant)(roomId, authSocket.userId);
            // Отписываем пользователя от канала комнаты
            authSocket.leave(`room:${roomId}`);
            // Уведомляем других участников об уходе пользователя
            authSocket.to(`room:${roomId}`).emit('user-left', {
                roomId,
                userId: authSocket.userId,
            });
        });
        // WebRTC: Обмен сигналами
        authSocket.on('webrtc-signal', (signal) => {
            console.log(`WebRTC: Получен сигнал от ${authSocket.userId} в комнате ${signal.roomId}`);
            console.log(`WebRTC: Тип сигнала: ${signal.type}`);
            console.log(`WebRTC: Целевой пользователь: ${signal.targetUserId || 'все участники'}`);
            if (signal.sdp) {
                console.log(`WebRTC: Сигнал содержит SDP (${signal.sdp.substring(0, 50)}...)`);
            }
            if (signal.candidate) {
                console.log(`WebRTC: Сигнал содержит ICE candidate`);
            }
            // Проверяем, что пользователь находится в комнате
            const room = (0, webRTCService_1.getRoomInfo)(signal.roomId);
            if (!room) {
                console.log(`WebRTC: Комната ${signal.roomId} не найдена`);
                return;
            }
            if (!room.participants.includes(authSocket.userId)) {
                console.log(`WebRTC: Пользователь ${authSocket.userId} не находится в комнате ${signal.roomId}`);
                console.log(`WebRTC: Участники комнаты: ${room.participants.join(', ')}`);
                return;
            }
            // Если указан конкретный получатель, отправляем сигнал только ему
            if (signal.targetUserId) {
                const targetSocket = activeConnections.get(signal.targetUserId);
                if (targetSocket) {
                    console.log(`WebRTC: Отправка сигнала пользователю ${signal.targetUserId}`);
                    try {
                        targetSocket.emit('webrtc-signal', {
                            ...signal,
                            userId: authSocket.userId,
                        });
                        console.log(`WebRTC: Сигнал успешно отправлен пользователю ${signal.targetUserId}`);
                    }
                    catch (error) {
                        console.error(`WebRTC: Ошибка при отправке сигнала:`, error);
                    }
                }
                else {
                    console.log(`WebRTC: Целевой пользователь ${signal.targetUserId} не найден в активных соединениях`);
                    console.log(`WebRTC: Активные соединения:`, Array.from(activeConnections.keys()));
                }
            }
            else {
                // Иначе отправляем всем участникам комнаты, кроме отправителя
                console.log(`WebRTC: Отправка сигнала всем участникам комнаты ${signal.roomId}`);
                try {
                    authSocket.to(`room:${signal.roomId}`).emit('webrtc-signal', {
                        ...signal,
                        userId: authSocket.userId,
                    });
                    console.log(`WebRTC: Сигнал успешно отправлен всем участникам комнаты ${signal.roomId}`);
                }
                catch (error) {
                    console.error(`WebRTC: Ошибка при отправке сигнала всем участникам:`, error);
                }
            }
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
function notifyFeedbackUpdated(io, sessionId, feedbackId, updates, newFeedback = null) {
    io.to(`session:${sessionId}`).emit('feedback-updated', {
        sessionId,
        feedbackId,
        updates,
        newFeedback,
        timestamp: new Date().toISOString(),
    });
}
// Функция для отправки уведомления об обновлении статуса ссылки на видеозвонок
function notifyVideoLinkStatusUpdated(io, sessionId, videoLink, videoLinkStatus) {
    io.to(`session:${sessionId}`).emit('video-link-updated', {
        sessionId,
        videoLink,
        videoLinkStatus,
        timestamp: new Date().toISOString(),
    });
}
// Функция для отправки уведомления о WebRTC событии
function notifyWebRTCEvent(io, roomId, eventType, data) {
    io.to(`room:${roomId}`).emit(eventType, {
        roomId,
        ...data,
        timestamp: new Date().toISOString(),
    });
}
// Функция для отправки уведомления об обновлении календаря
function notifyCalendarUpdated(io, calendarUpdate) {
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
//# sourceMappingURL=websocket.js.map