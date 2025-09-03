import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получаем токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://app.supermock.ru';

/**
 * Валидация данных от Telegram Login Widget
 * Согласно официальной документации: https://core.telegram.org/widgets/login
 */
function validateTelegramAuth(data: any, botToken: string): boolean {
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  // Получаем hash из данных
  const checkHash = data.hash;
  if (!checkHash) {
    console.error('❌ Hash not provided');
    return false;
  }

  // Создаем копию данных без hash для проверки
  const dataToCheck = { ...data };
  delete dataToCheck.hash;

  // Сортируем ключи и создаем строку для проверки
  const dataCheckString = Object.keys(dataToCheck)
    .sort()
    .map((key) => `${key}=${dataToCheck[key]}`)
    .join('\n');

  console.log('🔍 Data check string:', dataCheckString);

  // Создаем секретный ключ из токена бота
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  
  // Вычисляем HMAC-SHA256
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  console.log('🔍 Computed hash:', hash);
  console.log('🔍 Received hash:', checkHash);

  const isValid = hash === checkHash;
  console.log('🔍 Hash validation:', isValid ? '✅ SUCCESS' : '❌ FAILED');

  return isValid;
}

/**
 * GET /auth/callback - обработка callback'а от Telegram Login Widget
 * Этот endpoint должен быть доступен по адресу https://app.supermock.ru/auth/callback
 */
router.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    console.log('=== TELEGRAM LOGIN WIDGET CALLBACK ===');
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
      console.error('❌ Missing required fields:', { id, first_name, auth_date, hash });
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Не все обязательные поля получены от Telegram'
      });
    }

    // Валидируем данные от Telegram
    if (!validateTelegramAuth(req.query, BOT_TOKEN || '')) {
      console.error('❌ Invalid Telegram auth data');
      return res.status(401).json({ 
        error: 'Invalid auth data',
        message: 'Неверные данные авторизации от Telegram'
      });
    }

    console.log('✅ Telegram auth data validated successfully');

    // Проверяем время авторизации (не старше 1 часа)
    const authTime = Number(auth_date) * 1000; // конвертируем в миллисекунды
    const currentTime = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 час
    
    if (currentTime - authTime > maxAge) {
      console.warn('⚠️ OAuth data too old for user:', id);
      return res.status(401).json({
        error: 'Auth data expired',
        message: 'Данные авторизации устарели'
      });
    }

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

    // Ищем пользователя по Telegram ID
    let user = await prisma.user.findFirst({
      where: {
        tgId: telegramUser.id,
      },
    });

    if (user) {
      // Обновляем существующего пользователя
      console.log('🔄 Updating existing user:', user.id);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          tgId: telegramUser.id,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Создаем нового пользователя
      console.log('🆕 Creating new user with Telegram ID:', telegramUser.id);
      
      // Генерируем уникальный ID для пользователя
      const userId = `user_${telegramUser.id}_${Date.now()}`;
      
      user = await prisma.user.create({
        data: {
          id: userId,
          tgId: telegramUser.id,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
    }

    console.log('✅ User processed successfully:', user.id);

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id,
        tgId: telegramUser.id,
        type: 'telegram',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 дней
      },
      JWT_SECRET
    );

    // Перенаправляем на frontend с токеном
    const redirectUrl = `${FRONTEND_URL}/auth/callback?token=${token}&userId=${user.id}&success=true`;
    
    console.log('🔄 Redirecting to:', redirectUrl);
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Error in Telegram auth callback:', error);
    
    // В случае ошибки перенаправляем на frontend с сообщением об ошибке
    const errorRedirectUrl = `${FRONTEND_URL}/auth/callback?error=auth_failed&message=${encodeURIComponent('Ошибка авторизации')}`;
    
    res.redirect(errorRedirectUrl);
  }
});

/**
 * POST /auth/telegram/callback - альтернативный endpoint для обработки данных
 * Используется для AJAX запросов
 */
router.post('/auth/telegram/callback', async (req: Request, res: Response) => {
  try {
    console.log('=== TELEGRAM LOGIN WIDGET POST CALLBACK ===');
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);

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
      console.error('❌ Missing required fields:', { id, first_name, auth_date, hash });
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Не все обязательные поля получены от Telegram'
      });
    }

    // Валидируем данные от Telegram
    if (!validateTelegramAuth(req.body, BOT_TOKEN || '')) {
      console.error('❌ Invalid Telegram auth data');
      return res.status(401).json({ 
        error: 'Invalid auth data',
        message: 'Неверные данные авторизации от Telegram'
      });
    }

    console.log('✅ Telegram auth data validated successfully');

    // Проверяем время авторизации
    const authTime = Number(auth_date) * 1000;
    const currentTime = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 час
    
    if (currentTime - authTime > maxAge) {
      console.warn('⚠️ OAuth data too old for user:', id);
      return res.status(401).json({
        error: 'Auth data expired',
        message: 'Данные авторизации устарели'
      });
    }

    // Создаем или обновляем пользователя
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

    let user = await prisma.user.findFirst({
      where: { tgId: telegramUser.id },
    });

    if (user) {
      console.log('🔄 Updating existing user:', user.id);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          tgId: telegramUser.id,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          lastLoginAt: new Date(),
        },
      });
    } else {
      console.log('🆕 Creating new user with Telegram ID:', telegramUser.id);
      const userId = `user_${telegramUser.id}_${Date.now()}`;
      
      user = await prisma.user.create({
        data: {
          id: userId,
          tgId: telegramUser.id,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
    }

    console.log('✅ User processed successfully:', user.id);

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id,
        tgId: telegramUser.id,
        type: 'telegram',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 дней
      },
      JWT_SECRET
    );

    // Возвращаем успешный ответ с токеном
    res.json({
      success: true,
      message: 'Авторизация через Telegram успешна',
      user: {
        id: user.id,
        tgId: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url,
      },
      token,
    });

  } catch (error) {
    console.error('❌ Error in Telegram auth POST callback:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера при обработке авторизации'
    });
  }
});

/**
 * GET /auth/telegram/status - проверка статуса авторизации
 */
router.get('/auth/telegram/status', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Токен не предоставлен'
      });
    }

    // Проверяем JWT токен
    const decoded = jwt.verify(String(token), JWT_SECRET) as any;
    
    if (decoded.type !== 'telegram') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'Неверный тип токена'
      });
    }

    // Получаем пользователя из базы
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        tgId: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      user,
      token: String(token),
    });

  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Недействительный токен'
    });
  }
});

export default router;
