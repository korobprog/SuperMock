/**
 * Сервис для работы с фронтендом
 */

import path from 'path';
import express from 'express';
import { Application, Request, Response } from 'express';
import fileSystemService from './fileSystemService';
import logger from './loggerService';

/**
 * Результат проверки фронтенда
 */
interface FrontendCheckResult {
  exists: boolean;
  path: string;
  hasIndexHtml: boolean;
  files?: string[];
}

/**
 * Проверяет наличие и настраивает обслуживание фронтенда
 */
export function setupFrontend(
  app: Application,
  basePath: string
): FrontendCheckResult {
  // Проверяем наличие директории с фронтендом
  const frontendDistPath = path.join(basePath, '../../react-frontend/dist');
  logger.debug('=== ПРОВЕРКА ФРОНТЕНДА ===');
  logger.debug(`Проверка пути к фронтенду: ${frontendDistPath}`);
  logger.debug(`__dirname: ${basePath}`);
  logger.debug(`Абсолютный путь: ${path.resolve(frontendDistPath)}`);

  // Проверяем наличие директории
  const frontendCheck = fileSystemService.checkFrontendDirectory(basePath);

  if (frontendCheck.exists) {
    logger.info(
      'Директория с фронтендом найдена. Настраиваем обслуживание статических файлов.'
    );

    if (frontendCheck.files) {
      logger.debug(
        `Содержимое директории фронтенда (${frontendCheck.files.length} файлов):`,
        frontendCheck.files.slice(0, 10).join(', ') +
          (frontendCheck.files.length > 10 ? '...' : '')
      );
    }

    logger.debug(
      `index.html: ${frontendCheck.hasIndexHtml ? 'найден' : 'не найден'}`
    );

    // Middleware для статических файлов - после API маршрутов
    app.use(express.static(frontendDistPath));

    // Базовый маршрут для всех остальных запросов - отдаем фронтенд
    app.get('*', (req: Request, res: Response): void => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });

    return {
      exists: true,
      path: frontendDistPath,
      hasIndexHtml: frontendCheck.hasIndexHtml,
      files: frontendCheck.files,
    };
  } else {
    logger.info(
      'Директория с фронтендом не найдена. Сервер будет обслуживать только API.'
    );
    logger.debug('Ожидаемый путь к фронтенду:', frontendDistPath);
    logger.debug(
      'Фронтенд должен обслуживаться через Netlify или другой сервис.'
    );

    // Проверяем альтернативные пути
    const alternativePaths =
      fileSystemService.checkAlternativeFrontendPaths(basePath);
    logger.debug('Результаты проверки альтернативных путей:', alternativePaths);

    // Проверяем наличие директории react-frontend
    const reactFrontendPath = path.join(basePath, '../../react-frontend');
    const reactFrontendCheck = fileSystemService.checkPath(reactFrontendPath);

    if (reactFrontendCheck.exists && reactFrontendCheck.isDirectory) {
      logger.debug(
        'Директория react-frontend существует:',
        reactFrontendCheck.files
      );
    }

    // Маршрут для всех остальных запросов, когда фронтенд отсутствует
    app.get('*', (req: Request, res: Response): void => {
      res.status(404).json({
        message:
          'Фронтенд не найден на сервере. Используйте API-эндпоинты или перейдите на https://supermock.ru/',
      });
    });

    return {
      exists: false,
      path: frontendDistPath,
      hasIndexHtml: false,
    };
  }
}

export default {
  setupFrontend,
};
