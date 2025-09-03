import { Router } from 'express';
import { AuthDataValidator } from '@telegram-auth/server';

const router = Router();

interface TelegramOAuthData {
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
  };
  hash: string;
  initData: string;
}

// Инициализируем валидатор Telegram OAuth
const telegramValidator = new AuthDataValidator({ 
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  inValidateDataAfter: 3600 // 1 час
});

/**
 * POST /api/auth/telegram-oauth
 * Проверяет OAuth данные от Telegram и создает/обновляет пользователя
 */
router.post('/telegram-oauth', async (req, res) => {
  try {
    const { user, hash, initData }: TelegramOAuthData = req.body;
    
    if (!user || !hash || !initData) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствуют необходимые параметры'
      });
    }

    // Получаем токен бота из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return res.status(500).json({
        success: false,
        message: 'Ошибка конфигурации сервера'
      });
    }

    try {
      // Создаем Map для валидации
      const authDataMap = new Map([
        ['id', user.id.toString()],
        ['first_name', user.first_name],
        ['last_name', user.last_name || ''],
        ['username', user.username || ''],
        ['photo_url', user.photo_url || ''],
        ['auth_date', user.auth_date.toString()],
        ['hash', hash]
      ]);

      // Валидируем данные используя официальную библиотеку
      const validatedUser = await telegramValidator.validate(authDataMap);
      console.log('✅ Telegram OAuth data validated successfully:', validatedUser);

      // Проверяем время авторизации (не старше 1 часа)
      const authTime = user.auth_date * 1000; // конвертируем в миллисекунды
      const currentTime = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 час
      
      if (currentTime - authTime > maxAge) {
        console.warn('OAuth data too old for user:', user.id);
        return res.status(401).json({
          success: false,
          message: 'Данные авторизации устарели'
        });
      }

      console.log('✅ Valid OAuth data for user:', user.id);

      // Здесь должна быть логика создания/обновления пользователя в БД
      // Пока возвращаем успешный ответ с userId
      const userId = user.id; // Используем Telegram ID как userId

      res.json({
        success: true,
        message: 'Авторизация успешна',
        userId: userId,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url
        }
      });

    } catch (validationError) {
      console.error('❌ Telegram OAuth validation failed:', validationError);
      return res.status(401).json({
        success: false,
        message: 'Недействительная подпись данных',
        details: validationError instanceof Error ? validationError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error processing OAuth callback:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

export default router;
