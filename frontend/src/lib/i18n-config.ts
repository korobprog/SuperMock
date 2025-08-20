import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ruTranslations from '../locales/ru.json';
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';
import deTranslations from '../locales/de.json';
import frTranslations from '../locales/fr.json';
import zhTranslations from '../locales/zh.json';

const resources = {
  ru: {
    translation: ruTranslations,
  },
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
  de: {
    translation: deTranslations,
  },
  fr: {
    translation: frTranslations,
  },
  zh: {
    translation: zhTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    debug: false,

    detection: {
      // Определяем язык из localStorage, потом из Telegram, потом из браузера
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'Super Mock-language',
    },

    interpolation: {
      escapeValue: false,
    },

    // Настройка разделителей для вложенных ключей
    keySeparator: '.',
    nsSeparator: false,
  });

export default i18n;
