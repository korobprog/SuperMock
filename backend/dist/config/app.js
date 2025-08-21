"use strict";
/**
 * Конфигурация приложения
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTEND_URL = exports.FRONTEND_PORT = exports.WEBSOCKET_PORT = exports.BACKEND_PORT = void 0;
exports.getRoomUrl = getRoomUrl;
exports.getRecordingUrl = getRecordingUrl;
const index_1 = require("./index");
// Порт бэкенда (настраиваемый)
exports.BACKEND_PORT = index_1.server.port;
// Порт WebSocket сервера (фиксированный)
exports.WEBSOCKET_PORT = 9878;
// Порт фронтенда (настраиваемый) - используем значение из централизованной конфигурации
exports.FRONTEND_PORT = index_1.frontend.port;
// Базовый URL фронтенда - используем значение из централизованной конфигурации
// Логируем информацию о переменных окружения
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL из env:', process.env.FRONTEND_URL || 'не установлен');
console.log('DOMAIN из env:', process.env.DOMAIN || 'не установлен');
exports.FRONTEND_URL = index_1.frontend.url;
// Логируем информацию о протоколе
console.log(`Используемый протокол: ${process.env.NODE_ENV === 'production' ? 'HTTPS' : 'HTTP'}`);
// Логируем используемый URL фронтенда
console.log(`Используется FRONTEND_URL: ${exports.FRONTEND_URL}`);
// Функция для получения URL комнаты - используем функцию из централизованной конфигурации
function getRoomUrl(roomId) {
    return index_1.frontend.getRoomUrl(roomId);
}
// Функция для получения URL записи
function getRecordingUrl(recordingId) {
    return `${exports.FRONTEND_URL}/recordings/${recordingId}`;
}
//# sourceMappingURL=app.js.map