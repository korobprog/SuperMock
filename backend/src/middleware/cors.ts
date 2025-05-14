/**
 * Middleware для настройки CORS
 * Позволяет фронтенду взаимодействовать с бэкендом
 */

import { Request, Response, NextFunction } from 'express';
import { FRONTEND_PORT } from '../config/app';
import logger from '../services/loggerService';

/**
 * Список разрешенных источников для CORS
 */
export const allowedOrigins = [
  // HTTP варианты
  `http://localhost:${FRONTEND_PORT}`,
  `http://127.0.0.1:${FRONTEND_PORT}`,
  // HTTPS варианты
  `https://localhost:${FRONTEND_PORT}`,
  `https://127.0.0.1:${FRONTEND_PORT}`,
  // Добавляем несколько соседних портов на случай, если основной порт занят
  `http://localhost:${Number(FRONTEND_PORT) + 1}`,
  `http://127.0.0.1:${Number(FRONTEND_PORT) + 1}`,
  `https://localhost:${Number(FRONTEND_PORT) + 1}`,
  `https://127.0.0.1:${Number(FRONTEND_PORT) + 1}`,
  `http://localhost:${Number(FRONTEND_PORT) + 2}`,
  `http://127.0.0.1:${Number(FRONTEND_PORT) + 2}`,
  `https://localhost:${Number(FRONTEND_PORT) + 2}`,
  `https://127.0.0.1:${Number(FRONTEND_PORT) + 2}`,
  // Добавляем порты, на которых может работать фронтенд
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://localhost:5174',
  'https://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'https://localhost:5175',
  'https://127.0.0.1:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5176',
  'https://localhost:5176',
  'https://127.0.0.1:5176',
  // В режиме разработки разрешаем запросы с любого порта
  'http://localhost:*',
  'http://127.0.0.1:*',
  'https://localhost:*',
  'https://127.0.0.1:*',
  // Добавляем новый домен
  'https://supermock.ru',
  // Добавляем IP-адрес сервера с портами
  'http://217.198.6.238:9091',
  'http://217.198.6.238:9092',
  'http://217.198.6.238:8443',
  'https://217.198.6.238:9091',
  'https://217.198.6.238:9092',
  'https://217.198.6.238:8443',
];

/**
 * Настройки CORS для Express
 */
export const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // Разрешаем передачу куки и заголовков авторизации
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

/**
 * Настраивает CORS заголовки для ответов
 */
export function setupCors(req: Request, res: Response, next: NextFunction) {
  // Получаем origin из заголовков запроса
  const origin = req.headers.origin;

  // Логируем информацию о запросе в режиме отладки
  logger.debug('CORS middleware', {
    origin,
    method: req.method,
    path: req.path,
  });

  // Разрешаем запросы с фронтенда
  // В production это будет https://supermock.ru
  if (origin) {
    // Проверяем, входит ли origin в список разрешенных
    // Или если это localhost с любым портом в режиме разработки
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin.endsWith('*')) {
        const prefix = allowedOrigin.slice(0, -1);
        return origin.startsWith(prefix);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      logger.warn(`Запрос с неразрешенного источника: ${origin}`);
    }
  } else {
    // Если origin не указан, разрешаем запросы с любого источника в режиме разработки
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }

  // Разрешаем указанные заголовки
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Разрешаем указанные методы
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  // Разрешаем отправку куки
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    logger.debug('Обработка preflight запроса');
    res.status(200).end();
    return;
  }

  // Продолжаем обработку запроса
  next();
}
