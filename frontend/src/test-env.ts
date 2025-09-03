// Тестовый файл для проверки переменных окружения
console.log('🔍 Проверка переменных окружения:');
console.log('VITE_TELEGRAM_BOT_ID:', import.meta.env.VITE_TELEGRAM_BOT_ID);
console.log('VITE_TELEGRAM_BOT_NAME:', import.meta.env.VITE_TELEGRAM_BOT_NAME);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

// Проверяем, что bot_id доступен
if (!import.meta.env.VITE_TELEGRAM_BOT_ID) {
  console.error('❌ VITE_TELEGRAM_BOT_ID не настроен!');
} else {
  console.log('✅ VITE_TELEGRAM_BOT_ID настроен:', import.meta.env.VITE_TELEGRAM_BOT_ID);
}
