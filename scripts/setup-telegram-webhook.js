#!/usr/bin/env node

/**
 * Скрипт для настройки webhook'а Telegram бота
 *
 * Использование:
 * node scripts/setup-telegram-webhook.js
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Загружаем переменные окружения
config();

async function setupWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const domain = process.env.DOMAIN || 'supermock.ru';

  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN не настроен в .env файле');
    process.exit(1);
  }

  console.log("🔧 Настройка webhook'а для Telegram бота...");
  console.log(`🌐 Домен: ${domain}`);
  console.log(`🤖 Токен бота: ${botToken.substring(0, 10)}...`);

  const webhookUrl = `https://${domain}/api/telegram-webhook`;

  try {
    // Устанавливаем webhook
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['callback_query', 'message'],
          drop_pending_updates: true,
        }),
      }
    );

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook успешно настроен!');
      console.log(`🔗 URL: ${webhookUrl}`);

      // Проверяем информацию о webhook'е
      const infoResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getWebhookInfo`
      );
      const infoData = await infoResponse.json();

      if (infoData.ok) {
        console.log("📊 Информация о webhook'е:");
        console.log(`   URL: ${infoData.result.url}`);
        console.log(
          `   Ожидающие обновления: ${infoData.result.pending_update_count}`
        );
        console.log(
          `   Последняя ошибка: ${infoData.result.last_error_message || 'Нет'}`
        );
      }
    } else {
      console.error("❌ Ошибка настройки webhook'а:", data.description);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Ошибка при настройке webhook'а:", error.message);
    process.exit(1);
  }
}

// Запускаем настройку
setupWebhook();
