import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Система отправки уведомлений через Telegram бот
 */
class TelegramNotificationService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.botName =
      process.env.TELEGRAM_BOT_NAME ||
      process.env.VITE_TELEGRAM_BOT_NAME ||
      'SuperMock_bot';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.frontendUrl = process.env.FRONTEND_URL || 'https://supermock.ru';
  }

  /**
   * Проверяет доступность Telegram бота
   */
  async checkBotAvailability() {
    try {
      if (!this.botToken) {
        return { available: false, reason: 'Bot token not configured' };
      }

      const response = await fetch(`${this.baseUrl}/getMe`);
      const data = await response.json();

      const isAvailable = data.ok && data.result?.username === this.botName;

      return {
        available: isAvailable,
        botName: data.result?.username,
        reason: isAvailable ? 'Bot is available' : 'Bot not found or inactive',
      };
    } catch (error) {
      console.error('Error checking bot availability:', error);
      return { available: false, reason: 'Error checking bot' };
    }
  }

  /**
   * Отправляет сообщение пользователю через Telegram бот
   */
  async sendMessage(chatId, message, options = {}) {
    try {
      if (!this.botToken) {
        console.warn('Telegram bot token not configured');
        return { success: false, reason: 'Bot token not configured' };
      }

      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        ...options,
      };

      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ok) {
        console.log(`✅ Telegram message sent to ${chatId}`);
        return { success: true, messageId: data.result.message_id };
      } else {
        console.error(
          `❌ Failed to send Telegram message to ${chatId}:`,
          data.description
        );
        return { success: false, reason: data.description };
      }
    } catch (error) {
      console.error(`❌ Error sending Telegram message to ${chatId}:`, error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Отправляет уведомление о завершении сессии
   */
  async sendSessionCompletedNotification(userId, session, userRole) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tgId: true, firstName: true, username: true },
      });

      if (!user?.tgId) {
        console.log(`User ${userId} has no Telegram ID`);
        return { success: false, reason: 'No Telegram ID' };
      }

      const targetRole =
        userRole === 'interviewer' ? 'кандидате' : 'интервьюере';
      const message = `
🎯 <b>Собеседование завершено!</b>

📋 <b>Детали:</b>
• Профессия: ${session.profession || 'Не указана'}
• Язык: ${session.language || 'Не указан'}
• Ваша роль: ${userRole === 'interviewer' ? 'Интервьюер' : 'Кандидат'}

⭐ <b>Не забудьте оставить фидбек о ${targetRole}!</b>

Это поможет улучшить качество будущих собеседований и поддержать сообщество.

<a href="${this.frontendUrl}/history">📊 Перейти в историю</a>
      `.trim();

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '⭐ Оставить фидбек',
              url: `${this.frontendUrl}/history?session=${session.id}`,
            },
          ],
          [
            {
              text: '📊 Моя история',
              url: `${this.frontendUrl}/history`,
            },
          ],
        ],
      };

      return await this.sendMessage(user.tgId, message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error(
        `❌ Error sending session completed notification to ${userId}:`,
        error
      );
      return { success: false, reason: error.message };
    }
  }

  /**
   * Отправляет напоминание о фидбеке
   */
  async sendFeedbackReminder(userId, session, userRole) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tgId: true, firstName: true, username: true },
      });

      if (!user?.tgId) {
        console.log(`User ${userId} has no Telegram ID`);
        return { success: false, reason: 'No Telegram ID' };
      }

      const targetRole =
        userRole === 'interviewer' ? 'кандидате' : 'интервьюере';
      const message = `
🔔 <b>Напоминание о фидбеке</b>

Привет, ${user.firstName || user.username || 'друг'}!

Не забудьте оставить фидбек о ${targetRole} после собеседования по <b>${
        session.profession || 'неизвестной профессии'
      }</b>.

⭐ <b>Ваш фидбек очень важен!</b>
• Помогает улучшить качество собеседований
• Поддерживает сообщество
• Дает обратную связь партнеру

<a href="${this.frontendUrl}/history?session=${
        session.id
      }">📝 Оставить фидбек сейчас</a>
      `.trim();

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '⭐ Оставить фидбек',
              url: `${this.frontendUrl}/history?session=${session.id}`,
            },
          ],
          [
            {
              text: '⏰ Напомнить позже',
              callback_data: `remind_later_${session.id}`,
            },
          ],
        ],
      };

      return await this.sendMessage(user.tgId, message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error(`❌ Error sending feedback reminder to ${userId}:`, error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Отправляет уведомление о высоком рейтинге
   */
  async sendHighRatingNotification(userId, feedback, session) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tgId: true, firstName: true, username: true },
      });

      if (!user?.tgId) {
        console.log(`User ${userId} has no Telegram ID`);
        return { success: false, reason: 'No Telegram ID' };
      }

      const message = `
⭐ <b>Отличный рейтинг!</b>

Поздравляем, ${user.firstName || user.username || 'друг'}!

Вы получили отличную оценку <b>${
        feedback.rating
      }/5</b> за собеседование по <b>${
        session.profession || 'неизвестной профессии'
      }</b>!

🎉 <b>Это означает, что вы отлично справились с собеседованием!</b>

${feedback.comments ? `💬 <b>Комментарий:</b>\n"${feedback.comments}"` : ''}

Продолжайте в том же духе! 🚀

<a href="${this.frontendUrl}/history">📊 Посмотреть все отзывы</a>
      `.trim();

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '📊 Моя история',
              url: `${this.frontendUrl}/history`,
            },
          ],
          [
            {
              text: '🎯 Найти новое собеседование',
              url: `${this.frontendUrl}`,
            },
          ],
        ],
      };

      return await this.sendMessage(user.tgId, message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error(
        `❌ Error sending high rating notification to ${userId}:`,
        error
      );
      return { success: false, reason: error.message };
    }
  }

  /**
   * Отправляет уведомление об автоматическом завершении сессии
   */
  async sendAutoCompletedNotification(userId, session, userRole) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tgId: true, firstName: true, username: true },
      });

      if (!user?.tgId) {
        console.log(`User ${userId} has no Telegram ID`);
        return { success: false, reason: 'No Telegram ID' };
      }

      const targetRole =
        userRole === 'interviewer' ? 'кандидате' : 'интервьюере';
      const message = `
🔄 <b>Собеседование автоматически завершено</b>

Привет, ${user.firstName || user.username || 'друг'}!

Собеседование по <b>${
        session.profession || 'неизвестной профессии'
      }</b> было автоматически завершено системой.

📋 <b>Возможные причины:</b>
• Сессия длилась более 2 часов
• Один из участников покинул собеседование
• Технические проблемы

⭐ <b>Вы можете оставить фидбек о ${targetRole}!</b>

<a href="${this.frontendUrl}/history?session=${
        session.id
      }">📝 Оставить фидбек</a>
      `.trim();

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '⭐ Оставить фидбек',
              url: `${this.frontendUrl}/history?session=${session.id}`,
            },
          ],
          [
            {
              text: '🎯 Найти новое собеседование',
              url: `${this.frontendUrl}`,
            },
          ],
        ],
      };

      return await this.sendMessage(user.tgId, message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error(
        `❌ Error sending auto completed notification to ${userId}:`,
        error
      );
      return { success: false, reason: error.message };
    }
  }

  /**
   * Отправляет напоминание о предстоящем собеседовании
   */
  async sendUpcomingSessionReminder(userId, session, userRole) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tgId: true, firstName: true, username: true },
      });

      if (!user?.tgId) {
        console.log(`User ${userId} has no Telegram ID`);
        return { success: false, reason: 'No Telegram ID' };
      }

      const sessionTime = new Date(session.slotUtc);
      const timeString = sessionTime.toLocaleString('ru-RU', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const message = `
⏰ <b>Напоминание о собеседовании</b>

Привет, ${user.firstName || user.username || 'друг'}!

Через 15 минут начнется ваше собеседование!

📋 <b>Детали:</b>
• Время: ${timeString} UTC
• Профессия: ${session.profession || 'Не указана'}
• Язык: ${session.language || 'Не указан'}
• Ваша роль: ${userRole === 'interviewer' ? 'Интервьюер' : 'Кандидат'}
• Комната: ${session.jitsiRoom || 'Не указана'}

🎯 <b>Будьте готовы!</b>

<a href="${this.frontendUrl}/interview/${
        session.id
      }">🚀 Присоединиться к собеседованию</a>
      `.trim();

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🚀 Присоединиться',
              url: `${this.frontendUrl}/interview/${session.id}`,
            },
          ],
          [
            {
              text: '📋 Детали сессии',
              url: `${this.frontendUrl}/history?session=${session.id}`,
            },
          ],
        ],
      };

      return await this.sendMessage(user.tgId, message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error(
        `❌ Error sending upcoming session reminder to ${userId}:`,
        error
      );
      return { success: false, reason: error.message };
    }
  }

  /**
   * Обрабатывает callback запросы от Telegram бота
   */
  async handleCallback(callbackData, chatId, user) {
    try {
      if (callbackData.startsWith('remind_later_')) {
        const sessionId = callbackData.replace('remind_later_', '');

        // Создаем напоминание на 3 часа позже
        const remindLater = new Date(Date.now() + 3 * 60 * 60 * 1000);

        await prisma.notification.create({
          data: {
            userId: callbackData.userId, // Нужно передать userId
            type: 'feedback_reminder',
            title: 'Напоминание о фидбеке (отложено)',
            message: `Напоминание о фидбеке для сессии ${sessionId}`,
            status: 'active',
            priority: 2,
            actionData: JSON.stringify({
              sessionId,
              action: 'give_feedback',
              scheduledFor: remindLater.toISOString(),
            }),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        return { success: true, message: 'Напоминание отложено на 3 часа' };
      }

      if (callbackData === 'show_stats') {
        // Показываем статистику пользователя
        const user = await prisma.user.findFirst({
          where: { tgId: String(user.id) },
        });

        if (user) {
          // Получаем статистику пользователя
          const stats = await this.getUserStats(user.id);
          return await this.sendUserStats(user.id, stats);
        } else {
          return await this.sendMessage(
            chatId,
            '❌ Пользователь не найден в базе данных.'
          );
        }
      }

      if (callbackData === 'help') {
        // Показываем справку
        const helpMessage = `
❓ <b>Справка по SuperMock</b>

🎯 <b>Как использовать бота:</b>

1️⃣ <b>Нажмите кнопку START</b> - откроется приложение SuperMock
2️⃣ <b>Выберите профессию</b> - укажите область, в которой хотите практиковаться
3️⃣ <b>Выберите роль</b> - кандидат или интервьюер
4️⃣ <b>Найдите собеседование</b> - система подберет подходящего партнера
5️⃣ <b>Проведите собеседование</b> - используйте встроенную видеосвязь
6️⃣ <b>Оставьте фидбек</b> - оцените партнера и получите оценку

📋 <b>Доступные команды:</b>
• /start - главное меню
• /stats - ваша статистика
• /help - эта справка

🔗 <b>Полезные ссылки:</b>
• <a href="${this.frontendUrl}">Главная страница</a>
• <a href="${this.frontendUrl}/history">История собеседований</a>

💡 <b>Советы:</b>
• Будьте вежливы и профессиональны
• Оставляйте конструктивный фидбек
• Практикуйтесь регулярно для лучших результатов

Есть вопросы? Напишите нам! 📧
        `.trim();

        // Большая кнопка для открытия приложения
        const keyboard = {
          keyboard: [
            [
              {
                text: '🚀 Открыть SuperMock',
                web_app: {
                  url: `${this.frontendUrl}`,
                },
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
          selective: false,
        };

        // Inline кнопки для дополнительных функций
        const inlineKeyboard = {
          inline_keyboard: [
            [
              {
                text: '📊 Моя статистика',
                callback_data: 'show_stats',
              },
            ],
          ],
        };

        // Отправляем основное сообщение с большой кнопкой
        await this.sendMessage(chatId, helpMessage, {
          reply_markup: keyboard,
        });

        // Отправляем дополнительное сообщение с inline кнопками
        const additionalMessage = `
📱 <b>Дополнительные функции:</b>

Используйте кнопки ниже для быстрого доступа.
        `.trim();

        return await this.sendMessage(chatId, additionalMessage, {
          reply_markup: inlineKeyboard,
        });
      }

      return { success: false, message: 'Unknown callback' };
    } catch (error) {
      console.error('❌ Error handling callback:', error);
      return { success: false, message: 'Error handling callback' };
    }
  }

  /**
   * Обрабатывает команду /start и отправляет приветственное сообщение с кнопкой
   */
  async handleStartCommand(chatId, user) {
    try {
      if (!this.botToken) {
        console.warn('Telegram bot token not configured');
        return { success: false, reason: 'Bot token not configured' };
      }

      const welcomeMessage = `
🚀 <b>Добро пожаловать в SuperMock!</b>

Привет, ${user.first_name || user.username || 'друг'}! 👋

🎯 <b>SuperMock</b> - это платформа для практики собеседований с реальными людьми.

📋 <b>Что вы можете делать:</b>
• Найти собеседование по вашей профессии
• Практиковаться в роли кандидата или интервьюера
• Получать фидбек от партнеров
• Отслеживать свой прогресс

Нажмите кнопку <b>START</b> ниже, чтобы открыть приложение и начать практику! 🎉
      `.trim();

      // Создаем большую кнопку START для открытия мини-приложения
      const keyboard = {
        keyboard: [
          [
            {
              text: '🚀 Открыть SuperMock',
              web_app: {
                url: `${this.frontendUrl}`,
              },
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
        selective: false,
      };

      // Дополнительные кнопки в inline формате
      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: '📊 Моя статистика',
              callback_data: 'show_stats',
            },
          ],
          [
            {
              text: '❓ Помощь',
              callback_data: 'help',
            },
          ],
        ],
      };

      // Отправляем основное сообщение с большой кнопкой
      await this.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard,
      });

      // Отправляем дополнительное сообщение с inline кнопками
      const additionalMessage = `
📱 <b>Дополнительные возможности:</b>

Используйте кнопки ниже для быстрого доступа к функциям бота.
      `.trim();

      return await this.sendMessage(chatId, additionalMessage, {
        reply_markup: inlineKeyboard,
      });
    } catch (error) {
      console.error(`❌ Error handling start command for ${chatId}:`, error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Получает статистику пользователя
   */
  async getUserStats(userId) {
    try {
      // Получаем количество завершенных сессий
      const completedSessions = await prisma.session.count({
        where: {
          OR: [
            { interviewerId: userId, status: 'completed' },
            { candidateId: userId, status: 'completed' },
          ],
        },
      });

      // Получаем количество оставленных фидбеков
      const givenFeedbacks = await prisma.feedback.count({
        where: { fromUserId: userId },
      });

      // Получаем количество полученных фидбеков
      const receivedFeedbacks = await prisma.feedback.count({
        where: { toUserId: userId },
      });

      // Получаем средний рейтинг
      const avgRatingResult = await prisma.feedback.aggregate({
        where: { toUserId: userId },
        _avg: { rating: true },
      });

      const averageRating = avgRatingResult._avg.rating || 0;

      return {
        completedSessions,
        givenFeedbacks,
        receivedFeedbacks,
        averageRating: Math.round(averageRating * 10) / 10, // Округляем до 1 знака после запятой
      };
    } catch (error) {
      console.error(`❌ Error getting user stats for ${userId}:`, error);
      return {
        completedSessions: 0,
        givenFeedbacks: 0,
        receivedFeedbacks: 0,
        averageRating: 0,
      };
    }
  }

  /**
   * Отправляет статистику пользователю
   */
  async sendUserStats(userId, stats) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tgId: true, firstName: true, username: true },
      });

      if (!user?.tgId) {
        console.log(`User ${userId} has no Telegram ID`);
        return { success: false, reason: 'No Telegram ID' };
      }

      const message = `
📊 <b>Ваша статистика</b>

Привет, ${user.firstName || user.username || 'друг'}!

📈 <b>Ваши достижения:</b>
• Завершенных собеседований: ${stats.completedSessions}
• Оставленных фидбеков: ${stats.givenFeedbacks}
• Полученных фидбеков: ${stats.receivedFeedbacks}
• Средний рейтинг: ${stats.averageRating}/5

🏆 <b>Ваш статус:</b>
${
  stats.averageRating >= 4.5
    ? '⭐ Звездный участник'
    : stats.averageRating >= 4.0
    ? '🌟 Отличный участник'
    : stats.averageRating >= 3.5
    ? '✨ Хороший участник'
    : '👤 Участник'
}

<a href="${this.frontendUrl}/history">📊 Подробная статистика</a>
      `.trim();

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '📊 Подробная статистика',
              url: `${this.frontendUrl}/history`,
            },
          ],
          [
            {
              text: '🎯 Найти собеседование',
              url: `${this.frontendUrl}`,
            },
          ],
        ],
      };

      return await this.sendMessage(user.tgId, message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error(`❌ Error sending user stats to ${userId}:`, error);
      return { success: false, reason: error.message };
    }
  }
}

export default TelegramNotificationService;
