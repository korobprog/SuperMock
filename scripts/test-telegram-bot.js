#!/usr/bin/env node

/**
 * Скрипт для тестирования Telegram бота
 *
 * Использование:
 * node scripts/test-telegram-bot.js
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Загружаем переменные окружения
config();

async function testBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN не настроен в .env файле');
    process.exit(1);
  }

  console.log('🧪 Тестирование Telegram бота...');
  console.log(`🤖 Токен бота: ${botToken.substring(0, 10)}...`);

  try {
    // 1. Проверяем информацию о боте
    console.log('\n1️⃣ Проверка информации о боте...');
    const meResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    const meData = await meResponse.json();

    if (meData.ok) {
      console.log('✅ Бот доступен');
      console.log(`   Имя: ${meData.result.first_name}`);
      console.log(`   Username: @${meData.result.username}`);
      console.log(`   ID: ${meData.result.id}`);
    } else {
      console.error(
        '❌ Ошибка получения информации о боте:',
        meData.description
      );
      return;
    }

    // 2. Проверяем webhook
    console.log("\n2️⃣ Проверка webhook'а...");
    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    const webhookData = await webhookResponse.json();

    if (webhookData.ok) {
      if (webhookData.result.url) {
        console.log('✅ Webhook настроен');
        console.log(`   URL: ${webhookData.result.url}`);
        console.log(
          `   Ожидающие обновления: ${webhookData.result.pending_update_count}`
        );

        if (webhookData.result.last_error_message) {
          console.log(
            `   ⚠️ Последняя ошибка: ${webhookData.result.last_error_message}`
          );
        }
      } else {
        console.log('⚠️ Webhook не настроен');
      }
    } else {
      console.error(
        "❌ Ошибка получения информации о webhook'е:",
        webhookData.description
      );
    }

    // 3. Проверяем API эндпоинты (если сервер запущен)
    console.log('\n3️⃣ Проверка API эндпоинтов...');
    const baseUrl = process.env.API_URL || 'http://localhost:3001';

    try {
      const statusResponse = await fetch(`${baseUrl}/api/telegram-bot-status`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('✅ API эндпоинт /api/telegram-bot-status доступен');
        console.log(
          `   Статус: ${statusData.available ? 'Доступен' : 'Недоступен'}`
        );
        if (!statusData.available) {
          console.log(`   Причина: ${statusData.reason}`);
        }
      } else {
        console.log('⚠️ API эндпоинт недоступен (сервер не запущен?)');
      }
    } catch (error) {
      console.log('⚠️ API эндпоинт недоступен (сервер не запущен?)');
    }

    console.log('\n🎉 Тестирование завершено!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Убедитесь, что сервер запущен: pnpm run dev');
    console.log('2. Настройте webhook: pnpm run telegram:setup');
    console.log('3. Отправьте команду /start боту в Telegram');
    console.log('4. Проверьте работу кнопки START');
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    process.exit(1);
  }
}

// Запускаем тестирование
testBot();



