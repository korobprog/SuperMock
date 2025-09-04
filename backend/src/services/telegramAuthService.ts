import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { telegramService } from './telegramService';

// Интерфейс для кода верификации
interface VerificationCode {
  id: string;
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
}

// Интерфейс для пользователя
interface TelegramUser {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
}

// Временное хранилище кодов (в продакшене используйте Redis)
const verificationCodes = new Map<string, VerificationCode>();
const users = new Map<string, TelegramUser>();

export class TelegramAuthService {
  private readonly CODE_LENGTH = parseInt(process.env.VERIFICATION_CODE_LENGTH || '6');
  private readonly CODE_EXPIRY_MINUTES = parseInt(process.env.VERIFICATION_CODE_EXPIRY || '5');
  private readonly MAX_ATTEMPTS = parseInt(process.env.MAX_VERIFICATION_ATTEMPTS || '3');
  private readonly JWT_EXPIRY_DAYS = parseInt(process.env.JWT_EXPIRY_DAYS || '30');

  /**
   * Генерация кода верификации
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Создание уникального ID для кода
   */
  private generateCodeId(phoneNumber: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${phoneNumber}_${timestamp}_${random}`;
  }

  /**
   * Отправка кода верификации через Telegram бота
   */
  async sendVerificationCode(phoneNumber: string, telegramUserId?: string): Promise<{
    success: boolean;
    codeId?: string;
    message: string;
    expiresIn?: number;
  }> {
    try {
      console.log(`🔐 Отправка кода верификации для номера: ${phoneNumber}`);

      // Генерируем код
      const code = this.generateVerificationCode();
      const codeId = this.generateCodeId(phoneNumber);
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      // Сохраняем код в хранилище
      const verificationCode: VerificationCode = {
        id: codeId,
        phoneNumber,
        code,
        expiresAt,
        attempts: 0,
        isUsed: false,
        createdAt: new Date()
      };

      verificationCodes.set(codeId, verificationCode);

      // Формируем сообщение для пользователя
      const message = `🔐 Код верификации для SuperMock

📱 Номер: ${phoneNumber}
🔢 Код: ${code}

⏰ Код действителен ${this.CODE_EXPIRY_MINUTES} минут

⚠️ Не передавайте этот код третьим лицам!`;

      // Отправляем код через Telegram бота
      let sent = false;
      
      if (telegramUserId) {
        // Если есть telegramUserId, отправляем напрямую
        sent = await telegramService.sendMessage(telegramUserId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
      } else {
        // Если нет telegramUserId, пытаемся найти пользователя по номеру телефона
        // В реальном приложении здесь должна быть логика поиска пользователя
        console.warn('⚠️ Telegram User ID не предоставлен, код не может быть отправлен');
        return {
          success: false,
          message: 'Не удалось отправить код. Убедитесь, что вы начали диалог с ботом.'
        };
      }

      if (sent) {
        console.log(`✅ Код верификации отправлен для номера: ${phoneNumber}`);
        return {
          success: true,
          codeId,
          message: 'Код верификации отправлен в Telegram',
          expiresIn: this.CODE_EXPIRY_MINUTES * 60
        };
      } else {
        // Удаляем код из хранилища, если не удалось отправить
        verificationCodes.delete(codeId);
        return {
          success: false,
          message: 'Не удалось отправить код. Проверьте, что вы начали диалог с ботом.'
        };
      }

    } catch (error) {
      console.error('❌ Ошибка при отправке кода верификации:', error);
      return {
        success: false,
        message: 'Внутренняя ошибка сервера при отправке кода'
      };
    }
  }

  /**
   * Проверка кода верификации
   */
  async verifyCode(codeId: string, inputCode: string, userInfo?: {
    firstName?: string;
    lastName?: string;
    username?: string;
  }): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    message: string;
  }> {
    try {
      console.log(`🔍 Проверка кода: ${inputCode} для ID: ${codeId}`);

      // Получаем код из хранилища
      const verificationCode = verificationCodes.get(codeId);
      
      if (!verificationCode) {
        return {
          success: false,
          message: 'Код верификации не найден или истек'
        };
      }

      // Проверяем, не истек ли код
      if (new Date() > verificationCode.expiresAt) {
        verificationCodes.delete(codeId);
        return {
          success: false,
          message: 'Код верификации истек. Запросите новый код.'
        };
      }

      // Проверяем, не использован ли код
      if (verificationCode.isUsed) {
        return {
          success: false,
          message: 'Код верификации уже использован'
        };
      }

      // Проверяем количество попыток
      if (verificationCode.attempts >= this.MAX_ATTEMPTS) {
        verificationCodes.delete(codeId);
        return {
          success: false,
          message: 'Превышено максимальное количество попыток. Запросите новый код.'
        };
      }

      // Увеличиваем счетчик попыток
      verificationCode.attempts++;

      // Проверяем код
      if (verificationCode.code !== inputCode) {
        verificationCodes.set(codeId, verificationCode);
        return {
          success: false,
          message: `Неверный код. Осталось попыток: ${this.MAX_ATTEMPTS - verificationCode.attempts}`
        };
      }

      // Код верный - помечаем как использованный
      verificationCode.isUsed = true;
      verificationCodes.set(codeId, verificationCode);

      console.log(`✅ Код верификации успешно проверен для номера: ${verificationCode.phoneNumber}`);

      // Создаем или находим пользователя
      const userId = `user_${verificationCode.phoneNumber.replace(/\D/g, '')}_${Date.now()}`;
      
      const user: TelegramUser = {
        id: userId,
        phoneNumber: verificationCode.phoneNumber,
        firstName: userInfo?.firstName,
        lastName: userInfo?.lastName,
        username: userInfo?.username,
        createdAt: new Date()
      };

      // Сохраняем пользователя
      users.set(userId, user);

      // Создаем JWT токен
      const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
      const token = jwt.sign(
        {
          userId: userId,
          phoneNumber: verificationCode.phoneNumber,
          type: 'telegram_auth',
          iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        { expiresIn: `${this.JWT_EXPIRY_DAYS}d` }
      );

      console.log(`🎉 Пользователь успешно авторизован: ${userId}`);

      return {
        success: true,
        token,
        user: {
          id: userId,
          phoneNumber: verificationCode.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          createdAt: user.createdAt
        },
        message: 'Авторизация успешна'
      };

    } catch (error) {
      console.error('❌ Ошибка при проверке кода верификации:', error);
      return {
        success: false,
        message: 'Внутренняя ошибка сервера при проверке кода'
      };
    }
  }

  /**
   * Получение информации о пользователе по токену
   */
  async getUserByToken(token: string): Promise<{
    success: boolean;
    user?: any;
    message: string;
  }> {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (decoded.type !== 'telegram_auth') {
        return {
          success: false,
          message: 'Неверный тип токена'
        };
      }

      const user = users.get(decoded.userId);
      
      if (!user) {
        return {
          success: false,
          message: 'Пользователь не найден'
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          createdAt: user.createdAt
        },
        message: 'Пользователь найден'
      };

    } catch (error) {
      console.error('❌ Ошибка при получении пользователя по токену:', error);
      return {
        success: false,
        message: 'Неверный или истекший токен'
      };
    }
  }

  /**
   * Очистка истекших кодов (вызывать периодически)
   */
  cleanupExpiredCodes(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [codeId, code] of verificationCodes.entries()) {
      if (now > code.expiresAt) {
        verificationCodes.delete(codeId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Очищено истекших кодов: ${cleanedCount}`);
    }
  }

  /**
   * Получение статистики кодов
   */
  getStats(): {
    activeCodes: number;
    totalUsers: number;
    expiredCodes: number;
  } {
    const now = new Date();
    let expiredCodes = 0;

    for (const code of verificationCodes.values()) {
      if (now > code.expiresAt) {
        expiredCodes++;
      }
    }

    return {
      activeCodes: verificationCodes.size - expiredCodes,
      totalUsers: users.size,
      expiredCodes
    };
  }
}

// Singleton instance
export const telegramAuthService = new TelegramAuthService();

// Периодическая очистка истекших кодов
const cleanupInterval = parseInt(process.env.CODE_CLEANUP_INTERVAL || '5') * 60 * 1000;
setInterval(() => {
  telegramAuthService.cleanupExpiredCodes();
}, cleanupInterval);
