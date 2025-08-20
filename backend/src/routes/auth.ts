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
import { User } from '../models/UserModel'; // Импортируем модель пользователя из UserModel
import { auth, JWT_SECRET } from '../middleware/auth';
import { FRONTEND_PORT, FRONTEND_URL } from '../config/app'; // Импортируем FRONTEND_PORT и FRONTEND_URL из конфигурации

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
      console.log('=== ОТЛАДКА РЕГИСТРАЦИИ ===');
      console.log('Получен запрос на регистрацию');
      console.log('Заголовки запроса:', req.headers);
      console.log('Тело запроса:', { ...req.body, password: '***скрыто***' });
      console.log('Origin:', req.headers.origin);
      console.log('Referer:', req.headers.referer);
      console.log('IP клиента:', req.ip);
      console.log('User-Agent:', req.headers['user-agent']);

      // Проверяем результаты валидации
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Ошибки валидации:', errors.array());
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Проверяем, существует ли пользователь с таким email
      console.log('Проверка существования пользователя с email:', email);
      let user = await User.findOne({ email });
      if (user) {
        console.log('Пользователь с таким email уже существует');
        res
          .status(400)
          .json({ message: 'Пользователь с таким email уже существует' });
        return;
      }
      console.log('Пользователь с таким email не найден, создаем нового');

      // Создаем нового пользователя
      user = new User({
        email,
        password,
      });

      // Сохраняем пользователя в хранилище
      // Пароль будет хешироваться автоматически в методе save()
      console.log('Сохранение пользователя в хранилище');
      try {
        await user.save();
        console.log('Пользователь успешно сохранен');
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
        if (err) {
          next(err);
          return;
        }
        res.json({ token });
      });
    } catch (error) {
      console.error('Ошибка при регистрации:', (error as Error).message);
      console.error('Стек ошибки:', (error as Error).stack);
      console.error(
        'Тип ошибки:',
        error instanceof Error ? 'Error' : typeof error
      );
      console.error('Полная ошибка:', error);
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
    console.log('=== ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ===');
    console.log('ID пользователя из токена:', req.user?.id);
    console.log('Заголовки запроса:', req.headers);
    console.log('Метод запроса:', req.method);
    console.log('URL запроса:', req.originalUrl);
    console.log('IP клиента:', req.ip);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Cookies:', req.cookies);
    console.log('Параметры запроса:', req.query);
    console.log('Тело запроса:', req.body);
    console.log('Используемая модель пользователя:', User.name || 'Неизвестно');
    console.log('USE_MONGODB:', process.env.USE_MONGODB);
    console.log('MONGO_URI установлен:', process.env.MONGO_URI ? 'Да' : 'Нет');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Получаем пользователя из хранилища (без пароля)
    console.log('Попытка найти пользователя по ID:', req.user?.id);
    const userWithSelect = await User.findById(req.user!.id);
    console.log(
      'Результат поиска пользователя:',
      userWithSelect ? 'Найден' : 'Не найден'
    );

    if (!userWithSelect) {
      console.log('Пользователь не найден в базе данных');
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }

    console.log('Данные пользователя (без пароля):', {
      id: userWithSelect.id,
      email: userWithSelect.email,
      googleId: userWithSelect.googleId || 'отсутствует',
      feedbackStatus: userWithSelect.feedbackStatus || 'none',
    });

    // Используем метод select для исключения пароля
    console.log('Применение метода select для исключения пароля');
    const user = (userWithSelect as any).select('-password');
    console.log('Результат после select:', user ? 'Успешно' : 'Ошибка');

    // Добавляем статус обратной связи, если он не был включен
    if (user && !user.feedbackStatus) {
      console.log('Добавление статуса обратной связи');
      user.feedbackStatus = userWithSelect.feedbackStatus || 'none';
    }

    console.log('Отправка данных пользователя клиенту');
    res.json(user);
  } catch (error) {
    console.error(
      'Ошибка при получении данных пользователя:',
      (error as Error).message
    );
    console.error('Стек ошибки:', (error as Error).stack);
    console.error(
      'Тип ошибки:',
      error instanceof Error ? 'Error' : typeof error
    );
    console.error('Полная ошибка:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}) as RequestHandler);

// Маршрут для инициирования Google OAuth
// GET /api/auth/google (с учетом префикса в server.ts)
router.get(
  '/auth/google',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('=== ИНИЦИИРОВАНИЕ GOOGLE OAUTH ===');
    console.log('Запрос на аутентификацию Google OAuth');
    console.log('URL запроса:', req.originalUrl);
    console.log('Заголовки запроса:', req.headers);
    console.log(
      'Полный URL:',
      `${req.protocol}://${req.get('host')}${req.originalUrl}`
    );
    console.log('Netlify редирект информация:');
    console.log('x-nf-request-id:', req.headers['x-nf-request-id']);
    console.log('Netlify URL:', req.headers['x-url']);
    console.log('Netlify оригинальный URL:', req.headers['x-original-url']);
    console.log(
      'Ожидаемый callback URL:',
      `${req.protocol}://${req.get('host')}/api/google/callback`
    );
    console.log(
      'GOOGLE_CALLBACK_URL из env:',
      process.env.GOOGLE_CALLBACK_URL || 'не установлен'
    );
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('HOST:', process.env.HOST);
    console.log('PORT:', process.env.PORT);
    console.log(
      'FRONTEND_URL из env:',
      process.env.FRONTEND_URL || 'не установлен'
    );
    console.log('FRONTEND_URL из конфигурации:', FRONTEND_URL);
    console.log('FRONTEND_PORT из конфигурации:', FRONTEND_PORT);
    console.log(
      'Удаленное подключение к базе данных:',
      process.env.MONGO_URI ? 'Да' : 'Нет'
    );
    console.log(
      'Удаленное подключение к Redis:',
      process.env.REDIS_HOST ? 'Да' : 'Нет'
    );
    console.log('=== ОТЛАДКА NETLIFY ПЕРЕМЕННЫХ ===');
    console.log(
      'Netlify домен:',
      req.headers['x-forwarded-host'] || 'не определен'
    );
    console.log(
      'Netlify протокол:',
      req.headers['x-forwarded-proto'] || 'не определен'
    );
    console.log('Netlify URL:', req.headers['x-url'] || 'не определен');
    console.log(
      'Netlify оригинальный URL:',
      req.headers['x-original-url'] || 'не определен'
    );
    console.log(
      'Netlify переадресация:',
      req.headers['x-forwarded-for'] || 'не определен'
    );
    console.log(
      'Netlify запрос через:',
      req.headers['x-forwarded-server'] || 'не определен'
    );
    console.log(
      'Netlify порт:',
      req.headers['x-forwarded-port'] || 'не определен'
    );
    console.log('Netlify схема:', req.headers['x-scheme'] || 'не определен');
    console.log('Netlify хост:', req.headers['host'] || 'не определен');
    console.log('Netlify origin:', req.headers['origin'] || 'не определен');
    console.log('Netlify referer:', req.headers['referer'] || 'не определен');
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Маршрут для обработки обратного вызова Google OAuth
// GET /api/auth/google/callback
router.get(
  '/auth/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('=== ОБРАБОТКА GOOGLE OAUTH CALLBACK ===');
    console.log('Получен callback от Google OAuth');
    console.log('URL запроса:', req.originalUrl);
    console.log('Заголовки запроса:', req.headers);
    console.log(
      'Полный URL callback:',
      `${req.protocol}://${req.get('host')}${req.originalUrl}`
    );
    console.log('Netlify редирект информация для callback:');
    console.log('x-nf-request-id:', req.headers['x-nf-request-id']);
    console.log('Netlify URL:', req.headers['x-url']);
    console.log('Netlify оригинальный URL:', req.headers['x-original-url']);
    console.log('Netlify редирект статус:', req.headers['x-redirect-status']);
    console.log('Параметры запроса:', req.query);
    console.log('Ошибка (если есть):', req.query.error || 'нет');
    console.log(
      'Код ошибки (если есть):',
      req.query.error_description || 'нет'
    );
    console.log('=== ОТЛАДКА NETLIFY CALLBACK ===');
    console.log(
      'Netlify домен:',
      req.headers['x-forwarded-host'] || 'не определен'
    );
    console.log(
      'Netlify протокол:',
      req.headers['x-forwarded-proto'] || 'не определен'
    );
    console.log('Netlify URL:', req.headers['x-url'] || 'не определен');
    console.log(
      'Netlify оригинальный URL:',
      req.headers['x-original-url'] || 'не определен'
    );
    console.log(
      'Netlify переадресация:',
      req.headers['x-forwarded-for'] || 'не определен'
    );
    console.log(
      'Netlify запрос через:',
      req.headers['x-forwarded-server'] || 'не определен'
    );
    console.log(
      'Netlify порт:',
      req.headers['x-forwarded-port'] || 'не определен'
    );
    console.log('Netlify схема:', req.headers['x-scheme'] || 'не определен');
    console.log('Netlify хост:', req.headers['host'] || 'не определен');
    console.log('Netlify origin:', req.headers['origin'] || 'не определен');
    console.log('Netlify referer:', req.headers['referer'] || 'не определен');
    console.log(
      'GOOGLE_CALLBACK_URL из env:',
      process.env.GOOGLE_CALLBACK_URL || 'не установлен'
    );
    next();
  },
  passport.authenticate('google', { session: false }),
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Аутентификация Google OAuth успешна');
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
        // Используем порт 3000, на котором запущен фронтенд
        // Обновляем URL перенаправления с токеном
        const redirectUrl = `${FRONTEND_URL}/auth-callback?token=${token}`;
        console.log('=== ОТЛАДКА ПЕРЕНАПРАВЛЕНИЯ С ТОКЕНОМ ===');
        console.log('Токен получен:', token ? 'Да' : 'Нет');
        console.log('Длина токена:', token ? token.length : 0);
        console.log('=== ПЕРЕНАПРАВЛЕНИЕ ПОСЛЕ АУТЕНТИФИКАЦИИ ===');
        console.log('Перенаправление на:', redirectUrl);
        console.log('FRONTEND_URL из конфигурации:', FRONTEND_URL);
        console.log('FRONTEND_PORT из конфигурации:', FRONTEND_PORT);
        console.log(
          'FRONTEND_URL из env:',
          process.env.FRONTEND_URL || 'не установлен'
        );
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('HOST:', process.env.HOST);
        console.log('PORT:', process.env.PORT);
        console.log(
          'Полный URL обратного вызова:',
          `${req.protocol}://${req.get('host')}/api/google/callback`
        );
        console.log(
          'Удаленное подключение к базе данных:',
          process.env.MONGO_URI ? 'Да' : 'Нет'
        );
        console.log(
          'Удаленное подключение к Redis:',
          process.env.REDIS_HOST ? 'Да' : 'Нет'
        );

        res.redirect(redirectUrl);
      });
    } catch (error) {
      console.error('Ошибка при обработке Google OAuth callback:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }) as RequestHandler
);

export default router;
