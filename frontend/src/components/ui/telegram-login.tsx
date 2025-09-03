import React, { useEffect, useRef, useState } from 'react';
import { TelegramUser } from '@/lib/telegram-auth';

// Используем типы из @telegram-auth/react пакета

// Основной компонент для Telegram Mini Apps
export function TelegramLoginWidget({
  onAuth,
  className = '',
}: {
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkTelegramEnvironment = () => {
      const tg = window.Telegram?.WebApp;
      
      if (tg) {
        console.log('✅ Telegram WebApp detected');
        console.log('🔧 Version:', tg.version);
        console.log('🔧 Platform:', tg.platform);
        console.log('🔧 Init data:', tg.initData);
        console.log('🔧 Init data unsafe:', tg.initDataUnsafe);
        
        setIsInTelegram(true);
        
        // Если пользователь уже авторизован
        if (tg.initDataUnsafe?.user) {
          console.log('✅ User already authenticated:', tg.initDataUnsafe.user);
          const user = tg.initDataUnsafe.user;
          
          const telegramUser: TelegramUser = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name || '',
            username: user.username || '',
            photo_url: user.photo_url || '',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'telegram_mini_apps_hash',
          };
          
          // Сохраняем в localStorage
          localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
          console.log('✅ User saved to localStorage');
          
          // Вызываем callback
          onAuth(telegramUser);
        } else {
          console.log('ℹ️ User not authenticated in Mini Apps');
          setError('Для продолжения необходимо авторизоваться в Telegram');
        }
        
        // Готовим WebApp
        tg.ready();
        
        // Настраиваем основную кнопку
        if (tg.MainButton) {
          tg.MainButton.setText('Войти через Telegram');
          tg.MainButton.onClick(() => {
            handleTelegramAuth();
          });
          tg.MainButton.show();
        }
        
      } else {
        console.log('ℹ️ Not in Telegram environment');
        setIsInTelegram(false);
        setError('Этот компонент работает только в Telegram Mini Apps');
      }
    };

    checkTelegramEnvironment();
  }, [onAuth]);

  const handleTelegramAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tg = window.Telegram?.WebApp;
      
      if (!tg) {
        throw new Error('Telegram WebApp not available');
      }
      
      // Запрашиваем доступ к отправке сообщений
      // Note: requestWriteAccess is not available in current API
      console.log('🔐 Write access request not implemented in current API');
      
      // Открываем ссылку на бота
      const botUsername = import.meta.env.VITE_TELEGRAM_BOT_NAME;
      if (botUsername) {
        const botUrl = `https://t.me/${botUsername}?start=auth`;
        console.log('🔐 Opening bot URL:', botUrl);
        
        if (tg.openTelegramLink) {
          tg.openTelegramLink(botUrl);
        } else {
          // Fallback
          window.open(botUrl, '_blank');
        }
        
        // Показываем сообщение пользователю
        // Note: showAlert is not available in current API
        console.log('🔐 Please authorize in bot and return to app');
        
        // Ждем авторизации
        setTimeout(() => {
          checkAuthStatus();
        }, 3000);
        
      } else {
        throw new Error('Bot username not configured');
      }
      
    } catch (error) {
      console.error('❌ Error during Telegram auth:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = () => {
    const tg = window.Telegram?.WebApp;
    
    if (tg?.initDataUnsafe?.user) {
      console.log('✅ User authenticated after delay:', tg.initDataUnsafe.user);
      const user = tg.initDataUnsafe.user;
      
      const telegramUser: TelegramUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name || '',
        username: user.username || '',
        photo_url: user.photo_url || '',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'telegram_mini_apps_hash',
      };
      
      // Сохраняем в localStorage
      localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
      console.log('✅ User saved to localStorage after delay');
      
      // Вызываем callback
      onAuth(telegramUser);
      setError(null);
    } else {
      console.log('ℹ️ User still not authenticated');
      setError('Авторизация не завершена. Попробуйте еще раз.');
    }
  };

  if (!isInTelegram) {
    return (
      <div className={`text-center p-4 border border-gray-200 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-sm text-gray-600">
          Этот компонент работает только в Telegram Mini Apps
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-4 border border-red-200 bg-red-50 rounded-lg ${className}`}>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={handleTelegramAuth}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006fa0] disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Авторизация...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="flex-shrink-0">
                <circle cx="120" cy="120" r="120" fill="#fff" />
                <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
                <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
                <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
              </svg>
              <span>Войти через Telegram</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`text-center p-4 border border-green-200 bg-green-50 rounded-lg ${className}`}>
      <p className="text-sm text-green-600 mb-3">
        ✅ Авторизация в Telegram Mini Apps
      </p>
      <p className="text-xs text-green-500">
        Компонент готов к работе
      </p>
    </div>
  );
}

// Компонент для обычных веб-браузеров (fallback)
export function TelegramWebFallback({
  onAuth,
  className = '',
}: {
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const handleWebAuth = () => {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_NAME;
    
    if (botUsername) {
      const botUrl = `https://t.me/${botUsername}?start=auth`;
      console.log('🔐 Opening bot in browser:', botUrl);
      
      // Открываем бота в новой вкладке
      window.open(botUrl, '_blank');
      
      // Показываем инструкцию
      alert('Откройте бота в Telegram и нажмите /start для авторизации. После этого вернитесь на сайт.');
    } else {
      alert('Ошибка конфигурации: имя бота не найдено');
    }
  };

  return (
    <div className={`text-center p-4 border border-blue-200 bg-blue-50 rounded-lg ${className}`}>
      <p className="text-sm text-blue-600 mb-3">
        Для авторизации откройте бота в Telegram
      </p>
      <button
        onClick={handleWebAuth}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006fa0] text-white rounded-lg font-medium text-sm transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="flex-shrink-0">
          <circle cx="120" cy="120" r="120" fill="#fff" />
          <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
          <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
          <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
        </svg>
        <span>Открыть в Telegram</span>
      </button>
    </div>
  );
}

// Основной экспорт - автоматически выбирает правильный компонент
export function TelegramLogin({
  onAuth,
  className = '',
}: {
  onAuth: (user: TelegramUser) => void;
  className?: string;
}) {
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    // Проверяем, находимся ли мы в Telegram Mini Apps
    const tg = window.Telegram?.WebApp;
    setIsInTelegram(!!tg);
  }, []);

  if (isInTelegram) {
    return <TelegramLoginWidget onAuth={onAuth} className={className} />;
  } else {
    return <TelegramWebFallback onAuth={onAuth} className={className} />;
  }
}

// Экспортируем все компоненты для обратной совместимости
export { TelegramLoginWidget as TelegramProductionLogin };
