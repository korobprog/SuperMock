/**
 * Скрипт для оптимизации MongoDB
 *
 * Этот скрипт создает индексы для часто запрашиваемых полей
 * и настраивает другие оптимизации производительности.
 *
 * Запуск: node optimize-mongodb.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Получаем URI подключения из переменных окружения
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://admin:password@localhost:27017/mock_interviews?authSource=admin';

// Функция для создания индексов
async function createIndexes() {
  const client = new MongoClient(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    console.log('Подключение к MongoDB...');
    await client.connect();
    console.log('Успешное подключение к MongoDB');

    const db = client.db();

    // Создаем индексы для коллекции пользователей
    console.log('Создание индексов для коллекции users...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ googleId: 1 }, { sparse: true });
    await db.collection('users').createIndex({ createdAt: 1 });
    await db.collection('users').createIndex({ lastLogin: 1 });
    console.log('Индексы для коллекции users созданы');

    // Создаем индексы для коллекции сессий
    console.log('Создание индексов для коллекции sessions...');
    await db.collection('sessions').createIndex({ userId: 1 });
    await db.collection('sessions').createIndex({ createdAt: 1 });
    await db.collection('sessions').createIndex({ status: 1 });
    await db.collection('sessions').createIndex({ 'feedback.rating': 1 });
    console.log('Индексы для коллекции sessions созданы');

    // Создаем индексы для коллекции отзывов
    console.log('Создание индексов для коллекции feedback...');
    await db.collection('feedback').createIndex({ sessionId: 1 });
    await db.collection('feedback').createIndex({ userId: 1 });
    await db.collection('feedback').createIndex({ rating: 1 });
    await db.collection('feedback').createIndex({ createdAt: 1 });
    console.log('Индексы для коллекции feedback созданы');

    // Создаем индексы для коллекции логов
    console.log('Создание индексов для коллекции logs...');
    await db.collection('logs').createIndex({ timestamp: 1 });
    await db.collection('logs').createIndex({ level: 1 });
    await db.collection('logs').createIndex({ userId: 1 });
    await db.collection('logs').createIndex({ sessionId: 1 });
    console.log('Индексы для коллекции logs созданы');

    // Создаем TTL индекс для автоматического удаления старых логов
    console.log('Создание TTL индекса для коллекции logs...');
    await db.collection('logs').createIndex(
      { timestamp: 1 },
      { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 дней
    );
    console.log('TTL индекс для коллекции logs создан');

    // Создаем индексы для коллекции календаря
    console.log('Создание индексов для коллекции calendar...');
    await db.collection('calendar').createIndex({ userId: 1 });
    await db.collection('calendar').createIndex({ date: 1 });
    await db.collection('calendar').createIndex({ 'slots.startTime': 1 });
    await db.collection('calendar').createIndex({ 'slots.status': 1 });
    console.log('Индексы для коллекции calendar созданы');

    console.log('Все индексы успешно созданы');
  } catch (error) {
    console.error('Ошибка при создании индексов:', error);
  } finally {
    await client.close();
    console.log('Соединение с MongoDB закрыто');
  }
}

// Запускаем функцию создания индексов
createIndexes().catch(console.error);
