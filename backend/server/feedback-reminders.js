import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import TelegramNotificationService from './telegram-notifications.js';

/**
 * Система автоматических напоминаний о фидбеке
 */
class FeedbackReminderService {
  constructor() {
    this.reminderIntervals = {
      first: 24 * 60 * 60 * 1000, // 24 часа
      second: 3 * 24 * 60 * 60 * 1000, // 3 дня
      final: 7 * 24 * 60 * 60 * 1000, // 7 дней
    };
    this.telegramService = new TelegramNotificationService();
  }

  /**
   * Проверяет завершенные сессии без фидбека и создает напоминания
   */
  async checkAndCreateReminders() {
    try {
      console.log('🔔 Проверка напоминаний о фидбеке...');

      // Получаем завершенные сессии старше 24 часов
      const completedSessions = await prisma.session.findMany({
        where: {
          status: 'completed',
          completedAt: {
            lt: new Date(Date.now() - this.reminderIntervals.first),
          },
        },
        include: {
          interviewer: true,
          candidate: true,
          feedback: true,
        },
      });

      let remindersCreated = 0;

      for (const session of completedSessions) {
        const reminders = await this.createRemindersForSession(session);
        remindersCreated += reminders.length;
      }

      console.log(`✅ Создано ${remindersCreated} напоминаний о фидбеке`);
      return remindersCreated;
    } catch (error) {
      console.error('❌ Ошибка при создании напоминаний:', error);
      throw error;
    }
  }

  /**
   * Создает напоминания для конкретной сессии
   */
  async createRemindersForSession(session) {
    const reminders = [];

    // Проверяем, есть ли уже фидбеки от участников
    const existingFeedbacks = session.feedback || [];
    const feedbackFromUserIds = existingFeedbacks.map((f) => f.fromUserId);

    // Для интервьюера
    if (
      session.interviewer &&
      !feedbackFromUserIds.includes(session.interviewer.id)
    ) {
      const reminder = await this.createReminderForUser(
        session.interviewer.id,
        session,
        'interviewer'
      );
      if (reminder) reminders.push(reminder);
    }

    // Для кандидата
    if (
      session.candidate &&
      !feedbackFromUserIds.includes(session.candidate.id)
    ) {
      const reminder = await this.createReminderForUser(
        session.candidate.id,
        session,
        'candidate'
      );
      if (reminder) reminders.push(reminder);
    }

    return reminders;
  }

