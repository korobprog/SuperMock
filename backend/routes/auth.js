const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const InMemoryUser = require('../models/InMemoryUser'); // Используем InMemoryUser вместо MongoDB
const { auth, JWT_SECRET } = require('../middleware/auth');

// Проверяем, нужно ли использовать MongoDB
console.log('=== ПРОВЕРКА НАСТРОЕК АУТЕНТИФИКАЦИИ ===');
console.log('USE_MONGODB:', process.env.USE_MONGODB);

let User;
if (process.env.USE_MONGODB === 'true') {
  try {
    console.log('Попытка использования MongoDB для аутентификации...');
    const mongoUser = require('../models/User');
    console.log('Модель MongoDB User успешно загружена');

    // Проверяем подключение к MongoDB
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      console.log('Соединение с MongoDB установлено');
      User = mongoUser;
      console.log('Используется MongoDB для хранения пользователей');
    } else {
      console.log(
        'Соединение с MongoDB не установлено, используем InMemoryUser'
      );
      User = InMemoryUser;
    }
  } catch (error) {
    console.error('Ошибка при загрузке модели MongoDB User:', error.message);
    console.log('Используем InMemoryUser из-за ошибки');
    User = InMemoryUser;
  }
} else {
  console.log('Используем InMemoryUser согласно настройкам');
  User = InMemoryUser;
}

// Логируем итоговый выбор модели пользователя
console.log(
  `Итоговая модель пользователя: ${
    User === InMemoryUser ? 'InMemoryUser' : 'MongoDB User'
  }`
);

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
      console.log(`Попытка регистрации пользователя с email: ${email}`);

      // Проверяем, существует ли пользователь с таким email
      let user = await User.findOne({ email });
      if (user) {
        console.log(`Пользователь с email ${email} уже существует`);
        return res
          .status(400)
          .json({ message: 'Пользователь с таким email уже существует' });
      }

      console.log(`Создание нового пользователя с email: ${email}`);

      // Создаем нового пользователя
      user = new User({
        email,
        password,
      });

      // Сохраняем пользователя в хранилище
      // Пароль будет хешироваться автоматически в методе save()
      try {
        await user.save();
        console.log(
          `Пользователь с email ${email} успешно сохранен, ID: ${user.id}`
        );
      } catch (saveError) {
        console.error('Ошибка при сохранении пользователя:', saveError);
        throw saveError;
      }

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
      console.log(`Попытка входа пользователя с email: ${email}`);

      // Ищем пользователя по email
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`Пользователь с email ${email} не найден`);
        return res.status(400).json({ message: 'Неверные учетные данные' });
      }

      console.log(`Пользователь с email ${email} найден, проверка пароля`);

      // Проверяем пароль
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log(`Неверный пароль для пользователя с email ${email}`);
        return res.status(400).json({ message: 'Неверные учетные данные' });
      }

      console.log(`Успешный вход пользователя с email ${email}`);

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
    console.log(`Запрос данных пользователя с ID: ${req.user.id}`);

    // Получаем пользователя из хранилища (без пароля)
    const userWithSelect = await User.findById(req.user.id);
    if (!userWithSelect) {
      console.log(`Пользователь с ID ${req.user.id} не найден`);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    console.log(`Пользователь с ID ${req.user.id} найден`);

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
