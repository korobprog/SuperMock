"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const UserModel_1 = require("../models/UserModel"); // Импортируем функцию для получения модели
const config_1 = __importDefault(require("../config"));
const loggerService_1 = __importDefault(require("../services/loggerService"));
// Настройка сериализации и десериализации пользователя
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const User = (0, UserModel_1.getCurrentUserModel)();
        const user = await User.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
// Настройка стратегии Google OAuth
// Определяем фактический callback URL, который будет использоваться
const actualCallbackURL = config_1.default.googleOAuth.callbackUrl;
// Добавляем отладочную информацию о несоответствии URL
loggerService_1.default.info('=== ПРОВЕРКА СООТВЕТСТВИЯ URL ОБРАТНОГО ВЫЗОВА ===');
loggerService_1.default.info('Фактический URL в Passport:', actualCallbackURL);
loggerService_1.default.info('Ожидаемый маршрут в auth.ts:', '/auth/google/callback');
loggerService_1.default.info('Полный ожидаемый URL:', `${config_1.default.server.env === 'production' ? 'https' : 'http'}://${config_1.default.server.host}:${config_1.default.server.port}/api/auth/google/callback`);
loggerService_1.default.info('=== НАСТРОЙКА GOOGLE OAUTH СТРАТЕГИИ ===');
loggerService_1.default.info('Используемый callbackURL:', actualCallbackURL);
loggerService_1.default.info('Значение GOOGLE_CALLBACK_URL из env:', process.env.GOOGLE_CALLBACK_URL || 'не установлен');
loggerService_1.default.info('GOOGLE_CLIENT_ID установлен:', config_1.default.googleOAuth.clientId ? 'Да' : 'Нет');
loggerService_1.default.info('GOOGLE_CLIENT_SECRET установлен:', config_1.default.googleOAuth.clientSecret ? 'Да' : 'Нет');
loggerService_1.default.info('NODE_ENV:', config_1.default.server.env);
loggerService_1.default.info('HOST:', config_1.default.server.host);
loggerService_1.default.info('PORT:', config_1.default.server.port);
loggerService_1.default.info('FRONTEND_URL:', config_1.default.frontend.url);
// Проверяем наличие необходимых переменных окружения для Google OAuth
if (config_1.default.googleOAuth.enabled) {
    loggerService_1.default.info('Настраиваем Google OAuth стратегию');
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: config_1.default.googleOAuth.clientId,
        clientSecret: config_1.default.googleOAuth.clientSecret,
        callbackURL: actualCallbackURL,
        scope: config_1.default.googleOAuth.scope,
        proxy: true, // Добавляем поддержку прокси для корректной обработки перенаправлений
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            loggerService_1.default.info('Google OAuth профиль получен');
            loggerService_1.default.debug('OAuth accessToken:', accessToken ? 'Получен' : 'Отсутствует');
            loggerService_1.default.debug('Google OAuth refreshToken:', refreshToken ? 'Получен' : 'Отсутствует');
            // Добавляем расширенное логирование для отладки redirect_uri_mismatch
            loggerService_1.default.debug('=== ОТЛАДКА GOOGLE OAUTH REDIRECT ===');
            loggerService_1.default.debug('Используемый callbackURL:', actualCallbackURL);
            loggerService_1.default.debug('Фактический порт бэкенда:', config_1.default.server.port);
            loggerService_1.default.debug('Порт фронтенда из конфигурации:', config_1.default.frontend.port);
            loggerService_1.default.debug('Полный URL обратного вызова:', actualCallbackURL);
            loggerService_1.default.debug('Параметры запроса:', {
                accessToken: accessToken ? 'Получен' : 'Отсутствует',
                refreshToken: refreshToken ? 'Получен' : 'Отсутствует',
                profileId: profile.id,
                profileEmails: profile.emails ? 'Получены' : 'Отсутствуют',
            });
            // Получаем email из профиля или создаем временный
            const email = profile.emails && profile.emails[0] && profile.emails[0].value
                ? profile.emails[0].value
                : `google_${profile.id}@example.com`;
            const User = (0, UserModel_1.getCurrentUserModel)();
            // Ищем пользователя по email или googleId
            let user = await User.findOne({ email });
            // Если пользователь не найден по email, ищем по googleId
            if (!user) {
                // Проверяем, есть ли метод findByGoogleId у модели User
                if (typeof User.findByGoogleId === 'function') {
                    user = await User.findByGoogleId(profile.id);
                }
                else {
                    console.log('Метод findByGoogleId не найден в модели User');
                }
            }
            if (user) {
                // Обновляем Google данные существующего пользователя
                user.googleId = profile.id;
                user.googleAccessToken = accessToken;
                user.googleRefreshToken = refreshToken || '';
                await user.save();
                loggerService_1.default.info('Обновлены Google данные существующего пользователя:', user.id);
            }
            else {
                // Создаем нового пользователя
                user = new User({
                    email,
                    password: 'google_oauth_user', // Пароль не используется для OAuth пользователей
                    googleId: profile.id,
                    googleAccessToken: accessToken,
                    googleRefreshToken: refreshToken || '',
                });
                await user.save();
                loggerService_1.default.info('Создан новый пользователь через Google OAuth:', user.id);
            }
            return done(null, user);
        }
        catch (error) {
            loggerService_1.default.error('Ошибка в Google OAuth стратегии:', error);
            return done(error, undefined);
        }
    }));
}
else {
    loggerService_1.default.warn('Google OAuth стратегия не настроена: отсутствуют GOOGLE_CLIENT_ID или GOOGLE_CLIENT_SECRET');
}
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map