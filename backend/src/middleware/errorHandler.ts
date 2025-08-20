/**
 * Middleware для обработки ошибок
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../services/loggerService';
import databaseService from '../services/databaseService';

/**
 * Обрабатывает ошибки API
 */
export function apiErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Логируем ошибку
  logger.error('API ошибка:', err);

  // Логируем детали запроса
  logger.debug('Детали запроса при ошибке:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    protocol: req.protocol,
    secure: req.secure,
    originalUrl: req.originalUrl,
  });

  // Проверяем подключение к MongoDB, если используется
  if (process.env.USE_MONGODB === 'true') {
    logger.debug('Проверка подключения к MongoDB при ошибке API...');

    // Асинхронно проверяем подключение к MongoDB
    databaseService
      .checkMongoDBConnection()
      .then((result) => {
        if (result.success) {
          logger.info('Успешное подключение к MongoDB при ошибке API');
        } else {
          logger.error(
            'Ошибка подключения к MongoDB при ошибке API:',
            result.message
          );
        }
      })
      .catch((mongoErr) => {
        logger.error('Ошибка при проверке MongoDB при ошибке API:', mongoErr);
      });
  }

  // Проверяем подключение к Redis, если используется
  if (process.env.USE_REDIS === 'true') {
    logger.debug('Проверка подключения к Redis...', {
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
    });
  }

  // Отправляем информативный ответ об ошибке
  res.status(500).json({
    message: 'Что-то пошло не так на сервере!',
    error:
      process.env.NODE_ENV !== 'production'
        ? { name: err.name, message: err.message }
        : undefined,
  });
}

/**
 * Обрабатывает общие ошибки
 */
export function generalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Логируем ошибку
  logger.error('Ошибка сервера:', err);

  // Отправляем ответ об ошибке
  res.status(500).json({
    message: 'Что-то пошло не так на сервере!',
  });
}

export default {
  apiErrorHandler,
  generalErrorHandler,
};
