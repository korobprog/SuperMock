/**
 * Сервис для работы с файловой системой
 */

import fs from 'fs';
import path from 'path';
import logger from './loggerService';

/**
 * Результат проверки файла или директории
 */
interface FileCheckResult {
  exists: boolean;
  path: string;
  isDirectory?: boolean;
  size?: number;
  files?: string[];
  error?: string;
}

/**
 * Проверяет наличие файла или директории
 */
export function checkPath(pathToCheck: string): FileCheckResult {
  try {
    const exists = fs.existsSync(pathToCheck);

    if (!exists) {
      return {
        exists: false,
        path: pathToCheck,
      };
    }

    const stats = fs.statSync(pathToCheck);
    const isDirectory = stats.isDirectory();

    if (isDirectory) {
      try {
        const files = fs.readdirSync(pathToCheck);
        return {
          exists: true,
          path: pathToCheck,
          isDirectory: true,
          files,
        };
      } catch (error) {
        return {
          exists: true,
          path: pathToCheck,
          isDirectory: true,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } else {
      return {
        exists: true,
        path: pathToCheck,
        isDirectory: false,
        size: stats.size,
      };
    }
  } catch (error) {
    return {
      exists: false,
      path: pathToCheck,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Проверяет наличие нескольких файлов
 */
export function checkFiles(
  filePaths: string[]
): Record<string, FileCheckResult> {
  const results: Record<string, FileCheckResult> = {};

  filePaths.forEach((filePath) => {
    results[filePath] = checkPath(filePath);
  });

  return results;
}

/**
 * Проверяет наличие директории с фронтендом
 */
export function checkFrontendDirectory(basePath: string): {
  frontendPath: string;
  exists: boolean;
  hasIndexHtml: boolean;
  files?: string[];
} {
  // Проверяем путь для Next.js (.next директория)
  const nextDistPath = path.join(basePath, '../../.next');
  logger.debug(`Проверка пути к Next.js фронтенду: ${nextDistPath}`);
  logger.debug(`Абсолютный путь: ${path.resolve(nextDistPath)}`);

  // Проверяем Next.js путь
  const nextResult = checkPath(nextDistPath);

  // Если Next.js директория существует, используем ее
  if (nextResult.exists && nextResult.isDirectory) {
    logger.debug(`Next.js директория найдена: ${nextDistPath}`);
    const files = nextResult.files || [];

    return {
      frontendPath: nextDistPath,
      exists: true,
      hasIndexHtml: true, // Next.js не требует index.html
      files,
    };
  }

  // Если Next.js директория не найдена, проверяем старый путь для совместимости
  const frontendDistPath = path.join(basePath, '../../react-frontend/dist');
  logger.debug(
    `Next.js директория не найдена, проверка пути к React фронтенду: ${frontendDistPath}`
  );
  logger.debug(`Абсолютный путь: ${path.resolve(frontendDistPath)}`);

  const result = checkPath(frontendDistPath);

  if (!result.exists || !result.isDirectory) {
    return {
      frontendPath: frontendDistPath,
      exists: false,
      hasIndexHtml: false,
    };
  }

  const files = result.files || [];
  const hasIndexHtml = files.includes('index.html');

  if (hasIndexHtml) {
    try {
      const indexHtmlPath = path.join(frontendDistPath, 'index.html');
      const indexHtmlStats = fs.statSync(indexHtmlPath);
      logger.debug(`Размер index.html: ${indexHtmlStats.size} байт`);
    } catch (error) {
      logger.error(
        `Ошибка при проверке index.html: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return {
    frontendPath: frontendDistPath,
    exists: true,
    hasIndexHtml,
    files,
  };
}

/**
 * Проверяет наличие альтернативных путей к фронтенду
 */
export function checkAlternativeFrontendPaths(
  basePath: string
): Record<string, FileCheckResult> {
  const alternativePaths = [
    path.join(basePath, '../react-frontend/dist'),
    path.join(basePath, '../../../react-frontend/dist'),
    path.join(basePath, '../../dist'),
    path.join(basePath, '../dist'),
    '/usr/share/nginx/html',
    '/app/react-frontend/dist',
    '/app/dist',
  ];

  logger.debug('Проверка альтернативных путей к фронтенду:');
  return checkFiles(alternativePaths);
}

/**
 * Проверяет наличие и содержимое .env файла
 */
export function checkEnvFile(basePath: string): {
  exists: boolean;
  path: string;
  content?: string[];
} {
  const envPath = path.join(basePath, '../.env');

  try {
    const exists = fs.existsSync(envPath);

    if (!exists) {
      return {
        exists: false,
        path: envPath,
      };
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent
      .split('\n')
      .filter((line) => !line.includes('SECRET') && !line.includes('PASSWORD'))
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    return {
      exists: true,
      path: envPath,
      content: envLines,
    };
  } catch (error) {
    logger.error('Ошибка при проверке .env файла:', error);

    return {
      exists: false,
      path: envPath,
    };
  }
}

export default {
  checkPath,
  checkFiles,
  checkFrontendDirectory,
  checkAlternativeFrontendPaths,
  checkEnvFile,
};
