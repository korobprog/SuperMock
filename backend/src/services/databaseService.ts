/**
 * Сервис для работы с базой данных MongoDB
 */

import { MongoClient } from 'mongodb';
import logger from './loggerService';

// Интерфейс для результата проверки подключения
interface ConnectionCheckResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Проверяет подключение к MongoDB
 */
export async function checkMongoDBConnection(): Promise<ConnectionCheckResult> {
  // Проверяем, нужно ли использовать MongoDB
  if (process.env.USE_MONGODB !== 'true') {
    logger.info('Используется хранилище пользователей в памяти (InMemoryUser)');
    logger.info('Флаг USE_MONGODB не установлен или равен false');
    return {
      success: false,
      message: 'MongoDB не используется (USE_MONGODB != true)',
    };
  }

  // Проверяем наличие URI для подключения
  if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI не определен в переменных окружения');
    return {
      success: false,
      message: 'MONGO_URI не определен в переменных окружения',
    };
  }

  try {
    // Логируем информацию о подключении (без секретов)
    const safeUri = process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@');
    logger.debug('Попытка подключения к MongoDB...', {
      uri: safeUri,
      host: new URL(process.env.MONGO_URI.replace('mongodb://', 'http://'))
        .hostname,
      port: new URL(process.env.MONGO_URI.replace('mongodb://', 'http://'))
        .port,
      database: new URL(
        process.env.MONGO_URI.replace('mongodb://', 'http://')
      ).pathname.substring(1),
    });

    // Создаем клиент MongoDB
    const client = new MongoClient(process.env.MONGO_URI);

    // Подключаемся к базе данных
    await client.connect();
    logger.info('Успешное подключение к MongoDB');

    // Проверяем доступность базы данных через ping
    logger.debug('Проверка доступности базы данных через ping...');
    await client.db().admin().ping();
    logger.info('MongoDB пинг успешен - база данных отвечает');

    // Закрываем соединение
    await client.close();

    return {
      success: true,
      message: 'Успешное подключение к MongoDB',
    };
  } catch (err) {
    // Логируем ошибку
    logger.error('Ошибка подключения к MongoDB', err);

    return {
      success: false,
      message: 'Ошибка подключения к MongoDB',
      details:
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
            }
          : err,
    };
  }
}

/**
 * Проверяет сетевую доступность MongoDB
 * Используется для диагностики проблем с подключением
 */
export async function checkMongoDBNetworkConnectivity(): Promise<ConnectionCheckResult> {
  // Проверяем наличие URI для подключения
  if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI не определен в переменных окружения');
    return {
      success: false,
      message: 'MONGO_URI не определен в переменных окружения',
    };
  }

  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    // Получаем хост и порт из URI
    const mongoHost = new URL(
      process.env.MONGO_URI.replace('mongodb://', 'http://')
    ).hostname;
    const mongoPort = new URL(
      process.env.MONGO_URI.replace('mongodb://', 'http://')
    ).port;

    // Проверяем доступность хоста через ping
    logger.debug(`Проверка доступности хоста ${mongoHost} через ping...`);
    const pingResult = await execPromise(`ping -c 1 ${mongoHost}`);
    logger.debug(`Результат ping ${mongoHost}:`, pingResult.stdout);

    // Проверяем доступность порта
    logger.debug(
      `Проверка доступности порта ${mongoPort} на хосте ${mongoHost}...`
    );
    const portCheckResult = await execPromise(
      `nc -zv ${mongoHost} ${mongoPort} 2>&1 || echo "Порт недоступен"`
    );
    logger.debug(
      `Результат проверки порта ${mongoPort}:`,
      portCheckResult.stdout || portCheckResult.stderr
    );

    // Анализируем результаты
    const portAvailable = !portCheckResult.stdout.includes('Порт недоступен');

    return {
      success: portAvailable,
      message: portAvailable
        ? `Хост ${mongoHost} и порт ${mongoPort} доступны`
        : `Проблема с доступностью хоста ${mongoHost} или порта ${mongoPort}`,
      details: {
        pingOutput: pingResult.stdout,
        portCheckOutput: portCheckResult.stdout || portCheckResult.stderr,
      },
    };
  } catch (err) {
    logger.error('Ошибка при проверке сетевой доступности MongoDB', err);

    return {
      success: false,
      message: 'Ошибка при проверке сетевой доступности MongoDB',
      details:
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
            }
          : err,
    };
  }
}

export default {
  checkMongoDBConnection,
  checkMongoDBNetworkConnectivity,
};
