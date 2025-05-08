const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const InMemoryUser = require('../models/InMemoryUser'); // Используем InMemoryUser вместо MongoDB
const { auth, JWT_SECRET } = require('../middleware/auth');

// Используем InMemoryUser как User для совместимости с кодом
const User = InMemoryUser;

// Маршрут для регистрации пользователя
// POST /api/register
router.post(
  '/register',
  [
    // Валидация входных данных
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Пароль должен содержать минимум 6 символов'),
  ],
  async (req, res) => {
    // Проверяем результаты валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Проверяем, существует ли пользователь с таким email
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ message: 'Пользователь с таким email уже существует' });
      }

      // Создаем нового пользователя
      user = new User({
        email,
        password,
      });

      // Сохраняем пользователя в хранилище
      // Пароль будет хешироваться автоматически в методе save()
      await user.save();

      // Создаем JWT-токен
      const payload = {
        user: {
          id: user.id, // Используем UUID из InMemoryUser
        },
      };

      jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (error) {
      console.error('Ошибка при регистрации:', error.message);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
);

// Маршрут для входа пользователя
// POST /api/login
router.post(
  '/login',
  [
    // Валидация входных данных
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').exists().withMessage('Введите пароль'),
  ],
  async (req, res) => {
    // Проверяем результаты валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Ищем пользователя по email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Неверные учетные данные' });
      }

      // Проверяем пароль
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Неверные учетные данные' });
      }

      // Создаем JWT-токен
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (error) {
      console.error('Ошибка при входе:', error.message);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
);

// Защищенный маршрут для получения данных пользователя
// GET /api/user
router.get('/user', auth, async (req, res) => {
  try {
    // Получаем пользователя из хранилища (без пароля)
    const userWithSelect = await User.findById(req.user.id);
    if (!userWithSelect) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Используем метод select для исключения пароля
    const user = userWithSelect.select('-password');

    // Добавляем статус обратной связи, если он не был включен
    if (user && !user.feedbackStatus) {
      user.feedbackStatus = userWithSelect.feedbackStatus || 'none';
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
