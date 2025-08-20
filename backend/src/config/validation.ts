/**
 * Модуль валидации переменных окружения
 */

import logger from '../services/loggerService';

/**
 * Интерфейс для описания переменной окружения
 */
interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  default?: string;
  type?: 'string' | 'number' | 'boolean';
}

/**
 * Список всех переменных окружения с описанием
 */
export const ENV_VARS: EnvVar[] = [
  // Основные настройки
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Окружение (development/production)',
    default: 'development',
    type: 'string',
  },
  {
    name: 'PORT',
    required: false,
    description: 'Порт для API',
    default: '3002',
    type: 'number',
  },
  {
    name: 'FRONTEND_PORT',
    required: false,
    description: 'Порт для фронтенда',
    default: '3000',
    type: 'number',
  },
  {
    name: 'FRONTEND_URL',
    required: false,
    description: 'URL фронтенда',
    default: `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
    type: 'string',
  },
  {
    name: 'DOMAIN',
    required: false,
    description: 'Домен приложения',
    default: 'localhost',
    type: 'string',
  },

  // MongoDB
  {
    name: 'USE_MONGODB',
    required: false,
    description: 'Использовать MongoDB (true/false)',
    default: 'false',
    type: 'boolean',
  },
  {
    name: 'MONGO_URI',
    required: false,
    description: 'URI для подключения к MongoDB',
    default: 'mongodb://localhost:27017/supermock',
    type: 'string',
  },

  // Redis
  {
    name: 'REDIS_HOST',
    required: false,
    description: 'Хост Redis',
    default: 'localhost',
    type: 'string',
  },
  {
    name: 'REDIS_PORT',
    required: false,
    description: 'Порт Redis',
    default: '6379',
    type: 'number',
  },
  {
    name: 'REDIS_PASSWORD',
    required: false,
    description: 'Пароль Redis',
    type: 'string',
  },

  // Google OAuth
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'ID клиента Google OAuth',
    type: 'string',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Секрет клиента Google OAuth',
    type: 'string',
  },
  {
    name: 'GOOGLE_CALLBACK_URL',
    required: false,
    description: 'URL обратного вызова для Google OAuth',
    type: 'string',
  },

  // JWT
  {
    name: 'JWT_SECRET',
    required: false,
    description: 'Секретный ключ для JWT',
    type: 'string',
  },
];

/**
 * Проверяет наличие обязательных переменных окружения
 * @returns {string[]} Список отсутствующих обязательных переменных
 */
export function checkRequiredEnvVars(): string[] {
  const missingEnvVars = ENV_VARS.filter(
    (envVar) => envVar.required && !process.env[envVar.name]
  ).map((envVar) => envVar.name);

  return missingEnvVars;
}

/**
 * Устанавливает значения по умолчанию для отсутствующих переменных окружения
 */
export function setDefaultEnvVars(): void {
  ENV_VARS.forEach((envVar) => {
    if (!process.env[envVar.name] && envVar.default !== undefined) {
      process.env[envVar.name] = envVar.default;
      logger.debug(
        `Установлено значение по умолчанию для ${envVar.name}: ${envVar.default}`
      );
    }
  });
}

/**
 * Валидирует переменные окружения
 * @throws {Error} Если отсутствуют обязательные переменные окружения
 */
export function validateEnv(): void {
  const missingEnvVars = checkRequiredEnvVars();
  const typeErrors: string[] = [];

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Отсутствуют обязательные переменные окружения: ${missingEnvVars.join(
        ', '
      )}`
    );
  }

  // Устанавливаем значения по умолчанию
  setDefaultEnvVars();

  // Проверяем типы переменных
  ENV_VARS.forEach((envVar) => {
    const value = process.env[envVar.name];

    if (value && envVar.type) {
      let isValid = true;

      switch (envVar.type) {
        case 'number':
          isValid = !isNaN(Number(value));
          break;
        case 'boolean':
          isValid = value === 'true' || value === 'false';
          break;
        // Для строк валидация не требуется
      }

      if (!isValid) {
        typeErrors.push(
          `${envVar.name}: ожидается тип ${envVar.type}, получено значение "${value}"`
        );
      }
    }
  });

  // Если есть ошибки типов, выбрасываем исключение
  if (typeErrors.length > 0) {
    throw new Error(
      `Ошибки типов переменных окружения:\n${typeErrors.join('\n')}`
    );
  }

  // Логируем информацию о переменных окружения (без секретов)
  logger.info('=== ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ ===');
  ENV_VARS.forEach((envVar) => {
    if (
      !envVar.name.includes('SECRET') &&
      !envVar.name.includes('PASSWORD') &&
      !envVar.name.includes('KEY')
    ) {
      logger.info(
        `${envVar.name}: ${process.env[envVar.name] || 'не установлено'}`
      );
    } else {
      logger.info(
        `${envVar.name}: ${
          process.env[envVar.name] ? '***скрыто***' : 'не установлено'
        }`
      );
    }
  });
}

/**
 * Генерирует содержимое файла .env.example на основе описания переменных окружения
 * @returns {string} Содержимое файла .env.example
 */
export function generateEnvExample(): string {
  let content = '# Файл с примерами переменных окружения\n';
  content +=
    '# Скопируйте этот файл в .env и заполните необходимые значения\n\n';

  // Группируем переменные по категориям
  const categories: Record<string, EnvVar[]> = {
    'Основные настройки': [],
    MongoDB: [],
    Redis: [],
    'Google OAuth': [],
    JWT: [],
    Другое: [],
  };

  ENV_VARS.forEach((envVar) => {
    if (envVar.name.startsWith('MONGO')) {
      categories['MongoDB'].push(envVar);
    } else if (envVar.name.startsWith('REDIS')) {
      categories['Redis'].push(envVar);
    } else if (envVar.name.startsWith('GOOGLE')) {
      categories['Google OAuth'].push(envVar);
    } else if (envVar.name.startsWith('JWT')) {
      categories['JWT'].push(envVar);
    } else if (
      ['NODE_ENV', 'PORT', 'FRONTEND_PORT', 'FRONTEND_URL', 'DOMAIN'].includes(
        envVar.name
      )
    ) {
      categories['Основные настройки'].push(envVar);
    } else {
      categories['Другое'].push(envVar);
    }
  });

  // Формируем содержимое файла
  Object.entries(categories).forEach(([category, vars]) => {
    if (vars.length > 0) {
      content += `# ${category}\n`;
      vars.forEach((envVar) => {
        content += `# ${envVar.description}\n`;
        if (envVar.required) {
          content += `${envVar.name}=\n\n`;
        } else {
          content += `${envVar.name}=${envVar.default || ''}\n\n`;
        }
      });
    }
  });

  return content;
}

export default {
  validateEnv,
  checkRequiredEnvVars,
  setDefaultEnvVars,
  generateEnvExample,
  ENV_VARS,
};
