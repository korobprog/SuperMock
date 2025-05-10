/**
 * Конфигурация приложения
 */

// Порт бэкенда (фиксированный)
export const BACKEND_PORT = 8080;

// Порт WebSocket сервера (фиксированный)
export const WEBSOCKET_PORT = 9878;

// Порт фронтенда (фиксированный)
export const FRONTEND_PORT = 3000;

// Базовый URL фронтенда
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

// Функция для получения URL комнаты
export function getRoomUrl(roomId: string): string {
  return `${FRONTEND_URL}/video-chat/${roomId}`;
}

// Функция для получения URL записи
export function getRecordingUrl(recordingId: string): string {
  return `${FRONTEND_URL}/recordings/${recordingId}`;
}
