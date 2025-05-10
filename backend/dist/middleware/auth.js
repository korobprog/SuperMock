"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.JWT_SECRET = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const InMemoryUser_1 = require("../models/InMemoryUser");
// Секретный ключ для JWT
exports.JWT_SECRET = process.env.JWT_SECRET || 'mock_interview_secret_key';
// Middleware для проверки JWT-токена
const auth = async (req, res, next) => {
    console.log('Middleware auth: Проверка токена');
    console.log('Заголовки запроса:', req.headers);
    // Получаем токен из заголовка Authorization
    const authHeader = req.header('Authorization');
    console.log('Заголовок Authorization:', authHeader);
    // Проверяем наличие токена
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Токен не предоставлен или неверный формат');
        res.status(401).json({ message: 'Доступ запрещен. Токен не предоставлен' });
        return;
    }
    // Извлекаем токен из заголовка
    const token = authHeader.replace('Bearer ', '');
    console.log('Извлеченный токен (первые 10 символов):', token.substring(0, 10) + '...');
    try {
        // Верифицируем токен
        const decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
        console.log('Токен успешно верифицирован');
        console.log('Данные пользователя:', decoded.user);
        // Добавляем информацию о пользователе в объект запроса
        req.user = decoded.user;
        // Проверяем, существует ли пользователь в базе данных
        const user = await InMemoryUser_1.InMemoryUser.findById(req.user.id);
        // Если пользователь не найден, создаем его
        if (!user) {
            console.log('Пользователь не найден в базе данных. Создаем нового пользователя.');
            // Создаем нового пользователя с тем же ID
            const newUser = new InMemoryUser_1.InMemoryUser({
                email: `user_${req.user.id}@example.com`, // Временный email
                password: 'temporary_password', // Временный пароль
                googleId: req.user.googleId,
                googleAccessToken: req.user.googleAccessToken,
            });
            // Устанавливаем ID из токена
            newUser.id = req.user.id;
            // Сохраняем пользователя
            await newUser.save();
            console.log('Создан новый пользователь с ID:', req.user.id);
        }
        next();
    }
    catch (error) {
        console.error('Ошибка верификации токена:', error.message);
        res.status(401).json({ message: 'Недействительный токен' });
    }
};
exports.auth = auth;
//# sourceMappingURL=auth.js.map