/**
 * Конфигурация приложения
 */

// Порт бэкенда (настраиваемый)
export const BACKEND_PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : 49226;

// Порт WebSocket сервера (фиксированный)
export const WEBSOCKET_PORT = 9878;

// Порт фронтенда (фиксированный)
export const FRONTEND_PORT = 3000;

// Базовый URL фронтенда
// В продакшн-режиме используем URL VPS Jino, иначе локальный URL
export const FRONTEND_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://c641b068463c.vps.myjino.ru'
    : `http://localhost:${FRONTEND_PORT}`;

// Логируем информацию о протоколе
console.log(
  `Используемый протокол: ${
    process.env.NODE_ENV === 'production' ? 'HTTPS' : 'HTTP'
  }`
);

// Логируем используемый URL фронтенда
console.log(`Используется FRONTEND_URL: ${FRONTEND_URL}`);

// Функция для получения URL комнаты
export function getRoomUrl(roomId: string): string {
  return `${FRONTEND_URL}/video-chat/${roomId}`;
}

// Функция для получения URL записи
export function getRecordingUrl(recordingId: string): string {
  return `${FRONTEND_URL}/recordings/${recordingId}`;
}
