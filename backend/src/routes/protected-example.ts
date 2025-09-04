import express, { Request, Response } from 'express';
import { requireTelegramAuth, optionalTelegramAuth } from '../middleware/telegramAuth';

const router = express.Router();

/**
 * GET /api/protected/profile
 * Получение профиля пользователя (требует авторизации)
 */
router.get('/profile', requireTelegramAuth, async (req: Request, res: Response) => {
  try {
    // req.user доступен благодаря middleware requireTelegramAuth
    const user = req.user!;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt
      },
      message: 'Профиль получен успешно'
    });

  } catch (error) {
    console.error('❌ Ошибка при получении профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

/**
 * PUT /api/protected/profile
 * Обновление профиля пользователя (требует авторизации)
 */
router.put('/profile', requireTelegramAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { firstName, lastName, username } = req.body;

    // Здесь должна быть логика обновления пользователя в базе данных
    // Пока что просто возвращаем обновленные данные
    
    res.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        username: username || user.username,
        createdAt: user.createdAt
      },
      message: 'Профиль обновлен успешно'
    });

  } catch (error) {
    console.error('❌ Ошибка при обновлении профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

/**
 * GET /api/protected/dashboard
 * Получение данных дашборда (опциональная авторизация)
 */
router.get('/dashboard', optionalTelegramAuth, async (req: Request, res: Response) => {
  try {
    const isAuthenticated = !!req.user;
    
    let dashboardData: any = {
      isAuthenticated,
      publicData: {
        totalUsers: 1000,
        activeSessions: 50
      }
    };

    // Если пользователь авторизован, добавляем персональные данные
    if (isAuthenticated) {
      dashboardData.personalData = {
        userId: req.user!.id,
        phoneNumber: req.user!.phoneNumber,
        userSessions: 5,
        lastActivity: new Date()
      };
    }

    res.json({
      success: true,
      data: dashboardData,
      message: isAuthenticated ? 'Данные дашборда получены' : 'Публичные данные дашборда получены'
    });

  } catch (error) {
    console.error('❌ Ошибка при получении дашборда:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

/**
 * GET /api/protected/status
 * Проверка статуса авторизации
 */
router.get('/status', requireTelegramAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username
      },
      message: 'Пользователь авторизован'
    });

  } catch (error) {
    console.error('❌ Ошибка при проверке статуса:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

export default router;
