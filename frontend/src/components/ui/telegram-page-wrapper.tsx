import React, { useEffect, useState } from 'react';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';

interface TelegramPageWrapperProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  className?: string;
}

/**
 * Компонент-обертка для правильного отображения страниц в Telegram Mini Apps
 * Обеспечивает корректную работу навигации и UI элементов
 */
export function TelegramPageWrapper({ 
  children, 
  title, 
  showBackButton = true,
  className = '' 
}: TelegramPageWrapperProps) {
  const { isInTelegramMiniApps, goBack } = useTelegramNavigation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isInTelegramMiniApps) {
      const telegramWebApp = window.Telegram?.WebApp;
      
      if (telegramWebApp) {
        // Настраиваем Telegram WebApp
        telegramWebApp.ready();
        
        // Устанавливаем заголовок страницы
        if (title) {
          telegramWebApp.setHeaderColor('#ffffff');
          telegramWebApp.setBackgroundColor('#ffffff');
        }

        // Настраиваем кнопку "Назад" если нужно
        if (showBackButton && telegramWebApp.BackButton) {
          telegramWebApp.BackButton.show();
          telegramWebApp.BackButton.onClick(() => {
            goBack();
          });
        } else if (telegramWebApp.BackButton) {
          telegramWebApp.BackButton.hide();
        }

        // Настраиваем главную кнопку если нужно
        if (telegramWebApp.MainButton) {
          telegramWebApp.MainButton.hide();
        }

        // Устанавливаем флаг готовности
        setIsReady(true);
      }
    } else {
      // В веб-версии сразу готовы
      setIsReady(true);
    }

    // Очистка при размонтировании
    return () => {
      if (isInTelegramMiniApps) {
        const telegramWebApp = window.Telegram?.WebApp;
        if (telegramWebApp?.BackButton) {
          telegramWebApp.BackButton.hide();
        }
        if (telegramWebApp?.MainButton) {
          telegramWebApp.MainButton.hide();
        }
      }
    };
  }, [isInTelegramMiniApps, title, showBackButton, goBack]);

  // Показываем загрузку пока Telegram WebApp не готов
  if (isInTelegramMiniApps && !isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {/* Заголовок для Telegram Mini Apps */}
      {isInTelegramMiniApps && title && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900 text-center">
            {title}
          </h1>
        </div>
      )}
      
      {/* Основной контент */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
