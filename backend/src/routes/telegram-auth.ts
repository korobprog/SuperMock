import express, { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const router = express.Router();

// Получаем токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Простой тестовый маршрут
router.get('/telegram-test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Telegram auth routes are working!',
    timestamp: new Date().toISOString(),
    botToken: BOT_TOKEN ? 'configured' : 'not configured'
  });
});

// Функция для валидации данных от Telegram
function validateTelegramAuth(data: any, botToken: string): boolean {
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  const checkHash = data.hash;
  const dataToCheck = { ...data };
  delete dataToCheck.hash;

  const dataCheckString = Object.keys(dataToCheck)
    .sort()
    .map((key) => `${key}=${dataToCheck[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hash === checkHash;
}

// POST /api/telegram-auth-callback - обработка данных от Telegram виджета (POST)
router.post('/telegram-auth-callback', async (req: Request, res: Response) => {
  try {
    console.log('=== TELEGRAM AUTH CALLBACK (POST) ===');
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);

    // Получаем данные авторизации из body
    const {
      id,
      first_name,
      last_name,
      username,
      photo_url,
      auth_date,
      hash,
    } = req.body;

    // Проверяем наличие обязательных полей
    if (!id || !first_name || !auth_date || !hash) {
      console.error('Missing required fields:', { id, first_name, auth_date, hash });
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Не все обязательные поля получены от Telegram'
      });
    }

    // Валидируем данные от Telegram
    if (!validateTelegramAuth(req.body, BOT_TOKEN || '')) {
      console.error('Invalid Telegram auth data');
      return res.status(401).json({ 
        error: 'Invalid auth data',
        message: 'Неверные данные авторизации от Telegram'
      });
    }

    console.log('Telegram auth data validated successfully');

    // Создаем или обновляем пользователя в базе данных
    const telegramUser = {
      id: String(id),
      first_name: String(first_name),
      last_name: String(last_name || ''),
      username: String(username || ''),
      photo_url: String(photo_url || ''),
      auth_date: Number(auth_date),
      hash: String(hash),
    };

    console.log('Processing user:', telegramUser);

    // Временно создаем простого пользователя без базы данных
    const userId = `user_${telegramUser.id}_${Date.now()}`;
    
    console.log('User processed successfully:', userId);

    // Создаем JWT токен
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
    
    const token = jwt.sign(
      { 
        userId: userId,
        tgId: telegramUser.id,
        type: 'telegram'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Возвращаем успешный ответ с токеном
    res.json({
      success: true,
      message: 'Авторизация успешна',
      token: token,
      user: {
        id: userId,
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url
      }
    });

  } catch (error) {
    console.error('Error in Telegram auth callback (POST):', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера при обработке авторизации'
    });
  }
});

// GET /api/telegram-auth-callback - обработка callback от Telegram виджета (GET)
router.get('/telegram-auth-callback', async (req: Request, res: Response) => {
  try {
    console.log('=== TELEGRAM AUTH CALLBACK (GET) ===');
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);

    // Получаем данные авторизации из query параметров
    const {
      id,
      first_name,
      last_name,
      username,
      photo_url,
      auth_date,
      hash,
    } = req.query;

    // Проверяем наличие обязательных полей
    if (!id || !first_name || !auth_date || !hash) {
      console.error('Missing required fields:', { id, first_name, auth_date, hash });
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Не все обязательные поля получены от Telegram'
      });
    }

    // Валидируем данные от Telegram
    if (!validateTelegramAuth(req.query, BOT_TOKEN || '')) {
      console.error('Invalid Telegram auth data');
      return res.status(401).json({ 
        error: 'Invalid auth data',
        message: 'Неверные данные авторизации от Telegram'
      });
    }

    console.log('Telegram auth data validated successfully');

    // Создаем или обновляем пользователя в базе данных
    const telegramUser = {
      id: String(id),
      first_name: String(first_name),
      last_name: String(last_name || ''),
      username: String(username || ''),
      photo_url: String(photo_url || ''),
      auth_date: Number(auth_date),
      hash: String(hash),
    };

    console.log('Processing user:', telegramUser);

    // Временно создаем простого пользователя без базы данных
    const userId = `user_${telegramUser.id}_${Date.now()}`;
    
    console.log('User processed successfully:', userId);

    // Создаем JWT токен
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
    
    const token = jwt.sign(
      { 
        userId: userId,
        tgId: telegramUser.id,
        type: 'telegram'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Перенаправляем на frontend с токеном
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.supermock.ru';
    const redirectUrl = `${frontendUrl}/telegram-auth-success?token=${token}&userId=${userId}`;
    
    console.log('Redirecting to:', redirectUrl);
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Error in Telegram auth callback (GET):', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера при обработке авторизации'
    });
  }
});

// GET /api/telegram-bot-check - проверка доступности бота
router.get('/telegram-bot-check', async (req: Request, res: Response) => {
  try {
    if (!BOT_TOKEN) {
      return res.json({ available: false, reason: 'Bot token not configured' });
    }

    // Проверяем доступность бота через Telegram API
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const data = await response.json() as any;

    if (data.ok) {
      res.json({ 
        available: true, 
        bot: data.result,
        message: 'Telegram бот доступен'
      });
    } else {
      res.json({ 
        available: false, 
        reason: 'Bot API error',
        error: data.description
      });
    }
  } catch (error) {
    console.error('Error checking bot availability:', error);
    res.json({ 
      available: false, 
      reason: 'Network error',
      error: (error as Error).message
    });
  }
});

export default router;
