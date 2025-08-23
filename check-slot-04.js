import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSlot04() {
  try {
    console.log('🔍 Проверка слота 04:00 UTC...\n');

    const entries = await prisma.userQueue.findMany({
      where: { slotUtc: '2025-08-22T04:00:00.000Z' },
      include: { user: true }
    });

    console.log(`📊 Записи в слоте 04:00 UTC (${entries.length}):`);
    entries.forEach(entry => {
      console.log(`   - ${entry.user.firstName || 'Unknown'} (ID: ${entry.userId})`);
      console.log(`     Роль: ${entry.role}`);
      console.log(`     Профессия: ${entry.profession}`);
      console.log(`     Язык: ${entry.language}`);
      console.log('');
    });

    const interviewers = entries.filter(e => e.role === 'interviewer');
    const candidates = entries.filter(e => e.role === 'candidate');

    console.log('📈 Статистика:');
    console.log(`   Интервьюеры: ${interviewers.length}`);
    console.log(`   Кандидаты: ${candidates.length}`);

    if (interviewers.length > 0) {
      console.log('\n✅ Есть интервьюеры в этом слоте!');
      interviewers.forEach(entry => {
        console.log(`   - ${entry.user.firstName || 'Unknown'} (${entry.profession}, ${entry.language})`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlot04();
