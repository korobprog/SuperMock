import { useEffect, useState } from 'react';
import {
  setupTelegramFullscreen,
  isTelegramFullscreen,
  exitTelegramFullscreen,
  isFullscreenSupported,
  showAboutCompanyButton,
  hideAboutCompanyButton,
} from '@/lib/utils';

/**
 * Хук для автоматической настройки полноэкранного режима в Telegram Mini Apps
 * Используется в компонентах для автоматического разворачивания приложения
 *
 * @returns {Object} Объект с состоянием и функциями управления полноэкранным режимом
 */
export function useTelegramFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Проверяем поддержку полноэкранного режима
    const supported = isFullscreenSupported();
    setIsSupported(supported);

    // Настраиваем полноэкранный режим при монтировании
    setupTelegramFullscreen();

    // Проверяем начальное состояние
    setIsFullscreen(isTelegramFullscreen());

    // Добавляем обработчик изменений полноэкранного режима (только если поддерживается)
    if (supported) {
      const handleFullscreenChange = () => {
        setIsFullscreen(isTelegramFullscreen());
      };

      // Слушаем события изменения полноэкранного режима
      const tg = window.Telegram?.WebApp;
      if (tg?.onEvent) {
        tg.onEvent('fullscreenChanged', handleFullscreenChange);
      }

      return () => {
        // Очистка обработчиков при размонтировании
        if (tg?.offEvent) {
          tg.offEvent('fullscreenChanged', handleFullscreenChange);
        }
      };
    }
  }, []);

  return {
    isFullscreen,
    isSupported,
    exitFullscreen: exitTelegramFullscreen,
    showAboutCompany: showAboutCompanyButton,
    hideAboutCompany: hideAboutCompanyButton,
  };
}
