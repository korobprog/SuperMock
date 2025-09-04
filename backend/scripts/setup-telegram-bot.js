#!/usr/bin/env node

/**
 * Скрипт для настройки Telegram бота для авторизации
 * 
 * Использование:
 * node scripts/setup-telegram-bot.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function validateBotToken(token) {
  // Проверяем формат токена Telegram бота
  const botTokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
  return botTokenRegex.test(token);
}

function validatePhoneNumber(phone) {
  // Простая проверка номера телефона
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

async function setupTelegramBot() {
  console.log('🤖 Настройка Telegram бота для авторизации\n');
  
  console.log('📋 Инструкция:');
  console.log('1. Перейдите к @BotFather в Telegram');
  console.log('2. Создайте нового бота командой /newbot');
  console.log('3. Следуйте инструкциям BotFather');
  console.log('4. Скопируйте полученный токен\n');

  // Получаем токен бота
  let botToken;
  do {
    botToken = await question('Введите токен бота (формат: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz): ');
    
    if (!validateBotToken(botToken)) {
      console.log('❌ Неверный формат токена. Попробуйте еще раз.\n');
    }
  } while (!validateBotToken(botToken));

  // Получаем номер телефона для тестирования
  let testPhone;
  do {
    testPhone = await question('Введите ваш номер телефона для тестирования (например: +79991234567): ');
    
    if (!validatePhoneNumber(testPhone)) {
      console.log('❌ Неверный формат номера телефона. Попробуйте еще раз.\n');
    }
  } while (!validatePhoneNumber(testPhone));

  // Генерируем JWT секрет
  const jwtSecret = generateJWTSecret();
  console.log('\n✅ JWT секрет сгенерирован автоматически');

  // Получаем URL фронтенда
  const frontendUrl = await question('Введите URL фронтенда (по умолчанию: https://app.supermock.ru): ') || 'https://app.supermock.ru';

  // Создаем конфигурацию
  const config = {
    TELEGRAM_BOT_TOKEN: botToken,
    JWT_SECRET: jwtSecret,
    FRONTEND_URL: frontendUrl,
    TEST_PHONE: testPhone,
    MAX_VERIFICATION_ATTEMPTS: 3,
    VERIFICATION_CODE_EXPIRY: 5,
    JWT_EXPIRY_DAYS: 30,
    VERIFICATION_CODE_LENGTH: 6,
    CODE_CLEANUP_INTERVAL: 5,
    MAX_CODES_PER_PHONE: 3
  };

  // Сохраняем конфигурацию
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Конфигурация сохранена в ${envPath}`);
  } catch (error) {
    console.log(`\n❌ Ошибка при сохранении конфигурации: ${error.message}`);
    console.log('Создайте файл .env вручную со следующим содержимым:');
    console.log('\n' + envContent);
  }

  // Тестируем бота
  console.log('\n🧪 Тестирование бота...');
  
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Бот успешно настроен!');
      console.log(`📱 Имя бота: ${data.result.first_name}`);
      console.log(`🆔 Username: @${data.result.username}`);
      console.log(`🆔 ID: ${data.result.id}`);
    } else {
      console.log('❌ Ошибка при проверке бота:', data.description);
    }
  } catch (error) {
    console.log('❌ Ошибка при тестировании бота:', error.message);
  }

  // Инструкции по использованию
  console.log('\n📖 Следующие шаги:');
  console.log('1. Найдите вашего бота в Telegram: @' + (await getBotUsername(botToken)));
  console.log('2. Начните диалог с ботом командой /start');
  console.log('3. Запустите сервер: pnpm dev');
  console.log('4. Перейдите на страницу авторизации: /auth/telegram');
  console.log('5. Введите номер телефона и получите код в чате с ботом');

  console.log('\n🔧 Дополнительные настройки:');
  console.log('- Максимум попыток ввода кода: 3');
  console.log('- Время жизни кода: 5 минут');
  console.log('- Время жизни JWT токена: 30 дней');
  console.log('- Длина кода верификации: 6 цифр');

  rl.close();
}

async function getBotUsername(token) {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    return data.ok ? data.result.username : 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Запускаем настройку
setupTelegramBot().catch(console.error);
