import FeedbackReminderService from './backend/server/feedback-reminders.js';
import InterviewAnalytics from './backend/server/analytics.js';

async function runAllAutomatedTasks() {
  console.log('🚀 Запуск всех автоматических задач системы интервью...\n');

  try {
    // 1. Запускаем автоматические напоминания
    console.log('📧 Запуск системы напоминаний...');
    const reminderService = new FeedbackReminderService();
    const reminderResults = await reminderService.runAllTasks();

    // 2. Генерируем аналитику
    console.log('\n📊 Генерация аналитики...');
    const analytics = new InterviewAnalytics();
    const analyticsData = await analytics.getFullAnalytics();

    // 3. Экспортируем аналитику
    console.log('\n📁 Экспорт аналитики...');
    const exportFile = await analytics.exportAnalytics();

    // 4. Выводим итоговый отчет
    console.log('\n🎉 Все автоматические задачи выполнены успешно!');
    console.log('\n📋 Итоговый отчет:');
    console.log('='.repeat(50));

    console.log('\n📧 Напоминания:');
    console.log(
      `   - Создано напоминаний о фидбеке: ${reminderResults.remindersCreated}`
    );
    console.log(
      `   - Уведомлений о высоких рейтингах: ${reminderResults.highRatingNotifications}`
    );
    console.log(
      `   - Автоматически завершенных сессий: ${reminderResults.sessionsAutoCompleted}`
    );

    console.log('\n📊 Общая статистика:');
    console.log(`   - Всего сессий: ${analyticsData.overall.totalSessions}`);
    console.log(
      `   - Завершенных сессий: ${analyticsData.overall.completedSessions}`
    );
    console.log(
      `   - Процент завершения: ${analyticsData.overall.completionRate}`
    );
    console.log(`   - Всего фидбеков: ${analyticsData.overall.totalFeedbacks}`);
    console.log(`   - Процент фидбеков: ${analyticsData.overall.feedbackRate}`);
    console.log(`   - Средний рейтинг: ${analyticsData.overall.averageRating}`);
    console.log(
      `   - Всего пользователей: ${analyticsData.overall.totalUsers}`
    );
    console.log(
      `   - Активных пользователей: ${analyticsData.overall.activeUsers}`
    );

    console.log('\n📈 Статистика за неделю:');
    console.log(
      `   - Сессий за неделю: ${analyticsData.weekly.sessionsInPeriod}`
    );
    console.log(
      `   - Завершенных за неделю: ${analyticsData.weekly.completedInPeriod}`
    );
    console.log(
      `   - Фидбеков за неделю: ${analyticsData.weekly.feedbacksInPeriod}`
    );
    console.log(
      `   - Средний рейтинг за неделю: ${analyticsData.weekly.averageRating}`
    );

    console.log('\n🏆 Топ профессий:');
    analyticsData.professions.slice(0, 5).forEach((prof, index) => {
      console.log(
        `   ${index + 1}. ${prof.profession}: ${
          prof.sessionsCount
        } сессий, рейтинг ${prof.averageRating}`
      );
    });

    console.log('\n🌍 Языки:');
    analyticsData.languages.slice(0, 3).forEach((lang, index) => {
      console.log(
        `   ${index + 1}. ${lang.language}: ${lang.sessionsCount} сессий`
      );
    });

    console.log('\n⭐ Распределение рейтингов:');
    analyticsData.ratings.distribution.forEach((rating) => {
      console.log(
        `   ${rating.rating} звезд: ${rating.count} (${rating.percentage}%)`
      );
    });

    console.log('\n⏰ Время до фидбека:');
    console.log(
      `   - Среднее время: ${analyticsData.feedbackTiming.averageTimeToFeedback}`
    );
    console.log(
      `   - 0-24 часа: ${analyticsData.feedbackTiming.timeRanges['0-24h']}`
    );
    console.log(
      `   - 24-72 часа: ${analyticsData.feedbackTiming.timeRanges['24-72h']}`
    );
    console.log(
      `   - 72+ часов: ${analyticsData.feedbackTiming.timeRanges['72h+']}`
    );

    console.log('\n📁 Файлы:');
    console.log(`   - Аналитика экспортирована в: ${exportFile}`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Все задачи выполнены успешно!');

    return {
      success: true,
      reminderResults,
      analyticsData,
      exportFile,
    };
  } catch (error) {
    console.error('❌ Ошибка при выполнении автоматических задач:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Запускаем задачи, если скрипт вызван напрямую
if (import.meta.url.endsWith('run-automated-tasks.js')) {
  runAllAutomatedTasks()
    .then((result) => {
      if (result.success) {
        console.log('\n🎯 Система готова к работе!');
        process.exit(0);
      } else {
        console.error('\n💥 Произошла ошибка:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

export default runAllAutomatedTasks;
