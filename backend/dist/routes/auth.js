"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const InMemoryUser_1 = require("../models/InMemoryUser"); // Используем InMemoryUser вместо MongoDB
const auth_1 = require("../middleware/auth");
// Используем InMemoryUser как User для совместимости с кодом
const User = InMemoryUser_1.InMemoryUser;
// Маршрут для регистрации пользователя
// POST /api/register
router.post('/register', [
    // Валидация входных данных
    (0, express_validator_1.body)('email').isEmail().withMessage('Введите корректный email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Пароль должен содержать минимум 6 символов'),
], (async (req, res, next) => {
    try {
        // Проверяем результаты валидации
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { email, password } = req.body;
        // Проверяем, существует ли пользователь с таким email
        let user = await User.findOne({ email });
        if (user) {
            res
                .status(400)
                .json({ message: 'Пользователь с таким email уже существует' });
            return;
        }
        // Создаем нового пользователя
        user = new User({
            email,
            password,
        });
        // Сохраняем пользователя в хранилище
        // Пароль будет хешироваться автоматически в методе save()
        await user.save();
        // Создаем JWT-токен
        const payload = {
            user: {
                id: user.id, // Используем UUID из InMemoryUser
            },
        };
        jsonwebtoken_1.default.sign(payload, auth_1.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) {
                next(err);
                return;
            }
            res.json({ token });
        });
    }
    catch (error) {
        console.error('Ошибка при регистрации:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}));
// Маршрут для входа пользователя
// POST /api/login
router.post('/login', [
    // Валидация входных данных
    (0, express_validator_1.body)('email').isEmail().withMessage('Введите корректный email'),
    (0, express_validator_1.body)('password').exists().withMessage('Введите пароль'),
], (async (req, res, next) => {
    try {
        // Проверяем результаты валидации
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { email, password } = req.body;
        // Ищем пользователя по email
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Неверные учетные данные' });
            return;
        }
        // Проверяем пароль
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ message: 'Неверные учетные данные' });
            return;
        }
        // Создаем JWT-токен
        const payload = {
            user: {
                id: user.id,
            },
        };
        jsonwebtoken_1.default.sign(payload, auth_1.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) {
                next(err);
                return;
            }
            res.json({ token });
        });
    }
    catch (error) {
        console.error('Ошибка при входе:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}));
// Защищенный маршрут для получения данных пользователя
// GET /api/user
router.get('/user', auth_1.auth, (async (req, res) => {
    try {
        // Получаем пользователя из хранилища (без пароля)
        const userWithSelect = await User.findById(req.user.id);
        if (!userWithSelect) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }
        // Используем метод select для исключения пароля
        const user = userWithSelect.select('-password');
        // Добавляем статус обратной связи, если он не был включен
        if (user && !user.feedbackStatus) {
            user.feedbackStatus = userWithSelect.feedbackStatus || 'none';
        }
        res.json(user);
    }
    catch (error) {
        console.error('Ошибка при получении данных пользователя:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}));
// Маршрут для инициирования Google OAuth
// GET /auth/google
router.get('/auth/google', passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
}));
// Маршрут для обработки обратного вызова Google OAuth
// GET /google/callback
router.get('/auth/google/callback', passport_1.default.authenticate('google', { session: false }), (async (req, res, next) => {
    try {
        // Получаем пользователя из запроса (добавлен Passport)
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Ошибка аутентификации через Google' });
            return;
        }
        // Создаем JWT-токен
        const payload = {
            user: {
                id: user.id,
                googleId: user.googleId,
                googleAccessToken: user.googleAccessToken,
            },
        };
        jsonwebtoken_1.default.sign(payload, auth_1.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) {
                console.error('Ошибка при создании JWT-токена:', err);
                res.status(500).json({ message: 'Ошибка сервера' });
                return;
            }
            // Перенаправляем пользователя на фронтенд с токеном
            // Используем порт 5173, на котором запущен фронтенд
            res.redirect(`http://localhost:5173/auth-callback?token=${token}`);
        });
    }
    catch (error) {
        console.error('Ошибка при обработке Google OAuth callback:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}));
exports.default = router;
//# sourceMappingURL=auth.js.map