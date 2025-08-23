#!/usr/bin/env node

/**
 * Скрипт для создания тестовых пользователей с разными часовыми поясами
 * Тестирует систему синхронизации времени между пользователями
 * Запуск: node create-timezone-test-users.js
 */

import { DateTime } from 'luxon';

const API_BASE = 'http://localhost:3000';

// Тестовые пользователи с разными часовыми поясами
const testUsers = [
  // Москва (UTC+3) - Frontend разработчики
  {
    id: 2001,
    name: 'Анна (Москва)',
    profession: 'frontend',
    language: 'ru',
    tools: ['react', 'typescript', 'vue'],
    role: 'interviewer',
    timezone: 'Europe/Moscow',
    timezoneOffset: 'UTC+3',
    preferredTime: '10:00', // Утреннее время в Москве
  },
  {
    id: 2002,
    name: 'Михаил (Москва)',
    profession: 'frontend',
    language: 'ru',
    tools: ['react', 'javascript', 'css'],
    role: 'candidate',
    timezone: 'Europe/Moscow',
    timezoneOffset: 'UTC+3',
    preferredTime: '14:00', // Дневное время в Москве
  },
  
  // Владивосток (UTC+10) - Backend разработчики
  {
    id: 2003,
    name: 'Елена (Владивосток)',
    profession: 'backend',
    language: 'ru',
    tools: ['nodejs', 'python', 'postgresql'],
    role: 'interviewer',
    timezone: 'Asia/Vladivostok',
    timezoneOffset: 'UTC+10',
    preferredTime: '17:00', // Вечернее время во Владивостоке
  },
  {
    id: 2004,
    name: 'Дмитрий (Владивосток)',
    profession: 'backend',
    language: 'ru',
    tools: ['java', 'spring', 'mysql'],
    role: 'candidate',
    timezone: 'Asia/Vladivostok',
    timezoneOffset: 'UTC+10',
    preferredTime: '09:00', // Утреннее время во Владивостоке
  },
  
  // Нью-Йорк (UTC-5) - Full Stack разработчики
  {
    id: 2005,
    name: 'John (New York)',
    profession: 'fullstack',
    language: 'en',
    tools: ['react', 'nodejs', 'typescript'],
    role: 'interviewer',
    timezone: 'America/New_York',
    timezoneOffset: 'UTC-5',
    preferredTime: '15:00', // Дневное время в Нью-Йорке
  },
  {
    id: 2006,
    name: 'Sarah (New York)',
    profession: 'fullstack',
    language: 'en',
    tools: ['vue', 'python', 'mongodb'],
    role: 'candidate',
    timezone: 'America/New_York',
    timezoneOffset: 'UTC-5',
    preferredTime: '10:00', // Утреннее время в Нью-Йорке
  },
  
  // Лондон (UTC+0) - DevOps разработчики
  {
    id: 2007,
    name: 'Emma (London)',
    profession: 'devops',
    language: 'en',
    tools: ['docker', 'kubernetes', 'aws'],
    role: 'interviewer',
    timezone: 'Europe/London',
    timezoneOffset: 'UTC+0',
    preferredTime: '13:00', // Дневное время в Лондоне
  },
  {
    id: 2008,
    name: 'James (London)',
    profession: 'devops',
    language: 'en',
    tools: ['jenkins', 'terraform', 'gcp'],
    role: 'candidate',
    timezone: 'Europe/London',
    timezoneOffset: 'UTC+0',
    preferredTime: '16:00', // Вечернее время в Лондоне
  },
  
  // Токио (UTC+9) - Mobile разработчики
  {
    id: 2009,
    name: 'Yuki (Tokyo)',
    profession: 'mobile',
    language: 'en',
    tools: ['react-native', 'swift', 'kotlin'],
    role: 'interviewer',
    timezone: 'Asia/Tokyo',
    timezoneOffset: 'UTC+9',
    preferredTime: '20:00', // Вечернее время в Токио
  },
  {
    id: 2010,
    name: 'Hiroshi (Tokyo)',
    profession: 'mobile',
    language: 'en',
    tools: ['flutter', 'dart', 'firebase'],
    role: 'candidate',
    timezone: 'Asia/Tokyo',
    timezoneOffset: 'UTC+9',
    preferredTime: '11:00', // Утреннее время в Токио
  },
];

