const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const InMemoryFeedback = require('../models/InMemoryFeedback');
const InMemoryUser = require('../models/InMemoryUser');
const InMemorySession = require('../models/InMemorySession');
const { notifyFeedbackUpdated } = require('../websocket');

// Отправка обратной связи для сессии
// POST /api/sessions/:id/feedback
router.post('/sessions/:id/feedback', auth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const { ratings, comments, recommendations } = req.body;

    // Проверяем существование сессии
    const session = await InMemorySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Проверяем, участвовал ли пользователь в сессии
    const isInterviewer = session.interviewerId === userId;
    const isInterviewee = session.intervieweeId === userId;
    const isObserver =
      session.observerIds && session.observerIds.includes(userId);

    if (!isInterviewer && !isInterviewee && !isObserver) {
      return res.status(403).json({
        message:
          'Вы не можете оставить обратную связь для сессии, в которой не участвовали',
      });
    }

    // Проверяем, не отправлял ли пользователь уже обратную связь для этой сессии
    const existingFeedback = await InMemoryFeedback.findByUserAndSession(
      userId,
      sessionId
    );
    if (existingFeedback) {
      return res.status(400).json({
        message: 'Вы уже отправили обратную связь для этой сессии',
      });
    }

    // Создаем новую обратную связь
    const feedback = new InMemoryFeedback({
      sessionId,
      userId,
      ratings: ratings || {},
      comments: comments || '',
      recommendations: recommendations || '',
    });

    await feedback.save();

    // Обновляем статус обратной связи пользователя
    const user = await InMemoryUser.findById(userId);
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
    notifyFeedbackUpdated(io, sessionId, feedback.id, null, feedback);

    // Проверяем, заполнили ли обе стороны обратную связь
    const allFeedbacks = await InMemoryFeedback.findBySessionId(sessionId);
    const interviewerFeedback = allFeedbacks.find(
      (f) => f.userId === session.interviewerId
    );
    const intervieweeFeedback = allFeedbacks.find(
      (f) => f.userId === session.intervieweeId
    );

    // Если обе стороны заполнили обратную связь, отправляем дополнительное уведомление
    if (interviewerFeedback && intervieweeFeedback) {
      notifyFeedbackUpdated(io, sessionId, null, { bothSidesSubmitted: true });
    }

    res.status(201).json({
      message: 'Обратная связь успешно отправлена',
      feedback,
    });
  } catch (error) {
    console.error('Ошибка при отправке обратной связи:', error);
    res.status(500).json({
      message: 'Ошибка сервера при отправке обратной связи',
      details: error.message,
    });
  }
});

// Получение списка обратной связи для пользователя
// GET /api/users/:id/feedback
router.get('/users/:id/feedback', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const requestUserId = req.user.id;

    // Проверяем права доступа (пользователь может получить только свою обратную связь)
    if (targetUserId !== requestUserId) {
      return res.status(403).json({
        message: 'Вы можете получить только свою обратную связь',
      });
    }

    // Получаем список обратной связи для пользователя
    const feedbacks = await InMemoryFeedback.findByUserId(targetUserId);

    res.json(feedbacks);
  } catch (error) {
    console.error('Ошибка при получении списка обратной связи:', error);
    res.status(500).json({
      message: 'Ошибка сервера при получении списка обратной связи',
      details: error.message,
    });
  }
});

// Получение обратной связи для сессии
// GET /api/sessions/:id/feedback
router.get('/sessions/:id/feedback', auth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    // Проверяем существование сессии
    const session = await InMemorySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Проверяем, участвовал ли пользователь в сессии
    const isInterviewer = session.interviewerId === userId;
    const isInterviewee = session.intervieweeId === userId;
    const isObserver =
      session.observerIds && session.observerIds.includes(userId);

    if (!isInterviewer && !isInterviewee && !isObserver) {
      return res.status(403).json({
        message:
          'Вы не можете получить обратную связь для сессии, в которой не участвовали',
      });
    }

    // Получаем обратную связь для сессии
    const feedbacks = await InMemoryFeedback.findBySessionId(sessionId);

    // Проверяем, заполнили ли обе стороны (интервьюер и интервьюируемый) обратную связь
    const interviewerFeedback = feedbacks.find(
      (feedback) => feedback.userId === session.interviewerId
    );
    const intervieweeFeedback = feedbacks.find(
      (feedback) => feedback.userId === session.intervieweeId
    );

    // Добавляем информацию о заполнении обратной связи обеими сторонами
    const bothSidesSubmitted = !!(interviewerFeedback && intervieweeFeedback);

    res.json({
      feedbacks,
      bothSidesSubmitted,
      session,
    });
  } catch (error) {
    console.error('Ошибка при получении обратной связи для сессии:', error);
    res.status(500).json({
      message: 'Ошибка сервера при получении обратной связи для сессии',
      details: error.message,
    });
  }
});

module.exports = router;
