import { getTelegramWebApp } from './utils';

// Поддерживаемые языки приложения
export const SUPPORTED_LANGUAGES = [
  'ru',
  'en',
  'es',
  'de',
  'fr',
  'zh',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Определяет оптимальный язык для пользователя на основе разных источников
 * Приоритет:
 * 1. Сохраненный в localStorage
 * 2. Язык из Telegram WebApp
 * 3. Язык браузера (navigator.language)
 * 4. IP-адрес (если доступен API)
 * 5. Fallback на русский
 */
export async function detectUserLanguage(): Promise<SupportedLanguage> {
  console.log('🔍 Starting language detection...');

  // В dev режиме используем максимально быстрый fallback
  if (import.meta.env.DEV) {
    console.log('🔧 Dev mode detected, using instant fallback');
    
    // 1. Проверяем сохраненный язык
    const savedLanguage = localStorage.getItem('Super Mock-language');
    if (
      savedLanguage &&
      SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)
    ) {
      console.log('🔤 Language detected from localStorage in dev mode:', savedLanguage);
      return savedLanguage as SupportedLanguage;
    }
    
    // 2. Проверяем браузер
    const browserLang = getBrowserLanguage();
    if (browserLang) {
      console.log('🔤 Language detected from browser in dev mode:', browserLang);
      return browserLang;
    }
    
    // 3. Мгновенный fallback на русский
    console.log('🔤 Using instant fallback language in dev mode: ru');
    return 'ru';
  }

  // Production режим - полное определение языка
  // 1. Проверяем сохраненный язык
  const savedLanguage = localStorage.getItem('Super Mock-language');
  if (
    savedLanguage &&
    SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)
  ) {
    console.log('🔤 Language detected from localStorage:', savedLanguage);
    return savedLanguage as SupportedLanguage;
  }
  console.log('📭 No valid language found in localStorage');

  // 2. Проверяем Telegram WebApp
  const telegramLang = getTelegramLanguage();
  if (telegramLang) {
    console.log('🔤 Language detected from Telegram:', telegramLang);
    return telegramLang;
  }
  console.log('📱 No valid language found in Telegram WebApp');

  // 3. Проверяем браузер
  const browserLang = getBrowserLanguage();
  if (browserLang) {
    console.log('🔤 Language detected from browser:', browserLang);
    return browserLang;
  }
  console.log('🌐 No valid language found in browser settings');

  // 4. Пробуем IP-геолокацию (только в production)
  try {
    const ipLang = await getLanguageByIP();
    if (ipLang) {
      console.log('🔤 Language detected from IP:', ipLang);
      return ipLang;
    }
  } catch (error) {
    console.warn('Failed to detect language by IP:', error);
  }
  console.log('🌍 No valid language found via IP detection');

  // 5. Fallback на русский
  console.log('🔤 Using fallback language: ru');
  return 'ru';
}

/**
 * Получает язык из Telegram WebApp
 */
function getTelegramLanguage(): SupportedLanguage | null {
  try {
    const tg = getTelegramWebApp();
    const telegramLang = tg?.initDataUnsafe?.user?.language_code;

    if (!telegramLang) return null;

    // Сопоставляем коды языков Telegram с нашими
    const langMapping: { [key: string]: SupportedLanguage } = {
      ru: 'ru',
      en: 'en',
      es: 'es',
      de: 'de',
      fr: 'fr',
      zh: 'zh',
      'zh-cn': 'zh',
      'zh-tw': 'zh',
      'zh-hans': 'zh',
      'zh-hant': 'zh',
    };

    return langMapping[telegramLang.toLowerCase()] || null;
  } catch (error) {
    console.warn('Failed to get Telegram language:', error);
    return null;
  }
}

/**
 * Получает язык из настроек браузера
 */
function getBrowserLanguage(): SupportedLanguage | null {
  try {
    const browserLang = navigator.language || (navigator as any).languages?.[0];
    if (!browserLang) return null;

    console.log('🌐 Browser language detected:', browserLang);

    // Извлекаем основной код языка (до дефиса)
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Проверяем, поддерживается ли язык
    if (SUPPORTED_LANGUAGES.includes(langCode as SupportedLanguage)) {
      return langCode as SupportedLanguage;
    }

    return null;
  } catch (error) {
    console.warn('Failed to get browser language:', error);
    return null;
  }
}

/**
 * Получает язык на основе IP-адреса (необязательно)
 * Использует бесплатное API ipapi.co
 */
async function getLanguageByIP(): Promise<SupportedLanguage | null> {
  try {
    console.log('🌍 Attempting to detect language by IP...');

    // Создаем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

    try {
      // Используем бесплатное API для определения страны по IP
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Очищаем таймаут если запрос завершился успешно

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const countryCode = data.country_code?.toLowerCase();

      console.log('🌍 IP-based country detected:', countryCode);

      if (!countryCode) return null;

    // Сопоставляем коды стран с языками
    const countryToLanguage: { [key: string]: SupportedLanguage } = {
      // Русскоязычные страны
      ru: 'ru',
      by: 'ru',
      kz: 'ru',
      kg: 'ru',
      tj: 'ru',
      uz: 'ru',
      am: 'ru',
      az: 'ru',
      ge: 'ru',
      md: 'ru',

      // Англоязычные страны
      us: 'en',
      gb: 'en',
      ca: 'en',
      au: 'en',
      nz: 'en',
      ie: 'en',
      za: 'en',
      in: 'en',
      sg: 'en',
      my: 'en',
      ph: 'en',

      // Испаноязычные страны
      es: 'es',
      mx: 'es',
      ar: 'es',
      co: 'es',
      pe: 'es',
      ve: 'es',
      cl: 'es',
      ec: 'es',
      gt: 'es',
      cu: 'es',
      bo: 'es',
      do: 'es',
      hn: 'es',
      py: 'es',
      sv: 'es',
      ni: 'es',
      cr: 'es',
      pa: 'es',
      uy: 'es',
      gq: 'es',

      // Немецкоязычные страны
      de: 'de',
      at: 'de',
      li: 'de',

      // Франкоязычные страны
      fr: 'fr',
      be: 'fr',
      mc: 'fr',

      // Китайскоязычные страны/регионы
      cn: 'zh',
      tw: 'zh',
      hk: 'zh',
      mo: 'zh',
    };

          return countryToLanguage[countryCode] || null;
    } catch (fetchError) {
      clearTimeout(timeoutId); // Очищаем таймаут в случае ошибки
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn('IP language detection timed out after 5 seconds');
      } else {
        console.warn('Failed to get language by IP:', fetchError);
      }
      return null;
    }
  } catch (error) {
    console.warn('Failed to get language by IP:', error);
    return null;
  }
}

/**
 * Сохраняет выбранный язык и применяет его
 */
export function saveAndApplyLanguage(
  language: SupportedLanguage,
  i18n: any,
  setLanguage: (lang: string) => void
) {
  // Сохраняем в localStorage
  localStorage.setItem('Super Mock-language', language);

  // Применяем в i18n
  i18n.changeLanguage(language);

  // Сохраняем в store
  setLanguage(language);

  console.log('🔤 Language saved and applied:', language);
}

/**
 * Утилита для тестирования определения языка
 */
export async function testLanguageDetection() {
  console.log('🧪 Testing language detection...');

  // Очищаем localStorage для чистого теста
  localStorage.removeItem('Super Mock-language');

  const detected = await detectUserLanguage();
  console.log('🧪 Test result:', detected);

  return detected;
}
