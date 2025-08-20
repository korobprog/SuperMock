import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

/**
 * Система аналитики и статистики для завершенных интервью
 */
class InterviewAnalytics {
  constructor() {
    this.timeRanges = {
      today: new Date(Date.now() - 24 * 60 * 60 * 1000),
      week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      year: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Получает общую статистику по завершенным интервью
   */
  async getOverallStats() {
    try {
      const [
        totalSessions,
        completedSessions,
        totalFeedbacks,
        averageRating,
        totalUsers,
        activeUsers,
      ] = await Promise.all([
        prisma.session.count(),
        prisma.session.count({ where: { status: 'completed' } }),
        prisma.feedback.count(),
        prisma.feedback.aggregate({ _avg: { rating: true } }),
        prisma.user.count(),
        prisma.user.count({
          where: {
            OR: [
              { sessionsAsInterviewer: { some: {} } },
              { sessionsAsCandidate: { some: {} } },
            ],
          },
        }),
      ]);

      const completionRate =
        totalSessions > 0
          ? ((completedSessions / totalSessions) * 100).toFixed(1)
          : 0;
      const feedbackRate =
        completedSessions > 0
          ? ((totalFeedbacks / (completedSessions * 2)) * 100).toFixed(1)
          : 0;

      return {
        totalSessions,
        completedSessions,
        completionRate: `${completionRate}%`,
        totalFeedbacks,
        feedbackRate: `${feedbackRate}%`,
        averageRating: averageRating._avg.rating?.toFixed(1) || 'N/A',
        totalUsers,
        activeUsers,
      };
    } catch (error) {
      console.error('❌ Ошибка при получении общей статистики:', error);
      throw error;
    }
  }

  /**
   * Получает статистику по временным периодам
   */
  async getTimeBasedStats(timeRange = 'week') {
    try {
      const startDate = this.timeRanges[timeRange];
      if (!startDate) {
        throw new Error('Неверный временной диапазон');
      }

      const [
        sessionsInPeriod,
        completedInPeriod,
        feedbacksInPeriod,
        averageRatingInPeriod,
      ] = await Promise.all([
        prisma.session.count({
          where: { createdAt: { gte: startDate } },
        }),
        prisma.session.count({
          where: {
            status: 'completed',
            completedAt: { gte: startDate },
          },
        }),
        prisma.feedback.count({
          where: { createdAt: { gte: startDate } },
        }),
        prisma.feedback.aggregate({
          where: { createdAt: { gte: startDate } },
          _avg: { rating: true },
        }),
      ]);

      return {
        period: timeRange,
        sessionsInPeriod,
        completedInPeriod,
        feedbacksInPeriod,
        averageRating: averageRatingInPeriod._avg.rating?.toFixed(1) || 'N/A',
        completionRate:
          sessionsInPeriod > 0
            ? ((completedInPeriod / sessionsInPeriod) * 100).toFixed(1)
            : 0,
      };
    } catch (error) {
      console.error('❌ Ошибка при получении статистики по времени:', error);
      throw error;
    }
  }

  /**
   * Получает статистику по профессиям
   */
  async getProfessionStats() {
    try {
      const professionStats = await prisma.session.groupBy({
        by: ['profession'],
        where: { status: 'completed' },
        _count: { id: true },
      });

      // Получаем фидбеки с информацией о сессиях
      const feedbacksWithSessions = await prisma.feedback.findMany({
        include: {
          session: true,
        },
      });

      // Объединяем статистику
      const stats = professionStats.map((stat) => {
        const feedbacks = feedbacksWithSessions.filter(
          (f) => f.session?.profession === stat.profession
        );
        const avgRating =
          feedbacks.length > 0
            ? (
                feedbacks.reduce((sum, f) => sum + f.rating, 0) /
                feedbacks.length
              ).toFixed(1)
            : 'N/A';

        return {
          profession: stat.profession,
          sessionsCount: stat._count.id,
          averageRating: avgRating,
          feedbacksCount: feedbacks.length,
        };
      });

      return stats.sort((a, b) => b.sessionsCount - a.sessionsCount);
    } catch (error) {
      console.error('❌ Ошибка при получении статистики по профессиям:', error);
      throw error;
    }
  }

  /**
   * Получает статистику по языкам
   */
  async getLanguageStats() {
    try {
      const languageStats = await prisma.session.groupBy({
        by: ['language'],
        where: { status: 'completed' },
        _count: { id: true },
      });

      return languageStats
        .map((stat) => ({
          language: stat.language,
          sessionsCount: stat._count.id,
        }))
        .sort((a, b) => b.sessionsCount - a.sessionsCount);
    } catch (error) {
      console.error('❌ Ошибка при получении статистики по языкам:', error);
      throw error;
    }
  }

  /**
   * Получает топ пользователей по активности
   */
  async getTopUsers(limit = 10) {
    try {
      const topInterviewers = await prisma.user.findMany({
        where: {
          sessionsAsInterviewer: {
            some: { status: 'completed' },
          },
        },
        include: {
          sessionsAsInterviewer: {
            where: { status: 'completed' },
          },
          feedbackReceived: true,
        },
        take: limit,
      });

      const topCandidates = await prisma.user.findMany({
        where: {
          sessionsAsCandidate: {
            some: { status: 'completed' },
          },
        },
        include: {
          sessionsAsCandidate: {
            where: { status: 'completed' },
          },
          feedbackReceived: true,
        },
        take: limit,
      });

      const processUserStats = (users, role) => {
        return users
          .map((user) => {
            const sessions =
              role === 'interviewer'
                ? user.sessionsAsInterviewer
                : user.sessionsAsCandidate;
            const avgRating =
              user.feedbackReceived.length > 0
                ? (
                    user.feedbackReceived.reduce(
                      (sum, f) => sum + f.rating,
                      0
                    ) / user.feedbackReceived.length
                  ).toFixed(1)
                : 'N/A';

            return {
              id: user.id,
              username: user.username || `${user.firstName} ${user.lastName}`,
              role,
              sessionsCount: sessions.length,
              averageRating: avgRating,
              feedbacksReceived: user.feedbackReceived.length,
            };
          })
          .sort((a, b) => b.sessionsCount - a.sessionsCount);
      };

      return {
        topInterviewers: processUserStats(topInterviewers, 'interviewer'),
        topCandidates: processUserStats(topCandidates, 'candidate'),
      };
    } catch (error) {
      console.error('❌ Ошибка при получении топ пользователей:', error);
      throw error;
    }
  }

  /**
   * Получает статистику по рейтингам
   */
  async getRatingStats() {
    try {
      const ratingDistribution = await prisma.feedback.groupBy({
        by: ['rating'],
        _count: { id: true },
      });

      const totalFeedbacks = ratingDistribution.reduce(
        (sum, r) => sum + r._count.id,
        0
      );

      const distribution = ratingDistribution
        .map((rating) => ({
          rating: rating.rating,
          count: rating._count.id,
          percentage:
            totalFeedbacks > 0
              ? ((rating._count.id / totalFeedbacks) * 100).toFixed(1)
              : 0,
        }))
        .sort((a, b) => a.rating - b.rating);

      const averageRating = await prisma.feedback.aggregate({
        _avg: { rating: true },
      });

      return {
        distribution,
        totalFeedbacks,
        averageRating: averageRating._avg.rating?.toFixed(1) || 'N/A',
      };
    } catch (error) {
      console.error('❌ Ошибка при получении статистики по рейтингам:', error);
      throw error;
    }
  }

  /**
   * Получает статистику по времени до отправки фидбека
   */
  async getFeedbackTimingStats() {
    try {
      const feedbacksWithTiming = await prisma.feedback.findMany({
        include: {
          session: true,
        },
        where: {
          session: {
            completedAt: { not: null },
          },
        },
      });

      const timingStats = feedbacksWithTiming.map((feedback) => {
        const sessionCompleted = new Date(feedback.session.completedAt);
        const feedbackCreated = new Date(feedback.createdAt);
        const hoursDiff =
          (feedbackCreated - sessionCompleted) / (1000 * 60 * 60);

        return {
          hoursToFeedback: hoursDiff,
          rating: feedback.rating,
        };
      });

      const averageTime =
        timingStats.length > 0
          ? (
              timingStats.reduce((sum, t) => sum + t.hoursToFeedback, 0) /
              timingStats.length
            ).toFixed(1)
          : 0;

      const timeRanges = {
        '0-24h': timingStats.filter((t) => t.hoursToFeedback <= 24).length,
        '24-72h': timingStats.filter(
          (t) => t.hoursToFeedback > 24 && t.hoursToFeedback <= 72
        ).length,
        '72h+': timingStats.filter((t) => t.hoursToFeedback > 72).length,
      };

      return {
        averageTimeToFeedback: `${averageTime} часов`,
        timeRanges,
        totalFeedbacks: timingStats.length,
      };
    } catch (error) {
      console.error(
        '❌ Ошибка при получении статистики по времени фидбека:',
        error
      );
      throw error;
    }
  }

  /**
   * Получает полную аналитику
   */
  async getFullAnalytics() {
    try {
      console.log('📊 Генерация полной аналитики...');

      const [
        overallStats,
        weekStats,
        professionStats,
        languageStats,
        topUsers,
        ratingStats,
        feedbackTiming,
      ] = await Promise.all([
        this.getOverallStats(),
        this.getTimeBasedStats('week'),
        this.getProfessionStats(),
        this.getLanguageStats(),
        this.getTopUsers(),
        this.getRatingStats(),
        this.getFeedbackTimingStats(),
      ]);

      const analytics = {
        overall: overallStats,
        weekly: weekStats,
        professions: professionStats,
        languages: languageStats,
        topUsers,
        ratings: ratingStats,
        feedbackTiming,
        generatedAt: new Date().toISOString(),
      };

      console.log('✅ Аналитика сгенерирована успешно');
      return analytics;
    } catch (error) {
      console.error('❌ Ошибка при генерации аналитики:', error);
      throw error;
    }
  }

  /**
   * Экспортирует аналитику в JSON файл
   */
  async exportAnalytics(filename = 'interview-analytics.json') {
    try {
      const analytics = await this.getFullAnalytics();

      fs.writeFileSync(filename, JSON.stringify(analytics, null, 2));
      console.log(`📁 Аналитика экспортирована в ${filename}`);

      return filename;
    } catch (error) {
      console.error('❌ Ошибка при экспорте аналитики:', error);
      throw error;
    }
  }
}

export default InterviewAnalytics;
