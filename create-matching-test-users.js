#!/usr/bin/env node

/**
 * Скрипт для создания пользователей с одинаковым временем для тестирования матчинга
 * Запуск: node create-matching-test-users.js
 */

import { DateTime } from 'luxon';

const API_BASE = 'http://localhost:3000';

// Пользователи с одинаковым временем для тестирования матчинга
const matchingTestUsers = [
  // Сценарий 1: Москва - Frontend разработчики в 10:00
  {
    id: 3001,
    name: 'Алексей (Москва)',
    profession: 'frontend',
    language: 'ru',
    tools: ['react', 'typescript', 'css'],
    role: 'candidate',
    timezone: 'Europe/Moscow',
    timezoneOffset: 'UTC+3',
    preferredTime: '10:00',
  },
  {
    id: 3002,
    name: 'Мария (Москва)',
    profession: 'frontend',
    language: 'ru',
    tools: ['react', 'javascript', 'vue'],
    role: 'interviewer',
    timezone: 'Europe/Moscow',
    timezoneOffset: 'UTC+3',
    preferredTime: '10:00',
  },
  
  // Сценарий 2: Владивосток - Backend разработчики в 17:00
  {
    id: 3003,
    name: 'Сергей (Владивосток)',
    profession: 'backend',
    language: 'ru',
    tools: ['nodejs', 'python', 'mongodb'],
    role: 'candidate',
    timezone: 'Asia/Vladivostok',
    timezoneOffset: 'UTC+10',
    preferredTime: '17:00',
  },
  {
    id: 3004,
    name: 'Ольга (Владивосток)',
    profession: 'backend',
    language: 'ru',
    tools: ['nodejs', 'typescript', 'postgresql'],
    role: 'interviewer',
    timezone: 'Asia/Vladivostok',
    timezoneOffset: 'UTC+10',
    preferredTime: '17:00',
  },
  
  // Сценарий 3: Нью-Йорк - Full Stack разработчики в 15:00
  {
    id: 3005,
    name: 'Mike (New York)',
    profession: 'fullstack',
    language: 'en',
    tools: ['react', 'nodejs', 'typescript'],
    role: 'candidate',
    timezone: 'America/New_York',
    timezoneOffset: 'UTC-5',
    preferredTime: '15:00',
  },
  {
    id: 3006,
    name: 'Lisa (New York)',
    profession: 'fullstack',
    language: 'en',
    tools: ['vue', 'python', 'mongodb'],
    role: 'interviewer',
    timezone: 'America/New_York',
    timezoneOffset: 'UTC-5',
    preferredTime: '15:00',
  },
  
  // Сценарий 4: Лондон - DevOps разработчики в 13:00
  {
    id: 3007,
    name: 'David (London)',
    profession: 'devops',
    language: 'en',
    tools: ['docker', 'kubernetes', 'aws'],
    role: 'candidate',
    timezone: 'Europe/London',
    timezoneOffset: 'UTC+0',
    preferredTime: '13:00',
  },
  {
    id: 3008,
    name: 'Helen (London)',
    profession: 'devops',
    language: 'en',
    tools: ['jenkins', 'terraform', 'gcp'],
    role: 'interviewer',
    timezone: 'Europe/London',
    timezoneOffset: 'UTC+0',
    preferredTime: '13:00',
  },
  
  // Сценарий 5: Токио - Mobile разработчики в 20:00
  {
    id: 3009,
    name: 'Kenji (Tokyo)',
    profession: 'mobile',
    language: 'en',
    tools: ['react-native', 'swift', 'firebase'],
    role: 'candidate',
    timezone: 'Asia/Tokyo',
    timezoneOffset: 'UTC+9',
    preferredTime: '20:00',
  },
  {
    id: 3010,
    name: 'Aiko (Tokyo)',
    profession: 'mobile',
    language: 'en',
    tools: ['flutter', 'dart', 'kotlin'],
    role: 'interviewer',
    timezone: 'Asia/Tokyo',
    timezoneOffset: 'UTC+9',
    preferredTime: '20:00',
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

    // 2. Сохраняем предпочтения с UTC слотом
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

    // 3. Присоединяемся к слоту
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
function analyzeMatchingScenarios(users) {
  console.log('\n🔍 Анализ сценариев матчинга:\n');

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
          
          if (matchScore > 0) {
            console.log(`       ✅ Хороший матч!`);
          } else {
            console.log(`       ⚠️  Нет общих инструментов`);
          }
          console.log('');
        });
      });
    } else {
      console.log(`   ⚠️  Нет потенциальных матчей (только ${candidates.length} кандидатов и ${interviewers.length} интервьюеров)`);
    }
    
    console.log('');
  });
}

// Основная функция
async function createMatchingTestUsers() {
  console.log('🎯 Создание пользователей для тестирования матчинга\n');
  console.log('📋 План тестирования:');
  console.log('• 10 пользователей с одинаковым временем в 5 сценариях');
  console.log('• Тестирование успешного матчинга');
  console.log('• Проверка совместимости инструментов');
  console.log('• Анализ качества матчей\n');

  const results = [];

  // Создаем пользователей
  for (const user of matchingTestUsers) {
    const result = await createUserWithPreferences(user);
    results.push(result);
    
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Анализируем результаты
  const successfulUsers = results.filter(r => r.success);
  const failedUsers = results.filter(r => !r.success);

  console.log('\n📊 Результаты создания:');
  console.log(`✅ Успешно создано: ${successfulUsers.length}/${matchingTestUsers.length}`);
  console.log(`❌ Ошибки: ${failedUsers.length}/${matchingTestUsers.length}`);

  if (failedUsers.length > 0) {
    console.log('\n❌ Пользователи с ошибками:');
    failedUsers.forEach(user => {
      console.log(`   • ${user.name}: ${user.error}`);
    });
  }

  // Анализируем потенциальные матчи
  analyzeMatchingScenarios(results);

  console.log('\n🎉 Создание завершено!');
  console.log('\n💡 Следующие шаги:');
  console.log('1. Запустите тест матчинга: node test-timezone-matching.js');
  console.log('2. Проверьте страницу выбора времени в браузере');
  console.log('3. Убедитесь, что матчинг работает корректно');
  console.log('4. Протестируйте создание сессий');
}

// Запуск
createMatchingTestUsers().catch(console.error);