  /**
   * Создает напоминание для конкретного пользователя
   */
  async createReminderForUser(userId, session, userRole) {
    try {
      // Проверяем, есть ли уже активное напоминание для этой сессии и пользователя
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'feedback_reminder',
          actionData: {
            contains: session.id,
          },
          status: 'active',
        },
      });

      if (existingReminder) {
        return null; // Напоминание уже существует
      }

      const targetUser =
        userRole === 'interviewer' ? session.candidate : session.interviewer;
      const targetRole =
        userRole === 'interviewer' ? 'кандидате' : 'интервьюере';

      // Создаем уведомление в базе данных
      const reminder = await prisma.notification.create({
        data: {
          userId,
          type: 'feedback_reminder',
          title: 'Напоминание о фидбеке',
          message: `Не забудьте оставить фидбек о ${targetRole} после собеседования по ${session.profession}.`,
          status: 'active',
          priority: 2,
          actionData: JSON.stringify({
            sessionId: session.id,
            action: 'give_feedback',
            targetUserId: targetUser?.id,
            reminderType: 'feedback',
          }),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Истекает через 7 дней
        },
      });

      // Отправляем уведомление через Telegram бот
      const telegramResult = await this.telegramService.sendFeedbackReminder(
        userId,
        session,
        userRole
      );

      if (telegramResult.success) {
        console.log(
          `📱 Telegram напоминание отправлено пользователю ${userId} о сессии ${session.id}`
        );
      } else {
        console.log(
          `⚠️ Telegram напоминание не отправлено пользователю ${userId}: ${telegramResult.reason}`
        );
      }

      console.log(
        `📧 Создано напоминание для пользователя ${userId} о сессии ${session.id}`
      );
      return reminder;
    } catch (error) {
      console.error(
        `❌ Ошибка при создании напоминания для пользователя ${userId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Отправляет уведомления о высоких рейтингах
   */
  async sendHighRatingNotifications() {
    try {
      console.log('⭐ Проверка высоких рейтингов...');

      // Получаем фидбеки с рейтингом 5 за последние 24 часа
      const highRatings = await prisma.feedback.findMany({
        where: {
          rating: 5,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          toUser: true,
          session: true,
        },
      });

      let notificationsSent = 0;

      for (const feedback of highRatings) {
        const notification = await this.createHighRatingNotification(feedback);
        if (notification) notificationsSent++;
      }

      console.log(
        `✅ Отправлено ${notificationsSent} уведомлений о высоких рейтингах`
      );
      return notificationsSent;
    } catch (error) {
      console.error(
        '❌ Ошибка при отправке уведомлений о высоких рейтингах:',
        error
      );
      throw error;
    }
  }

  /**
   * Создает уведомление о высоком рейтинге
   */
  async createHighRatingNotification(feedback) {
    try {
      // Проверяем, есть ли уже уведомление об этом рейтинге
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: feedback.toUserId,
          type: 'high_rating',
          actionData: {
            contains: feedback.id.toString(),
          },
        },
      });

      if (existingNotification) {
        return null; // Уведомление уже существует
      }

      // Создаем уведомление в базе данных
      const notification = await prisma.notification.create({
        data: {
          userId: feedback.toUserId,
          type: 'high_rating',
          title: 'Отличный рейтинг! ⭐',
          message: `Вы получили отличную оценку (5/5) за собеседование по ${feedback.session.profession}!`,
          status: 'active',
          priority: 3,
          actionData: JSON.stringify({
            feedbackId: feedback.id,
            sessionId: feedback.sessionId,
            rating: feedback.rating,
            action: 'view_feedback',
          }),
        },
      });

      // Отправляем уведомление через Telegram бот
      const telegramResult =
        await this.telegramService.sendHighRatingNotification(
          feedback.toUserId,
          feedback,
          feedback.session
        );

      if (telegramResult.success) {
        console.log(
          `📱 Telegram уведомление о высоком рейтинге отправлено пользователю ${feedback.toUserId}`
        );
      } else {
        console.log(
          `⚠️ Telegram уведомление о высоком рейтинге не отправлено пользователю ${feedback.toUserId}: ${telegramResult.reason}`
        );
      }

      console.log(
        `⭐ Создано уведомление о высоком рейтинге для пользователя ${feedback.toUserId}`
      );
      return notification;
    } catch (error) {
      console.error(
        `❌ Ошибка при создании уведомления о высоком рейтинге:`,
        error
      );
      return null;
    }
  }

  /**
   * Автоматически завершает старые сессии
   */
  async autoCompleteOldSessions() {
    try {
      console.log('🕐 Проверка старых сессий...');

      // Находим сессии старше 2 часов со статусом 'scheduled'
      const oldSessions = await prisma.session.findMany({
        where: {
          status: 'scheduled',
          createdAt: {
            lt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 часа
          },
        },
        include: {
          interviewer: true,
          candidate: true,
        },
      });

      let completedCount = 0;

      for (const session of oldSessions) {
        await this.autoCompleteSession(session);
        completedCount++;
      }

      console.log(`✅ Автоматически завершено ${completedCount} старых сессий`);
      return completedCount;
    } catch (error) {
      console.error('❌ Ошибка при автоматическом завершении сессий:', error);
      throw error;
    }
  }

  /**
   * Автоматически завершает одну сессию
   */
  async autoCompleteSession(session) {
    try {
      // Обновляем статус сессии
      await prisma.session.update({
        where: { id: session.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Создаем уведомления для участников
      const notifications = [];

      if (session.interviewer) {
        notifications.push({
          userId: session.interviewer.id,
          type: 'session_auto_completed',
          title: 'Собеседование автоматически завершено',
          message: `Собеседование по ${session.profession} было автоматически завершено. Вы можете оставить фидбек.`,
          status: 'active',
          priority: 1,
          actionData: JSON.stringify({
            sessionId: session.id,
            action: 'give_feedback',
            targetUserId: session.candidate?.id,
            autoCompleted: true,
          }),
        });

        // Отправляем Telegram уведомление
        const telegramResult =
          await this.telegramService.sendAutoCompletedNotification(
            session.interviewer.id,
            session,
            'interviewer'
          );

        if (telegramResult.success) {
          console.log(
            `📱 Telegram уведомление об авто-завершении отправлено интервьюеру ${session.interviewer.id}`
          );
        }
      }

      if (session.candidate) {
        notifications.push({
          userId: session.candidate.id,
          type: 'session_auto_completed',
          title: 'Собеседование автоматически завершено',
          message: `Собеседование по ${session.profession} было автоматически завершено. Вы можете оставить фидбек.`,
          status: 'active',
          priority: 1,
          actionData: JSON.stringify({
            sessionId: session.id,
            action: 'give_feedback',
            targetUserId: session.interviewer?.id,
            autoCompleted: true,
          }),
        });

        // Отправляем Telegram уведомление
        const telegramResult =
          await this.telegramService.sendAutoCompletedNotification(
            session.candidate.id,
            session,
            'candidate'
          );

        if (telegramResult.success) {
          console.log(
            `📱 Telegram уведомление об авто-завершении отправлено кандидату ${session.candidate.id}`
          );
        }
      }

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      console.log(`🔄 Сессия ${session.id} автоматически завершена`);
    } catch (error) {
      console.error(
        `❌ Ошибка при автоматическом завершении сессии ${session.id}:`,
        error
      );
    }
  }

  /**
   * Запускает все автоматические задачи
   */
  async runAllTasks() {
    try {
      console.log('🚀 Запуск автоматических задач...\n');

      const results = {
        remindersCreated: 0,
        highRatingNotifications: 0,
        sessionsAutoCompleted: 0,
      };

      // 1. Проверяем напоминания о фидбеке
      results.remindersCreated = await this.checkAndCreateReminders();

      // 2. Отправляем уведомления о высоких рейтингах
      results.highRatingNotifications =
        await this.sendHighRatingNotifications();

      // 3. Автоматически завершаем старые сессии
      results.sessionsAutoCompleted = await this.autoCompleteOldSessions();

      console.log('\n📊 Результаты автоматических задач:');
      console.log(`   - Напоминаний о фидбеке: ${results.remindersCreated}`);
      console.log(
        `   - Уведомлений о высоких рейтингах: ${results.highRatingNotifications}`
      );
      console.log(
        `   - Автоматически завершенных сессий: ${results.sessionsAutoCompleted}`
      );

      return results;
    } catch (error) {
      console.error('❌ Ошибка при выполнении автоматических задач:', error);
      throw error;
    }
  }
}

export default FeedbackReminderService;
