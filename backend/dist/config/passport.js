"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const InMemoryUser_1 = require("../models/InMemoryUser");
// Настройка сериализации и десериализации пользователя
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await InMemoryUser_1.InMemoryUser.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
// Настройка стратегии Google OAuth
// Определяем фактический callback URL, который будет использоваться
const actualCallbackURL = process.env.GOOGLE_CALLBACK_URL ||
    'https://217.198.6.238:443/api/auth/google/callback';
// Добавляем отладочную информацию о несоответствии URL
console.log('=== ПРОВЕРКА СООТВЕТСТВИЯ URL ОБРАТНОГО ВЫЗОВА ===');
console.log('Фактический URL в Passport:', actualCallbackURL);
console.log('Ожидаемый маршрут в auth.ts:', '/auth/google/callback');
console.log('Полный ожидаемый URL:', 'https://217.198.6.238:443/api/auth/google/callback');
console.log('=== НАСТРОЙКА GOOGLE OAUTH СТРАТЕГИИ ===');
console.log('Используемый callbackURL:', actualCallbackURL);
console.log('Значение GOOGLE_CALLBACK_URL из env:', process.env.GOOGLE_CALLBACK_URL || 'не установлен');
console.log('Значение GOOGLE_CALLBACK_URL из Netlify:', process.env.NETLIFY_GOOGLE_CALLBACK_URL || 'не установлен');
console.log('GOOGLE_CLIENT_ID установлен:', process.env.GOOGLE_CLIENT_ID ? 'Да' : 'Нет');
console.log('GOOGLE_CLIENT_SECRET установлен:', process.env.GOOGLE_CLIENT_SECRET ? 'Да' : 'Нет');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('HOST:', process.env.HOST);
console.log('PORT:', process.env.PORT);
console.log('FRONTEND_URL из env:', process.env.FRONTEND_URL || 'не установлен');
console.log('MONGO_URI:', process.env.MONGO_URI ? '***скрыто***' : 'не установлен');
console.log('REDIS_HOST:', process.env.REDIS_HOST || 'не установлен');
console.log('=== ОТЛАДКА NETLIFY ПЕРЕМЕННЫХ В PASSPORT ===');
console.log('Все переменные окружения:');
Object.keys(process.env).forEach((key) => {
    if (key.includes('NETLIFY') ||
        key.includes('GOOGLE') ||
        key.includes('URL')) {
        console.log(`${key}: ${key.includes('SECRET') ? '***скрыто***' : process.env[key]}`);
    }
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: actualCallbackURL,
    scope: ['profile', 'email'],
    proxy: true, // Добавляем поддержку прокси для корректной обработки перенаправлений
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google OAuth профиль:', profile);
        console.log('OAuth accessToken:', accessToken ? 'Получен' : 'Отсутствует');
        console.log('Google OAuth refreshToken:', refreshToken ? 'Получен' : 'Отсутствует');
        // Добавляем расширенное логирование для отладки redirect_uri_mismatch
        console.log('=== ОТЛАДКА GOOGLE OAUTH REDIRECT ===');
        console.log('Используемый callbackURL:', process.env.GOOGLE_CALLBACK_URL ||
            'https://217.198.6.238:443/api/auth/google/callback');
        console.log('Значение GOOGLE_CALLBACK_URL из env:', process.env.GOOGLE_CALLBACK_URL || 'не установлен');
        console.log('Значение GOOGLE_CALLBACK_URL из Netlify:', process.env.NETLIFY_GOOGLE_CALLBACK_URL || 'не установлен');
        console.log('Фактический порт бэкенда:', process.env.PORT || 8080);
        console.log('Порт фронтенда из конфигурации:', require('../config/app').FRONTEND_PORT);
        console.log('Полный URL обратного вызова:', `http://localhost:${process.env.PORT || 8080}/api/auth/google/callback`);
        console.log('Параметры запроса:', {
            accessToken: accessToken ? 'Получен' : 'Отсутствует',
            refreshToken: refreshToken ? 'Получен' : 'Отсутствует',
            profileId: profile.id,
            profileEmails: profile.emails,
        });
        console.log('=== ОТЛАДКА NETLIFY ПЕРЕМЕННЫХ В CALLBACK ===');
        console.log('Все переменные окружения в callback:');
        Object.keys(process.env).forEach((key) => {
            if (key.includes('NETLIFY') ||
                key.includes('GOOGLE') ||
                key.includes('URL')) {
                console.log(`${key}: ${key.includes('SECRET') ? '***скрыто***' : process.env[key]}`);
            }
        });
        // Получаем email из профиля или создаем временный
        const email = profile.emails && profile.emails[0] && profile.emails[0].value
            ? profile.emails[0].value
            : `google_${profile.id}@example.com`;
        // Ищем пользователя по email или googleId
        let user = await InMemoryUser_1.InMemoryUser.findOne({ email });
        // Если пользователь не найден по email, ищем по googleId
        if (!user) {
            user = await InMemoryUser_1.InMemoryUser.findByGoogleId(profile.id);
        }
        if (user) {
            // Обновляем Google данные существующего пользователя
            user.googleId = profile.id;
            user.googleAccessToken = accessToken;
            user.googleRefreshToken = refreshToken || '';
            await user.save();
            console.log('Обновлены Google данные существующего пользователя:', user.id);
        }
        else {
            // Создаем нового пользователя
            user = new InMemoryUser_1.InMemoryUser({
                email,
                password: 'google_oauth_user', // Пароль не используется для OAuth пользователей
                googleId: profile.id,
                googleAccessToken: accessToken,
                googleRefreshToken: refreshToken || '',
            });
            await user.save();
            console.log('Создан новый пользователь через Google OAuth:', user.id);
        }
        return done(null, user);
    }
    catch (error) {
        console.error('Ошибка в Google OAuth стратегии:', error);
        return done(error, undefined);
    }
}));
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map