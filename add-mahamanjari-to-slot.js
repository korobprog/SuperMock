import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMahamanjariToSlot() {
  try {
    console.log('➕ Добавляем Mahamanjari_dd в слот 04:00 UTC (07:00 по Москве)...\n');

    const userId = '74497925';
    const targetSlot = '2025-08-22T04:00:00.000Z';
    
    // Сначала проверим, есть ли интервьюеры в этом слоте
    const interviewers = await prisma.userQueue.findMany({
      where: {
        slotUtc: targetSlot,
        role: 'interviewer',
        profession: 'frontend',
        language: 'ru'
      },
      include: { user: true }
    });

    console.log(`🔍 Интервьюеры в слоте ${targetSlot}:`);
    interviewers.forEach(entry => {
      const name = entry.user.firstName || entry.user.lastName || entry.user.username || 'Unknown';
      console.log(`   - ${name} (${entry.profession}, ${entry.language})`);
    });

    if (interviewers.length === 0) {
      console.log('❌ Нет интервьюеров в этом слоте');
      return;
    }

    // Проверим, есть ли уже Mahamanjari_dd в этом слоте
    const existingEntry = await prisma.userQueue.findFirst({
      where: {
        userId,
        slotUtc: targetSlot
      }
    });

    if (existingEntry) {
      console.log('✅ Mahamanjari_dd уже в этом слоте');
      return;
    }

    // Добавляем Mahamanjari_dd в слот
    await prisma.userQueue.create({
      data: {
        userId,
        role: 'candidate',
        profession: 'frontend', 
        language: 'ru',
        slotUtc: targetSlot,
        status: 'waiting'
      }
    });

    console.log('✅ Mahamanjari_dd добавлен в слот 04:00 UTC');

    // Обновляем предпочтения пользователя
    await prisma.preference.updateMany({
      where: { 
        userId,
        role: 'candidate'
      },
      data: {
        slotsUtc: JSON.stringify([targetSlot])
      }
    });

    console.log('✅ Предпочтения обновлены');

    // Проверяем результат
    console.log('\n📊 Состояние слота 04:00 UTC после изменений:');
    const allEntries = await prisma.userQueue.findMany({
      where: { slotUtc: targetSlot },
      include: { user: true }
    });

    allEntries.forEach(entry => {
      const name = entry.user.firstName || entry.user.lastName || entry.user.username || 'Unknown';
      console.log(`   - ${name} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

    const candidatesInSlot = allEntries.filter(e => e.role === 'candidate');
    const interviewersInSlot = allEntries.filter(e => e.role === 'interviewer');

    console.log(`\n📈 Статистика слота:`);
    console.log(`   Кандидаты: ${candidatesInSlot.length}`);
    console.log(`   Интервьюеры: ${interviewersInSlot.length}`);

    if (candidatesInSlot.length > 0 && interviewersInSlot.length > 0) {
      console.log('\n🎯 Теперь в этом слоте есть и кандидаты, и интервьюеры!');
      console.log('✅ Mahamanjari_dd должен видеть интервьюеров в UI');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMahamanjariToSlot();
