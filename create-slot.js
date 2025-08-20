#!/usr/bin/env node

/**
 * Простой скрипт для создания слотов времени
 * Запуск: node create-slot.js
 */

const API_BASE = 'http://localhost:3000';

async function createSlot() {
  console.log('🎯 Создание слота времени...\n');

  // Создаем интервьюера
  const interviewer = {
    userId: 1001,
    role: 'interviewer',
    profession: 'frontend',
    language: 'en',
    tools: ['react', 'typescript', 'vue'],
    slotTime: '14:00',
  };

  // Создаем кандидата
  const candidate = {
    userId: 1002,
    role: 'candidate',
    profession: 'frontend',
    language: 'en',
    tools: ['react', 'vue', 'angular'],
    slotTime: '14:00',
  };

  const users = [interviewer, candidate];

  for (const user of users) {
    try {
      console.log(`📝 Создаем ${user.role}: ${user.profession} developer`);

      // 1. Сохраняем инструменты
      const toolsResponse = await fetch(`${API_BASE}/api/user-tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          profession: user.profession,
          tools: user.tools,
        }),
      });

      if (toolsResponse.ok) {
        console.log(`  ✅ Инструменты сохранены: ${user.tools.join(', ')}`);
      } else {
        const error = await toolsResponse.text();
        console.log(
          `  ❌ Ошибка инструментов: ${toolsResponse.status} - ${error}`
        );
      }

      // 2. Создаем слот времени
      const slotTime = new Date();
      slotTime.setHours(14, 0, 0, 0); // 14:00

      const preferencesResponse = await fetch(`${API_BASE}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          role: user.role,
          profession: user.profession,
          language: user.language,
          slotsUtc: [slotTime.toISOString()],
        }),
      });

      if (preferencesResponse.ok) {
        console.log(`  ✅ Слот времени создан: ${user.slotTime}`);
      } else {
        const error = await preferencesResponse.text();
        console.log(
          `  ❌ Ошибка слота: ${preferencesResponse.status} - ${error}`
        );
      }
    } catch (error) {
      console.log(`  ❌ Ошибка для ${user.role}: ${error.message}`);
    }

    console.log('');
  }

  console.log('🎉 Слоты созданы!');
  console.log('\nТеперь можете протестировать:');
  console.log('1. Откройте приложение в браузере');
  console.log('2. Выберите роль Candidate');
  console.log('3. Выберите профессию Frontend');
  console.log('4. Выберите инструменты React, Vue');
  console.log('5. Перейдите на страницу времени');
  console.log('6. Должен появиться слот в 14:00 с учетом инструментов!');
}

// Запуск
if (import.meta.url === `file://${process.argv[1]}`) {
  createSlot();
}
