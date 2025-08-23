import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createLocalTestUsers() {
  try {
    console.log('🧪 Создание тестовых пользователей в локальной базе...\n');

    // Очищаем старые данные в правильном порядке
    console.log('🗑️ Очищаем старые данные...');
    await prisma.match.deleteMany({});
    await prisma.userQueue.deleteMany({});
    await prisma.preference.deleteMany({});
    await prisma.user.deleteMany({});

    // Создаем тестовых пользователей
    console.log('👥 Создаем пользователей...');

    // Пользователь 1: Кандидат из Владивостока
    const candidate1 = await prisma.user.create({
      data: {
        id: 'test-candidate-1',
        username: 'candidate_vladivostok',
        firstName: 'Кандидат',
        lastName: 'Владивосток',
        tgId: '123456789'
      }
    });

    // Пользователь 2: Интервьюер из Москвы
    const interviewer1 = await prisma.user.create({
      data: {
        id: 'test-interviewer-1',
        username: 'interviewer_moscow',
        firstName: 'Интервьюер',
        lastName: 'Москва',
        tgId: '987654321'
      }
    });

    // Пользователь 3: Кандидат из Москвы
    const candidate2 = await prisma.user.create({
      data: {
        id: 'test-candidate-2',
        username: 'candidate_moscow',
        firstName: 'Кандидат',
        lastName: 'Москва',
        tgId: '111222333'
      }
    });

    // Пользователь 4: Интервьюер из Владивостока
    const interviewer2 = await prisma.user.create({
      data: {
        id: 'test-interviewer-2',
        username: 'interviewer_vladivostok',
        firstName: 'Интервьюер',
        lastName: 'Владивосток',
        tgId: '444555666'
      }
    });

    console.log('✅ Пользователи созданы');

    // Создаем предпочтения
    console.log('📅 Создаем предпочтения...');

    // Кандидат 1 (Владивосток) - предпочитает 14:00 по Владивостоку (04:00 UTC)
    await prisma.preference.create({
      data: {
        userId: candidate1.id,
        role: 'candidate',
        profession: 'frontend',
        language: 'ru',
        slotsUtc: JSON.stringify(['2025-08-22T04:00:00.000Z'])
      }
    });

    // Интервьюер 1 (Москва) - доступен в 07:00 по Москве (04:00 UTC)
    await prisma.preference.create({
      data: {
        userId: interviewer1.id,
        role: 'interviewer',
        profession: 'frontend',
        language: 'ru',
        slotsUtc: JSON.stringify(['2025-08-22T04:00:00.000Z'])
      }
    });

    // Кандидат 2 (Москва) - предпочитает 07:00 по Москве (04:00 UTC)
    await prisma.preference.create({
      data: {
        userId: candidate2.id,
        role: 'candidate',
        profession: 'frontend',
        language: 'ru',
        slotsUtc: JSON.stringify(['2025-08-22T04:00:00.000Z'])
      }
    });

    // Интервьюер 2 (Владивосток) - доступен в 14:00 по Владивостоку (04:00 UTC)
    await prisma.preference.create({
      data: {
        userId: interviewer2.id,
        role: 'interviewer',
        profession: 'frontend',
        language: 'ru',
        slotsUtc: JSON.stringify(['2025-08-22T04:00:00.000Z'])
      }
    });

    console.log('✅ Предпочтения созданы');

    // Добавляем в очередь
    console.log('📋 Добавляем в очередь...');

    // Кандидат 1 в очереди
    await prisma.userQueue.create({
      data: {
        userId: candidate1.id,
        role: 'candidate',
        profession: 'frontend',
        language: 'ru',
        slotUtc: '2025-08-22T04:00:00.000Z',
        status: 'waiting'
      }
    });

    // Интервьюер 1 в очереди
    await prisma.userQueue.create({
      data: {
        userId: interviewer1.id,
        role: 'interviewer',
        profession: 'frontend',
        language: 'ru',
        slotUtc: '2025-08-22T04:00:00.000Z',
        status: 'waiting'
      }
    });

    // Кандидат 2 в очереди
    await prisma.userQueue.create({
      data: {
        userId: candidate2.id,
        role: 'candidate',
        profession: 'frontend',
        language: 'ru',
        slotUtc: '2025-08-22T04:00:00.000Z',
        status: 'waiting'
      }
    });

    // Интервьюер 2 в очереди
    await prisma.userQueue.create({
      data: {
        userId: interviewer2.id,
        role: 'interviewer',
        profession: 'frontend',
        language: 'ru',
        slotUtc: '2025-08-22T04:00:00.000Z',
        status: 'waiting'
      }
    });

    console.log('✅ Пользователи добавлены в очередь');

    // Проверяем результат
    console.log('\n📊 Проверяем результат...');
    
    const allEntries = await prisma.userQueue.findMany({
      where: { slotUtc: '2025-08-22T04:00:00.000Z' },
      include: { user: true }
    });

    console.log('📋 Все записи в слоте 04:00 UTC:');
    allEntries.forEach(entry => {
      const name = entry.user.firstName + ' ' + entry.user.lastName;
      console.log(`   - ${name} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

    const candidates = allEntries.filter(e => e.role === 'candidate');
    const interviewers = allEntries.filter(e => e.role === 'interviewer');

    console.log(`\n📈 Статистика слота 04:00 UTC:`);
    console.log(`   Кандидаты: ${candidates.length}`);
    console.log(`   Интервьюеры: ${interviewers.length}`);

    if (candidates.length > 0 && interviewers.length > 0) {
      console.log('\n🎯 Слот готов для матчинга!');
      console.log('✅ Теперь можно тестировать фронтенд');
    }

    console.log('\n🧪 Тестовые данные созданы!');
    console.log('🌐 Откройте http://localhost:5173/time для тестирования');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLocalTestUsers();
