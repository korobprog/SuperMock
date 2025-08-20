// Скрипт для заполнения базы данных начальными данными
// Используем нативный MongoDB драйвер вместо Prisma для обхода ограничения с транзакциями
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function main() {
  // Получаем URI для подключения к MongoDB из переменных окружения
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb://admin:dev-password@localhost:27018/supermock_dev?authSource=admin';

  // Создаем клиент MongoDB
  const client = new MongoClient(mongoUri);

  try {
    console.log('Начинаем заполнение базы данных...');

    // Подключаемся к базе данных
    await client.connect();
    console.log('Подключение к MongoDB установлено');

    // Получаем базу данных и коллекцию пользователей
    const dbName = new URL(
      mongoUri.replace('mongodb://', 'http://')
    ).pathname.substring(1);
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Хешируем пароль для тестового пользователя
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    // Проверяем, существует ли тестовый пользователь
    const testUser = await usersCollection.findOne({
      email: 'test@example.com',
    });

    // Если пользователь не существует, создаем его
    if (!testUser) {
      const newTestUser = {
        _id: uuidv4(),
        email: 'test@example.com',
        password: hashedPassword,
        roleHistory: [],
        feedbackStatus: 'none',
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newTestUser);
      console.log(`Создан тестовый пользователь с ID: ${newTestUser._id}`);
    } else {
      console.log(`Тестовый пользователь уже существует с ID: ${testUser._id}`);
    }

    // Проверяем, существует ли админ
    const adminUser = await usersCollection.findOne({
      email: 'admin@example.com',
    });

    // Если админ не существует, создаем его
    if (!adminUser) {
      const newAdminUser = {
        _id: uuidv4(),
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', salt),
        roleHistory: [{ role: 'admin', assignedAt: new Date().toISOString() }],
        feedbackStatus: 'none',
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newAdminUser);
      console.log(`Создан администратор с ID: ${newAdminUser._id}`);
    } else {
      console.log(`Администратор уже существует с ID: ${adminUser._id}`);
    }

    console.log('База данных успешно заполнена начальными данными');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Соединение с MongoDB закрыто');
  }
}

main();
