import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserTimezone() {
  try {
    console.log('🔍 Проверка часового пояса пользователя...\n');

    const userId = '74497925'; // Mahamanjari_dd

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        queues: true
      }
    });

    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }

    console.log(`👤 Пользователь: ${user.firstName || user.lastName || user.username}`);
    console.log(`🆔 ID: ${user.id}`);
    
    // Проверяем предпочтения
    const prefs = user.preferences[0];
    if (prefs) {
      console.log(`📅 Предпочтения:`);
      console.log(`   Роль: ${prefs.role}`);
      console.log(`   Профессия: ${prefs.profession}`);
      console.log(`   Язык: ${prefs.language}`);
      console.log(`   Слоты UTC: ${prefs.slotsUtc || 'нет'}`);
    }

    // Проверяем записи в очереди
    console.log(`\n📋 Записи в очереди:`);
    user.queues.forEach(queue => {
      console.log(`   - ${queue.slotUtc} (${queue.role}) - ${queue.profession} - ${queue.language}`);
    });

    // Проверяем, есть ли записи в слоте 04:00 UTC
    const slot04Entry = user.queues.find(q => q.slotUtc === '2025-08-22T04:00:00.000Z');
    if (slot04Entry) {
      console.log(`\n✅ Пользователь в слоте 04:00 UTC`);
    } else {
      console.log(`\n❌ Пользователь НЕ в слоте 04:00 UTC`);
    }

    // Проверяем, есть ли интервьюер в том же слоте
    const interviewerInSlot = await prisma.userQueue.findFirst({
      where: {
        slotUtc: '2025-08-22T04:00:00.000Z',
        role: 'interviewer',
        profession: 'frontend',
        language: 'ru'
      },
      include: { user: true }
    });

    if (interviewerInSlot) {
      const interviewerName = interviewerInSlot.user.firstName || interviewerInSlot.user.lastName || interviewerInSlot.user.username;
      console.log(`\n👨‍💼 Интервьюер в слоте: ${interviewerName}`);
    } else {
      console.log(`\n❌ Нет интервьюера в слоте 04:00 UTC`);
    }

    // Проверяем все записи в слоте 04:00 UTC
    console.log(`\n📊 Все записи в слоте 04:00 UTC:`);
    const allSlot04Entries = await prisma.userQueue.findMany({
      where: { slotUtc: '2025-08-22T04:00:00.000Z' },
      include: { user: true }
    });

    allSlot04Entries.forEach(entry => {
      const name = entry.user.firstName || entry.user.lastName || entry.user.username;
      console.log(`   - ${name} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

    const candidates = allSlot04Entries.filter(e => e.role === 'candidate');
    const interviewers = allSlot04Entries.filter(e => e.role === 'interviewer');

    console.log(`\n📈 Статистика слота 04:00 UTC:`);
    console.log(`   Кандидаты: ${candidates.length}`);
    console.log(`   Интервьюеры: ${interviewers.length}`);

    if (candidates.length > 0 && interviewers.length > 0) {
      console.log(`\n🎯 Слот готов для матчинга!`);
      console.log(`✅ Mahamanjari_dd должен видеть интервьюера в UI`);
    } else {
      console.log(`\n⚠️  Слот не готов для матчинга`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTimezone();
