/**
 * Централизованный модуль конфигурации
 *
 * Этот модуль объединяет все настройки приложения в одном месте
 * и предоставляет доступ к ним через единый интерфейс.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import logger from '../services/loggerService';
import { validateEnv, setDefaultEnvVars } from './validation';

// Определяем текущее окружение
const nodeEnv = process.env.NODE_ENV || 'development';

// Загружаем переменные окружения из файлов .env
// Сначала загружаем общие настройки из .env
const defaultEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(defaultEnvPath)) {
  logger.debug(`Загрузка переменных окружения из ${defaultEnvPath}`);
  dotenv.config({ path: defaultEnvPath });
}

// Затем загружаем настройки для конкретного окружения из .env.{environment}
const envFilePath = path.resolve(__dirname, `../../../.env.${nodeEnv}`);
if (fs.existsSync(envFilePath)) {
  logger.debug(
    `Загрузка переменных окружения для ${nodeEnv} из ${envFilePath}`
  );
  dotenv.config({ path: envFilePath });
} else {
  logger.debug(
    `Файл .env.${nodeEnv} не найден, используются только общие настройки`
  );
}

// Устанавливаем значения по умолчанию и валидируем переменные окружения
setDefaultEnvVars();

try {
  validateEnv();
} catch (error) {
  logger.warn(
    `Ошибка валидации переменных окружения: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  logger.warn('Приложение продолжит работу с значениями по умолчанию');
}

/**
 * Серверная конфигурация
 */
export const server = {
  // Основные настройки сервера
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3002, // Изменяем порт по умолчанию с 3000 на 3002
  host: process.env.HOST || 'localhost',

  // Настройки CORS
  corsEnabled: true,
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['*'],

  // Настройки безопасности
  jwtSecret:
    process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};

/**
 * Конфигурация фронтенда
 */
export const frontend = {
  port: process.env.FRONTEND_PORT
    ? parseInt(process.env.FRONTEND_PORT, 10)
    : 3000,
  url:
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? `https://${process.env.DOMAIN || 'supermock.ru'}`
      : `http://localhost:${process.env.FRONTEND_PORT || 3000}`),

  // Функция для получения URL комнаты
  getRoomUrl: (roomId: string): string =>
    `${frontend.url}/video-chat/${roomId}`,

  // Функция для получения URL записи
  getRecordingUrl: (recordingId: string): string =>
    `${frontend.url}/recordings/${recordingId}`,
};

/**
 * Конфигурация базы данных MongoDB
 */
export const mongodb = {
  enabled: process.env.USE_MONGODB === 'true',
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/supermock',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

/**
 * Конфигурация Redis
 */
export const redis = {
  enabled: process.env.USE_REDIS === 'true',
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || '',

  // Формирует URL для подключения к Redis
  getUrl: (): string => {
    const auth = redis.password ? `default:${redis.password}@` : '';
    return `redis://${auth}${redis.host}:${redis.port}`;
  },
};

/**
 * Конфигурация Google OAuth
 */
export const googleOAuth = {
  enabled: Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ),
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    (process.env.NODE_ENV === 'production'
      ? `https://${
          process.env.DOMAIN || 'supermock.ru'
        }/api/auth/google/callback`
      : `http://localhost:${server.port}/api/auth/google/callback`),
  scope: ['profile', 'email'],
};

/**
 * Конфигурация WebSocket
 */
export const websocket = {
  port: server.port, // Используем тот же порт, что и для HTTP сервера
  path: '/socket.io',
  corsOrigin: frontend.url,
};

/**
 * Экспортируем все конфигурации
 */
export default {
  server,
  frontend,
  mongodb,
  redis,
  googleOAuth,
  websocket,
};