// Функция конвертации локального времени в UTC
function convertLocalToUTC(localTime, timezone) {
  const [hours, minutes] = localTime.split(':').map(Number);
  const localDate = DateTime.now().setZone(timezone);
  const slotDate = localDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  const utcDate = slotDate.toUTC();
  return utcDate.toISO();
}

// Функция для создания пользователя с предпочтениями
async function createUserWithPreferences(user) {
  try {
    console.log(`\n👤 Создаем пользователя: ${user.name} (${user.timezoneOffset})`);
    console.log(`   Профессия: ${user.profession}, Роль: ${user.role}, Язык: ${user.language}`);
    console.log(`   Инструменты: ${user.tools.join(', ')}`);
    console.log(`   Предпочтительное время: ${user.preferredTime} (${user.timezone})`);

    // 1. Конвертируем локальное время в UTC
    const utcSlot = convertLocalToUTC(user.preferredTime, user.timezone);
    const utcTime = DateTime.fromISO(utcSlot).toFormat('HH:mm');
    
    console.log(`   UTC время: ${utcTime} (${utcSlot})`);

    // 2. Сохраняем инструменты
    const toolsResponse = await fetch(`${API_BASE}/api/user-tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        profession: user.profession,
        tools: user.tools,
      }),
    });

    if (toolsResponse.ok) {
      console.log(`   ✅ Инструменты сохранены`);
    } else {
      const error = await toolsResponse.text();
      console.log(`   ❌ Ошибка инструментов: ${toolsResponse.status} - ${error}`);
    }

    // 3. Сохраняем предпочтения с UTC слотом
    const preferencesResponse = await fetch(`${API_BASE}/api/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        role: user.role,
        profession: user.profession,
        language: user.language,
        slotsUtc: [utcSlot],
      }),
    });

    if (preferencesResponse.ok) {
      console.log(`   ✅ Предпочтения сохранены`);
    } else {
      const error = await preferencesResponse.text();
      console.log(`   ❌ Ошибка предпочтений: ${preferencesResponse.status} - ${error}`);
    }

    // 4. Присоединяемся к слоту
    const joinResponse = await fetch(`${API_BASE}/api/slots/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        role: user.role,
        profession: user.profession,
        language: user.language,
        slotUtc: utcSlot,
        tools: user.tools,
      }),
    });

    if (joinResponse.ok) {
      const joinResult = await joinResponse.json();
      console.log(`   ✅ Присоединились к слоту (позиция в очереди: ${joinResult.position || 'N/A'})`);
    } else {
      const error = await joinResponse.text();
      console.log(`   ❌ Ошибка присоединения: ${joinResponse.status} - ${error}`);
    }

    return {
      ...user,
      utcSlot,
      utcTime,
      success: true,
    };

  } catch (error) {
    console.log(`   ❌ Ошибка для ${user.name}: ${error.message}`);
    return {
      ...user,
      success: false,
      error: error.message,
    };
  }
}

// Функция для анализа потенциальных матчей
function analyzePotentialMatches(users) {
  console.log('\n🔍 Анализ потенциальных матчей:\n');

  const successfulUsers = users.filter(u => u.success);
  
  // Группируем по UTC времени
  const timeGroups = {};
  successfulUsers.forEach(user => {
    if (!timeGroups[user.utcTime]) {
      timeGroups[user.utcTime] = [];
    }
    timeGroups[user.utcTime].push(user);
  });

  // Анализируем каждую группу времени
  Object.entries(timeGroups).forEach(([utcTime, groupUsers]) => {
    console.log(`⏰ UTC ${utcTime}:`);
    
    const candidates = groupUsers.filter(u => u.role === 'candidate');
    const interviewers = groupUsers.filter(u => u.role === 'interviewer');
    
    console.log(`   Кандидаты (${candidates.length}):`);
    candidates.forEach(c => {
      console.log(`     • ${c.name} (${c.timezoneOffset}) - ${c.profession} [${c.tools.join(', ')}]`);
    });
    
    console.log(`   Интервьюеры (${interviewers.length}):`);
    interviewers.forEach(i => {
      console.log(`     • ${i.name} (${i.timezoneOffset}) - ${i.profession} [${i.tools.join(', ')}]`);
    });

    // Показываем потенциальные матчи
    if (candidates.length > 0 && interviewers.length > 0) {
      console.log(`   🎯 Потенциальные матчи:`);
      candidates.forEach(candidate => {
        interviewers.forEach(interviewer => {
          const commonTools = candidate.tools.filter(t => interviewer.tools.includes(t));
          const matchScore = commonTools.length;
          
          console.log(`     • ${candidate.name} ↔ ${interviewer.name}`);
          console.log(`       Общие инструменты: ${commonTools.length > 0 ? commonTools.join(', ') : 'нет'}`);
          console.log(`       Оценка матча: ${matchScore}/3`);
          
          // Показываем время в локальных часовых поясах
          const candidateLocalTime = DateTime.fromISO(candidate.utcSlot).setZone(candidate.timezone).toFormat('HH:mm');
          const interviewerLocalTime = DateTime.fromISO(interviewer.utcSlot).setZone(interviewer.timezone).toFormat('HH:mm');
          
          console.log(`       Время: ${candidate.name} ${candidateLocalTime} ↔ ${interviewer.name} ${interviewerLocalTime}`);
          console.log('');
        });
      });
    } else {
      console.log(`   ⚠️  Нет потенциальных матчей (только ${candidates.length} кандидатов и ${interviewers.length} интервьюеров)`);
    }
    
    console.log('');
  });
}

// Функция для демонстрации времени в разных часовых поясах
function demonstrateTimezoneConversion(users) {
  console.log('\n🌍 Демонстрация времени в разных часовых поясах:\n');

  const successfulUsers = users.filter(u => u.success);
  if (successfulUsers.length === 0) {
    console.log('❌ Нет успешно созданных пользователей для демонстрации');
    return;
  }

  // Берем первый успешный пользователя как пример
  const exampleUser = successfulUsers[0];
  const utcTime = exampleUser.utcTime;
  
  console.log(`📅 Пример: ${exampleUser.name} выбрал ${exampleUser.preferredTime} (${exampleUser.timezone})`);
  console.log(`🕐 Это соответствует ${utcTime} UTC\n`);

  // Показываем это время в разных часовых поясах
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

  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcDate = DateTime.utc().set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

  timezones.forEach(tz => {
    const localTime = utcDate.setZone(tz.zone);
    console.log(`${tz.name} (${tz.offset}): ${localTime.toFormat('HH:mm')}`);
  });
}

// Основная функция
async function createTimezoneTestUsers() {
  console.log('🌍 Создание тестовых пользователей с разными часовыми поясами\n');
  console.log('📋 План тестирования:');
  console.log('• 10 пользователей из 5 разных часовых поясов');
  console.log('• Разные профессии, инструменты и языки');
  console.log('• Тестирование синхронизации времени');
  console.log('• Анализ потенциальных матчей\n');

  const results = [];

  // Создаем пользователей
  for (const user of testUsers) {
    const result = await createUserWithPreferences(user);
    results.push(result);
    
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Анализируем результаты
  const successfulUsers = results.filter(r => r.success);
  const failedUsers = results.filter(r => !r.success);

  console.log('\n📊 Результаты создания:');
  console.log(`✅ Успешно создано: ${successfulUsers.length}/${testUsers.length}`);
  console.log(`❌ Ошибки: ${failedUsers.length}/${testUsers.length}`);

  if (failedUsers.length > 0) {
    console.log('\n❌ Пользователи с ошибками:');
    failedUsers.forEach(user => {
      console.log(`   • ${user.name}: ${user.error}`);
    });
  }

  // Анализируем потенциальные матчи
  analyzePotentialMatches(results);

  // Демонстрируем конвертацию времени
  demonstrateTimezoneConversion(results);

  console.log('\n🎉 Тестирование завершено!');
  console.log('\n💡 Следующие шаги:');
  console.log('1. Откройте приложение в браузере');
  console.log('2. Проверьте страницу выбора времени');
  console.log('3. Убедитесь, что слоты отображаются корректно');
  console.log('4. Протестируйте матчинг между пользователями');
  console.log('5. Проверьте синхронизацию времени в разных часовых поясах');
}

// Запуск
createTimezoneTestUsers().catch(console.error);
