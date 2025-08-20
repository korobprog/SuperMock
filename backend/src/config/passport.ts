import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/UserModel'; // Импортируем универсальную модель User
import config from '../config';
import logger from '../services/loggerService';

// Настройка сериализации и десериализации пользователя
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Настройка стратегии Google OAuth
// Определяем фактический callback URL, который будет использоваться
const actualCallbackURL = config.googleOAuth.callbackUrl;

// Добавляем отладочную информацию о несоответствии URL
logger.info('=== ПРОВЕРКА СООТВЕТСТВИЯ URL ОБРАТНОГО ВЫЗОВА ===');
logger.info('Фактический URL в Passport:', actualCallbackURL);
logger.info('Ожидаемый маршрут в auth.ts:', '/auth/google/callback');
logger.info(
  'Полный ожидаемый URL:',
  `${config.server.env === 'production' ? 'https' : 'http'}://${
    config.server.host
  }:${config.server.port}/api/auth/google/callback`
);

logger.info('=== НАСТРОЙКА GOOGLE OAUTH СТРАТЕГИИ ===');
logger.info('Используемый callbackURL:', actualCallbackURL);
logger.info(
  'Значение GOOGLE_CALLBACK_URL из env:',
  process.env.GOOGLE_CALLBACK_URL || 'не установлен'
);
logger.info(
  'GOOGLE_CLIENT_ID установлен:',
  config.googleOAuth.clientId ? 'Да' : 'Нет'
);
logger.info(
  'GOOGLE_CLIENT_SECRET установлен:',
  config.googleOAuth.clientSecret ? 'Да' : 'Нет'
);
logger.info('NODE_ENV:', config.server.env);
logger.info('HOST:', config.server.host);
logger.info('PORT:', config.server.port);
logger.info('FRONTEND_URL:', config.frontend.url);

// Проверяем наличие необходимых переменных окружения для Google OAuth
if (config.googleOAuth.enabled) {
  logger.info('Настраиваем Google OAuth стратегию');
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleOAuth.clientId,
        clientSecret: config.googleOAuth.clientSecret,
        callbackURL: actualCallbackURL,
        scope: config.googleOAuth.scope,
        proxy: true, // Добавляем поддержку прокси для корректной обработки перенаправлений
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          logger.info('Google OAuth профиль получен');
          logger.debug(
            'OAuth accessToken:',
            accessToken ? 'Получен' : 'Отсутствует'
          );
          logger.debug(
            'Google OAuth refreshToken:',
            refreshToken ? 'Получен' : 'Отсутствует'
          );

          // Добавляем расширенное логирование для отладки redirect_uri_mismatch
          logger.debug('=== ОТЛАДКА GOOGLE OAUTH REDIRECT ===');
          logger.debug('Используемый callbackURL:', actualCallbackURL);
          logger.debug('Фактический порт бэкенда:', config.server.port);
          logger.debug('Порт фронтенда из конфигурации:', config.frontend.port);
          logger.debug('Полный URL обратного вызова:', actualCallbackURL);
          logger.debug('Параметры запроса:', {
            accessToken: accessToken ? 'Получен' : 'Отсутствует',
            refreshToken: refreshToken ? 'Получен' : 'Отсутствует',
            profileId: profile.id,
            profileEmails: profile.emails ? 'Получены' : 'Отсутствуют',
          });

          // Получаем email из профиля или создаем временный
          const email =
            profile.emails && profile.emails[0] && profile.emails[0].value
              ? profile.emails[0].value
              : `google_${profile.id}@example.com`;

          // Ищем пользователя по email или googleId
          let user = await User.findOne({ email });

          // Если пользователь не найден по email, ищем по googleId
          if (!user) {
            // Проверяем, есть ли метод findByGoogleId у модели User
            if (typeof User.findByGoogleId === 'function') {
              user = await User.findByGoogleId(profile.id);
            } else {
              console.log('Метод findByGoogleId не найден в модели User');
            }
          }

          if (user) {
            // Обновляем Google данные существующего пользователя
            user.googleId = profile.id;
            user.googleAccessToken = accessToken;
            user.googleRefreshToken = refreshToken || '';
            await user.save();
            logger.info(
              'Обновлены Google данные существующего пользователя:',
              user.id
            );
          } else {
            // Создаем нового пользователя
            user = new User({
              email,
              password: 'google_oauth_user', // Пароль не используется для OAuth пользователей
              googleId: profile.id,
              googleAccessToken: accessToken,
              googleRefreshToken: refreshToken || '',
            });
            await user.save();
            logger.info(
              'Создан новый пользователь через Google OAuth:',
              user.id
            );
          }

          return done(null, user);
        } catch (error) {
          logger.error('Ошибка в Google OAuth стратегии:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
} else {
  logger.warn(
    'Google OAuth стратегия не настроена: отсутствуют GOOGLE_CLIENT_ID или GOOGLE_CLIENT_SECRET'
  );
}

export default passport;
