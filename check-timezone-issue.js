import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTimezoneIssue() {
  try {
    console.log('🔍 Проверка проблемы с часовыми поясами...\n');

    // Проверяем все записи в очереди для слота 04:00 UTC
    const slot04Entries = await prisma.userQueue.findMany({
      where: { slotUtc: '2025-08-22T04:00:00.000Z' },
      include: { user: true }
    });

    console.log('📊 Записи в слоте 04:00 UTC:');
    slot04Entries.forEach(entry => {
      const name = entry.user.firstName || entry.user.lastName || entry.user.username || 'Unknown';
      console.log(`   - ${name} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

    // Проверяем, есть ли конфликты в данных
    console.log('\n🔍 Проверяем потенциальные конфликты...');
    
    // Получаем все записи для frontend/ru
    const frontendRuEntries = await prisma.userQueue.findMany({
      where: {
        profession: 'frontend',
        language: 'ru'
      },
      include: { user: true },
      orderBy: { slotUtc: 'asc' }
    });

    console.log('📋 Все записи frontend/ru:');
    frontendRuEntries.forEach(entry => {
      const name = entry.user.firstName || entry.user.lastName || entry.user.username || 'Unknown';
      console.log(`   - ${name}: ${entry.slotUtc} (${entry.role})`);
    });

    // Проверяем, есть ли дублирующиеся записи
    const duplicates = frontendRuEntries.filter(entry => {
      const sameSlot = frontendRuEntries.filter(e => 
        e.slotUtc === entry.slotUtc && 
        e.role === entry.role && 
        e.userId === entry.userId
      );
      return sameSlot.length > 1;
    });

    if (duplicates.length > 0) {
      console.log('\n⚠️  Найдены дублирующиеся записи:');
      duplicates.forEach(entry => {
        const name = entry.user.firstName || entry.user.lastName || entry.user.username || 'Unknown';
        console.log(`   - ${name}: ${entry.slotUtc} (${entry.role})`);
      });
    } else {
      console.log('\n✅ Дублирующихся записей не найдено');
    }

    // Проверяем, есть ли записи с разными ролями в одном слоте
    const slotsWithBothRoles = {};
    frontendRuEntries.forEach(entry => {
      if (!slotsWithBothRoles[entry.slotUtc]) {
        slotsWithBothRoles[entry.slotUtc] = { candidates: 0, interviewers: 0 };
      }
      if (entry.role === 'candidate') {
        slotsWithBothRoles[entry.slotUtc].candidates++;
      } else if (entry.role === 'interviewer') {
        slotsWithBothRoles[entry.slotUtc].interviewers++;
      }
    });

    console.log('\n📈 Слоты с кандидатами и интервьюерами:');
    Object.entries(slotsWithBothRoles).forEach(([slot, counts]) => {
      if (counts.candidates > 0 && counts.interviewers > 0) {
        console.log(`   - ${slot}: ${counts.candidates} кандидатов, ${counts.interviewers} интервьюеров`);
      }
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimezoneIssue();
