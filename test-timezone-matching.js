#!/usr/bin/env node

/**
 * Скрипт для тестирования матчинга между пользователями из разных часовых поясов
 * Запуск: node test-timezone-matching.js
 */

import { DateTime } from 'luxon';

const API_BASE = 'http://localhost:3000';

// Тестовые сценарии матчинга
const testScenarios = [
  {
    name: 'Москва ↔ Владивосток (Frontend)',
    candidate: {
      id: 2002,
      name: 'Михаил (Москва)',
      timezone: 'Europe/Moscow',
      timezoneOffset: 'UTC+3',
      profession: 'frontend',
      language: 'ru',
      tools: ['react', 'javascript', 'css'],
      localTime: '14:00',
    },
    interviewer: {
      id: 2001,
      name: 'Анна (Москва)',
      timezone: 'Europe/Moscow',
      timezoneOffset: 'UTC+3',
      profession: 'frontend',
      language: 'ru',
      tools: ['react', 'typescript', 'vue'],
      localTime: '10:00',
    },
    expectedMatch: false, // Разное время
  },
  {
    name: 'Москва ↔ Владивосток (Backend)',
    candidate: {
      id: 2004,
      name: 'Дмитрий (Владивосток)',
      timezone: 'Asia/Vladivostok',
      timezoneOffset: 'UTC+10',
      profession: 'backend',
      language: 'ru',
      tools: ['java', 'spring', 'mysql'],
      localTime: '09:00',
    },
    interviewer: {
      id: 2003,
      name: 'Елена (Владивосток)',
      timezone: 'Asia/Vladivostok',
      timezoneOffset: 'UTC+10',
      profession: 'backend',
      language: 'ru',
      tools: ['nodejs', 'python', 'postgresql'],
      localTime: '17:00',
    },
    expectedMatch: false, // Разное время
  },
  {
    name: 'Нью-Йорк ↔ Лондон (Full Stack)',
    candidate: {
      id: 2006,
      name: 'Sarah (New York)',
      timezone: 'America/New_York',
      timezoneOffset: 'UTC-5',
      profession: 'fullstack',
      language: 'en',
      tools: ['vue', 'python', 'mongodb'],
      localTime: '10:00',
    },
    interviewer: {
      id: 2005,
      name: 'John (New York)',
      timezone: 'America/New_York',
      timezoneOffset: 'UTC-5',
      profession: 'fullstack',
      language: 'en',
      tools: ['react', 'nodejs', 'typescript'],
      localTime: '15:00',
    },
    expectedMatch: false, // Разное время
  },
  {
    name: 'Лондон ↔ Токио (DevOps)',
    candidate: {
      id: 2008,
      name: 'James (London)',
      timezone: 'Europe/London',
      timezoneOffset: 'UTC+0',
      profession: 'devops',
      language: 'en',
      tools: ['jenkins', 'terraform', 'gcp'],
      localTime: '16:00',
    },
    interviewer: {
      id: 2007,
      name: 'Emma (London)',
      timezone: 'Europe/London',
      timezoneOffset: 'UTC+0',
      profession: 'devops',
      language: 'en',
      tools: ['docker', 'kubernetes', 'aws'],
      localTime: '13:00',
    },
    expectedMatch: false, // Разное время
  },
];

