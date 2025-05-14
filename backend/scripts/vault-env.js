/**
 * Скрипт для получения секретов из HashiCorp Vault и экспорта их как переменных окружения
 * Используется для безопасного управления секретами в приложении
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Параметры по умолчанию
const VAULT_ADDR = process.env.VAULT_ADDR || 'http://localhost:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'supermock-root-token';
const SECRET_PATH = process.env.VAULT_SECRET_PATH || 'secret/data/supermock';
const ENV_FILE = process.env.ENV_FILE || path.join(__dirname, '..', '.env');

/**
 * Функция для логирования сообщений
 * @param {string} message - Сообщение для логирования
 */
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Функция для проверки доступности Vault
 * @returns {Promise<boolean>} - Результат проверки
 */
async function checkVault() {
  try {
    log(`Проверка доступности Vault по адресу ${VAULT_ADDR}...`);
    const response = await axios.get(`${VAULT_ADDR}/v1/sys/health`);
    if (response.status === 200) {
      log('Vault доступен');
      return true;
    }
  } catch (error) {
    log(`Ошибка при проверке доступности Vault: ${error.message}`);
  }

  log('Vault недоступен. Секреты не будут получены.');
  return false;
}

/**
 * Функция для получения секретов из Vault
 * @returns {Promise<Object|null>} - Объект с секретами или null в случае ошибки
 */
async function getSecrets() {
  try {
    log(`Получение секретов из пути ${SECRET_PATH}...`);
    const response = await axios.get(`${VAULT_ADDR}/v1/${SECRET_PATH}`, {
      headers: {
        'X-Vault-Token': VAULT_TOKEN,
      },
    });

    if (
      response.status === 200 &&
      response.data &&
      response.data.data &&
      response.data.data.data
    ) {
      log('Секреты успешно получены');
      return response.data.data.data;
    }

    log('Секреты не найдены или имеют неверный формат');
    return null;
  } catch (error) {
    log(`Ошибка при получении секретов: ${error.message}`);
    return null;
  }
}

/**
 * Функция для экспорта секретов в переменные окружения
 * @param {Object} secrets - Объект с секретами
 */
function exportSecrets(secrets) {
  if (!secrets) {
    log('Нет секретов для экспорта');
    return;
  }

  log('Экспорт секретов в переменные окружения...');

  // Экспортируем секреты в переменные окружения
  Object.entries(secrets).forEach(([key, value]) => {
    process.env[key] = value;
  });

  log('Секреты успешно экспортированы в переменные окружения');
}

/**
 * Функция для сохранения секретов в .env файл
 * @param {Object} secrets - Объект с секретами
 */
function saveSecretsToEnvFile(secrets) {
  if (!secrets) {
    log('Нет секретов для сохранения в .env файл');
    return;
  }

  log(`Сохранение секретов в файл ${ENV_FILE}...`);

  // Создаем содержимое .env файла
  const envContent = Object.entries(secrets)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Сохраняем в файл
  fs.writeFileSync(ENV_FILE, envContent);

  log('Секреты успешно сохранены в .env файл');
}

/**
 * Основная функция скрипта
 */
async function main() {
  log('Запуск скрипта получения секретов из Vault');

  // Проверяем доступность Vault
  if (!(await checkVault())) {
    log('Использование локального .env файла, если он существует');
    if (fs.existsSync(ENV_FILE)) {
      log(`Локальный .env файл найден: ${ENV_FILE}`);
      // Загружаем переменные из .env файла
      require('dotenv').config({ path: ENV_FILE });
    } else {
      log('Локальный .env файл не найден');
    }
    return;
  }

  // Получаем секреты из Vault
  const secrets = await getSecrets();

  // Экспортируем секреты в переменные окружения
  exportSecrets(secrets);

  // Сохраняем секреты в .env файл (опционально, только для разработки)
  if (process.env.NODE_ENV === 'development') {
    saveSecretsToEnvFile(secrets);
  }

  log('Скрипт получения секретов из Vault успешно завершен');
}

// Запускаем основную функцию
if (require.main === module) {
  main().catch((error) => {
    log(`Ошибка при выполнении скрипта: ${error.message}`);
    process.exit(1);
  });
} else {
  // Экспортируем функции для использования в других модулях
  module.exports = {
    getSecrets,
    exportSecrets,
  };
}
