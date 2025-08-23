const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentSlots() {
  try {
    console.log('🔍 Проверка текущих слотов в базе данных...');
    
    // Получаем все записи из user_queue
    const queues = await prisma.userQueue.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Найдено ${queues.length} записей в очереди:`);
    
    queues.forEach((queue, index) => {
      console.log(`\n${index + 1}. Пользователь: ${queue.user?.firstName || 'Unknown'} (${queue.userId})`);
      console.log(`   Роль: ${queue.role}`);
      console.log(`   Профессия: ${queue.profession}`);
      console.log(`   Язык: ${queue.language}`);
      console.log(`   Слот UTC: ${queue.slotUtc}`);
      console.log(`   Статус: ${queue.status}`);
      console.log(`   Инструменты: ${queue.tools || 'нет'}`);
      console.log(`   Создан: ${queue.createdAt}`);
    });
    
    // Проверяем, что покажет API для разных timezone
    console.log('\n🌐 Проверка API для разных timezone:');
    
    const testCases = [
      { timezone: 'Europe/Moscow', date: '2025-08-22' },
      { timezone: 'Asia/Vladivostok', date: '2025-08-22' },
      { timezone: 'UTC', date: '2025-08-22' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📅 ${testCase.timezone}, ${testCase.date}:`);
      
      // Симулируем API запрос
      const startZ = new Date(`${testCase.date}T00:00:00.000Z`);
      const endZ = new Date(`${testCase.date}T23:59:59.999Z`);
      
      const matchingQueues = queues.filter(q => {
        const slotDate = new Date(q.slotUtc);
        return slotDate >= startZ && slotDate <= endZ && 
               q.role === 'interviewer' && 
               q.profession === 'frontend' && 
               q.language === 'ru';
      });
      
      if (matchingQueues.length > 0) {
        const slotTimes = [...new Set(matchingQueues.map(q => {
          const d = new Date(q.slotUtc);
          return d.toISOString().slice(11, 16); // HH:mm в UTC
        }))];
        
        console.log(`   ✅ Найдено ${matchingQueues.length} слотов: ${slotTimes.join(', ')}`);
      } else {
        console.log(`   ❌ Слоты не найдены`);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentSlots();
