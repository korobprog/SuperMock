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
// Порт фронтенда (фиксированный)
exports.FRONTEND_PORT = 3000;
// Базовый URL фронтенда
// В продакшн-режиме используем URL VPS Jino, иначе локальный URL
exports.FRONTEND_URL = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://supermock.netlify.app/'
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