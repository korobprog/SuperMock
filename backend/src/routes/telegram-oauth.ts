import { Router } from 'express';
import crypto from 'crypto';

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

/**
 * Проверяет OAuth данные от Telegram
 * @param data - данные от Telegram OAuth
 * @param botToken - токен бота
 * @returns boolean - валидны ли данные
 */
function validateTelegramOAuth(data: TelegramOAuthData, botToken: string): boolean {
  try {
    // Создаем HMAC-SHA256 подпись
    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Сортируем параметры по алфавиту (кроме hash)
    const params = new URLSearchParams(data.initData);
    params.delete('hash');
    
    const paramString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Вычисляем подпись
    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(paramString)
      .digest('hex');
    
    console.log('🔐 OAuth validation:', {
      paramString,
      calculatedHash,
      receivedHash: data.hash,
      isValid: calculatedHash === data.hash
    });
    
    return calculatedHash === data.hash;
  } catch (error) {
    console.error('Error validating OAuth data:', error);
    return false;
  }
}

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

    // Проверяем подпись данных
    if (!validateTelegramOAuth({ user, hash, initData }, botToken)) {
      console.warn('Invalid OAuth signature for user:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Недействительная подпись данных'
      });
    }

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

  } catch (error) {
    console.error('Error processing OAuth callback:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

export default router;
