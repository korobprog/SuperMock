#!/usr/bin/env node

/**
 * Скрипт для проверки конфигурации переменных окружения
 *
 * Использование:
 * node check-env.js [путь_к_env_файлу]
 *
 * Если путь не указан, скрипт проверит .env файл в корне проекта
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Получаем путь к файлу .env из аргументов командной строки или используем значение по умолчанию
const envPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '../../.env');

console.log(`Проверка файла конфигурации: ${envPath}`);

// Проверяем существование файла
if (!fs.existsSync(envPath)) {
  console.error(`Ошибка: Файл ${envPath} не найден`);
  process.exit(1);
}

// Загружаем переменные окружения из файла
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Определяем группы переменных окружения
const envGroups = {
  'Основные настройки': [
    'NODE_ENV',
    'PORT',
    'FRONTEND_PORT',
    'FRONTEND_URL',
    'DOMAIN',
  ],
  MongoDB: ['USE_MONGODB', 'MONGO_URI'],
  Redis: ['USE_REDIS', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD'],
  JWT: ['JWT_SECRET', 'JWT_EXPIRES_IN'],
  'Google OAuth': [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
  ],
  CORS: ['CORS_ORIGINS'],
};

// Определяем обязательные переменные в зависимости от окружения
const requiredVars = {
  development: ['NODE_ENV', 'PORT'],
  staging: ['NODE_ENV', 'PORT', 'DOMAIN', 'JWT_SECRET'],
  production: ['NODE_ENV', 'PORT', 'DOMAIN', 'JWT_SECRET', 'REDIS_PASSWORD'],
};

// Определяем зависимые переменные
const dependentVars = {
  'USE_MONGODB=true': ['MONGO_URI'],
  'USE_REDIS=true': ['REDIS_HOST', 'REDIS_PORT'],
};

// Получаем текущее окружение
const nodeEnv = envConfig.NODE_ENV || 'development';

console.log(`\nТекущее окружение: ${nodeEnv}`);
console.log('='.repeat(50));

// Проверяем наличие всех переменных по группам
let hasWarnings = false;
let hasErrors = false;

console.log('\nПроверка переменных окружения по группам:');
for (const [group, vars] of Object.entries(envGroups)) {
  console.log(`\n${group}:`);

  for (const varName of vars) {
    const value = envConfig[varName];
    const isRequired = requiredVars[nodeEnv]?.includes(varName);

    if (value === undefined) {
      if (isRequired) {
        console.error(`  ❌ ${varName}: Отсутствует (обязательная переменная)`);
        hasErrors = true;
      } else {
        console.warn(`  ⚠️ ${varName}: Отсутствует`);
        hasWarnings = true;
      }
    } else {
      // Скрываем значения секретных переменных
      const displayValue =
        varName.includes('SECRET') || varName.includes('PASSWORD')
          ? '***скрыто***'
          : value;

      console.log(`  ✅ ${varName}: ${displayValue}`);
    }
  }
}

// Проверяем зависимые переменные
console.log('\nПроверка зависимых переменных:');
for (const [condition, vars] of Object.entries(dependentVars)) {
  const [condVarName, condVarValue] = condition.split('=');

  if (envConfig[condVarName] === condVarValue) {
    for (const varName of vars) {
      if (envConfig[varName] === undefined) {
        console.error(
          `  ❌ ${varName}: Отсутствует (требуется при ${condition})`
        );
        hasErrors = true;
      }
    }
  }
}

// Проверяем специфичные для окружения требования
console.log('\nПроверка специфичных требований для окружения:');

if (nodeEnv === 'production') {
  // Проверка JWT_SECRET на сложность
  if (envConfig.JWT_SECRET && envConfig.JWT_SECRET.length < 32) {
    console.warn(
      `  ⚠️ JWT_SECRET: Слишком короткий (рекомендуется минимум 32 символа)`
    );
    hasWarnings = true;
  }

  // Проверка REDIS_PASSWORD на сложность
  if (
    envConfig.USE_REDIS === 'true' &&
    envConfig.REDIS_PASSWORD &&
    envConfig.REDIS_PASSWORD.length < 16
  ) {
    console.warn(
      `  ⚠️ REDIS_PASSWORD: Слишком простой (рекомендуется минимум 16 символов)`
    );
    hasWarnings = true;
  }

  // Проверка HTTPS для продакшн
  if (
    envConfig.FRONTEND_URL &&
    !envConfig.FRONTEND_URL.startsWith('https://')
  ) {
    console.error(`  ❌ FRONTEND_URL: В продакшн должен использоваться HTTPS`);
    hasErrors = true;
  }
} else if (nodeEnv === 'staging') {
  // Проверка JWT_SECRET на уникальность для staging
  if (envConfig.JWT_SECRET === 'default_jwt_secret_change_in_production') {
    console.warn(`  ⚠️ JWT_SECRET: Используется значение по умолчанию`);
    hasWarnings = true;
  }
}

// Выводим итоговый результат
console.log('\n='.repeat(50));
if (hasErrors) {
  console.error(
    '\n❌ Проверка не пройдена. Исправьте ошибки перед запуском приложения.'
  );
  process.exit(1);
} else if (hasWarnings) {
  console.warn(
    '\n⚠️ Проверка пройдена с предупреждениями. Рекомендуется исправить предупреждения.'
  );
  process.exit(0);
} else {
  console.log(
    '\n✅ Проверка успешно пройдена. Все переменные окружения настроены корректно.'
  );
  process.exit(0);
}
