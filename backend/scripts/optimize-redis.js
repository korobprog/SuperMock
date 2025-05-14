/**
 * Скрипт для оптимизации Redis
 *
 * Этот скрипт настраивает оптимальные параметры Redis
 * и создает структуры данных для кэширования.
 *
 * Запуск: node optimize-redis.js
 */

const Redis = require('ioredis');
require('dotenv').config();

// Получаем параметры подключения из переменных окружения
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

// Создаем подключение к Redis
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Функция для оптимизации Redis
async function optimizeRedis() {
  try {
    console.log('Подключение к Redis...');

    // Проверяем соединение
    await redis.ping();
    console.log('Успешное подключение к Redis');

    // Получаем информацию о сервере Redis
    const info = await redis.info();
    console.log('Информация о сервере Redis получена');

    // Настраиваем параметры Redis для оптимальной производительности
    console.log('Настройка параметров Redis...');

    // Устанавливаем политику вытеснения данных
    await redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
    console.log('Установлена политика вытеснения: allkeys-lru');

    // Настраиваем время жизни для разных типов кэшей

    // 1. Кэш для часто запрашиваемых данных API (TTL: 5 минут)
    console.log('Создание структур для кэширования API...');
    await redis.del('api:cache:config');
    await redis.hset('api:cache:config', 'enabled', 'true');
    await redis.hset('api:cache:config', 'ttl', '300');

    // 2. Кэш для данных пользовательских сессий (TTL: 30 минут)
    console.log('Создание структур для кэширования сессий...');
    await redis.del('session:cache:config');
    await redis.hset('session:cache:config', 'enabled', 'true');
    await redis.hset('session:cache:config', 'ttl', '1800');

    // 3. Кэш для статических данных (TTL: 1 час)
    console.log('Создание структур для кэширования статических данных...');
    await redis.del('static:cache:config');
    await redis.hset('static:cache:config', 'enabled', 'true');
    await redis.hset('static:cache:config', 'ttl', '3600');

    // Создаем индексы для поиска
    console.log('Создание индексов для поиска...');

    // Проверяем, поддерживает ли Redis модуль RediSearch
    const modules = await redis.call('MODULE', 'LIST');
    const hasRediSearch = modules.some(
      (module) => Array.isArray(module) && module[1] === 'search'
    );

    if (hasRediSearch) {
      try {
        // Создаем индекс для поиска по сессиям
        await redis.call(
          'FT.CREATE',
          'idx:sessions',
          'ON',
          'HASH',
          'PREFIX',
          '1',
          'session:',
          'SCHEMA',
          'userId',
          'TAG',
          'status',
          'TAG',
          'createdAt',
          'NUMERIC',
          'SORTABLE'
        );
        console.log('Создан индекс для поиска по сессиям');
      } catch (error) {
        if (!error.message.includes('Index already exists')) {
          throw error;
        }
        console.log('Индекс для поиска по сессиям уже существует');
      }
    } else {
      console.log('Модуль RediSearch не установлен, индексы не созданы');
    }

    // Настраиваем ограничение скорости запросов
    console.log('Настройка ограничения скорости запросов...');
    await redis.del('rate:limit:config');
    await redis.hset('rate:limit:config', 'enabled', 'true');
    await redis.hset('rate:limit:config', 'requests_per_second', '10');
    await redis.hset('rate:limit:config', 'burst', '20');

    console.log('Оптимизация Redis успешно завершена');
  } catch (error) {
    console.error('Ошибка при оптимизации Redis:', error);
  } finally {
    // Закрываем соединение
    redis.quit();
    console.log('Соединение с Redis закрыто');
  }
}

// Запускаем функцию оптимизации
optimizeRedis().catch(console.error);
