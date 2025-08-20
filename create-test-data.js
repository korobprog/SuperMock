#!/usr/bin/env node

/**
 * Простой скрипт для создания тестовых данных
 * Запуск: node create-test-data.js
 */

const API_BASE = 'http://localhost:3000';

async function createTestData() {
  console.log('🔧 Создание тестовых данных...\n');

  const testUsers = [
    {
      id: 1001,
      name: 'Frontend Developer',
      profession: 'frontend',
      language: 'en',
      tools: ['react', 'typescript', 'vue'],
      role: 'interviewer',
    },
    {
      id: 1002,
      name: 'Backend Developer',
      profession: 'backend',
      language: 'en',
      tools: ['nodejs', 'python', 'postgresql'],
      role: 'candidate',
    },
    {
      id: 1003,
      name: 'Full Stack Developer',
      profession: 'fullstack',
      language: 'en',
      tools: ['react', 'nodejs', 'typescript'],
      role: 'interviewer',
    },
  ];

  for (const user of testUsers) {
    try {
      console.log(`📝 Создаем данные для: ${user.name}`);

      // 1. Сохраняем инструменты
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
        console.log(`  ✅ Инструменты сохранены: ${user.tools.join(', ')}`);
      } else {
        console.log(
          `  ❌ Ошибка сохранения инструментов: ${toolsResponse.status}`
        );
      }

      // 2. Создаем слот времени (14:00)
      const slotTime = new Date();
      slotTime.setHours(14, 0, 0, 0);

      const preferencesResponse = await fetch(`${API_BASE}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          role: user.role,
          profession: user.profession,
          language: user.language,
          slotsUtc: [slotTime.toISOString()],
        }),
      });

      if (preferencesResponse.ok) {
        console.log(`  ✅ Слот времени создан: 14:00`);
      } else {
        console.log(
          `  ❌ Ошибка создания слота: ${preferencesResponse.status}`
        );
      }
    } catch (error) {
      console.log(`  ❌ Ошибка для ${user.name}: ${error.message}`);
    }

    console.log('');
  }

  console.log('🎉 Тестовые данные созданы!');
  console.log('\nТеперь можете протестировать систему:');
  console.log('1. Откройте приложение');
  console.log('2. Выберите профессию и инструменты');
  console.log('3. Перейдите на страницу выбора времени');
  console.log('4. Должны появиться слоты с учетом инструментов');
}

// Запуск
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestData();
}