// Функция для получения слотов пользователя
async function getUserSlots(userId, role) {
  try {
    const response = await fetch(`${API_BASE}/api/my-bookings/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.queues.filter(q => q.role === role);
  } catch (error) {
    console.log(`   ❌ Ошибка получения слотов для ${userId}: ${error.message}`);
    return [];
  }
}

// Функция для тестирования матчинга
async function testMatching(candidate, interviewer) {
  console.log(`\n🎯 Тестируем матчинг: ${candidate.name} ↔ ${interviewer.name}`);
  console.log(`   Кандидат: ${candidate.timezoneOffset} (${candidate.localTime})`);
  console.log(`   Интервьюер: ${interviewer.timezoneOffset} (${interviewer.localTime})`);

  try {
    // Получаем слоты кандидата
    const candidateSlots = await getUserSlots(candidate.id, 'candidate');
    const interviewerSlots = await getUserSlots(interviewer.id, 'interviewer');

    console.log(`   Слоты кандидата: ${candidateSlots.length}`);
    console.log(`   Слоты интервьюера: ${interviewerSlots.length}`);

    if (candidateSlots.length === 0 || interviewerSlots.length === 0) {
      console.log(`   ⚠️  Нет слотов для матчинга`);
      return false;
    }

    // Проверяем пересечение по времени
    const candidateTimes = candidateSlots.map(s => s.slotUtc);
    const interviewerTimes = interviewerSlots.map(s => s.slotUtc);

    const commonTimes = candidateTimes.filter(time => interviewerTimes.includes(time));

    if (commonTimes.length > 0) {
      console.log(`   ✅ Найдено ${commonTimes.length} общих временных слотов`);
      
      // Показываем время в разных часовых поясах
      commonTimes.forEach(utcTime => {
        const utcDateTime = DateTime.fromISO(utcTime);
        const candidateLocalTime = utcDateTime.setZone(candidate.timezone).toFormat('HH:mm');
        const interviewerLocalTime = utcDateTime.setZone(interviewer.timezone).toFormat('HH:mm');
        
        console.log(`      UTC: ${utcDateTime.toFormat('HH:mm')}`);
        console.log(`      ${candidate.name}: ${candidateLocalTime}`);
        console.log(`      ${interviewer.name}: ${interviewerLocalTime}`);
      });

      // Проверяем совместимость инструментов
      const commonTools = candidate.tools.filter(t => interviewer.tools.includes(t));
      const matchScore = commonTools.length;
      
      console.log(`   Инструменты кандидата: ${candidate.tools.join(', ')}`);
      console.log(`   Инструменты интервьюера: ${interviewer.tools.join(', ')}`);
      console.log(`   Общие инструменты: ${commonTools.length > 0 ? commonTools.join(', ') : 'нет'}`);
      console.log(`   Оценка матча: ${matchScore}/3`);

      return true;
    } else {
      console.log(`   ❌ Нет общих временных слотов`);
      return false;
    }

  } catch (error) {
    console.log(`   ❌ Ошибка тестирования матчинга: ${error.message}`);
    return false;
  }
}

// Функция для демонстрации времени в разных часовых поясах
function demonstrateTimezoneConversion() {
  console.log('\n🌍 Демонстрация времени в разных часовых поясах:\n');

  const timezones = [
    { name: 'Москва', zone: 'Europe/Moscow', offset: 'UTC+3' },
    { name: 'Владивосток', zone: 'Asia/Vladivostok', offset: 'UTC+10' },
    { name: 'Екатеринбург', zone: 'Asia/Yekaterinburg', offset: 'UTC+5' },
    { name: 'Лондон', zone: 'Europe/London', offset: 'UTC+0' },
    { name: 'Нью-Йорк', zone: 'America/New_York', offset: 'UTC-5' },
    { name: 'Лос-Анджелес', zone: 'America/Los_Angeles', offset: 'UTC-8' },
    { name: 'Токио', zone: 'Asia/Tokyo', offset: 'UTC+9' },
    { name: 'Дубай', zone: 'Asia/Dubai', offset: 'UTC+4' },
  ];

  // Показываем текущее время
  const now = DateTime.now();
  console.log('🕐 Текущее время:');
  timezones.forEach(tz => {
    const localTime = now.setZone(tz.zone);
    console.log(`${tz.name} (${tz.offset}): ${localTime.toFormat('HH:mm')} - ${localTime.toFormat('EEEE, dd MMMM yyyy')}`);
  });

  // Показываем примеры конвертации
  console.log('\n📅 Примеры конвертации времени:');
  
  const examples = [
    { name: 'Утреннее интервью', moscowTime: '10:00' },
    { name: 'Дневное интервью', moscowTime: '14:00' },
    { name: 'Вечернее интервью', moscowTime: '19:00' },
  ];

  examples.forEach(example => {
    console.log(`\n${example.name} (Москва ${example.moscowTime}):`);
    
    // Конвертируем из Москвы в UTC
    const [hours, minutes] = example.moscowTime.split(':').map(Number);
    const moscowDate = DateTime.now().setZone('Europe/Moscow');
    const slotDate = moscowDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    const utcDate = slotDate.toUTC();
    
    timezones.forEach(tz => {
      const localTime = utcDate.setZone(tz.zone);
      console.log(`${tz.name}: ${localTime.toFormat('HH:mm')}`);
    });
  });
}

// Функция для проверки статуса системы
async function checkSystemStatus() {
  console.log('🔍 Проверка статуса системы:\n');

  try {
    // Проверяем статус сервера
    const statusResponse = await fetch(`${API_BASE}/api/dev/status`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Сервер работает');
      console.log(`   Кандидат ID: ${status.candidateId}`);
      console.log(`   Интервьюер ID: ${status.interviewerId}`);
      console.log(`   Очереди кандидатов: ${status.candidateQueues?.length || 0}`);
    } else {
      console.log('❌ Сервер не отвечает');
      return false;
    }

    // Проверяем количество пользователей в очереди
    const candidateSlots = await fetch(`${API_BASE}/api/slots?role=candidate&timezone=UTC`);
    const interviewerSlots = await fetch(`${API_BASE}/api/slots?role=interviewer&timezone=UTC`);
    
    if (candidateSlots.ok && interviewerSlots.ok) {
      const candidateData = await candidateSlots.json();
      const interviewerData = await interviewerSlots.json();
      
      const totalCandidates = candidateData.slots.reduce((sum, slot) => sum + slot.count, 0);
      const totalInterviewers = interviewerData.slots.reduce((sum, slot) => sum + slot.count, 0);
      
      console.log(`   Кандидатов в очереди: ${totalCandidates}`);
      console.log(`   Интервьюеров в очереди: ${totalInterviewers}`);
      console.log(`   Всего слотов: ${candidateData.slots.length + interviewerData.slots.length}`);
    }

    return true;
  } catch (error) {
    console.log(`❌ Ошибка проверки статуса: ${error.message}`);
    return false;
  }
}

// Основная функция
async function testTimezoneMatching() {
  console.log('🌍 Тестирование матчинга пользователей из разных часовых поясов\n');

  // Проверяем статус системы
  const systemOk = await checkSystemStatus();
  if (!systemOk) {
    console.log('❌ Система недоступна, прерываем тестирование');
    return;
  }

  console.log('\n📋 Тестовые сценарии:');
  testScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
  });

  // Тестируем каждый сценарий
  const results = [];
  for (const scenario of testScenarios) {
    const matched = await testMatching(scenario.candidate, scenario.interviewer);
    results.push({
      scenario: scenario.name,
      matched,
      expected: scenario.expectedMatch,
      success: matched === scenario.expectedMatch,
    });
  }

  // Анализируем результаты
  console.log('\n📊 Результаты тестирования:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const matchStatus = result.matched ? 'СОВПАЛ' : 'НЕ СОВПАЛ';
    console.log(`${status} ${result.scenario}: ${matchStatus} (ожидалось: ${result.expected ? 'СОВПАЛ' : 'НЕ СОВПАЛ'})`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Успешных тестов: ${successCount}/${results.length}`);

  // Демонстрируем конвертацию времени
  demonstrateTimezoneConversion();

  console.log('\n🎉 Тестирование завершено!');
  console.log('\n💡 Рекомендации:');
  console.log('• Проверьте логику матчинга в системе');
  console.log('• Убедитесь, что время корректно конвертируется');
  console.log('• Протестируйте реальные сценарии использования');
}

// Запуск
testTimezoneMatching().catch(console.error);
