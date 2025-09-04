import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт переводов
import en from './locales/en.json';
import ru from './locales/ru.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';

const resources = {
  en: {
    translation: en
  },
  ru: {
    translation: ru
  },
  es: {
    translation: es
  },
  fr: {
    translation: fr
  },
  de: {
    translation: de
  },
  zh: {
    translation: zh
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React уже экранирует значения
    },
    
    detection: {
      // Порядок определения языка
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Ключ для localStorage
      lookupLocalStorage: 'i18nextLng',
      
      // Кэширование
      caches: ['localStorage'],
      
      // Не добавлять суффикс к URL
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
    },
    
    // Настройки для разных языков
    supportedLngs: ['en', 'ru', 'es', 'fr', 'de', 'zh'],
    
    // Загрузка переводов
    load: 'languageOnly',
    
    // Настройки для отладки
    react: {
      useSuspense: false,
    }
  });

// Добавляем обработчики событий для отладки
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
});

i18n.on('loaded', (loaded) => {
  console.log('i18n resources loaded:', loaded);
});

i18n.on('failedLoading', (lng, ns, msg) => {
  console.error('Failed to load i18n resource:', lng, ns, msg);
});

export default i18n;

