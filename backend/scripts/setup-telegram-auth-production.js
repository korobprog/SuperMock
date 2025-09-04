#!/usr/bin/env node

/**
 * Скрипт для настройки Telegram авторизации в продакшене
 * Использует существующий production.env файл
 * 
 * Использование:
 * node scripts/setup-telegram-auth-production.js
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Путь к production.env
const PRODUCTION_ENV_PATH = path.join(__dirname, '..', '..', 'production.env');

function loadProductionEnv() {
  try {
    const envContent = fs.readFileSync(PRODUCTION_ENV_PATH, 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('❌ Ошибка при чтении production.env:', error.message);
    return null;
  }
}

async function testTelegramBot(env) {
  console.log('🤖 Тестирование Telegram бота...');
  
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log('❌ TELEGRAM_BOT_TOKEN не найден в production.env');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Бот успешно настроен!');
      console.log(`📱 Имя бота: ${data.result.first_name}`);
      console.log(`🆔 Username: @${data.result.username}`);
      console.log(`🆔 ID: ${data.result.id}`);
      return true;
    } else {
      console.log('❌ Ошибка при проверке бота:', data.description);
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при тестировании бота:', error.message);
    return false;
  }
}

function validateConfiguration(env) {
  console.log('🔍 Проверка конфигурации...');
  
  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'JWT_SECRET',
    'FRONTEND_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Отсутствуют обязательные переменные:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    return false;
  }
  
  console.log('✅ Все обязательные переменные настроены');
  
  // Проверяем дополнительные настройки
  const authSettings = {
    'MAX_VERIFICATION_ATTEMPTS': env.MAX_VERIFICATION_ATTEMPTS || '3',
    'VERIFICATION_CODE_EXPIRY': env.VERIFICATION_CODE_EXPIRY || '5',
    'JWT_EXPIRY_DAYS': env.JWT_EXPIRY_DAYS || '30',
    'VERIFICATION_CODE_LENGTH': env.VERIFICATION_CODE_LENGTH || '6',
    'CODE_CLEANUP_INTERVAL': env.CODE_CLEANUP_INTERVAL || '5',
    'MAX_CODES_PER_PHONE': env.MAX_CODES_PER_PHONE || '3'
  };
  
  console.log('📋 Настройки авторизации:');
  Object.entries(authSettings).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  return true;
}

async function testAPI(env) {
  console.log('🌐 Тестирование API...');
  
  const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${apiUrl}/api/telegram-auth/stats`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API доступен');
      console.log(`📊 Статистика: ${JSON.stringify(data.stats, null, 2)}`);
      return true;
    } else {
      console.log('❌ API недоступен:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка подключения к API:', error.message);
    console.log('Убедитесь, что сервер запущен');
    return false;
  }
}

function showInstructions(env) {
  console.log('\n📖 Инструкции по использованию:');
  console.log('1. Найдите вашего бота в Telegram: @' + (env.VITE_TELEGRAM_BOT_NAME || 'SuperMock_bot'));
  console.log('2. Начните диалог с ботом командой /start');
  console.log('3. Перейдите на страницу авторизации: ' + env.FRONTEND_URL + '/auth/telegram');
  console.log('4. Введите номер телефона и получите код в чате с ботом');
  
  console.log('\n🔧 Настройки безопасности:');
  console.log('- Максимум попыток ввода кода: ' + (env.MAX_VERIFICATION_ATTEMPTS || '3'));
  console.log('- Время жизни кода: ' + (env.VERIFICATION_CODE_EXPIRY || '5') + ' минут');
  console.log('- Время жизни JWT токена: ' + (env.JWT_EXPIRY_DAYS || '30') + ' дней');
  console.log('- Длина кода верификации: ' + (env.VERIFICATION_CODE_LENGTH || '6') + ' цифр');
  
  console.log('\n🧪 Тестирование:');
  console.log('node scripts/test-telegram-auth.js');
  
  console.log('\n📡 API Endpoints:');
  console.log('- POST /api/telegram-auth/send-code - Отправка кода');
  console.log('- POST /api/telegram-auth/verify-code - Проверка кода');
  console.log('- GET /api/telegram-auth/me - Информация о пользователе');
  console.log('- GET /api/telegram-auth/stats - Статистика');
}

async function main() {
  console.log('🚀 Настройка Telegram авторизации для продакшена\n');
  
  // Загружаем конфигурацию
  const env = loadProductionEnv();
  if (!env) {
    process.exit(1);
  }
  
  // Проверяем конфигурацию
  if (!validateConfiguration(env)) {
    process.exit(1);
  }
  
  // Тестируем бота
  const botOk = await testTelegramBot(env);
  if (!botOk) {
    console.log('⚠️  Проблемы с ботом, но продолжаем...');
  }
  
  // Тестируем API
  const apiOk = await testAPI(env);
  if (!apiOk) {
    console.log('⚠️  API недоступен, но настройка завершена');
  }
  
  // Показываем инструкции
  showInstructions(env);
  
  console.log('\n✅ Настройка завершена!');
}

// Запускаем настройку
main().catch(console.error);
