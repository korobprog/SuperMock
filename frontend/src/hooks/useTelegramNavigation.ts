import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Хук для правильной навигации в зависимости от контекста
 * В Telegram Mini Apps использует Telegram WebApp API
 * В веб-версии использует обычную навигацию React Router
 */
export function useTelegramNavigation() {
  const navigate = useNavigate();

  const isInTelegramMiniApps = !!window.Telegram?.WebApp;

  const navigateTo = useCallback((path: string, options?: {
    replace?: boolean;
    state?: any;
    openInNewTab?: boolean;
  }) => {
    if (isInTelegramMiniApps) {
      // В Telegram Mini Apps используем специальные методы
      const telegramWebApp = window.Telegram?.WebApp;
      
      if (telegramWebApp) {
        // Если нужно открыть в новой вкладке или это внешняя ссылка
        if (options?.openInNewTab || path.startsWith('http')) {
          // Используем window.open для внешних ссылок в Telegram Mini Apps
          window.open(path, '_blank');
        } else {
          // Для внутренних страниц используем обычную навигацию
          // но с проверкой на доступность
          try {
            if (options?.replace) {
              navigate(path, { replace: true, state: options.state });
            } else {
              navigate(path, { state: options.state });
            }
          } catch (error) {
            console.warn('Navigation failed, trying to open as link:', error);
            // Fallback: открываем как внешнюю ссылку
            window.open(`${window.location.origin}${path}`, '_blank');
          }
        }
      } else {
        // Fallback к обычной навигации
        if (options?.replace) {
          navigate(path, { replace: true, state: options.state });
        } else {
          navigate(path, { state: options.state });
        }
      }
    } else {
      // В веб-версии используем обычную навигацию
      if (options?.replace) {
        navigate(path, { replace: true, state: options.state });
      } else {
        navigate(path, { state: options.state });
      }
    }
  }, [navigate, isInTelegramMiniApps]);

  const goBack = useCallback(() => {
    if (isInTelegramMiniApps) {
      const telegramWebApp = window.Telegram?.WebApp;
      if (telegramWebApp && telegramWebApp.BackButton) {
        // Показываем кнопку "Назад" в Telegram Mini Apps
        telegramWebApp.BackButton.show();
        telegramWebApp.BackButton.onClick(() => {
          navigate(-1);
        });
      } else {
        // Fallback к обычной навигации назад
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [navigate, isInTelegramMiniApps]);

  const openExternalLink = useCallback((url: string) => {
    if (isInTelegramMiniApps) {
      // В Telegram Mini Apps используем window.open
      window.open(url, '_blank');
    } else {
      window.open(url, '_blank');
    }
  }, [isInTelegramMiniApps]);

  return {
    navigateTo,
    goBack,
    openExternalLink,
    isInTelegramMiniApps
  };
}
