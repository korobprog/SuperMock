// Тестовый скрипт для проверки системы фидбека
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testFeedback() {
  console.log('🧪 Тестирование системы фидбека...\n');

  try {
    // 1. Тест простого фидбека
    console.log('1️⃣ Тестируем простой фидбек...');
    const simpleFeedback = await fetch(`${API_BASE}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-1',
        fromUserId: '1',
        toUserId: '2',
        rating: 5,
        comments: 'Отличное собеседование!'
      })
    });

    if (simpleFeedback.ok) {
      const result = await simpleFeedback.json();
      console.log('✅ Простой фидбек сохранен:', result);
    } else {
      const error = await simpleFeedback.text();
      console.log('❌ Ошибка простого фидбека:', error);
    }

    // 2. Тест расширенного фидбека
    console.log('\n2️⃣ Тестируем расширенный фидбек...');
    const enhancedFeedback = await fetch(`${API_BASE}/api/sessions/test-session-2/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId: '1',
        toUserId: '2',
        ratings: {
          preparation: 5,
          communication: 4,
          technicalSkills: 5,
          problemSolving: 4,
          overall: 5
        },
        comments: 'Очень хорошее собеседование с детальными ответами',
        recommendations: 'Продолжайте практиковаться в решении алгоритмических задач'
      })
    });

    if (enhancedFeedback.ok) {
      const result = await enhancedFeedback.json();
      console.log('✅ Расширенный фидбек сохранен:', result);
    } else {
      const error = await enhancedFeedback.text();
      console.log('❌ Ошибка расширенного фидбека:', error);
    }

    // 3. Тест получения истории
    console.log('\n3️⃣ Тестируем получение истории...');
    const history = await fetch(`${API_BASE}/api/history/1`);

    if (history.ok) {
      const result = await history.json();
      console.log('✅ История получена:', {
        sessionsCount: result.sessions?.length || 0,
        feedbacksCount: result.feedbacks?.length || 0
      });
      
      if (result.feedbacks?.length > 0) {
        console.log('📊 Последний фидбек:', result.feedbacks[0]);
      }
    } else {
      const error = await history.text();
      console.log('❌ Ошибка получения истории:', error);
    }

    // 4. Тест получения фидбека для сессии
    console.log('\n4️⃣ Тестируем получение фидбека для сессии...');
    const sessionFeedback = await fetch(`${API_BASE}/api/sessions/test-session-1/feedback?userId=1`);

    if (sessionFeedback.ok) {
      const result = await sessionFeedback.json();
      console.log('✅ Фидбек сессии получен:', {
        feedbacksCount: result.feedbacks?.length || 0,
        bothSidesSubmitted: result.bothSidesSubmitted
      });
    } else {
      const error = await sessionFeedback.text();
      console.log('❌ Ошибка получения фидбека сессии:', error);
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
  }
}

// Запускаем тест
testFeedback().then(() => {
  console.log('\n🏁 Тестирование завершено!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
