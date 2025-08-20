// Совместимая обертка для старого API пока обновляем компоненты
import { useTranslation } from 'react-i18next';

export type Language = 'ru' | 'en' | 'es' | 'de' | 'fr' | 'zh';

// Legacy функция для поддержки старого API
export function t(key: string, lang: Language = 'ru'): string {
  // Это временная функция - компоненты должны использовать useTranslation хук
  console.warn(
    'Using legacy t() function. Please migrate to useTranslation hook.'
  );
  return key || '';
}

// Хук для использования в новых компонентах
export function useAppTranslation() {
  return useTranslation();
}
