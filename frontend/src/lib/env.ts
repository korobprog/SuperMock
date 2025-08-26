/**
 * Утилиты для работы с переменными окружения
 */

export const env = {
  // Telegram Bot
  TELEGRAM_BOT_NAME: import.meta.env.VITE_TELEGRAM_BOT_NAME,
  TELEGRAM_BOT_ID: import.meta.env.VITE_TELEGRAM_BOT_ID,

  // API
  API_URL: import.meta.env.VITE_API_URL,

  // WebRTC
  JITSI_URL: import.meta.env.VITE_JITSI_URL,
  STUN_URLS: import.meta.env.VITE_STUN_URLS,
  TURN_URL: import.meta.env.VITE_TURN_URL,
  TURN_USERNAME: import.meta.env.VITE_TURN_USERNAME,
  TURN_PASSWORD: import.meta.env.VITE_TURN_PASSWORD,

  // Environment
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  ENABLE_DEV_TEST_ACCOUNTS: import.meta.env.VITE_ENABLE_DEV_TEST_ACCOUNTS === 'true',
} as const;

/**
 * Проверяет наличие обязательных переменных окружения
 */
export function validateEnv() {
  const required = [
    'VITE_TELEGRAM_BOT_NAME',
    'VITE_TELEGRAM_BOT_ID',
    'VITE_API_URL',
  ] as const;

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }

  return true;
}

/**
 * Получает значение переменной окружения с проверкой
 */
export function getEnvVar(key: keyof ImportMetaEnv['env']): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}
