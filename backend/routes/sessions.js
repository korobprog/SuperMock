const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const InMemorySession = require('../models/InMemorySession');
const InMemoryUser = require('../models/InMemoryUser');

// Получение списка всех сессий
// GET /api/sessions
router.get('/', auth, async (req, res) => {
  try {
    console.log('Получен запрос на /api/sessions');
    console.log('Пользователь:', req.user);

    const sessions = await InMemorySession.find();
    console.log('Найдено сессий:', sessions.length);

    // Устанавливаем заголовок Content-Type явно
    res.setHeader('Content-Type', 'application/json');
    res.json(sessions);
  } catch (error) {
    console.error('Ошибка при получении списка сессий:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание новой сессии
// POST /api/sessions
router.post('/', auth, async (req, res) => {
  try {
    const { videoLink, startTime } = req.body;

    // Создаем новую сессию
    const session = new InMemorySession({
      videoLink,
      startTime: startTime ? new Date(startTime) : new Date(),
      status: 'pending',
    });

    await session.save();

    res.status(201).json(session);
  } catch (error) {
    console.error('Ошибка при создании сессии:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Выбор роли в сессии
// POST /api/sessions/:id/roles
router.post('/:id/roles', auth, async (req, res) => {
  try {
    const { role } = req.body;
    const sessionId = req.params.id;
    const userId = req.user.id;

    console.log('Выбор роли для сессии:', sessionId);
    console.log('Пользователь ID:', userId);
    console.log('Выбранная роль:', role);

    // Проверяем, что роль указана корректно
    if (!['interviewer', 'interviewee', 'observer'].includes(role)) {
      console.log('Некорректная роль:', role);
      return res.status(400).json({
        message:
          'Некорректная роль. Допустимые значения: interviewer, interviewee, observer',
      });
    }

    // Получаем сессию по ID
    const session = await InMemorySession.findById(sessionId);
    console.log('Найдена сессия:', session ? 'Да' : 'Нет');
    if (!session) {
      return res.status(404).json({ message: 'Сессия не найдена' });
    }

    // Получаем пользователя
    const user = await InMemoryUser.findById(userId);
    console.log('Найден пользователь:', user ? 'Да' : 'Нет');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем статус обратной связи пользователя
    if (user.feedbackStatus === 'pending' && role !== 'observer') {
      return res.status(403).json({
        message:
          'Вы не можете выбрать эту роль, пока не заполните форму обратной связи',
      });
    }

    // Проверяем ограничения для выбора роли
    try {
      if (role === 'interviewer') {
        // Проверяем, был ли пользователь интервьюером в последней сессии
        const lastSession = await InMemorySession.findLastSessionAsInterviewer(
          userId
        );

        console.log('Последняя сессия как интервьюер:', lastSession);

        if (lastSession) {
          return res.status(400).json({
            message:
              'Вы не можете выбрать роль интервьюера, так как были интервьюером в последней сессии',
          });
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке ограничений для выбора роли:', error);
      return res.status(500).json({
        message: 'Ошибка при проверке ограничений для выбора роли',
        details: error.message,
      });
    }

    // Проверяем, не занята ли уже роль
    if (role === 'interviewer' && session.interviewerId) {
      return res.status(400).json({ message: 'Роль интервьюера уже занята' });
    }

    if (role === 'interviewee' && session.intervieweeId) {
      return res.status(400).json({ message: 'Роль отвечающего уже занята' });
    }

    // Назначаем роль пользователю в сессии
    await session.assignRole(userId, role);

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
    } catch (error) {
      console.error('Ошибка при обновлении истории ролей:', error.message);
      return res
        .status(500)
        .json({ message: 'Ошибка при обновлении истории ролей' });
    }

    // Сохраняем пользователя
    await user.save();

    res.json({
      message: 'Роль успешно назначена',
      session,
    });
  } catch (error) {
    console.error('Ошибка при назначении роли:', error);
    console.error('Стек ошибки:', error.stack);
    res.status(500).json({
      message: 'Ошибка сервера при назначении роли',
      details: error.message,
    });
  }
});

module.exports = router;
