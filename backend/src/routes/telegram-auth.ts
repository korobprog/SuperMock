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
    console.error('❌ TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  console.log('🔍 Starting Telegram auth validation...');
  console.log('  - Bot token length:', botToken.length);
  console.log('  - Data keys:', Object.keys(data));

  const checkHash = data.hash;
  if (!checkHash) {
    console.error('❌ Hash not provided in data');
    return false;
  }

  const dataToCheck = { ...data };
  delete dataToCheck.hash;

  console.log('  - Data without hash:', dataToCheck);

  const dataCheckString = Object.keys(dataToCheck)
    .sort()
    .map((key) => `${key}=${dataToCheck[key]}`)
    .join('\n');

  console.log('  - Data check string:', dataCheckString);

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  console.log('  - Secret key (hex):', secretKey.toString('hex').substring(0, 16) + '...');

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  console.log('  - Computed hash:', hash);
  console.log('  - Received hash:', checkHash);
  console.log('  - Hash match:', hash === checkHash ? '✅ YES' : '❌ NO');

  return hash === checkHash;
}

// POST /api/telegram-auth-callback - обработка данных от Telegram виджета (POST)
router.post('/telegram-auth-callback', async (req: Request, res: Response) => {
  try {
    console.log('=== TELEGRAM AUTH CALLBACK (POST) ===');
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('User-Agent:', req.headers['user-agent']);

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

    console.log('📋 Parsed data:', {
      id: id ? `✅ ${id}` : '❌ missing',
      first_name: first_name ? `✅ ${first_name}` : '❌ missing',
      last_name: last_name ? `✅ ${last_name}` : '❌ missing',
      username: username ? `✅ ${username}` : '❌ missing',
      photo_url: photo_url ? `✅ ${photo_url}` : '❌ missing',
      auth_date: auth_date ? `✅ ${auth_date}` : '❌ missing',
      hash: hash ? `✅ ${hash}` : '❌ missing',
    });

    // Проверяем наличие обязательных полей
    if (!id || !first_name || !auth_date || !hash) {
      console.error('❌ Missing required fields:', { id, first_name, auth_date, hash });
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Не все обязательные поля получены от Telegram',
        received: req.body,
        required: ['id', 'first_name', 'auth_date', 'hash']
      });
    }

    // Валидируем данные от Telegram
    if (!validateTelegramAuth(req.body, BOT_TOKEN || '')) {
      console.error('❌ Invalid Telegram auth data');
      console.error('🔍 Validation details:');
      console.error('  - Bot token configured:', !!BOT_TOKEN);
      console.error('  - Received hash:', hash);
      console.error('  - Data to validate:', JSON.stringify(req.body, null, 2));
      return res.status(401).json({ 
        error: 'Invalid auth data',
        message: 'Неверные данные авторизации от Telegram',
        details: 'Проверьте настройки бота и домена в BotFather'
      });
    }

    console.log('✅ Telegram auth data validated successfully');

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

    console.log('👤 Processing user:', telegramUser);

    // Временно создаем простого пользователя без базы данных
    const userId = `user_${telegramUser.id}_${Date.now()}`;
    
    console.log('✅ User processed successfully:', userId);

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

    console.log('🔐 JWT token created successfully');

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
    console.error('❌ Error in Telegram auth callback (POST):', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера при обработке авторизации',
      details: error instanceof Error ? error.message : 'Unknown error'
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

// POST /api/telegram-generate-auth-token - генерация временного токена для авторизации
router.post('/telegram-generate-auth-token', async (req: Request, res: Response) => {
  try {
    console.log('=== TELEGRAM GENERATE AUTH TOKEN ===');
    console.log('Body:', req.body);

    const { telegramId, firstName, username } = req.body;

    if (!telegramId) {
      return res.status(400).json({ 
        error: 'Missing telegramId',
        message: 'Telegram ID обязателен для генерации токена'
      });
    }

    // Создаем временный токен (действует 5 минут)
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
    const tempToken = jwt.sign(
      { 
        telegramId: String(telegramId),
        firstName: firstName || '',
        username: username || '',
        type: 'telegram_temp_auth',
        purpose: 'bot_to_web_auth'
      },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    console.log('✅ Temporary auth token generated for telegramId:', telegramId);

    res.json({
      success: true,
      token: tempToken,
      expiresIn: '5m',
      message: 'Временный токен авторизации создан'
    });

  } catch (error) {
    console.error('❌ Error generating auth token:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Ошибка при генерации токена авторизации'
    });
  }
});

// GET /api/telegram-auth-status - проверка статуса авторизации пользователя
router.get('/telegram-auth-status', async (req: Request, res: Response) => {
  try {
    console.log('=== TELEGRAM AUTH STATUS CHECK ===');
    console.log('Query params:', req.query);

    const { telegramId } = req.query;

    if (!telegramId) {
      return res.status(400).json({ 
        error: 'Missing telegramId',
        message: 'Telegram ID обязателен для проверки статуса'
      });
    }

    // Проверяем, есть ли пользователь в базе данных
    // Пока что просто возвращаем статус "не авторизован"
    // В будущем можно добавить проверку в базе данных
    
    console.log('✅ Auth status checked for telegramId:', telegramId);

    res.json({
      success: true,
      telegramId: String(telegramId),
      isAuthorized: false, // Всегда false для повторной авторизации
      message: 'Пользователь не авторизован'
    });

  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Ошибка при проверке статуса авторизации'
    });
  }
});

// GET /api/telegram-auth-by-token - авторизация по временному токену
router.get('/telegram-auth-by-token', async (req: Request, res: Response) => {
  try {
    console.log('=== TELEGRAM AUTH BY TOKEN ===');
    console.log('Query params:', req.query);

    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        error: 'Missing token',
        message: 'Токен авторизации обязателен'
      });
    }

    // Валидируем токен
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
    let decoded: any;
    
    try {
      decoded = jwt.verify(String(token), JWT_SECRET);
    } catch (jwtError) {
      console.error('❌ Invalid token:', jwtError);
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Неверный или истекший токен авторизации'
      });
    }

    if (decoded.type !== 'telegram_temp_auth' || decoded.purpose !== 'bot_to_web_auth') {
      return res.status(401).json({ 
        error: 'Invalid token type',
        message: 'Неверный тип токена'
      });
    }

    console.log('✅ Token validated for telegramId:', decoded.telegramId);

    // Создаем постоянный JWT токен для пользователя
    const userId = `user_${decoded.telegramId}_${Date.now()}`;
    
    const permanentToken = jwt.sign(
      { 
        userId: userId,
        tgId: decoded.telegramId,
        type: 'telegram'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Permanent token created for user:', userId);

    // Перенаправляем на frontend с токеном
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.supermock.ru';
    const redirectUrl = `${frontendUrl}/telegram-auth-success?token=${permanentToken}&userId=${userId}&telegramId=${decoded.telegramId}`;
    
    console.log('Redirecting to:', redirectUrl);
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Error in telegram auth by token:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Ошибка при авторизации по токену'
    });
  }
});

export default router;
