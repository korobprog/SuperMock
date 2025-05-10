"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const InMemoryFeedback_1 = require("../models/InMemoryFeedback");
const InMemoryUser_1 = require("../models/InMemoryUser");
const InMemorySession_1 = require("../models/InMemorySession");
const websocket_1 = require("../websocket");
const router = express_1.default.Router();
// Отправка обратной связи для сессии
// POST /api/sessions/:id/feedback
router.post('/sessions/:id/feedback', auth_1.auth, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }
        const { ratings, comments, recommendations } = req.body;
        // Проверяем существование сессии
        const session = await InMemorySession_1.InMemorySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        // Проверяем, участвовал ли пользователь в сессии
        const isInterviewer = session.interviewerId === userId;
        const isInterviewee = session.intervieweeId === userId;
        const isObserver = session.observerIds && session.observerIds.includes(userId);
        if (!isInterviewer && !isInterviewee && !isObserver) {
            return res.status(403).json({
                message: 'Вы не можете оставить обратную связь для сессии, в которой не участвовали',
            });
        }
        // Проверяем, не отправлял ли пользователь уже обратную связь для этой сессии
        const existingFeedback = await InMemoryFeedback_1.InMemoryFeedback.findByUserAndSession(userId, sessionId);
        if (existingFeedback) {
            return res.status(400).json({
                message: 'Вы уже отправили обратную связь для этой сессии',
            });
        }
        // Создаем новую обратную связь
        const feedback = new InMemoryFeedback_1.InMemoryFeedback({
            sessionId,
            userId,
            ratings: ratings || {},
            comments: comments || '',
            recommendations: recommendations || '',
        });
        await feedback.save();
        // Обновляем статус обратной связи пользователя
        const user = await InMemoryUser_1.InMemoryUser.findById(userId);
        if (user) {
            // Если пользователь был интервьюером или отвечающим, обновляем статус
            if (isInterviewer || isInterviewee) {
                user.feedbackStatus = 'completed';
                await user.save();
            }
        }
        // Получаем экземпляр Socket.IO из объекта запроса
        const io = req.app.get('io');
        // Отправляем уведомление о новой обратной связи
        (0, websocket_1.notifyFeedbackUpdated)(io, sessionId, feedback.id, {}, feedback);
        // Проверяем, заполнили ли обе стороны обратную связь
        const allFeedbacks = await InMemoryFeedback_1.InMemoryFeedback.findBySessionId(sessionId);
        const interviewerFeedback = allFeedbacks.find((f) => f.userId === session.interviewerId);
        const intervieweeFeedback = allFeedbacks.find((f) => f.userId === session.intervieweeId);
        // Если обе стороны заполнили обратную связь, отправляем дополнительное уведомление
        if (interviewerFeedback && intervieweeFeedback) {
            (0, websocket_1.notifyFeedbackUpdated)(io, sessionId, 'both-submitted', {
                bothSidesSubmitted: true,
            });
        }
        res.status(201).json({
            message: 'Обратная связь успешно отправлена',
            feedback,
        });
    }
    catch (error) {
        console.error('Ошибка при отправке обратной связи:', error);
        res.status(500).json({
            message: 'Ошибка сервера при отправке обратной связи',
            details: error.message,
        });
    }
});
// Получение списка обратной связи для пользователя
// GET /api/users/:id/feedback
router.get('/users/:id/feedback', auth_1.auth, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const requestUserId = req.user?.id;
        if (!requestUserId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }
        // Проверяем права доступа (пользователь может получить только свою обратную связь)
        if (targetUserId !== requestUserId) {
            return res.status(403).json({
                message: 'Вы можете получить только свою обратную связь',
            });
        }
        // Получаем список обратной связи для пользователя
        const feedbacks = await InMemoryFeedback_1.InMemoryFeedback.findByUserId(targetUserId);
        res.json(feedbacks);
    }
    catch (error) {
        console.error('Ошибка при получении списка обратной связи:', error);
        res.status(500).json({
            message: 'Ошибка сервера при получении списка обратной связи',
            details: error.message,
        });
    }
});
// Получение обратной связи для сессии
// GET /api/sessions/:id/feedback
router.get('/sessions/:id/feedback', auth_1.auth, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }
        // Проверяем существование сессии
        const session = await InMemorySession_1.InMemorySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Сессия не найдена' });
        }
        // Проверяем, участвовал ли пользователь в сессии
        const isInterviewer = session.interviewerId === userId;
        const isInterviewee = session.intervieweeId === userId;
        const isObserver = session.observerIds && session.observerIds.includes(userId);
        if (!isInterviewer && !isInterviewee && !isObserver) {
            return res.status(403).json({
                message: 'Вы не можете получить обратную связь для сессии, в которой не участвовали',
            });
        }
        // Получаем обратную связь для сессии
        const feedbacks = await InMemoryFeedback_1.InMemoryFeedback.findBySessionId(sessionId);
        // Проверяем, заполнили ли обе стороны (интервьюер и интервьюируемый) обратную связь
        const interviewerFeedback = feedbacks.find((feedback) => feedback.userId === session.interviewerId);
        const intervieweeFeedback = feedbacks.find((feedback) => feedback.userId === session.intervieweeId);
        // Добавляем информацию о заполнении обратной связи обеими сторонами
        const bothSidesSubmitted = !!(interviewerFeedback && intervieweeFeedback);
        res.json({
            feedbacks,
            bothSidesSubmitted,
            session,
        });
    }
    catch (error) {
        console.error('Ошибка при получении обратной связи для сессии:', error);
        res.status(500).json({
            message: 'Ошибка сервера при получении обратной связи для сессии',
            details: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=feedback.js.map