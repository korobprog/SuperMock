#!/usr/bin/env node

/**
 * Скрипт для запуска сервера с динамическим выбором порта
 * Если основной порт занят, будет выбран следующий свободный порт
 * Также обновляет конфигурацию фронтенда с новым портом
 */

const { spawn, execSync } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

// Основной порт для бэкенда
const basePort = 3000;
// Порт для фронтенда Next.js (по умолчанию)
const nextPort = 3001;
// Максимальное количество попыток найти свободный порт
const maxAttempts = 10;

// Функция для проверки, свободен ли порт
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      // Порт занят
      resolve(false);
    });

    server.once('listening', () => {
      // Порт свободен, закрываем тестовый сервер
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

// Функция для поиска свободного порта
async function findFreePort(startPort) {
  let port = startPort;
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (await isPortFree(port)) {
      return port;
    }
    port++;
    attempts++;
  }

  throw new Error(
    `Не удалось найти свободный порт после ${maxAttempts} попыток`
  );
}

// Функция для обновления .env файла с новым портом
function updateEnvFile(port) {
  const envPath = path.join(__dirname, '..', '.env');

  try {
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');

      // Обновляем PORT в .env
      if (envContent.includes('PORT=')) {
        envContent = envContent.replace(/PORT=\d+/, `PORT=${port}`);
      } else {
        envContent += `\nPORT=${port}`;
      }
    } else {
      envContent = `PORT=${port}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`Файл .env обновлен с PORT=${port}`);
  } catch (error) {
    console.error('Ошибка при обновлении .env файла:', error);
  }
}

// Функция для определения порта фронтенда Next.js
async function determineNextPort() {
  // Проверяем, свободен ли порт по умолчанию для Next.js
  if (await isPortFree(nextPort)) {
    return nextPort;
  }

  // Если порт занят, ищем следующий свободный
  return await findFreePort(nextPort + 1);
}

// Функция для обновления конфигурации Next.js
function updateNextConfig(backendPort, frontendPort) {
  try {
    // Используем новый скрипт для обновления конфигурации Next.js
    const updateScript = path.join(__dirname, 'update-next-config.js');
    console.log(`Запуск скрипта обновления конфигурации: ${updateScript}`);

    execSync(`node "${updateScript}" ${backendPort} ${frontendPort}`, {
      stdio: 'inherit',
      shell: true,
    });

    console.log('Конфигурация успешно обновлена');
  } catch (error) {
    console.error('Ошибка при обновлении конфигурации:', error);
  }
}

// Функция для запуска сервера
async function startServer() {
  try {
    // Определяем порт фронтенда Next.js
    const frontendPort = await determineNextPort();
    console.log(`Определен порт фронтенда Next.js: ${frontendPort}`);

    // Проверяем, свободен ли основной порт для бэкенда
    if (await isPortFree(basePort)) {
      console.log(`Основной порт ${basePort} свободен, запускаем сервер...`);

      // Обновляем конфигурацию
      updateNextConfig(basePort, frontendPort);

      // Запускаем сервер на основном порту
      const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true,
      });

      return;
    }

    // Ищем свободный порт для бэкенда
    console.log(`Основной порт ${basePort} занят, ищем свободный порт...`);
    const freePort = await findFreePort(basePort + 1);
    console.log(`Найден свободный порт для бэкенда: ${freePort}`);

    // Обновляем .env файл
    updateEnvFile(freePort);

    // Обновляем конфигурацию
    updateNextConfig(freePort, frontendPort);

    // Запускаем сервер на свободном порту
    console.log(`Запускаем сервер на порту ${freePort}...`);
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
    });
  } catch (error) {
    console.error('Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

// Запускаем сервер
startServer();
