// Тест подключения к базе данных
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Тестирование подключения к базе данных...\n');
  console.log('📋 DATABASE_URL:', process.env.DATABASE_URL);

  const prisma = new PrismaClient();

  try {
    // Тест подключения
    console.log('1️⃣ Проверяем подключение...');
    await prisma.$connect();
    console.log('✅ Подключение успешно!');

    // Тест простого запроса
    console.log('\n2️⃣ Выполняем простой запрос...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Запрос выполнен:', result);

    // Проверяем таблицы
    console.log('\n3️⃣ Проверяем таблицы...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('✅ Найденные таблицы:', tables.map(t => t.table_name));

    // Проверяем таблицу feedback
    console.log('\n4️⃣ Проверяем таблицу feedback...');
    const feedbackTable = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'feedback'
    `;
    console.log('✅ Структура таблицы feedback:', feedbackTable);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection().then(() => {
  console.log('\n🏁 Тест завершен!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
