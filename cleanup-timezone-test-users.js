#!/usr/bin/env node

/**
 * Скрипт для очистки тестовых пользователей с разными часовыми поясами
 * Запуск: node cleanup-timezone-test-users.js
 */

const API_BASE = 'http://localhost:3000';

// ID тестовых пользователей для удаления
const testUserIds = [
  2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010
];

async function cleanupTestUsers() {
  console.log('🧹 Очистка тестовых пользователей с разными часовыми поясами\n');

  for (const userId of testUserIds) {
    try {
      console.log(`🗑️  Удаляем пользователя ${userId}...`);

      // 1. Удаляем из очереди
      const queueResponse = await fetch(`${API_BASE}/api/dev/cleanup-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (queueResponse.ok) {
        console.log(`   ✅ Пользователь ${userId} удален из очереди`);
      } else {
        console.log(`   ⚠️  Пользователь ${userId} не найден в очереди`);
      }

    } catch (error) {
      console.log(`   ❌ Ошибка удаления пользователя ${userId}: ${error.message}`);
    }
  }

  console.log('\n🎉 Очистка завершена!');
  console.log('\n💡 Теперь можете создать новых тестовых пользователей');
}

// Запуск
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupTestUsers().catch(console.error);
}
