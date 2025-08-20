// Скрипт для проверки базы данных через Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Проверяем базу данных через Prisma...\n');

    // Подключаемся к БД
    await prisma.$connect();
    console.log('✅ Подключение к БД установлено');

    // 1. Проверяем всех пользователей
    console.log('\n👥 Пользователи:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        tgId: true,
        username: true,
        firstName: true,
        lastName: true,
        language: true,
        createdAt: true,
      },
    });

    if (users.length > 0) {
      console.log(`Найдено ${users.length} пользователей:`);
      users.forEach((user) => {
        console.log(
          `  ID: ${user.id} | TG: ${user.tgId} | Имя: ${user.firstName} ${
            user.lastName || ''
          } | @${user.username || 'нет'} | Язык: ${user.language || 'нет'}`
        );
      });
    } else {
      console.log('Пользователи не найдены');
    }

    // 2. Проверяем настройки пользователей
    console.log('\n⚙️ Настройки пользователей:');
    const settings = await prisma.userSettings.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    if (settings.length > 0) {
      console.log(`Найдено ${settings.length} настроек:`);
      settings.forEach((setting) => {
        const user = setting.user;
        const apiKeyMasked = setting.openrouterApiKey
          ? setting.openrouterApiKey.substring(0, 8) +
            '••••••••••••••••' +
            setting.openrouterApiKey.substring(
              setting.openrouterApiKey.length - 4
            )
          : 'не задан';

        console.log(
          `  Пользователь: ${user.firstName} ${user.lastName || ''} (ID: ${
            user.id
          })`
        );
        console.log(`    API ключ: ${apiKeyMasked}`);
        console.log(`    Модель: ${setting.preferredModel}`);
        console.log(`    Уровень: ${setting.questionsLevel}`);
        console.log(
          `    ИИ генерация: ${
            setting.useAiGeneration ? 'включена' : 'выключена'
          }`
        );
        console.log(`    Количество вопросов: ${setting.questionsCount}`);
        console.log(`    Обновлено: ${setting.updatedAt.toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('Настройки пользователей не найдены');
    }

    // 3. Проверяем демо пользователя
    console.log('\n🎭 Демо пользователь (ID: 12345678):');
    const demoUser = await prisma.user.findUnique({
      where: { id: 12345678 },
      include: {
        userSettings: true,
        preferences: true,
        sessionsAsInterviewer: true,
        sessionsAsCandidate: true,
      },
    });

    if (demoUser) {
      console.log('✅ Демо пользователь найден:');
      console.log(`  Имя: ${demoUser.firstName} ${demoUser.lastName || ''}`);
      console.log(`  Username: @${demoUser.username || 'нет'}`);
      console.log(`  Язык: ${demoUser.language || 'нет'}`);
      console.log(`  Создан: ${demoUser.createdAt.toLocaleString()}`);
      console.log(`  Обновлен: ${demoUser.updatedAt.toLocaleString()}`);

      if (demoUser.userSettings) {
        console.log('  ✅ Настройки найдены:');
        const apiKeyMasked = demoUser.userSettings.openrouterApiKey
          ? demoUser.userSettings.openrouterApiKey.substring(0, 8) +
            '••••••••••••••••' +
            demoUser.userSettings.openrouterApiKey.substring(
              demoUser.userSettings.openrouterApiKey.length - 4
            )
          : 'не задан';
        console.log(`    API ключ: ${apiKeyMasked}`);
        console.log(`    Модель: ${demoUser.userSettings.preferredModel}`);
        console.log(
          `    ИИ генерация: ${
            demoUser.userSettings.useAiGeneration ? 'включена' : 'выключена'
          }`
        );
      } else {
        console.log('  ❌ Настройки не найдены');
      }

      console.log(`  Предпочтений: ${demoUser.preferences.length}`);
      console.log(
        `  Сессий как интервьюер: ${demoUser.sessionsAsInterviewer.length}`
      );
      console.log(
        `  Сессий как кандидат: ${demoUser.sessionsAsCandidate.length}`
      );
    } else {
      console.log('❌ Демо пользователь не найден');
    }

    // 4. Общая статистика
    console.log('\n📊 Общая статистика:');
    const totalUsers = await prisma.user.count();
    const totalSettings = await prisma.userSettings.count();
    const totalPreferences = await prisma.preference.count();
    const totalSessions = await prisma.session.count();
    const totalFeedback = await prisma.feedback.count();

    console.log(`  Всего пользователей: ${totalUsers}`);
    console.log(`  Настроек: ${totalSettings}`);
    console.log(`  Предпочтений: ${totalPreferences}`);
    console.log(`  Сессий: ${totalSessions}`);
    console.log(`  Отзывов: ${totalFeedback}`);

    console.log('\n✅ Проверка завершена');
  } catch (error) {
    console.error('❌ Ошибка проверки базы данных:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем проверку
checkDatabase();
