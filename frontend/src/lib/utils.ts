import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

// Telegram WebApp API types
interface TelegramWebAppAPI {
  initDataUnsafe?: {
    user?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      language_code?: string;
      photo_url?: string;
    };
  };
  initData?: string;
  expand?: () => void;
  ready?: () => void;
  setHeaderColor?: (color: string) => void;
  setThemeParams?: (params: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  }) => void;
  themeParams?: Record<string, unknown>;
  // Новые методы полноэкранного режима (Bot API 8.0+)
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  version?: string;
  onEvent?: (eventType: string, callback: (event?: unknown) => void) => void;
  offEvent?: (eventType: string, callback: (event?: unknown) => void) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  MainButton?: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
}

// Type assertion for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppAPI;
    };
  }
}

export type TelegramWebApp = TelegramWebAppAPI;

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

// Проверяет, запущено ли приложение в Telegram
export function isRunningInTelegram(): boolean {
  return getTelegramWebApp() !== null;
}

// Получает theme данные из Telegram
export function getTelegramTheme() {
  const tg = getTelegramWebApp();
  return tg?.themeParams ?? null;
}

// Устанавливает заголовок приложения в Telegram
export function setTelegramHeaderColor(color: string) {
  const tg = getTelegramWebApp();
  if (tg?.setHeaderColor) {
    tg.setHeaderColor(color);
  }
}

// Показывает кнопку "Назад" в Telegram
export function showTelegramBackButton(callback?: () => void) {
  const tg = getTelegramWebApp();
  if (tg?.BackButton) {
    tg.BackButton.show();
    if (callback) {
      tg.BackButton.onClick(callback);
    }
  }
}

// Скрывает кнопку "Назад" в Telegram
export function hideTelegramBackButton() {
  const tg = getTelegramWebApp();
  if (tg?.BackButton) {
    tg.BackButton.hide();
  }
}

// Показывает главную кнопку в Telegram
export function showTelegramMainButton(text: string, callback?: () => void) {
  const tg = getTelegramWebApp();
  if (tg?.MainButton) {
    const mainButton = tg.MainButton;
    mainButton.setText(text);
    mainButton.show();
    if (callback) {
      mainButton.onClick(callback);
    }
  }
}

// Скрывает главную кнопку в Telegram
export function hideTelegramMainButton() {
  const tg = getTelegramWebApp();
  if (tg?.MainButton) {
    tg.MainButton.hide();
  }
}

// Настраивает полноэкранный режим в Telegram Mini Apps
export function setupTelegramFullscreen() {
  const tg = getTelegramWebApp();
  if (tg) {
    // Говорим Telegram, что приложение готово
    tg.ready?.();

    // Сначала разворачиваем на максимальную высоту (старый API)
    tg.expand?.();

    // Проверяем версию Telegram WebApp для поддержки полноэкранного режима
    const version = tg.version || '6.0';
    const majorVersion = parseInt(version.split('.')[0]);

    console.log(`📱 Telegram WebApp версия: ${version}`);

    // Полноэкранный режим поддерживается только в Bot API 8.0+ (версия 8.0+)
    if (majorVersion >= 8 && tg.requestFullscreen) {
      try {
        console.log('🔄 Запрос полноэкранного режима...');
        tg.requestFullscreen();
      } catch (error) {
        console.warn('⚠️ Ошибка при запросе полноэкранного режима:', error);
        console.log('ℹ️ Используется только развернутый режим (expand)');
      }
    } else {
      console.log(
        `ℹ️ Полноэкранный режим не поддерживается в версии ${version}`
      );
      console.log('ℹ️ Используется только развернутый режим (expand)');
    }

    // Настраиваем тему
    if (tg.setThemeParams) {
      tg.setThemeParams({
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff',
      });
    }

    // Добавляем обработчики событий полноэкранного режима (только для поддерживаемых версий)
    if (majorVersion >= 8 && tg.onEvent) {
      tg.onEvent('fullscreenChanged', () => {
        console.log('🔄 Полноэкранный режим изменился:', tg.isFullscreen);
      });

      tg.onEvent('fullscreenFailed', (event: unknown) => {
        const errorEvent = event as { error?: string };
        console.warn('⚠️ Ошибка полноэкранного режима:', errorEvent?.error);
      });
    }

    console.log('✅ Telegram Mini Apps настроен');
  }
}

// Выход из полноэкранного режима в Telegram Mini Apps
export function exitTelegramFullscreen() {
  const tg = getTelegramWebApp();
  if (tg?.exitFullscreen) {
    try {
      tg.exitFullscreen();
      console.log('🔄 Выход из полноэкранного режима Telegram Mini Apps');
    } catch (error) {
      console.warn('⚠️ Ошибка при выходе из полноэкранного режима:', error);
    }
  } else {
    console.log(
      'ℹ️ Метод exitFullscreen не поддерживается в данной версии Telegram'
    );
  }
}

// Проверка, находится ли приложение в полноэкранном режиме
export function isTelegramFullscreen(): boolean {
  const tg = getTelegramWebApp();
  return tg?.isFullscreen ?? false;
}

// Проверка поддержки полноэкранного режима
export function isFullscreenSupported(): boolean {
  const tg = getTelegramWebApp();
  if (!tg) return false;

  const version = tg.version || '6.0';
  const majorVersion = parseInt(version.split('.')[0]);

  return majorVersion >= 8 && !!tg.requestFullscreen;
}

export function toUtcIso(
  localDateTime: string,
  tzOffsetMinutes?: number
): string {
  const date = new Date(localDateTime);
  if (!Number.isFinite(date.getTime())) return localDateTime;
  const offset = tzOffsetMinutes ?? -date.getTimezoneOffset();
  const utcMs = date.getTime() - offset * 60 * 1000;
  return new Date(utcMs).toISOString();
}
