export class TelegramService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || 'demo_token_or_empty';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Отправка сообщения пользователю
   */
  async sendMessage(chatId: string | number, text: string, options?: {
    parse_mode?: 'HTML' | 'Markdown';
    reply_markup?: any;
    disable_web_page_preview?: boolean;
  }): Promise<boolean> {
    try {
      if (!this.botToken || this.botToken === 'demo_token_or_empty') {
        console.warn('Telegram bot token not configured, skipping message send');
        return false;
      }

      const payload = {
        chat_id: chatId,
        text,
        ...options,
      };

      console.log(`📱 Sending Telegram message to ${chatId}:`, text);

      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Failed to send Telegram message:', result);
        return false;
      }

      console.log('✅ Telegram message sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  /**
   * Отправка уведомления о матче пользователей
   */
  async notifyMatch(userIds: string[], sessionId: string, slotTime: string): Promise<void> {
    const message = `🎯 Найден партнёр для собеседования!

📅 Время: ${new Date(slotTime).toLocaleString('ru-RU')}
🔗 Сессия: ${sessionId}

Переходите в приложение для начала собеседования.`;

    for (const userId of userIds) {
      await this.sendMessage(userId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    }
  }

  /**
   * Отправка напоминания о предстоящем собеседовании
   */
  async notifyReminder(userId: string, sessionId: string, slotTime: string, minutesBefore: number): Promise<void> {
    const message = `⏰ Напоминание: собеседование через ${minutesBefore} минут!

📅 Время: ${new Date(slotTime).toLocaleString('ru-RU')}
🔗 Сессия: ${sessionId}

Не забудьте присоединиться вовремя!`;

    await this.sendMessage(userId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }

  /**
   * Отправка уведомления о завершении собеседования
   */
  async notifyCompletion(userId: string, sessionId: string): Promise<void> {
    const message = `✅ Собеседование завершено!

🔗 Сессия: ${sessionId}

Не забудьте оставить обратную связь в приложении.`;

    await this.sendMessage(userId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }

  /**
   * Отправка уведомления о добавлении в очередь
   */
  async notifyQueued(userId: string, role: string, slotTime: string): Promise<void> {
    const roleText = role === 'interviewer' ? 'интервьюера' : 'кандидата';
    const message = `📝 Вы добавлены в очередь!

👤 Роль: ${roleText}
📅 Время: ${new Date(slotTime).toLocaleString('ru-RU')}

Ищем вам партнёра для собеседования...`;

    await this.sendMessage(userId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }
}

// Singleton instance
export const telegramService = new TelegramService();
