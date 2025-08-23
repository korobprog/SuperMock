import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Проверка пользователей и их слотов...\n');

    // Получаем всех пользователей с их предпочтениями
    const users = await prisma.user.findMany({
      include: {
        preferences: true,
        queues: true
      }
    });

    console.log(`📊 Найдено пользователей: ${users.length}\n`);

    users.forEach(user => {
      const prefs = user.preferences[0];
      const queueEntries = user.queues;
      
      console.log(`👤 ${user.name} (ID: ${user.id})`);
      console.log(`   Роль: ${prefs?.role || 'не указана'}`);
      console.log(`   Профессия: ${prefs?.profession || 'не указана'}`);
      console.log(`   Язык: ${prefs?.language || 'не указана'}`);
      console.log(`   Слоты UTC: ${prefs?.slotsUtc || 'нет'}`);
      console.log(`   В очереди: ${queueEntries.length} записей`);
      
      if (queueEntries.length > 0) {
        queueEntries.forEach(entry => {
          console.log(`     - ${entry.slotUtc} (${entry.role})`);
        });
      }
      console.log('');
    });

    // Проверяем все записи в очереди
    console.log('📋 Все записи в очереди:');
    const allQueueEntries = await prisma.userQueue.findMany({
      include: {
        user: true
      },
      orderBy: {
        slotUtc: 'asc'
      }
    });

    allQueueEntries.forEach(entry => {
      console.log(`   ${entry.slotUtc} - ${entry.user.name} (${entry.role})`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
