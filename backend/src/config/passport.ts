import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { InMemoryUser } from '../models/InMemoryUser';

// Настройка сериализации и десериализации пользователя
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await InMemoryUser.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Настройка стратегии Google OAuth
// Определяем фактический callback URL, который будет использоваться
const actualCallbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  'http://localhost:8080/api/google/callback';

console.log('=== НАСТРОЙКА GOOGLE OAUTH СТРАТЕГИИ ===');
console.log('Используемый callbackURL:', actualCallbackURL);
console.log(
  'GOOGLE_CLIENT_ID установлен:',
  process.env.GOOGLE_CLIENT_ID ? 'Да' : 'Нет'
);
console.log(
  'GOOGLE_CLIENT_SECRET установлен:',
  process.env.GOOGLE_CLIENT_SECRET ? 'Да' : 'Нет'
);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('HOST:', process.env.HOST);
console.log('PORT:', process.env.PORT);
console.log(
  'FRONTEND_URL из env:',
  process.env.FRONTEND_URL || 'не установлен'
);
console.log(
  'MONGO_URI:',
  process.env.MONGO_URI ? '***скрыто***' : 'не установлен'
);
console.log('REDIS_HOST:', process.env.REDIS_HOST || 'не установлен');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: actualCallbackURL,
      scope: ['profile', 'email'],
      proxy: true, // Добавляем поддержку прокси для корректной обработки перенаправлений
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth профиль:', profile);
        console.log(
          'OAuth accessToken:',
          accessToken ? 'Получен' : 'Отсутствует'
        );
        console.log(
          'Google OAuth refreshToken:',
          refreshToken ? 'Получен' : 'Отсутствует'
        );

        // Добавляем расширенное логирование для отладки redirect_uri_mismatch
        console.log('=== ОТЛАДКА GOOGLE OAUTH REDIRECT ===');
        console.log(
          'Используемый callbackURL:',
          process.env.GOOGLE_CALLBACK_URL ||
            'http://localhost:8080/api/auth/google/callback'
        );
        console.log('Фактический порт бэкенда:', process.env.PORT || 8080);
        console.log(
          'Порт фронтенда из конфигурации:',
          require('../config/app').FRONTEND_PORT
        );
        console.log(
          'Полный URL обратного вызова:',
          `http://localhost:${process.env.PORT || 8080}/api/google/callback`
        );
        console.log('Параметры запроса:', {
          accessToken: accessToken ? 'Получен' : 'Отсутствует',
          refreshToken: refreshToken ? 'Получен' : 'Отсутствует',
          profileId: profile.id,
          profileEmails: profile.emails,
        });

        // Получаем email из профиля или создаем временный
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value
            ? profile.emails[0].value
            : `google_${profile.id}@example.com`;

        // Ищем пользователя по email или googleId
        let user = await InMemoryUser.findOne({ email });

        // Если пользователь не найден по email, ищем по googleId
        if (!user) {
          user = await InMemoryUser.findByGoogleId(profile.id);
        }

        if (user) {
          // Обновляем Google данные существующего пользователя
          user.googleId = profile.id;
          user.googleAccessToken = accessToken;
          user.googleRefreshToken = refreshToken || '';
          await user.save();
          console.log(
            'Обновлены Google данные существующего пользователя:',
            user.id
          );
        } else {
          // Создаем нового пользователя
          user = new InMemoryUser({
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
      } catch (error) {
        console.error('Ошибка в Google OAuth стратегии:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
