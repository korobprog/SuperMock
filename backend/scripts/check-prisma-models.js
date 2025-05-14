// Скрипт для проверки доступных моделей Prisma
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Проверяем, существует ли файл адаптера
const adapterPath = path.resolve(__dirname, '../src/services/prismaAdapter.ts');
const adapterExists = fs.existsSync(adapterPath);

async function main() {
  try {
    console.log('=== ПРОВЕРКА МОДЕЛЕЙ PRISMA ===');

    let adapter;
    let prisma;

    // Используем адаптер, если он существует
    if (adapterExists) {
      try {
        // Пытаемся импортировать адаптер из скомпилированного JavaScript файла
        const adapterJsPath = adapterPath.replace('.ts', '.js');
        if (fs.existsSync(adapterJsPath)) {
          adapter = require('../src/services/prismaAdapter');
          prisma = adapter.client;
          console.log('Используем PrismaAdapter');
        } else {
          // Если скомпилированный файл не найден, создаем экземпляр Prisma клиента напрямую
          const { PrismaClient } = require('@prisma/client');
          prisma = new PrismaClient();
          console.log(
            'Адаптер не скомпилирован, используем PrismaClient напрямую'
          );
        }
      } catch (error) {
        console.error('Ошибка при импорте адаптера:', error);
        // Если не удалось импортировать адаптер, создаем экземпляр Prisma клиента напрямую
        const { PrismaClient } = require('@prisma/client');
        prisma = new PrismaClient();
        console.log(
          'Ошибка при импорте адаптера, используем PrismaClient напрямую'
        );
      }
    } else {
      // Если адаптер не существует, создаем экземпляр Prisma клиента напрямую
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      console.log('Адаптер не найден, используем PrismaClient напрямую');
    }

    // Выводим доступные модели
    console.log('\nДоступные модели:');
    console.log(Object.keys(prisma));

    // Проверяем, есть ли модель user
    if (prisma.user) {
      console.log('\nМодель user существует');
      try {
        const userCount = await prisma.user.count();
        console.log(`Количество пользователей: ${userCount}`);
      } catch (error) {
        console.log(
          'Не удалось получить количество пользователей:',
          error.message
        );
      }
    } else {
      console.log('\nМодель user НЕ существует');
    }

    // Проверяем, есть ли модель session
    if (prisma.session) {
      console.log('\nМодель session существует');
      try {
        const sessionCount = await prisma.session.count();
        console.log(`Количество сессий: ${sessionCount}`);
      } catch (error) {
        console.log('Не удалось получить количество сессий:', error.message);
      }
    } else {
      console.log('\nМодель session НЕ существует');
    }

    // Проверяем, есть ли модель userSession
    if (prisma.userSession) {
      console.log('\nМодель userSession существует');
      try {
        const userSessionCount = await prisma.userSession.count();
        console.log(
          `Количество связей пользователь-сессия: ${userSessionCount}`
        );
      } catch (error) {
        console.log(
          'Не удалось получить количество связей пользователь-сессия:',
          error.message
        );
      }
    } else {
      console.log('\nМодель userSession НЕ существует');
    }

    // Отключаемся от базы данных
    if (adapter && adapter.disconnect) {
      await adapter.disconnect();
    } else if (prisma.$disconnect) {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Ошибка при проверке моделей Prisma:', error);
    process.exit(1);
  }
}

main();
