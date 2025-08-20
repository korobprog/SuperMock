const jwt = require('jsonwebtoken');

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'mock_interview_secret_key';

// Импортируем модель пользователя
const InMemoryUser = require('../models/InMemoryUser');

// Middleware для проверки JWT-токена
const auth = async (req, res, next) => {
  console.log('Middleware auth: Проверка токена');
  console.log('Заголовки запроса:', req.headers);

  // Получаем токен из заголовка Authorization
  const authHeader = req.header('Authorization');
  console.log('Заголовок Authorization:', authHeader);

  // Проверяем наличие токена
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Токен не предоставлен или неверный формат');
    return res
      .status(401)
      .json({ message: 'Доступ запрещен. Токен не предоставлен' });
  }

  // Извлекаем токен из заголовка
  const token = authHeader.replace('Bearer ', '');
  console.log(
    'Извлеченный токен (первые 10 символов):',
    token.substring(0, 10) + '...'
  );

  try {
    // Верифицируем токен
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Токен успешно верифицирован');
    console.log('Данные пользователя:', decoded.user);

    // Добавляем информацию о пользователе в объект запроса
    req.user = decoded.user;

    // Проверяем, существует ли пользователь в базе данных
    const user = await InMemoryUser.findById(req.user.id);

    // Если пользователь не найден, создаем его
    if (!user) {
      console.log(
        'Пользователь не найден в базе данных. Создаем нового пользователя.'
      );

      // Создаем нового пользователя с тем же ID
      const newUser = new InMemoryUser({
        email: `user_${req.user.id}@example.com`, // Временный email
        password: 'temporary_password', // Временный пароль
      });

      // Устанавливаем ID из токена
      newUser.id = req.user.id;

      // Сохраняем пользователя
      await newUser.save();

      console.log('Создан новый пользователь с ID:', req.user.id);
    }

    next();
  } catch (error) {
    console.error('Ошибка верификации токена:', error.message);
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

module.exports = {
  auth,
  JWT_SECRET,
};
