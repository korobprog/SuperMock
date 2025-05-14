"use strict";
/**
 * Конфигурация приложения
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTEND_URL = exports.FRONTEND_PORT = exports.WEBSOCKET_PORT = exports.BACKEND_PORT = void 0;
exports.getRoomUrl = getRoomUrl;
exports.getRecordingUrl = getRecordingUrl;
// Порт бэкенда (настраиваемый)
exports.BACKEND_PORT = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 49226;
// Порт WebSocket сервера (фиксированный)
exports.WEBSOCKET_PORT = 9878;
// Порт фронтенда (настраиваемый)
exports.FRONTEND_PORT = process.env.FRONTEND_PORT
    ? parseInt(process.env.FRONTEND_PORT, 10)
    : 3001; // Используем 3001 по умолчанию, чтобы избежать конфликта с бэкендом
// Базовый URL фронтенда
// В продакшн-режиме используем URL VPS Jino, иначе локальный URL
// Логируем информацию о переменных окружения
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL из env:', process.env.FRONTEND_URL || 'не установлен');
console.log('DOMAIN из env:', process.env.DOMAIN || 'не установлен');
exports.FRONTEND_URL = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://supermock.ru/'
    : `http://localhost:${exports.FRONTEND_PORT}`;
// Логируем информацию о протоколе
console.log(`Используемый протокол: ${process.env.NODE_ENV === 'production' ? 'HTTPS' : 'HTTP'}`);
// Логируем используемый URL фронтенда
console.log(`Используется FRONTEND_URL: ${exports.FRONTEND_URL}`);
// Функция для получения URL комнаты
function getRoomUrl(roomId) {
    return `${exports.FRONTEND_URL}/video-chat/${roomId}`;
}
// Функция для получения URL записи
function getRecordingUrl(recordingId) {
    return `${exports.FRONTEND_URL}/recordings/${recordingId}`;
}
//# sourceMappingURL=app.js.map