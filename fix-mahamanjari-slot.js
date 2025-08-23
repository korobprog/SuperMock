import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMahamanjariSlot() {
  try {
    console.log('🔧 Исправляем слот для Mahamanjari_dd...\n');

    const userId = '74497925';
    const targetSlot = '2025-08-22T04:00:00.000Z'; // Слот korobprog
    
    // Удаляем старую запись в слоте 00:00 UTC
    console.log('🗑️  Удаляем старую запись в слоте 00:00 UTC...');
    await prisma.userQueue.deleteMany({
      where: {
        userId,
        slotUtc: '2025-08-22T00:00:00.000Z'
      }
    });

    // Добавляем в правильный слот
    console.log('➕ Добавляем в слот 04:00 UTC...');
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

    // Обновляем предпочтения
    console.log('📝 Обновляем предпочтения...');
    await prisma.preference.updateMany({
      where: {
        userId,
        role: 'candidate'
      },
      data: {
        slotsUtc: JSON.stringify([targetSlot])
      }
    });

    console.log('✅ Mahamanjari_dd перемещен в слот 04:00 UTC');

    // Проверяем результат
    console.log('\n📊 Проверяем слот 04:00 UTC:');
    const entries = await prisma.userQueue.findMany({
      where: { slotUtc: targetSlot },
      include: { user: true }
    });

    entries.forEach(entry => {
      const name = entry.user.firstName || entry.user.lastName || entry.user.username || 'Unknown';
      console.log(`   - ${name} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

    const candidates = entries.filter(e => e.role === 'candidate');
    const interviewers = entries.filter(e => e.role === 'interviewer');

    console.log(`\n📈 Статистика слота 04:00 UTC:`);
    console.log(`   Кандидаты: ${candidates.length}`);
    console.log(`   Интервьюеры: ${interviewers.length}`);

    if (candidates.length > 0 && interviewers.length > 0) {
      console.log('\n🎯 Теперь в слоте есть и кандидат, и интервьюер!');
      console.log('✅ Mahamanjari_dd должен видеть korobprog в UI');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMahamanjariSlot();
