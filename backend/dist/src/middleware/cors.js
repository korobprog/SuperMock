"use strict";
/**
 * Middleware для настройки CORS
 * Позволяет фронтенду взаимодействовать с бэкендом
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCors = setupCors;
/**
 * Настраивает CORS заголовки для ответов
 */
function setupCors(req, res, next) {
    // Получаем origin из заголовков запроса
    const origin = req.headers.origin;
    // Добавляем логирование для отладки
    console.log('CORS middleware:', {
        origin,
        method: req.method,
        path: req.path,
        headers: req.headers,
    });
    // Разрешаем запросы с фронтенда
    // В production это будет https://supermock.ru
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else {
        // Если origin не указан, разрешаем запросы с любого источника
        // Это может быть полезно для разработки, но в production лучше ограничить
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    // Разрешаем указанные заголовки
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    // Разрешаем указанные методы
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // Разрешаем отправку куки
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Обрабатываем preflight запросы
    if (req.method === 'OPTIONS') {
        // Добавляем логирование для отладки
        console.log('Обработка preflight запроса');
        // Отвечаем на preflight запрос
        res.status(200).end();
        return;
    }
    // Продолжаем обработку запроса
    next();
}
//# sourceMappingURL=cors.js.map