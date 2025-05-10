#!/usr/bin/env node

/**
 * Скрипт для обновления vite.config.ts и конфигурации фронтенда при изменении порта сервера
 * Использование: node update-vite-config.js <номер_порта_бэкенда> [номер_порта_фронтенда]
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
  try {
    // Пытаемся определить порт фронтенда, запустив команду vite --help
    // и проверяя, какой порт используется по умолчанию
    const viteInfo = execSync('npx vite --help', {
      cwd: path.join(__dirname, '..', '..', 'react-frontend'),
      encoding: 'utf8',
    });

    // Ищем строку с портом по умолчанию
    const portMatch = viteInfo.match(
      /--port \[number\]\s+port to use \(default: (\d+)\)/
    );
    if (portMatch && portMatch[1]) {
      frontendPort = portMatch[1];
    } else {
      // Если не удалось найти порт в выводе команды, используем порт по умолчанию
      frontendPort = 5173;
    }
  } catch (error) {
    console.error('Ошибка при определении порта фронтенда:', error);
    // Используем порт по умолчанию
    frontendPort = 5173;
  }
}

console.log(`Обновление vite.config.ts с портом бэкенда ${backendPort}...`);
console.log(`Обновление конфигурации с портом фронтенда ${frontendPort}...`);

// Путь к файлу vite.config.ts
const viteConfigPath = path.join(
  __dirname,
  '..',
  '..',
  'react-frontend',
  'vite.config.ts'
);

try {
  // Проверяем, существует ли файл
  if (!fs.existsSync(viteConfigPath)) {
    console.error(`Файл ${viteConfigPath} не найден`);
    process.exit(1);
  }

  // Читаем содержимое файла
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

  // Обновляем порт в конфигурации
  viteConfig = viteConfig.replace(
    /target: 'http:\/\/localhost:\d+'.*/,
    `target: 'http://localhost:${backendPort}', // Порт обновлен автоматически`
  );

  // Записываем обновленную конфигурацию
  fs.writeFileSync(viteConfigPath, viteConfig);

  console.log(
    `Файл ${viteConfigPath} успешно обновлен с портом бэкенда ${backendPort}`
  );

  // Обновляем конфигурационный файл app.ts
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
    console.error(`Файл ${appConfigPath} не найден`);
  }
} catch (error) {
  console.error('Ошибка при обновлении vite.config.ts:', error);
  process.exit(1);
}
