import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMahamanjari() {
  try {
    console.log('🔍 Поиск пользователя Mahamanjari_dd...\n');

    // Ищем пользователя по имени
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Mahamanjari' } },
          { lastName: { contains: 'Mahamanjari' } },
          { username: { contains: 'Mahamanjari' } },
          { username: { contains: 'dd' } }
        ]
      },
      include: {
        preferences: true,
        queues: true
      }
    });

    console.log(`📊 Найдено пользователей: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ Пользователь Mahamanjari_dd не найден');
      
      // Покажем всех пользователей для поиска
      console.log('\n📋 Все пользователи в системе:');
      const allUsers = await prisma.user.findMany({
        include: { preferences: true }
      });
      
      allUsers.forEach(user => {
        const name = user.firstName || user.lastName || user.username || 'Unknown';
        const prefs = user.preferences[0];
        console.log(`   - ${name} (ID: ${user.id}) - ${prefs?.role || 'no role'} - ${prefs?.profession || 'no profession'} - ${prefs?.language || 'no language'}`);
      });
      
      return;
    }

    users.forEach(user => {
      const name = user.firstName || user.lastName || user.username || 'Unknown';
      const prefs = user.preferences[0];
      const queues = user.queues;
      
      console.log(`👤 ${name} (ID: ${user.id})`);
      console.log(`   Username: ${user.username || 'не указан'}`);
      console.log(`   Роль: ${prefs?.role || 'не указана'}`);
      console.log(`   Профессия: ${prefs?.profession || 'не указана'}`);
      console.log(`   Язык: ${prefs?.language || 'не указан'}`);
      console.log(`   Слоты UTC: ${prefs?.slotsUtc || 'нет'}`);
      console.log(`   В очереди: ${queues.length} записей`);
      
      if (queues.length > 0) {
        queues.forEach(entry => {
          console.log(`     - ${entry.slotUtc} (${entry.role}) - ${entry.profession} - ${entry.language}`);
        });
      }
      console.log('');
    });

    // Если нашли пользователя, проверим, что он должен видеть
    if (users.length > 0) {
      const user = users[0];
      const prefs = user.preferences[0];
      
      if (prefs?.role === 'candidate') {
        console.log('🔍 Проверяем, что должен видеть кандидат...\n');
        
        // Получаем интервьюеров с подходящими критериями
        const availableInterviewers = await prisma.userQueue.findMany({
          where: {
            role: 'interviewer',
            profession: prefs.profession,
            language: prefs.language
          },
          include: { user: true }
        });

        console.log(`📊 Доступные интервьюеры (${availableInterviewers.length}):`);
        availableInterviewers.forEach(entry => {
          const interviewerName = entry.user.firstName || entry.user.lastName || entry.user.username || 'Unknown';
          console.log(`   - ${interviewerName} в слоте ${entry.slotUtc} (${entry.profession}, ${entry.language})`);
        });

        if (availableInterviewers.length === 0) {
          console.log('❌ Нет доступных интервьюеров с подходящими критериями');
          
          // Проверим все интервьюеры без фильтров
          const allInterviewers = await prisma.userQueue.findMany({
            where: { role: 'interviewer' },
            include: { user: true }
          });
          
          console.log(`\n🔍 Все интервьюеры в системе (${allInterviewers.length}):`);
          allInterviewers.forEach(entry => {
            const interviewerName = entry.user.firstName || entry.user.lastName || entry.user.username || 'Unknown';
            console.log(`   - ${interviewerName}: ${entry.profession}, ${entry.language} в слоте ${entry.slotUtc}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMahamanjari();
