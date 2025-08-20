#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки системы инструментов
 * Запуск: node test-tools-system.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Тестовые данные
const testUsers = [
  {
    id: 1001,
    name: 'Frontend Developer',
    profession: 'frontend',
    language: 'en',
    tools: ['react', 'typescript', 'vue', 'css'],
    role: 'interviewer',
  },
  {
    id: 1002,
    name: 'Backend Developer',
    profession: 'backend',
    language: 'en',
    tools: ['nodejs', 'python', 'postgresql', 'docker'],
    role: 'candidate',
  },
  {
    id: 1003,
    name: 'Full Stack Developer',
    profession: 'fullstack',
    language: 'en',
    tools: ['react', 'nodejs', 'typescript', 'postgresql'],
    role: 'interviewer',
  },
  {
    id: 1004,
    name: 'Designer',
    profession: 'designer',
    language: 'en',
    tools: ['figma', 'photoshop', 'sketch'],
    role: 'candidate',
  },
];

async function testAPI(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${data.error || 'Unknown error'}`
      );
    }

    return data;
  } catch (error) {
    console.error(`❌ API Error (${method} ${endpoint}):`, error.message);
    throw error;
  }
}

async function createTestUsers() {
  console.log('🔧 Создание тестовых пользователей...');

  for (const user of testUsers) {
    try {
      // Создаем пользователя (имитируем)
      console.log(`  - Создаем пользователя: ${user.name} (ID: ${user.id})`);

      // Сохраняем инструменты пользователя
      await testAPI('/api/user-tools', 'POST', {
        userId: user.id,
        profession: user.profession,
        tools: user.tools,
      });

      console.log(`  ✅ Инструменты сохранены для ${user.name}`);

      // Создаем слот времени (имитируем через preferences)
      const slotTime = new Date();
      slotTime.setHours(14, 0, 0, 0); // 14:00

      await testAPI('/api/preferences', 'POST', {
        userId: user.id,
        role: user.role,
        profession: user.profession,
        language: user.language,
        slotsUtc: [slotTime.toISOString()],
      });

      console.log(`  ✅ Слот времени создан для ${user.name}`);
    } catch (error) {
      console.log(`  ⚠️ Ошибка для ${user.name}:`, error.message);
    }
  }
}

async function testUserToolsAPI() {
  console.log('\n🔍 Тестирование API инструментов пользователей...');

  try {
    // Получаем инструменты пользователя
    const userTools = await testAPI('/api/user-tools?userId=1001');
    console.log('✅ Получение инструментов:', userTools);

    // Обновляем инструменты
    const updatedTools = await testAPI('/api/user-tools', 'POST', {
      userId: 1001,
      profession: 'frontend',
      tools: ['react', 'vue', 'angular', 'typescript'],
    });
    console.log('✅ Обновление инструментов:', updatedTools);
  } catch (error) {
    console.log('❌ Ошибка тестирования API инструментов:', error.message);
  }
}

async function testSlotsWithTools() {
  console.log('\n🔍 Тестирование слотов с инструментами...');

  try {
    // Тест 1: Строгий поиск (exact)
    const exactSlots = await testAPI(
      '/api/slots/with-tools?role=candidate&profession=frontend&language=en&tools=react&tools=typescript&matchStrictness=exact'
    );
    console.log('✅ Строгий поиск (exact):', exactSlots);

    // Тест 2: Частичный поиск (partial)
    const partialSlots = await testAPI(
      '/api/slots/with-tools?role=candidate&profession=frontend&language=en&tools=react&tools=typescript&matchStrictness=partial'
    );
    console.log('✅ Частичный поиск (partial):', partialSlots);

    // Тест 3: Любое совпадение (any)
    const anySlots = await testAPI(
      '/api/slots/with-tools?role=candidate&profession=frontend&language=en&tools=react&tools=typescript&matchStrictness=any'
    );
    console.log('✅ Любое совпадение (any):', anySlots);
  } catch (error) {
    console.log('❌ Ошибка тестирования слотов:', error.message);
  }
}

async function testMatchingLogic() {
  console.log('\n🔍 Тестирование логики матчинга...');

  const testCases = [
    {
      name: 'Frontend + React/TypeScript',
      params: {
        role: 'candidate',
        profession: 'frontend',
        language: 'en',
        tools: ['react', 'typescript'],
        matchStrictness: 'any',
      },
    },
    {
      name: 'Backend + Node.js/Python',
      params: {
        role: 'interviewer',
        profession: 'backend',
        language: 'en',
        tools: ['nodejs', 'python'],
        matchStrictness: 'partial',
      },
    },
    {
      name: 'Full Stack + React/Node.js',
      params: {
        role: 'candidate',
        profession: 'fullstack',
        language: 'en',
        tools: ['react', 'nodejs', 'typescript'],
        matchStrictness: 'exact',
      },
    },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n  Тест: ${testCase.name}`);
      const slots = await testAPI(
        '/api/slots/with-tools?' +
          new URLSearchParams({
            ...testCase.params,
            tools: testCase.params.tools.join(','),
          })
      );
      console.log(`  ✅ Результат: ${slots.slots?.length || 0} слотов найдено`);

      if (slots.slots?.length > 0) {
        slots.slots.forEach((slot) => {
          console.log(
            `    - ${slot.time}: ${slot.count} пользователей, score: ${
              slot.matchScore || 'N/A'
            }`
          );
        });
      }
    } catch (error) {
      console.log(`  ❌ Ошибка: ${error.message}`);
    }
  }
}

async function cleanup() {
  console.log('\n🧹 Очистка тестовых данных...');

  try {
    // Очищаем тестовых пользователей (имитируем)
    for (const user of testUsers) {
      try {
        await testAPI(`/api/dev/cleanup`, 'POST');
        console.log(`  ✅ Очищены данные для ${user.name}`);
      } catch (error) {
        console.log(`  ⚠️ Ошибка очистки для ${user.name}:`, error.message);
      }
    }
  } catch (error) {
    console.log('❌ Ошибка очистки:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Запуск тестов системы инструментов...\n');

  try {
    await createTestUsers();
    await testUserToolsAPI();
    await testSlotsWithTools();
    await testMatchingLogic();

    console.log('\n✅ Все тесты завершены!');

    // Очистка по запросу
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('\n🧹 Очистить тестовые данные? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await cleanup();
      }
      rl.close();
    });
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  }
}

// Запуск тестов
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export {
  testAPI,
  createTestUsers,
  testUserToolsAPI,
  testSlotsWithTools,
  testMatchingLogic,
};
