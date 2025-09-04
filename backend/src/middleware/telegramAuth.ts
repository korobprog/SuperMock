import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { telegramAuthService } from '../services/telegramAuthService';

// Интерфейс для Telegram пользователя
interface TelegramUser {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
}

// Расширяем интерфейс Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
    }
  }
}

/**
 * Middleware для проверки авторизации через Telegram
 */
export const requireTelegramAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Токен авторизации не предоставлен'
      });
      return;
    }

    const token = authHeader.substring(7); // Убираем "Bearer "
    
    // Проверяем токен через сервис
    const result = await telegramAuthService.getUserByToken(token);
    
    if (!result.success) {
      res.status(401).json({
        success: false,
        message: result.message
      });
      return;
    }

    // Добавляем пользователя в запрос
    req.telegramUser = result.user;
    next();

  } catch (error) {
    console.error('❌ Ошибка в middleware авторизации:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при проверке авторизации'
    });
  }
};

/**
 * Middleware для опциональной авторизации через Telegram
 * Не блокирует запрос, если токен отсутствует или неверен
 */
export const optionalTelegramAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Проверяем токен через сервис
      const result = await telegramAuthService.getUserByToken(token);
      
      if (result.success) {
        // Добавляем пользователя в запрос, если токен валиден
        req.telegramUser = result.user;
      }
    }

    next();

  } catch (error) {
    console.error('❌ Ошибка в опциональном middleware авторизации:', error);
    // Не блокируем запрос при ошибке в опциональной авторизации
    next();
  }
};

/**
 * Middleware для проверки роли пользователя
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.telegramUser) {
      res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован'
      });
      return;
    }

    // В текущей реализации у нас нет ролей, но можно добавить в будущем
    // const userRole = req.telegramUser.role || 'user';
    
    // if (!allowedRoles.includes(userRole)) {
    //   res.status(403).json({
    //     success: false,
    //     message: 'Недостаточно прав доступа'
    //   });
    //   return;
    // }

    next();
  };
};

/**
 * Middleware для проверки, что пользователь является владельцем ресурса
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.telegramUser) {
      res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован'
      });
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (req.telegramUser.id !== resourceUserId) {
      res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Вы можете работать только со своими ресурсами'
      });
      return;
    }

    next();
  };
};
