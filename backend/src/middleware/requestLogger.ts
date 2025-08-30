/**
 * Middleware для логирования HTTP запросов
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../services/loggerService';

/**
 * Логирует информацию о входящих HTTP запросах
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Логируем базовую информацию о запросе
  console.log(`🌐 Request: ${req.method} ${req.url}`);
  console.log('🌐 Request details:', {
    method: req.method,
    url: req.url,
    origin: req.get('Origin'),
    host: req.get('Host'),
    query: req.query,
    body: req.body,
  });

  // В режиме отладки логируем дополнительную информацию
  logger.debug('Детали запроса', {
    headers: req.headers,
    protocol: req.protocol,
    secure: req.secure,
    'X-Forwarded-Proto': req.get('X-Forwarded-Proto'),
    Origin: req.get('Origin'),
    Referer: req.get('Referer'),
  });

  // Продолжаем обработку запроса
  next();
}

export default requestLogger;
