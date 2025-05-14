#!/usr/bin/env node

/**
 * Скрипт для загрузки секретов из AWS Secrets Manager в переменные окружения
 *
 * Использование:
 * node aws-secrets.js [имя_секрета] [регион]
 *
 * Параметры:
 * - имя_секрета: имя секрета в AWS Secrets Manager (по умолчанию 'supermock')
 * - регион: регион AWS (по умолчанию 'eu-central-1')
 *
 * Требуется установить AWS SDK:
 * npm install @aws-sdk/client-secrets-manager
 *
 * Для аутентификации в AWS используются стандартные методы AWS SDK:
 * - Переменные окружения AWS_ACCESS_KEY_ID и AWS_SECRET_ACCESS_KEY
 * - Файл ~/.aws/credentials
 * - Роль IAM для EC2/ECS
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

// Получаем параметры из командной строки
const secretName = process.argv[2] || 'supermock';
const region = process.argv[3] || process.env.AWS_REGION || 'eu-central-1';

// Определяем путь к .env файлу
const envPath = path.resolve(__dirname, '../../.env');

// Загружаем существующие переменные окружения из .env файла, если он существует
let existingEnv = {};
if (fs.existsSync(envPath)) {
  existingEnv = dotenv.parse(fs.readFileSync(envPath));
}

// Функция для получения секретов из AWS Secrets Manager и обновления .env файла
async function updateEnvFromAWS() {
  try {
    console.log(
      `Получение секретов из AWS Secrets Manager: регион ${region}, секрет: ${secretName}`
    );

    // Инициализируем клиент AWS Secrets Manager
    const client = new SecretsManagerClient({ region });

    // Создаем команду для получения значения секрета
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    // Отправляем запрос
    const response = await client.send(command);

    if (!response.SecretString) {
      console.error(
        `Ошибка: Секрет ${secretName} не содержит строковых данных`
      );
      process.exit(1);
    }

    // Парсим JSON строку с секретами
    let secrets;
    try {
      secrets = JSON.parse(response.SecretString);
    } catch (error) {
      console.error('Ошибка при парсинге JSON из секрета:', error.message);
      process.exit(1);
    }

    // Объединяем существующие переменные с секретами из AWS
    // Секреты из AWS имеют приоритет
    const updatedEnv = { ...existingEnv, ...secrets };

    // Формируем содержимое .env файла
    let envContent = '';
    for (const [key, value] of Object.entries(updatedEnv)) {
      envContent += `${key}=${value}\n`;
    }

    // Записываем обновленные переменные в .env файл
    fs.writeFileSync(envPath, envContent);

    console.log(
      `Секреты успешно загружены из AWS Secrets Manager и сохранены в ${envPath}`
    );

    // Выводим список загруженных секретов (без значений)
    console.log('\nЗагруженные секреты:');
    for (const key of Object.keys(secrets)) {
      const displayValue =
        key.includes('SECRET') || key.includes('PASSWORD')
          ? '***скрыто***'
          : secrets[key];
      console.log(`  ${key}: ${displayValue}`);
    }
  } catch (error) {
    console.error(
      'Ошибка при получении секретов из AWS Secrets Manager:',
      error.message
    );
    process.exit(1);
  }
}

// Запускаем функцию получения секретов
updateEnvFromAWS();
