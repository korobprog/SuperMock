import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { telegramAuthService } from '../services/telegramAuthService';

const router = express.Router();

// Валидация номера телефона
const phoneValidation = [
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Неверный формат номера телефона'),
  body('telegramUserId')
    .optional()
    .isString()
    .withMessage('Telegram User ID должен быть строкой')
];

// Валидация кода верификации
const codeValidation = [
  body('codeId')
    .isString()
    .notEmpty()
    .withMessage('ID кода обязателен'),
  body('code')
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage('Код должен содержать 6 цифр')
    .matches(/^\d{6}$/)
    .withMessage('Код должен содержать только цифры'),
  body('userInfo')
    .optional()
    .isObject()
    .withMessage('Информация о пользователе должна быть объектом')
];

/**
 * POST /api/telegram-auth/send-code
 * Отправка кода верификации через Telegram бота
 */
router.post('/send-code', phoneValidation, async (req: Request, res: Response) => {
  try {
    console.log('=== ОТПРАВКА КОДА ВЕРИФИКАЦИИ ===');
    console.log('Body:', req.body);

    // Проверяем валидацию
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Ошибка валидации данных',
        details: errors.array()
      });
    }

    const { phoneNumber, telegramUserId } = req.body;

    // Отправляем код верификации
    const result = await telegramAuthService.sendVerificationCode(phoneNumber, telegramUserId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        codeId: result.codeId,
        expiresIn: result.expiresIn
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка в /send-code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

/**
 * POST /api/telegram-auth/verify-code
 * Проверка кода верификации
 */
router.post('/verify-code', codeValidation, async (req: Request, res: Response) => {
  try {
    console.log('=== ПРОВЕРКА КОДА ВЕРИФИКАЦИИ ===');
    console.log('Body:', req.body);

    // Проверяем валидацию
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Ошибка валидации данных',
        details: errors.array()
      });
    }

    const { codeId, code, userInfo } = req.body;

    // Проверяем код верификации
    const result = await telegramAuthService.verifyCode(codeId, code, userInfo);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        token: result.token,
        user: result.user
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка в /verify-code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

/**
 * GET /api/telegram-auth/me
 * Получение информации о текущем пользователе
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    console.log('=== ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ ===');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен авторизации не предоставлен'
      });
    }

    const token = authHeader.substring(7); // Убираем "Bearer "
    
    const result = await telegramAuthService.getUserByToken(token);

    if (result.success) {
      res.json({
        success: true,
        user: result.user,
        message: result.message
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('❌ Ошибка в /me:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

/**
 * GET /api/telegram-auth/stats
 * Получение статистики (только для отладки)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = telegramAuthService.getStats();
    
    res.json({
      success: true,
      stats,
      message: 'Статистика получена'
    });

  } catch (error) {
    console.error('❌ Ошибка в /stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

/**
 * POST /api/telegram-auth/refresh-token
 * Обновление токена авторизации
 */
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    console.log('=== ОБНОВЛЕНИЕ ТОКЕНА ===');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен авторизации не предоставлен'
      });
    }

    const oldToken = authHeader.substring(7);
    
    // Получаем пользователя по старому токену
    const userResult = await telegramAuthService.getUserByToken(oldToken);
    
    if (!userResult.success) {
      return res.status(401).json({
        success: false,
        message: userResult.message
      });
    }

    // Создаем новый токен
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
    
    const newToken = jwt.sign(
      {
        userId: userResult.user.id,
        phoneNumber: userResult.user.phoneNumber,
        type: 'telegram_auth',
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token: newToken,
      user: userResult.user,
      message: 'Токен успешно обновлен'
    });

  } catch (error) {
    console.error('❌ Ошибка в /refresh-token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

/**
 * POST /api/telegram-auth/logout
 * Выход из системы (в текущей реализации просто возвращаем успех)
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    console.log('=== ВЫХОД ИЗ СИСТЕМЫ ===');
    
    // В текущей реализации JWT токены не хранятся на сервере,
    // поэтому просто возвращаем успех
    // В будущем можно добавить blacklist токенов
    
    res.json({
      success: true,
      message: 'Выход выполнен успешно'
    });

  } catch (error) {
    console.error('❌ Ошибка в /logout:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

export default router;
