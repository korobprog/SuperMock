import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { InMemoryUser } from '../models/InMemoryUser';

// Расширяем интерфейс User для добавления наших полей
declare global {
  namespace Express {
    // Расширяем существующий интерфейс User из @types/passport
    interface User {
      id: string;
      googleId?: string;
      [key: string]: any;
    }
  }
}

// Секретный ключ для JWT
export const JWT_SECRET = process.env.JWT_SECRET || 'mock_interview_secret_key';

// Middleware для проверки JWT-токена
export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('=== MIDDLEWARE AUTH: ПРОВЕРКА ТОКЕНА ===');
  console.log('URL запроса:', req.originalUrl);
  console.log('Метод запроса:', req.method);
  console.log('IP клиента:', req.ip);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('Заголовки запроса:', req.headers);
  console.log('Cookies:', req.cookies);
  console.log('Параметры запроса:', req.query);
  console.log('Тело запроса:', req.body);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
  console.log(
    'GOOGLE_CLIENT_ID установлен:',
    process.env.GOOGLE_CLIENT_ID ? 'Да' : 'Нет'
  );
  console.log(
    'GOOGLE_CLIENT_SECRET установлен:',
    process.env.GOOGLE_CLIENT_SECRET ? 'Да' : 'Нет'
  );

  // Получаем токен из заголовка Authorization
  const authHeader = req.header('Authorization');
  console.log('Заголовок Authorization:', authHeader);

  // Проверяем наличие токена
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Токен не предоставлен или неверный формат');
    console.log('Полный заголовок Authorization:', authHeader);
    res.status(401).json({ message: 'Доступ запрещен. Токен не предоставлен' });
    return;
  }

  // Извлекаем токен из заголовка
  const token = authHeader.replace('Bearer ', '');
  console.log(
    'Извлеченный токен (первые 10 символов):',
    token.substring(0, 10) + '...'
  );
  console.log('Длина токена:', token.length);

  try {
    // Верифицируем токен
    console.log(
      'Попытка верификации токена с JWT_SECRET:',
      JWT_SECRET.substring(0, 5) + '...'
    );
    const decoded = jwt.verify(token, JWT_SECRET) as { user: { id: string } };
    console.log('Токен успешно верифицирован');
    console.log('Данные пользователя из токена:', decoded.user);

    // Добавляем информацию о пользователе в объект запроса
    req.user = decoded.user;
    console.log('Информация о пользователе добавлена в объект запроса');

    // Проверяем, существует ли пользователь в базе данных
    console.log(
      'Проверка существования пользователя в базе данных, ID:',
      req.user.id
    );
    const user = await InMemoryUser.findById(req.user.id);
    console.log(
      'Результат поиска пользователя:',
      user ? 'Найден' : 'Не найден'
    );

    // Если пользователь не найден, создаем его
    if (!user) {
      console.log(
        'Пользователь не найден в базе данных. Создаем нового пользователя.'
      );

      // Создаем нового пользователя с тем же ID
      const newUser = new InMemoryUser({
        email: `user_${req.user.id}@example.com`, // Временный email
        password: 'temporary_password', // Временный пароль
        googleId: req.user.googleId,
        googleAccessToken: req.user.googleAccessToken,
      });

      // Устанавливаем ID из токена
      newUser.id = req.user.id;
      console.log('Создан новый пользователь с данными:', {
        id: newUser.id,
        email: newUser.email,
        googleId: newUser.googleId || 'отсутствует',
      });

      // Сохраняем пользователя
      console.log('Попытка сохранения нового пользователя');
      await newUser.save();
      console.log('Новый пользователь успешно сохранен');
    } else {
      console.log('Найден существующий пользователь:', {
        id: user.id,
        email: user.email,
        googleId: user.googleId || 'отсутствует',
      });
    }

    console.log('Аутентификация успешна, переход к следующему middleware');
    next();
  } catch (error) {
    console.error('Ошибка верификации токена:', (error as Error).message);
    console.error('Стек ошибки:', (error as Error).stack);
    console.error(
      'Тип ошибки:',
      error instanceof Error ? 'Error' : typeof error
    );
    console.error('Полная ошибка:', error);
    res.status(401).json({ message: 'Недействительный токен' });
  }
};
