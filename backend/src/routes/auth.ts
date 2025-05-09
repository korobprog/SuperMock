import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { InMemoryUser } from '../models/InMemoryUser'; // Используем InMemoryUser вместо MongoDB
import { auth, JWT_SECRET } from '../middleware/auth';

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
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Проверяем результаты валидации
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Проверяем, существует ли пользователь с таким email
      let user = await User.findOne({ email });
      if (user) {
        res
          .status(400)
          .json({ message: 'Пользователь с таким email уже существует' });
        return;
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
        if (err) {
          next(err);
          return;
        }
        res.json({ token });
      });
    } catch (error) {
      console.error('Ошибка при регистрации:', (error as Error).message);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }) as RequestHandler
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
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Проверяем результаты валидации
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Ищем пользователя по email
      const user = await User.findOne({ email });
      if (!user) {
        res.status(400).json({ message: 'Неверные учетные данные' });
        return;
      }

      // Проверяем пароль
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(400).json({ message: 'Неверные учетные данные' });
        return;
      }

      // Создаем JWT-токен
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) {
          next(err);
          return;
        }
        res.json({ token });
      });
    } catch (error) {
      console.error('Ошибка при входе:', (error as Error).message);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }) as RequestHandler
);

// Защищенный маршрут для получения данных пользователя
// GET /api/user
router.get('/user', auth, (async (req: Request, res: Response) => {
  try {
    // Получаем пользователя из хранилища (без пароля)
    const userWithSelect = await User.findById(req.user!.id);
    if (!userWithSelect) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }

    // Используем метод select для исключения пароля
    const user = (userWithSelect as any).select('-password');

    // Добавляем статус обратной связи, если он не был включен
    if (user && !user.feedbackStatus) {
      user.feedbackStatus = userWithSelect.feedbackStatus || 'none';
    }

    res.json(user);
  } catch (error) {
    console.error(
      'Ошибка при получении данных пользователя:',
      (error as Error).message
    );
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}) as RequestHandler);

// Маршрут для инициирования Google OAuth
// GET /auth/google
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    session: false,
  })
);

// Маршрут для обработки обратного вызова Google OAuth
// GET /google/callback
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Получаем пользователя из запроса (добавлен Passport)
      const user = req.user as any;

      if (!user) {
        res.status(401).json({ message: 'Ошибка аутентификации через Google' });
        return;
      }

      // Создаем JWT-токен
      const payload = {
        user: {
          id: user.id,
          googleId: user.googleId,
          googleAccessToken: user.googleAccessToken,
        },
      };

      jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
        if (err) {
          console.error('Ошибка при создании JWT-токена:', err);
          res.status(500).json({ message: 'Ошибка сервера' });
          return;
        }

        // Перенаправляем пользователя на фронтенд с токеном
        // Используем порт 5174, на котором запущен фронтенд
        res.redirect(`http://localhost:5174/auth-callback?token=${token}`);
      });
    } catch (error) {
      console.error('Ошибка при обработке Google OAuth callback:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }) as RequestHandler
);

export default router;
