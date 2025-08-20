/**
 * Конфигурация приложения
 */

import { frontend, server } from './index';

// Порт бэкенда (настраиваемый)
export const BACKEND_PORT = server.port;

// Порт WebSocket сервера (фиксированный)
export const WEBSOCKET_PORT = 9878;

// Порт фронтенда (настраиваемый) - используем значение из централизованной конфигурации
export const FRONTEND_PORT = frontend.port;

// Базовый URL фронтенда - используем значение из централизованной конфигурации
// Логируем информацию о переменных окружения
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log(
  'FRONTEND_URL из env:',
  process.env.FRONTEND_URL || 'не установлен'
);
console.log('DOMAIN из env:', process.env.DOMAIN || 'не установлен');

export const FRONTEND_URL = frontend.url;

// Логируем информацию о протоколе
console.log(
  `Используемый протокол: ${
    process.env.NODE_ENV === 'production' ? 'HTTPS' : 'HTTP'
  }`
);

// Логируем используемый URL фронтенда
console.log(`Используется FRONTEND_URL: ${FRONTEND_URL}`);

// Функция для получения URL комнаты - используем функцию из централизованной конфигурации
export function getRoomUrl(roomId: string): string {
  return frontend.getRoomUrl(roomId);
}

// Функция для получения URL записи
export function getRecordingUrl(recordingId: string): string {
  return `${FRONTEND_URL}/recordings/${recordingId}`;
}
