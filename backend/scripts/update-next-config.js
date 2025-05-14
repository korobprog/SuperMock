#!/usr/bin/env node

/**
 * Скрипт для обновления конфигурации Next.js и бэкенда при изменении портов
 * Использование: node update-next-config.js <номер_порта_бэкенда> [номер_порта_фронтенда]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Получаем порт бэкенда из аргументов командной строки или из .env файла
let backendPort = process.argv[2];

// Получаем порт фронтенда из аргументов командной строки
let frontendPort = process.argv[3];

if (!backendPort) {
  try {
    // Пытаемся прочитать порт из .env файла
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const portMatch = envContent.match(/PORT=(\d+)/);
      if (portMatch && portMatch[1]) {
        backendPort = portMatch[1];
      }
    }
  } catch (error) {
    console.error('Ошибка при чтении .env файла:', error);
  }
}

// Если порт бэкенда все еще не определен, используем порт по умолчанию
if (!backendPort) {
  backendPort = 3000;
}

// Определяем порт фронтенда
if (!frontendPort) {
  // Стандартный порт для Next.js - 3000, но так как бэкенд может использовать этот порт,
  // используем 3001 по умолчанию
  frontendPort = 3001;
}

console.log(`Обновление конфигурации с портом бэкенда ${backendPort}...`);
console.log(`Обновление конфигурации с портом фронтенда ${frontendPort}...`);

// Создаем или обновляем .env.local файл для Next.js
const nextEnvPath = path.join(__dirname, '..', '..', '.env.local');

try {
  // Создаем содержимое .env.local файла
  const envContent = `NEXT_PUBLIC_API_URL=http://localhost:${backendPort}/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:${backendPort}
PORT=${frontendPort}
FRONTEND_PORT=${frontendPort}
`;

  // Записываем файл
  fs.writeFileSync(nextEnvPath, envContent);
  console.log(
    `Файл ${nextEnvPath} успешно создан/обновлен с портами бэкенда и фронтенда`
  );

  // Обновляем конфигурационный файл app.ts в бэкенде
  const appConfigPath = path.join(__dirname, '..', 'src', 'config', 'app.ts');

  // Проверяем, существует ли файл
  if (fs.existsSync(appConfigPath)) {
    // Читаем содержимое файла
    let appConfig = fs.readFileSync(appConfigPath, 'utf8');

    // Обновляем порт фронтенда в конфигурации
    appConfig = appConfig.replace(
      /export const FRONTEND_PORT = .*?;/,
      `export const FRONTEND_PORT = process.env.FRONTEND_PORT || ${frontendPort};`
    );

    // Записываем обновленную конфигурацию
    fs.writeFileSync(appConfigPath, appConfig);

    console.log(
      `Файл ${appConfigPath} успешно обновлен с портом фронтенда ${frontendPort}`
    );
  } else {
    console.log(
      `Файл ${appConfigPath} не найден, создание не требуется для Next.js`
    );
  }
} catch (error) {
  console.error('Ошибка при обновлении конфигурации:', error);
  process.exit(1);
}
