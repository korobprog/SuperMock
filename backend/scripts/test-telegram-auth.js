#!/usr/bin/env node

/**
 * Скрипт для тестирования Telegram авторизации
 * 
 * Использование:
 * node scripts/test-telegram-auth.js
 */

const fetch = require('node-fetch');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Загружаем production.env
const PRODUCTION_ENV_PATH = path.join(__dirname, '..', '..', 'production.env');
if (fs.existsSync(PRODUCTION_ENV_PATH)) {
  const envContent = fs.readFileSync(PRODUCTION_ENV_PATH, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} else {
  require('dotenv').config();
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

const API_BASE = process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://localhost:3000/api';

async function testTelegramAuth() {
  console.log('🧪 Тестирование Telegram авторизации\n');

  // Проверяем конфигурацию
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('❌ TELEGRAM_BOT_TOKEN не настроен в .env файле');
    console.log('Запустите: node scripts/setup-telegram-bot.js');
    rl.close();
    return;
  }

  if (!process.env.JWT_SECRET) {
    console.log('❌ JWT_SECRET не настроен в .env файле');
    console.log('Запустите: node scripts/setup-telegram-bot.js');
    rl.close();
    return;
  }

  console.log('✅ Конфигурация найдена');

  // Тест 1: Проверка доступности API
  console.log('\n📡 Тест 1: Проверка доступности API');
  try {
    const response = await fetch(`${API_BASE}/telegram-auth/stats`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API доступен');
      console.log(`📊 Статистика: ${JSON.stringify(data.stats, null, 2)}`);
    } else {
      console.log('❌ API недоступен:', data.message);
    }
  } catch (error) {
    console.log('❌ Ошибка подключения к API:', error.message);
    console.log('Убедитесь, что сервер запущен: pnpm dev');
    rl.close();
    return;
  }

  // Тест 2: Отправка кода верификации
  console.log('\n📱 Тест 2: Отправка кода верификации');
  
  const phoneNumber = await question('Введите номер телефона для тестирования: ');
  const telegramUserId = await question('Введите ваш Telegram User ID (или оставьте пустым): ') || 'test_user_id';

  try {
    const response = await fetch(`${API_BASE}/telegram-auth/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        telegramUserId
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Код верификации отправлен');
      console.log(`🆔 Code ID: ${data.codeId}`);
      console.log(`⏰ Истекает через: ${data.expiresIn} секунд`);
      
      // Тест 3: Проверка кода
      console.log('\n🔢 Тест 3: Проверка кода верификации');
      
      const code = await question('Введите код, который пришел в Telegram (или "test" для тестирования): ');
      
      if (code === 'test') {
        console.log('⚠️  Используется тестовый режим');
        console.log('В реальном приложении код должен прийти в Telegram');
      }

      const verifyResponse = await fetch(`${API_BASE}/telegram-auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeId: data.codeId,
          code: code,
          userInfo: {
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser'
          }
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        console.log('✅ Код верификации успешно проверен');
        console.log(`🎫 JWT Token: ${verifyData.token.substring(0, 50)}...`);
        console.log(`👤 User: ${JSON.stringify(verifyData.user, null, 2)}`);

        // Тест 4: Проверка авторизованного запроса
        console.log('\n🔐 Тест 4: Проверка авторизованного запроса');
        
        const meResponse = await fetch(`${API_BASE}/telegram-auth/me`, {
          headers: {
            'Authorization': `Bearer ${verifyData.token}`,
            'Content-Type': 'application/json'
          }
        });

        const meData = await meResponse.json();

        if (meData.success) {
          console.log('✅ Авторизованный запрос успешен');
          console.log(`👤 User data: ${JSON.stringify(meData.user, null, 2)}`);
        } else {
          console.log('❌ Ошибка авторизованного запроса:', meData.message);
        }

        // Тест 5: Обновление токена
        console.log('\n🔄 Тест 5: Обновление токена');
        
        const refreshResponse = await fetch(`${API_BASE}/telegram-auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${verifyData.token}`,
            'Content-Type': 'application/json'
          }
        });

        const refreshData = await refreshResponse.json();

        if (refreshData.success) {
          console.log('✅ Токен успешно обновлен');
          console.log(`🎫 New Token: ${refreshData.token.substring(0, 50)}...`);
        } else {
          console.log('❌ Ошибка обновления токена:', refreshData.message);
        }

      } else {
        console.log('❌ Ошибка проверки кода:', verifyData.message);
      }

    } else {
      console.log('❌ Ошибка отправки кода:', data.message);
    }

  } catch (error) {
    console.log('❌ Ошибка при тестировании:', error.message);
  }

  // Финальная статистика
  console.log('\n📊 Финальная статистика');
  try {
    const statsResponse = await fetch(`${API_BASE}/telegram-auth/stats`);
    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log(`📈 Активных кодов: ${statsData.stats.activeCodes}`);
      console.log(`👥 Всего пользователей: ${statsData.stats.totalUsers}`);
      console.log(`⏰ Истекших кодов: ${statsData.stats.expiredCodes}`);
    }
  } catch (error) {
    console.log('❌ Ошибка получения статистики:', error.message);
  }

  console.log('\n✅ Тестирование завершено');
  rl.close();
}

// Запускаем тестирование
testTelegramAuth().catch(console.error);
