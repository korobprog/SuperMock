import { PrismaClient } from '@prisma/client';

// Создаем единый экземпляр Prisma клиента для всего приложения
const prisma = new PrismaClient();

// Выводим доступные модели для отладки
console.log('=== ДОСТУПНЫЕ МОДЕЛИ PRISMA ===');
console.log(Object.keys(prisma));

// Добавляем обработку ошибок подключения
prisma
  .$connect()
  .then(() => {
    console.log('Prisma успешно подключен к базе данных');
  })
  .catch((error) => {
    console.error('Ошибка при подключении Prisma к базе данных:', error);
  });

// Обработка завершения работы приложения
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('Prisma отключен от базы данных');
});

export default prisma;
