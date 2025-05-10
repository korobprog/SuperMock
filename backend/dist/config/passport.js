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
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:9877/api/auth/google/callback',
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google OAuth профиль:', profile);
        console.log('OAuth accessToken:', accessToken ? 'Получен' : 'Отсутствует');
        console.log('Google OAuth refreshToken:', refreshToken ? 'Получен' : 'Отсутствует');
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