import { Request, Response, NextFunction } from 'express';
import os from 'os';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

// Типы для статусов сервисов
interface MongoStatus {
  status: string;
  version?: string;
  connections?: any;
  uptime?: number;
  error?: string;
}

interface RedisStatus {
  status: string;
  ping?: string;
  info?: Record<string, string>;
  error?: string;
}

/**
 * Middleware для проверки здоровья системы
 * Проверяет доступность MongoDB и Redis, а также системные ресурсы
 */
export const healthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const startTime = Date.now();

    // Базовая информация о системе
    const systemInfo = {
      uptime: os.uptime(),
      hostname: os.hostname(),
      platform: os.platform(),
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
    };

    // Проверка MongoDB, если используется
    let mongoStatus: MongoStatus = { status: 'disabled' };
    if (process.env.USE_MONGODB === 'true' && process.env.MONGO_URI) {
      try {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        const adminDb = client.db().admin();
        const serverStatus = await adminDb.serverStatus();

        mongoStatus = {
          status: 'connected',
          version: serverStatus.version,
          connections: serverStatus.connections,
          uptime: serverStatus.uptime,
        };

        await client.close();
      } catch (error) {
        mongoStatus = {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Проверка Redis, если используется
    let redisStatus: RedisStatus = { status: 'disabled' };
    if (process.env.USE_REDIS === 'true' && process.env.REDIS_HOST) {
      try {
        const redisClient = createClient({
          url: `redis://${process.env.REDIS_HOST}:${
            process.env.REDIS_PORT || 6379
          }`,
          password: process.env.REDIS_PASSWORD,
        });

        await redisClient.connect();
        const pingResult = await redisClient.ping();
        const info = await redisClient.info();

        redisStatus = {
          status: 'connected',
          ping: pingResult,
          info: info
            .split('\n')
            .reduce((acc: Record<string, string>, line: string) => {
              const parts = line.split(':');
              if (parts.length === 2) {
                acc[parts[0]] = parts[1].trim();
              }
              return acc;
            }, {}),
        };

        await redisClient.disconnect();
      } catch (error) {
        redisStatus = {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Формируем общий статус
    const responseTime = Date.now() - startTime;
    const status =
      mongoStatus.status === 'error' || redisStatus.status === 'error'
        ? 'degraded'
        : 'healthy';

    // Отправляем ответ
    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      system: systemInfo,
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
    });
  } catch (error) {
    // В случае ошибки отправляем статус 500
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Простой health-check эндпоинт для проверки доступности сервиса
 * Используется для проверки доступности сервиса без проверки зависимостей
 */
export const simpleHealthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};
