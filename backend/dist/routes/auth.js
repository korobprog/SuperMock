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
const UserModel_1 = require("../models/UserModel"); // Импортируем функцию для получения модели
const auth_1 = require("../middleware/auth");
const app_1 = require("../config/app"); // Импортируем FRONTEND_PORT и FRONTEND_URL из конфигурации
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
        console.log('=== ОТЛАДКА РЕГИСТРАЦИИ ===');
        console.log('Получен запрос на регистрацию');
        console.log('Заголовки запроса:', req.headers);
        console.log('Тело запроса:', { ...req.body, password: '***скрыто***' });
        console.log('Origin:', req.headers.origin);
        console.log('Referer:', req.headers.referer);
        console.log('IP клиента:', req.ip);
        console.log('User-Agent:', req.headers['user-agent']);
        // Проверяем результаты валидации
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('Ошибки валидации:', errors.array());
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { email, password } = req.body;
        // Проверяем, существует ли пользователь с таким email
        console.log('Проверка существования пользователя с email:', email);
        const User = (0, UserModel_1.getCurrentUserModel)();
        let user = await User.findOne({ email });
        if (user) {
            console.log('Пользователь с таким email уже существует');
            res
                .status(400)
                .json({ message: 'Пользователь с таким email уже существует' });
            return;
        }
        console.log('Пользователь с таким email не найден, создаем нового');
        // Создаем нового пользователя
        user = new User({
            email,
            password,
        });
        // Сохраняем пользователя в хранилище
        // Пароль будет хешироваться автоматически в методе save()
        console.log('Сохранение пользователя в хранилище');
        try {
            await user.save();
            console.log('Пользователь успешно сохранен');
        }
        catch (saveError) {
            console.error('Ошибка при сохранении пользователя:', saveError);
            throw saveError;
        }
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
        console.error('Стек ошибки:', error.stack);
        console.error('Тип ошибки:', error instanceof Error ? 'Error' : typeof error);
        console.error('Полная ошибка:', error);
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
        const User = (0, UserModel_1.getCurrentUserModel)();
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
        console.log('=== ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ===');
        console.log('ID пользователя из токена:', req.user?.id);
        console.log('Заголовки запроса:', req.headers);
        console.log('Метод запроса:', req.method);
        console.log('URL запроса:', req.originalUrl);
        console.log('IP клиента:', req.ip);
        console.log('User-Agent:', req.headers['user-agent']);
        console.log('Cookies:', req.cookies);
        console.log('Параметры запроса:', req.query);
        console.log('Тело запроса:', req.body);
        const User = (0, UserModel_1.getCurrentUserModel)();
        console.log('Используемая модель пользователя:', User.name || 'Неизвестно');
        console.log('USE_MONGODB:', process.env.USE_MONGODB);
        console.log('MONGO_URI установлен:', process.env.MONGO_URI ? 'Да' : 'Нет');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        // Получаем пользователя из хранилища (без пароля)
        console.log('Попытка найти пользователя по ID:', req.user?.id);
        const userWithSelect = await User.findById(req.user.id);
        console.log('Результат поиска пользователя:', userWithSelect ? 'Найден' : 'Не найден');
        if (!userWithSelect) {
            console.log('Пользователь не найден в базе данных');
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }
        console.log('Данные пользователя (без пароля):', {
            id: userWithSelect.id,
            email: userWithSelect.email,
            googleId: userWithSelect.googleId || 'отсутствует',
            feedbackStatus: userWithSelect.feedbackStatus || 'none',
        });
        // Используем метод select для исключения пароля
        console.log('Применение метода select для исключения пароля');
        const user = userWithSelect.select('-password');
        console.log('Результат после select:', user ? 'Успешно' : 'Ошибка');
        // Добавляем статус обратной связи, если он не был включен
        if (user && !user.feedbackStatus) {
            console.log('Добавление статуса обратной связи');
            user.feedbackStatus = userWithSelect.feedbackStatus || 'none';
        }
        console.log('Отправка данных пользователя клиенту');
        res.json(user);
    }
    catch (error) {
        console.error('Ошибка при получении данных пользователя:', error.message);
        console.error('Стек ошибки:', error.stack);
        console.error('Тип ошибки:', error instanceof Error ? 'Error' : typeof error);
        console.error('Полная ошибка:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}));
// Маршрут для инициирования Google OAuth
// GET /api/auth/google (с учетом префикса в server.ts)
router.get('/auth/google', (req, res, next) => {
    console.log('=== ИНИЦИИРОВАНИЕ GOOGLE OAUTH ===');
    console.log('Запрос на аутентификацию Google OAuth');
    console.log('URL запроса:', req.originalUrl);
    console.log('Заголовки запроса:', req.headers);
    console.log('Полный URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log('Netlify редирект информация:');
    console.log('x-nf-request-id:', req.headers['x-nf-request-id']);
    console.log('Netlify URL:', req.headers['x-url']);
    console.log('Netlify оригинальный URL:', req.headers['x-original-url']);
    console.log('Ожидаемый callback URL:', `${req.protocol}://${req.get('host')}/api/google/callback`);
    console.log('GOOGLE_CALLBACK_URL из env:', process.env.GOOGLE_CALLBACK_URL || 'не установлен');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('HOST:', process.env.HOST);
    console.log('PORT:', process.env.PORT);
    console.log('FRONTEND_URL из env:', process.env.FRONTEND_URL || 'не установлен');
    console.log('FRONTEND_URL из конфигурации:', app_1.FRONTEND_URL);
    console.log('FRONTEND_PORT из конфигурации:', app_1.FRONTEND_PORT);
    console.log('Удаленное подключение к базе данных:', process.env.MONGO_URI ? 'Да' : 'Нет');
    console.log('Удаленное подключение к Redis:', process.env.REDIS_HOST ? 'Да' : 'Нет');
    console.log('=== ОТЛАДКА NETLIFY ПЕРЕМЕННЫХ ===');
    console.log('Netlify домен:', req.headers['x-forwarded-host'] || 'не определен');
    console.log('Netlify протокол:', req.headers['x-forwarded-proto'] || 'не определен');
    console.log('Netlify URL:', req.headers['x-url'] || 'не определен');
    console.log('Netlify оригинальный URL:', req.headers['x-original-url'] || 'не определен');
    console.log('Netlify переадресация:', req.headers['x-forwarded-for'] || 'не определен');
    console.log('Netlify запрос через:', req.headers['x-forwarded-server'] || 'не определен');
    console.log('Netlify порт:', req.headers['x-forwarded-port'] || 'не определен');
    console.log('Netlify схема:', req.headers['x-scheme'] || 'не определен');
    console.log('Netlify хост:', req.headers['host'] || 'не определен');
    console.log('Netlify origin:', req.headers['origin'] || 'не определен');
    console.log('Netlify referer:', req.headers['referer'] || 'не определен');
    next();
}, passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
}));
// Маршрут для обработки обратного вызова Google OAuth
// GET /api/auth/google/callback
router.get('/auth/google/callback', (req, res, next) => {
    console.log('=== ОБРАБОТКА GOOGLE OAUTH CALLBACK ===');
    console.log('Получен callback от Google OAuth');
    console.log('URL запроса:', req.originalUrl);
    console.log('Заголовки запроса:', req.headers);
    console.log('Полный URL callback:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log('Netlify редирект информация для callback:');
    console.log('x-nf-request-id:', req.headers['x-nf-request-id']);
    console.log('Netlify URL:', req.headers['x-url']);
    console.log('Netlify оригинальный URL:', req.headers['x-original-url']);
    console.log('Netlify редирект статус:', req.headers['x-redirect-status']);
    console.log('Параметры запроса:', req.query);
    console.log('Ошибка (если есть):', req.query.error || 'нет');
    console.log('Код ошибки (если есть):', req.query.error_description || 'нет');
    console.log('=== ОТЛАДКА NETLIFY CALLBACK ===');
    console.log('Netlify домен:', req.headers['x-forwarded-host'] || 'не определен');
    console.log('Netlify протокол:', req.headers['x-forwarded-proto'] || 'не определен');
    console.log('Netlify URL:', req.headers['x-url'] || 'не определен');
    console.log('Netlify оригинальный URL:', req.headers['x-original-url'] || 'не определен');
    console.log('Netlify переадресация:', req.headers['x-forwarded-for'] || 'не определен');
    console.log('Netlify запрос через:', req.headers['x-forwarded-server'] || 'не определен');
    console.log('Netlify порт:', req.headers['x-forwarded-port'] || 'не определен');
    console.log('Netlify схема:', req.headers['x-scheme'] || 'не определен');
    console.log('Netlify хост:', req.headers['host'] || 'не определен');
    console.log('Netlify origin:', req.headers['origin'] || 'не определен');
    console.log('Netlify referer:', req.headers['referer'] || 'не определен');
    console.log('GOOGLE_CALLBACK_URL из env:', process.env.GOOGLE_CALLBACK_URL || 'не установлен');
    next();
}, passport_1.default.authenticate('google', { session: false }), (async (req, res, next) => {
    try {
        console.log('Аутентификация Google OAuth успешна');
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
            // Используем порт 3000, на котором запущен фронтенд
            // Обновляем URL перенаправления с токеном
            const redirectUrl = `${app_1.FRONTEND_URL}/auth-callback?token=${token}`;
            console.log('=== ОТЛАДКА ПЕРЕНАПРАВЛЕНИЯ С ТОКЕНОМ ===');
            console.log('Токен получен:', token ? 'Да' : 'Нет');
            console.log('Длина токена:', token ? token.length : 0);
            console.log('=== ПЕРЕНАПРАВЛЕНИЕ ПОСЛЕ АУТЕНТИФИКАЦИИ ===');
            console.log('Перенаправление на:', redirectUrl);
            console.log('FRONTEND_URL из конфигурации:', app_1.FRONTEND_URL);
            console.log('FRONTEND_PORT из конфигурации:', app_1.FRONTEND_PORT);
            console.log('FRONTEND_URL из env:', process.env.FRONTEND_URL || 'не установлен');
            console.log('NODE_ENV:', process.env.NODE_ENV);
            console.log('HOST:', process.env.HOST);
            console.log('PORT:', process.env.PORT);
            console.log('Полный URL обратного вызова:', `${req.protocol}://${req.get('host')}/api/google/callback`);
            console.log('Удаленное подключение к базе данных:', process.env.MONGO_URI ? 'Да' : 'Нет');
            console.log('Удаленное подключение к Redis:', process.env.REDIS_HOST ? 'Да' : 'Нет');
            res.redirect(redirectUrl);
        });
    }
    catch (error) {
        console.error('Ошибка при обработке Google OAuth callback:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}));
// Маршрут для проверки заполненных данных пользователя
// GET /api/user-data-check/:userId
router.get('/user-data-check/:userId', (async (req, res, next) => {
    try {
        const { userId } = req.params;
        const USE_MONGODB = process.env.USE_MONGODB === 'true';
        console.log('=== ПРОВЕРКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ ===');
        console.log('Проверяем данные для пользователя:', userId);
        console.log('USE_MONGODB:', USE_MONGODB);
        if (USE_MONGODB) {
            // Проверяем наличие профессии в таблице preferences
            const preferences = await prisma.preference.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 1,
            });
            // Проверяем наличие инструментов в таблице userTools
            const userTools = await prisma.userTool.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            const hasProfession = preferences.length > 0;
            const hasTools = userTools.length > 0;
            // Получаем последнюю профессию и инструменты
            const lastPreference = preferences[0];
            const profession = lastPreference?.profession || null;
            const tools = userTools.map(tool => tool.toolName);
            console.log('Результаты проверки (MongoDB):');
            console.log('- Есть профессия:', hasProfession);
            console.log('- Есть инструменты:', hasTools);
            console.log('- Профессия:', profession);
            console.log('- Количество инструментов:', tools.length);
            res.json({
                hasProfession,
                hasTools,
                profession,
                tools,
            });
        }
        else {
            // Для InMemoryUser возвращаем базовые данные
            console.log('Используется InMemoryUser - возвращаем базовые данные');
            // В dev режиме с демо пользователем возвращаем заполненные данные
            const hasProfession = true;
            const hasTools = true;
            const profession = 'Frontend Developer'; // Базовая профессия для демо
            const tools = ['JavaScript', 'React', 'TypeScript']; // Базовые инструменты для демо
            console.log('Результаты проверки (InMemory):');
            console.log('- Есть профессия:', hasProfession);
            console.log('- Есть инструменты:', hasTools);
            console.log('- Профессия:', profession);
            console.log('- Количество инструментов:', tools.length);
            res.json({
                hasProfession,
                hasTools,
                profession,
                tools,
            });
        }
    }
    catch (error) {
        console.error('Ошибка при проверке данных пользователя:', error);
        res.status(500).json({
            message: 'Ошибка при проверке данных пользователя',
            error: error.message
        });
    }
}));
exports.default = router;
//# sourceMappingURL=auth.js.map