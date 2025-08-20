const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSession() {
  try {
    // Создаем тестовых пользователей
    await prisma.user.upsert({
      where: { id: '87654321' },
      update: {},
      create: {
        id: '87654321',
        tgId: '87654321',
        firstName: 'TestInterviewer',
        language: 'javascript',
      },
    });

    await prisma.user.upsert({
      where: { id: '12345678' },
      update: {},
      create: {
        id: '12345678',
        tgId: '12345678',
        firstName: 'TestCandidate',
        language: 'javascript',
      },
    });

    // Создаем тестовую сессию
    const session = await prisma.session.upsert({
      where: { id: 'session_test_123' },
      update: {},
      create: {
        id: 'session_test_123',
        interviewerUserId: '87654321',
        candidateUserId: '12345678',
        profession: 'frontend',
        language: 'javascript',
        slotUtc: '2024-01-15T10:00:00Z',
        status: 'scheduled',
        jitsiRoom: 'Super Mock_session_test_123',
      },
    });

    console.log('✅ Тестовая сессия создана:', session);
  } catch (error) {
    console.error('❌ Ошибка создания тестовой сессии:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSession();
