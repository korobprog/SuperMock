import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMahamanjariQueue() {
  try {
    console.log('🔍 Проверяем очередь для Mahamanjari_dd...\n');

    const userId = '74497925';
    
    // Проверяем предпочтения пользователя
    const preferences = await prisma.preference.findMany({
      where: { userId },
      include: { user: true }
    });

    console.log('📋 Предпочтения Mahamanjari_dd:');
    preferences.forEach(pref => {
      console.log(`   Роль: ${pref.role}`);
      console.log(`   Профессия: ${pref.profession}`);
      console.log(`   Язык: ${pref.language}`);
      console.log(`   Слоты UTC: ${pref.slotsUtc}`);
    });

    // Проверяем, есть ли пользователь в очереди
    const queueEntries = await prisma.userQueue.findMany({
      where: { userId },
      include: { user: true }
    });

    console.log(`\n🚶 Записи в очереди для Mahamanjari_dd: ${queueEntries.length}`);
    queueEntries.forEach(entry => {
      console.log(`   - Слот: ${entry.slotUtc}`);
      console.log(`   - Роль: ${entry.role}`);
      console.log(`   - Профессия: ${entry.profession}`);
      console.log(`   - Язык: ${entry.language}`);
      console.log(`   - Статус: ${entry.status}`);
    });

    if (queueEntries.length === 0) {
      console.log('\n❌ Пользователь НЕ в очереди!');
      console.log('🔧 Это объясняет, почему он не видит интервьюеров в UI');
      
      // Давайте добавим его в очередь
      console.log('\n➕ Добавляем пользователя в очередь...');
      const pref = preferences[0];
      if (pref) {
        const slotsUtc = JSON.parse(pref.slotsUtc);
        
        for (const slotUtc of slotsUtc) {
          console.log(`   Добавляем в слот: ${slotUtc}`);
          
          try {
            await prisma.userQueue.create({
              data: {
                userId,
                role: pref.role,
                profession: pref.profession,
                language: pref.language,
                slotUtc,
                status: 'waiting'
              }
            });
            console.log(`   ✅ Добавлен в слот ${slotUtc}`);
          } catch (error) {
            console.log(`   ❌ Ошибка добавления в слот ${slotUtc}:`, error.message);
          }
        }
      }
    }

    // Проверяем еще раз после добавления
    console.log('\n🔄 Повторная проверка очереди...');
    const finalQueueEntries = await prisma.userQueue.findMany({
      where: { userId },
      include: { user: true }
    });

    console.log(`📊 Записи в очереди: ${finalQueueEntries.length}`);
    finalQueueEntries.forEach(entry => {
      console.log(`   - ${entry.slotUtc} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMahamanjariQueue();
