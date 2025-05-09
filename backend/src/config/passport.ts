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
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:9877/api/auth/google/callback',
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth профиль:', profile);
        console.log(
          'Google OAuth accessToken:',
          accessToken ? 'Получен' : 'Отсутствует'
        );
        console.log(
          'Google OAuth refreshToken:',
          refreshToken ? 'Получен' : 'Отсутствует'
        );

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
