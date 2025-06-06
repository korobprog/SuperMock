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

// Основной порт
const basePort = 3000;
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

// Функция для определения порта фронтенда
async function determineFrontendPort() {
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
      return portMatch[1];
    } else {
      // Если не удалось найти порт в выводе команды, используем порт по умолчанию
      return 5173;
    }
  } catch (error) {
    console.error('Ошибка при определении порта фронтенда:', error);
    // Используем порт по умолчанию
    return 5173;
  }
}

// Функция для обновления конфигурации Vite
function updateViteConfig(backendPort, frontendPort) {
  try {
    const updateScript = path.join(__dirname, 'update-vite-config.js');
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
    // Определяем порт фронтенда
    const frontendPort = await determineFrontendPort();
    console.log(`Определен порт фронтенда: ${frontendPort}`);

    // Проверяем, свободен ли основной порт
    if (await isPortFree(basePort)) {
      console.log(`Основной порт ${basePort} свободен, запускаем сервер...`);

      // Обновляем конфигурацию
      updateViteConfig(basePort, frontendPort);

      // Запускаем сервер на основном порту
      const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true,
      });

      return;
    }

    // Ищем свободный порт
    console.log(`Основной порт ${basePort} занят, ищем свободный порт...`);
    const freePort = await findFreePort(basePort + 1);
    console.log(`Найден свободный порт: ${freePort}`);

    // Обновляем .env файл
    updateEnvFile(freePort);

    // Обновляем конфигурацию
    updateViteConfig(freePort, frontendPort);

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
