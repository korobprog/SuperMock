"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const InMemorySession_1 = require("../models/InMemorySession");
const InMemoryUser_1 = require("../models/InMemoryUser");
const InMemoryCalendar_1 = require("../models/InMemoryCalendar");
const websocket_1 = require("../websocket");
const webRTCService_1 = require("../services/webRTCService");
// Заглушка для модели Log
class LogModel {
    constructor(data) {
        this.sessionId = data.sessionId;
        this.userId = data.userId;
        this.action = data.action;
        this.details = data.details;
    }
    async save() {
        console.log('Логирование:', this.action, this.details);
        return this;
    }
    static async create(data) {
        const log = new LogModel(data);
        return log.save();
    }
}
const router = express_1.default.Router();
// Флаг для переключения между InMemory и MongoDB
const USE_MONGODB = process.env.USE_MONGODB === 'true';
// Выбор модели в зависимости от флага
const SessionModel = InMemorySession_1.InMemorySession;
const Log = LogModel;
// Получение списка всех сессий
// GET /api/sessions
router.get('/', auth_1.auth, async (req, res) => {
    try {
        console.log('Получен запрос на /api/sessions');
        console.log('Пользователь:', req.user);
        const sessions = await InMemorySession_1.InMemorySession.find();
        console.log('Найдено сессий:', sessions.length);
        // Устанавливаем заголовок Content-Type явно
        res.setHeader('Content-Type', 'application/json');
        res.json(sessions);
    }
    catch (error) {
        console.error('Ошибка при получении списка сессий:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});
// Создание новой сессии
// POST /api/sessions
router.post('/', auth_1.auth, async (req, res) => {
    try {
        const { videoLink, startTime } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }
        // Проверка времени начала сессии
        const now = new Date();
        const minStartTime = new Date(now);
        minStartTime.setHours(minStartTime.getHours() + 2); // Минимум 2 часа вперед
        let sessionStartTime;
        if (startTime) {
            const requestedStartTime = new Date(startTime);
            // Проверяем, не находится ли запрошенное время в прошлом
            if (requestedStartTime < now) {
                console.warn(`Запрошенное время начала (${requestedStartTime.toISOString()}) находится в прошлом.`);
                res.status(400).json({
                    message: 'Невозможно создать сессию с временем начала в прошлом',
                    suggestedStartTime: minStartTime.toISOString(),
                });
                return;
            }
            // Проверяем, соответствует ли запрошенное время минимальному требованию (2 часа вперед)
            if (requestedStartTime < minStartTime) {
                console.warn(`Запрошенное время начала (${requestedStartTime.toISOString()}) меньше минимально допустимого.`);
                res.status(400).json({
                    message: 'Время начала должно быть как минимум на 2 часа позже текущего времени',
                    suggestedStartTime: minStartTime.toISOString(),
                });
                return;
            }
            sessionStartTime = requestedStartTime;
        }
        else {
            // Если время не указано, используем минимальное допустимое время
            sessionStartTime = minStartTime;
        }
        console.log(`Создание сессии с временем начала: ${sessionStartTime.toISOString()}`);
        // Создаем новую сессию
        const session = new SessionModel({
            videoLink,
            startTime: sessionStartTime,
            status: 'pending',
            creatorId: userId, // Добавляем ID создателя сессии
            videoLinkStatus: videoLink ? 'manual' : 'pending', // Если ссылка предоставлена, устанавливаем статус 'manual', иначе 'pending'
        });
        await session.save();
        // Создаем запись в календаре
        const calendarEntry = new InMemoryCalendar_1.InMemoryCalendarEntry({
            sessionId: session.id,
            videoLink: session.videoLink,
            startTime: sessionStartTime,
            participants: [userId], // Добавляем создателя как участника
        });
        await calendarEntry.save();
        console.log(`Создана запись в календаре для сессии ${session.id}`);
        // Логируем создание сессии
        if (USE_MONGODB) {
            await new Log({
                sessionId: session.id,
                userId,
                action: 'create_session',
                details: { videoLink },
            }).save();
        }
        // Получаем экземпляр Socket.IO из объекта запроса
        const io = req.app.get('io');
        // Отправляем уведомление о создании новой сессии
        (0, websocket_1.notifySessionUpdated)(io, session.id, session);
        res.status(201).json(session);
    }
    catch (error) {
        console.error('Ошибка при создании сессии:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});
// Выбор роли в сессии
// POST /api/sessions/:id/roles
router.post('/:id/roles', auth_1.auth, async (req, res) => {
    try {
        const { role } = req.body;
        const sessionId = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }
        console.log('Выбор роли для сессии:', sessionId);
        console.log('Пользователь ID:', userId);
        console.log('Выбранная роль:', role);
        // Проверяем, что роль указана корректно
        if (!['interviewer', 'interviewee', 'observer'].includes(role)) {
            console.log('Некорректная роль:', role);
            res.status(400).json({
                message: 'Некорректная роль. Допустимые значения: interviewer, interviewee, observer',
            });
            return;
        }
        // Получаем сессию по ID
        const session = await SessionModel.findById(sessionId);
        console.log('Найдена сессия:', session ? 'Да' : 'Нет');
        if (!session) {
            res.status(404).json({ message: 'Сессия не найдена' });
            return;
        }
        // Получаем пользователя
        let user = await InMemoryUser_1.InMemoryUser.findById(userId);
        console.log('Найден пользователь:', user ? 'Да' : 'Нет');
        // Если пользователь не найден, создаем его
        if (!user) {
            console.log('Пользователь не найден в базе данных. Создаем нового пользователя.');
            // Создаем нового пользователя с тем же ID
            user = new InMemoryUser_1.InMemoryUser({
                email: `user_${userId}@example.com`, // Временный email
                password: 'temporary_password', // Временный пароль
            });
            // Устанавливаем ID из токена
            user.id = userId;
            // Сохраняем пользователя
            await user.save();
            console.log('Создан новый пользователь с ID:', userId);
        }
        // Проверяем статус обратной связи пользователя
        if (user.feedbackStatus === 'pending' && role !== 'observer') {
            res.status(403).json({
                message: 'Вы не можете выбрать эту роль, пока не заполните форму обратной связи',
            });
            return;
        }
        // Проверяем ограничения для выбора роли
        try {
            if (role === 'interviewer') {
                // Удалена проверка на вход через Google OAuth
                // Проверяем, был ли пользователь интервьюером в последней сессии
                const lastSession = await SessionModel.findLastSessionAsInterviewer(userId);
                console.log('Последняя сессия как интервьюер:', lastSession);
                if (lastSession) {
                    res.status(400).json({
                        message: 'Вы не можете выбрать роль интервьюера, так как были интервьюером в последней сессии',
                    });
                    return;
                }
            }
        }
        catch (error) {
            console.error('Ошибка при проверке ограничений для выбора роли:', error);
            res.status(500).json({
                message: 'Ошибка при проверке ограничений для выбора роли',
                details: error.message,
            });
            return;
        }
        // Проверяем, не занята ли уже роль
        if (role === 'interviewer' && session.interviewerId) {
            res.status(400).json({ message: 'Роль Собеседующего уже занята' });
            return;
        }
        if (role === 'interviewee' && session.intervieweeId) {
            res.status(400).json({ message: 'Роль Отвечающего уже занята' });
            return;
        }
        // Получаем экземпляр Socket.IO из объекта запроса
        const io = req.app.get('io');
        // Если пользователь выбирает роль интервьюера и видеоссылка отсутствует или в статусе pending,
        // автоматически генерируем ссылку через WebRTC сервис
        if (role === 'interviewer' &&
            (!session.videoLink || session.videoLinkStatus === 'pending')) {
            // Определяем параметры встречи до блока try-catch
            // Убедимся, что ID сессии включен в summary для использования в requestId
            const meetingOptions = {
                summary: `Mock Interview ${session.id}`,
                startTime: session.startTime,
                durationMinutes: 60, // Длительность по умолчанию - 60 минут
            };
            try {
                // Генерируем новую ссылку на WebRTC комнату
                console.log('Создаем новую WebRTC комнату для сессии');
                const videoLink = await (0, webRTCService_1.createMeeting)(meetingOptions);
                // Проверяем валидность новой ссылки
                const validationResult = await (0, webRTCService_1.isValidMeetUrl)(videoLink);
                if (validationResult.isValid) {
                    session.videoLink = videoLink;
                    session.videoLinkStatus = 'active';
                    // Обновляем запись в календаре
                    const calendarEntry = await InMemoryCalendar_1.InMemoryCalendarEntry.findBySessionId(sessionId);
                    if (calendarEntry) {
                        await calendarEntry.updateVideoLink(videoLink);
                        console.log(`Обновлена ссылка на видео в календаре для сессии ${sessionId}`);
                    }
                    else {
                        // Если запись в календаре не найдена, создаем новую
                        const newCalendarEntry = new InMemoryCalendar_1.InMemoryCalendarEntry({
                            sessionId,
                            videoLink,
                            startTime: session.startTime,
                            participants: [userId],
                        });
                        await newCalendarEntry.save();
                        console.log(`Создана новая запись в календаре для сессии ${sessionId} с видеоссылкой`);
                    }
                    // Логируем генерацию ссылки
                    if (USE_MONGODB) {
                        await new Log({
                            sessionId: session.id,
                            userId,
                            action: 'generate_video_link',
                            details: {
                                videoLink,
                                role: 'interviewer',
                                validationResult: 'valid',
                            },
                        }).save();
                    }
                    // Отправляем уведомление об обновлении ссылки на видеозвонок
                    (0, websocket_1.notifyVideoLinkStatusUpdated)(io, sessionId, videoLink, 'active');
                    console.log(`Автоматически сгенерирована валидная ссылка на видеозвонок: ${videoLink}`);
                }
                else {
                    // Если ссылка не прошла валидацию, устанавливаем статус pending
                    session.videoLinkStatus = 'pending';
                    // Логируем неудачную попытку генерации ссылки
                    if (USE_MONGODB) {
                        await new Log({
                            sessionId: session.id,
                            userId,
                            action: 'generate_video_link_failed',
                            details: {
                                videoLink,
                                role: 'interviewer',
                                validationResult: 'invalid',
                                message: validationResult.message,
                            },
                        }).save();
                    }
                    console.warn(`Автоматически сгенерированная ссылка не прошла валидацию: ${validationResult.message}`);
                }
            }
            catch (error) {
                console.error('=== ОШИБКА ПРИ АВТОМАТИЧЕСКОЙ ГЕНЕРАЦИИ ВИДЕОССЫЛКИ ===');
                console.error('Ошибка при генерации видеоссылки:', error);
                console.error('Стек ошибки:', error.stack);
                // Логируем тип ошибки и её конструктор
                console.error('Тип ошибки:', error.constructor.name);
                console.error('Сообщение ошибки:', error.message);
                // Логируем все свойства ошибки для более полного анализа
                console.error('Все свойства ошибки:');
                const errorObj = error;
                for (const prop in errorObj) {
                    if (typeof errorObj[prop] !== 'function') {
                        try {
                            console.error(`- ${prop}:`, JSON.stringify(errorObj[prop]));
                        }
                        catch (e) {
                            console.error(`- ${prop}: [Невозможно сериализовать]`);
                        }
                    }
                }
                // Логируем контекст, в котором произошла ошибка
                console.error('Контекст ошибки:');
                console.error('- ID сессии:', sessionId);
                console.error('- Параметры встречи:', JSON.stringify(meetingOptions, null, 2));
                console.error('- Выбранная роль:', role);
                // Логируем в базу данных информацию об ошибке
                if (USE_MONGODB) {
                    try {
                        await new Log({
                            sessionId: session.id,
                            userId,
                            action: 'generate_video_link_error_on_role_select',
                            details: {
                                errorMessage: error.message,
                                errorType: error.constructor.name,
                                errorStack: error.stack,
                                meetingOptions,
                                role,
                            },
                        }).save();
                        console.log('Информация об ошибке сохранена в логах');
                    }
                    catch (logError) {
                        console.error('Ошибка при сохранении информации об ошибке в логах:', logError);
                    }
                }
                // Устанавливаем статус pending, чтобы пользователь мог попробовать еще раз
                session.videoLinkStatus = 'pending';
                console.error('=== КОНЕЦ ОТЧЕТА ОБ ОШИБКЕ ===');
            }
        }
        // Назначаем роль пользователю в сессии
        await session.assignRole(userId, role);
        // Обновляем запись в календаре - добавляем пользователя в список участников
        const calendarEntry = await InMemoryCalendar_1.InMemoryCalendarEntry.findBySessionId(sessionId);
        if (calendarEntry) {
            await calendarEntry.addParticipant(userId);
            console.log(`Пользователь ${userId} добавлен в календарь для сессии ${sessionId}`);
        }
        else {
            // Если запись в календаре не найдена, создаем новую
            const newCalendarEntry = new InMemoryCalendar_1.InMemoryCalendarEntry({
                sessionId,
                videoLink: session.videoLink,
                startTime: session.startTime,
                participants: [userId],
            });
            await newCalendarEntry.save();
            console.log(`Создана новая запись в календаре для сессии ${sessionId}`);
        }
        // Если пользователь выбрал роль интервьюера, устанавливаем videoLinkStatus = active
        if (role === 'interviewer' && session.videoLink) {
            session.videoLinkStatus = 'active';
        }
        // Отправляем уведомление о выборе роли
        (0, websocket_1.notifyRoleSelected)(io, sessionId, userId, role);
        // Если пользователь выбирает роль интервьюера или отвечающего,
        // устанавливаем статус обратной связи как "pending"
        if (role === 'interviewer' || role === 'interviewee') {
            user.feedbackStatus = 'pending';
        }
        // Обновляем историю ролей пользователя
        if (!user.roleHistory || !Array.isArray(user.roleHistory)) {
            user.roleHistory = [];
        }
        try {
            // Добавляем новую запись в историю ролей
            user.roleHistory.push({
                sessionId: session.id,
                role,
                timestamp: new Date(),
            });
        }
        catch (error) {
            console.error('Ошибка при обновлении истории ролей:', error.message);
            res
                .status(500)
                .json({ message: 'Ошибка при обновлении истории ролей' });
            return;
        }
        // Сохраняем пользователя
        await user.save();
        // Отправляем уведомление об обновлении сессии всем подписчикам
        (0, websocket_1.notifySessionUpdated)(io, sessionId, session);
        res.json({
            message: 'Роль успешно назначена',
            session,
        });
    }
    catch (error) {
        console.error('Ошибка при назначении роли:', error);
        console.error('Стек ошибки:', error.stack);
        res.status(500).json({
            message: 'Ошибка сервера при назначении роли',
            details: error.message,
        });
    }
});
// Изменение статуса сессии
// PUT /api/sessions/:id/status
router.put('/:id/status', auth_1.auth, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const { status } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }
        // Проверяем, что статус указан корректно
        if (!['pending', 'active', 'completed'].includes(status)) {
            res.status(400).json({
                message: 'Некорректный статус. Допустимые значения: pending, active, completed',
            });
            return;
        }
        // Получаем сессию по ID
        const session = await InMemorySession_1.InMemorySession.findById(sessionId);
        if (!session) {
            res.status(404).json({ message: 'Сессия не найдена' });
            return;
        }
        // Проверяем права доступа (только интервьюер может изменять статус)
        if (session.interviewerId !== userId) {
            res.status(403).json({
                message: 'Только интервьюер может изменять статус сессии',
            });
            return;
        }
        // Обновляем статус сессии
        session.status = status;
        await session.save();
        // Получаем экземпляр Socket.IO из объекта запроса
        const io = req.app.get('io');
        // Отправляем уведомление об изменении статуса сессии
        (0, websocket_1.notifySessionUpdated)(io, sessionId, session);
        // Если статус изменен на "completed", отправляем напоминание о необходимости заполнить форму обратной связи
        if (status === 'completed') {
            // Отправляем напоминание интервьюеру
            if (session.interviewerId) {
                (0, websocket_1.notifyFeedbackRequired)(io, session.interviewerId, sessionId);
            }
            // Отправляем напоминание отвечающему
            if (session.intervieweeId) {
                (0, websocket_1.notifyFeedbackRequired)(io, session.intervieweeId, sessionId);
            }
        }
        res.json({
            message: 'Статус сессии успешно обновлен',
            session,
        });
    }
    catch (error) {
        console.error('Ошибка при обновлении статуса сессии:', error);
        res.status(500).json({
            message: 'Ошибка сервера при обновлении статуса сессии',
            details: error.message,
        });
    }
});
// Генерация или обновление ссылки на видеозвонок
// POST /api/sessions/:id/video
router.post('/:id/video', auth_1.auth, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const { manualLink } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }
        // Получаем сессию по ID
        const session = await SessionModel.findById(sessionId);
        if (!session) {
            res.status(404).json({ message: 'Сессия не найдена' });
            return;
        }
        // Получаем пользователя
        const user = await InMemoryUser_1.InMemoryUser.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }
        // Проверяем, является ли пользователь интервьюером сессии
        if (session.interviewerId !== userId) {
            res.status(403).json({
                message: 'Только интервьюер может управлять ссылкой на видеозвонок',
            });
            return;
        }
        // Удалена проверка на наличие googleId
        // Если ссылка уже активна, возвращаем её
        if (session.videoLinkStatus === 'active' && session.videoLink) {
            // Логируем запрос на получение уже активной ссылки
            await Log.create({
                sessionId: session.id,
                userId,
                action: 'get_active_video_link',
                details: {
                    videoLink: session.videoLink,
                    videoLinkStatus: session.videoLinkStatus,
                    timestamp: new Date(),
                },
            });
            res.json({
                message: 'Ссылка уже активна',
                videoLink: session.videoLink,
                videoLinkStatus: session.videoLinkStatus,
            });
            return;
        }
        // Если предоставлена ручная ссылка, проверяем ее валидность
        if (manualLink) {
            const validationResult = await (0, webRTCService_1.isValidMeetUrl)(manualLink);
            if (validationResult.isValid) {
                // Обновляем сессию с ручной ссылкой
                session.videoLink = manualLink;
                session.videoLinkStatus = 'manual';
                await session.save();
                // Обновляем запись в календаре
                const calendarEntry = await InMemoryCalendar_1.InMemoryCalendarEntry.findBySessionId(sessionId);
                if (calendarEntry) {
                    await calendarEntry.updateVideoLink(manualLink);
                    console.log(`Обновлена ссылка на видео в календаре для сессии ${sessionId}`);
                }
                else {
                    // Если запись в календаре не найдена, создаем новую
                    const newCalendarEntry = new InMemoryCalendar_1.InMemoryCalendarEntry({
                        sessionId,
                        videoLink: manualLink,
                        startTime: session.startTime,
                        participants: [userId],
                    });
                    await newCalendarEntry.save();
                    console.log(`Создана новая запись в календаре для сессии ${sessionId} с видеоссылкой`);
                }
                // Логируем добавление ручной ссылки
                await Log.create({
                    sessionId: session.id,
                    userId,
                    action: 'add_manual_video_link',
                    details: {
                        videoLink: manualLink,
                        validationResult: 'valid',
                    },
                });
                // Отправляем уведомление об обновлении ссылки на видеозвонок
                const io = req.app.get('io');
                (0, websocket_1.notifyVideoLinkStatusUpdated)(io, sessionId, manualLink, 'manual');
                res.json({
                    message: 'Ссылка на видеозвонок успешно добавлена',
                    videoLink: manualLink,
                    videoLinkStatus: 'manual',
                });
            }
            else {
                // Если ссылка не прошла валидацию, возвращаем ошибку
                res.status(400).json({
                    message: 'Неверный формат ссылки Видео Чат',
                    details: validationResult.message,
                });
            }
        }
        else {
            // Если ручная ссылка не предоставлена, генерируем новую через WebRTC сервис
            // Определяем параметры встречи
            const meetingOptions = {
                summary: `Mock Interview ${session.id}`,
                startTime: session.startTime,
                durationMinutes: 60, // Длительность по умолчанию - 60 минут
            };
            try {
                // Логируем попытку генерации новой ссылки
                await Log.create({
                    sessionId: session.id,
                    userId,
                    action: 'generate_video_link_attempt',
                    details: {
                        meetingOptions,
                        timestamp: new Date(),
                    },
                });
                // Генерируем новую ссылку на WebRTC комнату
                const videoLink = await (0, webRTCService_1.createMeeting)(meetingOptions);
                // Проверяем валидность новой ссылки
                const validationResult = await (0, webRTCService_1.isValidMeetUrl)(videoLink);
                if (validationResult.isValid) {
                    // Обновляем сессию с новой ссылкой
                    session.videoLink = videoLink;
                    session.videoLinkStatus = 'active';
                    await session.save();
                    // Обновляем запись в календаре
                    const calendarEntry = await InMemoryCalendar_1.InMemoryCalendarEntry.findBySessionId(sessionId);
                    if (calendarEntry) {
                        await calendarEntry.updateVideoLink(videoLink);
                        console.log(`Обновлена ссылка на видео в календаре для сессии ${sessionId}`);
                    }
                    else {
                        // Если запись в календаре не найдена, создаем новую
                        const newCalendarEntry = new InMemoryCalendar_1.InMemoryCalendarEntry({
                            sessionId,
                            videoLink,
                            startTime: session.startTime,
                            participants: [userId],
                        });
                        await newCalendarEntry.save();
                        console.log(`Создана новая запись в календаре для сессии ${sessionId} с видеоссылкой`);
                    }
                    // Логируем генерацию ссылки
                    await Log.create({
                        sessionId: session.id,
                        userId,
                        action: 'generate_video_link',
                        details: {
                            videoLink,
                            validationResult: 'valid',
                        },
                    });
                    // Отправляем уведомление об обновлении ссылки на видеозвонок
                    const io = req.app.get('io');
                    (0, websocket_1.notifyVideoLinkStatusUpdated)(io, sessionId, videoLink, 'active');
                    res.json({
                        message: 'Ссылка на WebRTC видеочат успешно сгенерирована',
                        videoLink,
                        videoLinkStatus: 'active',
                    });
                }
                else {
                    // Если ссылка не прошла валидацию, возвращаем ошибку
                    res.status(400).json({
                        message: 'Сгенерированная ссылка на WebRTC комнату не прошла валидацию',
                        details: validationResult.message,
                    });
                }
            }
            catch (error) {
                console.error('=== ОШИБКА ПРИ ГЕНЕРАЦИИ ВИДЕОССЫЛКИ ===');
                console.error('Ошибка при генерации видеоссылки:', error);
                console.error('Стек ошибки:', error.stack);
                // Логируем тип ошибки и её конструктор
                console.error('Тип ошибки:', error.constructor.name);
                console.error('Сообщение ошибки:', error.message);
                // Логируем все свойства ошибки для более полного анализа
                console.error('Все свойства ошибки:');
                const errorObj = error;
                for (const prop in errorObj) {
                    if (typeof errorObj[prop] !== 'function') {
                        try {
                            console.error(`- ${prop}:`, JSON.stringify(errorObj[prop]));
                        }
                        catch (e) {
                            console.error(`- ${prop}: [Невозможно сериализовать]`);
                        }
                    }
                }
                // Логируем контекст, в котором произошла ошибка
                console.error('Контекст ошибки:');
                console.error('- ID сессии:', sessionId);
                console.error('- Параметры встречи:', JSON.stringify({
                    summary: `Mock Interview ${session.id}`,
                    startTime: session.startTime,
                    durationMinutes: 60,
                }, null, 2));
                // Логируем в базу данных информацию об ошибке
                try {
                    await Log.create({
                        sessionId: session.id,
                        userId,
                        action: 'generate_video_link_error',
                        details: {
                            errorMessage: error.message,
                            errorType: error.constructor.name,
                            errorStack: error.stack,
                            meetingParams: {
                                summary: `Mock Interview ${session.id}`,
                                startTime: session.startTime,
                                durationMinutes: 60,
                            },
                        },
                    });
                    console.log('Информация об ошибке сохранена в логах');
                }
                catch (logError) {
                    console.error('Ошибка при сохранении информации об ошибке в логах:', logError);
                }
                console.error('=== КОНЕЦ ОТЧЕТА ОБ ОШИБКЕ ===');
                // Возвращаем ошибку клиенту
                res.status(500).json({
                    message: 'Ошибка при генерации ссылки на WebRTC комнату',
                    details: error.message,
                });
            }
        }
    }
    catch (error) {
        console.error('Ошибка при обработке запроса на генерацию видеоссылки:', error);
        res.status(500).json({
            message: 'Ошибка сервера при обработке запроса',
            details: error.message,
        });
    }
});
// Получение информации о ссылке на видеозвонок
// GET /api/sessions/:id/video
router.get('/:id/video', auth_1.auth, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }
        // Получаем сессию по ID
        const session = await SessionModel.findById(sessionId);
        if (!session) {
            res.status(404).json({ message: 'Сессия не найдена' });
            return;
        }
        // Проверяем, является ли пользователь участником сессии
        const isParticipant = session.creatorId === userId ||
            session.interviewerId === userId ||
            session.intervieweeId === userId ||
            (session.observerIds && session.observerIds.includes(userId));
        if (!isParticipant) {
            res.status(403).json({
                message: 'У вас нет прав для просмотра ссылки на видеозвонок',
            });
            return;
        }
        // Логируем запрос на получение информации о ссылке
        await Log.create({
            sessionId: session.id,
            userId,
            action: 'get_video_link_info',
            details: {
                timestamp: new Date(),
                videoLinkStatus: session.videoLinkStatus || 'pending',
            },
        });
        // Если ссылка отсутствует или в статусе pending, возвращаем соответствующее сообщение
        if (!session.videoLink || session.videoLinkStatus === 'pending') {
            res.json({
                message: 'Ссылка еще не сгенерирована',
                videoLinkStatus: 'pending',
            });
            return;
        }
        // Возвращаем информацию о ссылке на видеозвонок
        res.json({
            videoLink: session.videoLink,
            videoLinkStatus: session.videoLinkStatus,
        });
    }
    catch (error) {
        console.error('Ошибка при получении информации о ссылке на видеозвонок:', error);
        res.status(500).json({
            message: 'Ошибка сервера при получении информации о ссылке на видеозвонок',
            details: error.message,
        });
    }
});
// Получение информации о конкретной сессии
// GET /api/sessions/:id
router.get('/:id', auth_1.auth, async (req, res) => {
    try {
        console.log('=== Получен запрос GET /api/sessions/:id ===');
        console.log('Параметры запроса:', req.params);
        console.log('ID сессии из параметров:', req.params.id);
        console.log('Заголовки запроса:', req.headers);
        console.log('Пользователь из запроса:', req.user);
        const sessionId = req.params.id;
        console.log('Используемый ID сессии:', sessionId);
        console.log('Тип ID сессии:', typeof sessionId);
        // Получаем сессию по ID
        console.log('Поиск сессии в хранилище...');
        const session = await InMemorySession_1.InMemorySession.findById(sessionId);
        console.log('Результат поиска сессии:', session ? 'Найдена' : 'Не найдена');
        if (!session) {
            console.log(`Сессия с ID ${sessionId} не найдена в хранилище`);
            console.log('Все доступные сессии:');
            const allSessions = await InMemorySession_1.InMemorySession.find();
            console.log('Количество сессий в хранилище:', allSessions.length);
            allSessions.forEach((s, index) => {
                console.log(`Сессия ${index + 1}:`, {
                    id: s.id,
                    interviewerId: s.interviewerId,
                    intervieweeId: s.intervieweeId,
                    status: s.status,
                });
            });
            res.status(404).json({ message: 'Сессия не найдена' });
            return;
        }
        console.log('Отправка данных сессии клиенту:', {
            id: session.id,
            interviewerId: session.interviewerId,
            intervieweeId: session.intervieweeId,
            status: session.status,
            videoLink: session.videoLink,
            videoLinkStatus: session.videoLinkStatus,
        });
        res.json(session);
    }
    catch (error) {
        console.error('Ошибка при получении информации о сессии:', error);
        res.status(500).json({
            message: 'Ошибка сервера при получении информации о сессии',
            details: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=sessions.js.map