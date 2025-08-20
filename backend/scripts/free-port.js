#!/usr/bin/env node

/**
 * Скрипт для освобождения занятого порта
 * Использование: node free-port.js <номер_порта>
 */

const { execSync } = require('child_process');
const os = require('os');

const port = process.argv[2] || 3000;

if (!port) {
  console.error('Пожалуйста, укажите номер порта');
  process.exit(1);
}

console.log(`Проверка и освобождение порта ${port}...`);

try {
  let command;

  if (os.platform() === 'win32') {
    // Windows
    command = `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a`;
    try {
      execSync(command, { stdio: 'inherit' });
    } catch (e) {
      // Игнорируем ошибки, так как команда может завершиться с ошибкой, если процесс не найден
      console.log('Процесс не найден или уже завершен');
    }
  } else {
    // Linux/Mac
    command = `lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs -r kill -9`;
    try {
      execSync(command, { stdio: 'inherit' });
    } catch (e) {
      // Игнорируем ошибки, так как команда может завершиться с ошибкой, если процесс не найден
      console.log('Процесс не найден или уже завершен');
    }
  }

  console.log(`Порт ${port} освобожден`);
} catch (error) {
  console.error(`Ошибка при освобождении порта ${port}:`, error.message);
  process.exit(1);
}
