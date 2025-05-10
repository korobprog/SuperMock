"use strict";
/**
 * Конфигурация приложения
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTEND_URL = exports.FRONTEND_PORT = exports.WEBSOCKET_PORT = exports.BACKEND_PORT = void 0;
exports.getRoomUrl = getRoomUrl;
exports.getRecordingUrl = getRecordingUrl;
// Порт бэкенда (фиксированный)
exports.BACKEND_PORT = 9877;
// Порт WebSocket сервера (фиксированный)
exports.WEBSOCKET_PORT = 9878;
// Порт фронтенда (фиксированный)
exports.FRONTEND_PORT = 5173;
// Базовый URL фронтенда
exports.FRONTEND_URL = `http://localhost:${exports.FRONTEND_PORT}`;
// Функция для получения URL комнаты
function getRoomUrl(roomId) {
    return `${exports.FRONTEND_URL}/video-chat/${roomId}`;
}
// Функция для получения URL записи
function getRecordingUrl(recordingId) {
    return `${exports.FRONTEND_URL}/recordings/${recordingId}`;
}
//# sourceMappingURL=app.js.map