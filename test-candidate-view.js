import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCandidateView() {
  try {
    console.log('🔍 Тестирование видимости слотов для кандидата...\n');

    // Создаем тестового кандидата
    const testCandidateId = 'test-candidate-' + Date.now();
    
    console.log('👤 Создаем тестового кандидата...');
    await prisma.user.upsert({
      where: { id: testCandidateId },
      update: {},
      create: {
        id: testCandidateId,
        firstName: 'Test',
        lastName: 'Candidate',
        language: 'ru'
      }
    });

    // Сохраняем предпочтения кандидата
    console.log('📝 Сохраняем предпочтения кандидата...');
    await prisma.preference.create({
      data: {
        userId: testCandidateId,
        role: 'candidate',
        profession: 'frontend',
        language: 'ru',
        slotsUtc: JSON.stringify(['2025-08-22T04:00:00.000Z'])
      }
    });

    // Добавляем кандидата в очередь
    console.log('📋 Добавляем кандидата в очередь...');
    await prisma.userQueue.create({
      data: {
        userId: testCandidateId,
        role: 'candidate',
        profession: 'frontend',
        language: 'ru',
        slotUtc: '2025-08-22T04:00:00.000Z',
        status: 'waiting'
      }
    });

    console.log('✅ Тестовый кандидат создан и добавлен в очередь\n');

    // Теперь проверим, что видит кандидат
    console.log('🔍 Проверяем, что видит кандидат...');
    
    // Получаем все записи в очереди для слота 04:00 UTC
    const queueEntries = await prisma.userQueue.findMany({
      where: {
        slotUtc: '2025-08-22T04:00:00.000Z'
      },
      include: {
        user: true
      }
    });

    console.log(`📊 Записи в очереди для слота 04:00 UTC (${queueEntries.length}):`);
    queueEntries.forEach(entry => {
      console.log(`   - ${entry.user.firstName || 'Unknown'} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

    // Проверяем, есть ли интервьюеры в этом слоте
    const interviewers = queueEntries.filter(entry => entry.role === 'interviewer');
    const candidates = queueEntries.filter(entry => entry.role === 'candidate');

    console.log(`\n📈 Статистика для слота 04:00 UTC:`);
    console.log(`   Интервьюеры: ${interviewers.length}`);
    console.log(`   Кандидаты: ${candidates.length}`);

    if (interviewers.length > 0) {
      console.log('\n✅ Кандидат должен видеть этот слот!');
      console.log('   Доступные интервьюеры:');
      interviewers.forEach(entry => {
        console.log(`   - ${entry.user.firstName || 'Unknown'} (${entry.profession})`);
      });
    } else {
      console.log('\n❌ Кандидат НЕ видит этот слот - нет интервьюеров');
    }

    // Очистка
    console.log('\n🧹 Очищаем тестовые данные...');
    await prisma.userQueue.deleteMany({
      where: { userId: testCandidateId }
    });
    await prisma.preference.deleteMany({
      where: { userId: testCandidateId }
    });
    await prisma.user.delete({
      where: { id: testCandidateId }
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCandidateView();
