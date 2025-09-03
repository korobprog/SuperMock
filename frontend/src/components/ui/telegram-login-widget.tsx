import React, { useEffect, useRef, useState } from 'react';

// Интерфейс для данных пользователя Telegram
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Пропсы для компонента
interface TelegramLoginWidgetProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  onError?: (error: string) => void;
  className?: string;
  dataOnauth?: string;
  requestAccess?: boolean;
  usePic?: boolean;
  cornerRadius?: number;
  lang?: string;
}

/**
 * Telegram Login Widget - официальный виджет для авторизации через Telegram
 * Документация: https://core.telegram.org/widgets/login
 */
export function TelegramLoginWidget({
  botName,
  onAuth,
  onError,
  className = '',
  dataOnauth = '/auth/telegram/callback', // Fixed: Use relative path to match backend
  requestAccess = true,
  usePic = true,
  cornerRadius = 8,
  lang = 'ru'
}: TelegramLoginWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔧 TelegramLoginWidget: Initializing with bot:', botName);
    
    // Проверяем, не загружен ли уже скрипт
    if ((window as any).TelegramLoginWidget) {
      console.log('✅ Telegram widget script already loaded');
      setIsLoading(false);
      return;
    }

    // Проверяем, не загружается ли уже скрипт
    if (document.querySelector('script[src*="telegram-widget.js"]')) {
      console.log('⏳ Telegram widget script already loading...');
      return;
    }

    console.log('📥 Loading Telegram widget script...');
    
    // Загружаем Telegram Login Widget скрипт
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    
    // Устанавливаем атрибуты для виджета
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', dataOnauth);
    script.setAttribute('data-request-access', requestAccess ? 'write' : 'read');
    script.setAttribute('data-use-pic', usePic ? 'true' : 'false');
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-lang', lang);
    
    // Обработчик успешной загрузки
    script.onload = () => {
      console.log('✅ Telegram widget script loaded successfully');
      console.log('🔧 Widget attributes:', {
        botName,
        dataOnauth,
        requestAccess,
        usePic,
        cornerRadius,
        lang
      });
      setIsLoading(false);
      setLoadError(null);
      
      // Устанавливаем глобальный обработчик для callback
      (window as any).onTelegramAuth = (user: TelegramUser) => {
        console.log('✅ Telegram auth successful:', user);
        onAuth(user);
      };
    };

    // Обработчик ошибки загрузки
    script.onerror = () => {
      const errorMsg = 'Ошибка загрузки Telegram Login Widget';
      console.error('❌ Telegram widget script load error');
      setIsLoading(false);
      setLoadError(errorMsg);
      onError?.(errorMsg);
    };

    // Добавляем скрипт в DOM
    if (widgetRef.current) {
      widgetRef.current.appendChild(script);
      console.log('📎 Script appended to DOM');
    } else {
      console.error('❌ Widget ref not available');
    }

    // Очистка при размонтировании
    return () => {
      console.log('🧹 Cleaning up Telegram widget');
      if (widgetRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Удаляем глобальный обработчик
      delete (window as any).onTelegramAuth;
    };
  }, [botName, dataOnauth, requestAccess, usePic, cornerRadius, lang, onAuth, onError]);

  // Показываем ошибку загрузки
  if (loadError) {
    return (
      <div className={`telegram-login-widget-error ${className}`}>
        <div className="flex items-center justify-center p-4 text-red-600 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium mb-2">Ошибка загрузки виджета</div>
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs text-blue-600 hover:underline"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={widgetRef} 
      className={`telegram-login-widget ${className}`}
      style={{ minHeight: '40px' }}
    >
      {/* Показываем загрузку пока скрипт не загрузился */}
      {isLoading && (
        <div className="flex items-center justify-center p-4 text-gray-500">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full mb-2"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Альтернативная реализация с iframe для случаев, когда скрипт не работает
 */
export function TelegramLoginWidgetFallback({
  botName,
  onAuth,
  onError,
  className = '',
  dataOnauth = 'https://app.supermock.ru/auth/callback',
  requestAccess = true,
  usePic = true,
  cornerRadius = 8,
  lang = 'ru'
}: TelegramLoginWidgetProps) {
  const iframeUrl = `https://oauth.telegram.org/auth?bot_id=${botName}&origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(dataOnauth)}&request_access=${requestAccess ? 'write' : 'read'}&use_pic=${usePic ? '1' : '0'}&radius=${cornerRadius}&lang=${lang}`;

  return (
    <div className={`telegram-login-widget-fallback ${className}`}>
      <iframe
        src={iframeUrl}
        width="300"
        height="40"
        frameBorder="0"
        scrolling="no"
        title="Telegram Login"
        className="border-0 rounded-lg"
      />
    </div>
  );
}

/**
 * Основной компонент с автоматическим fallback
 */
export function TelegramLoginWidgetMain(props: TelegramLoginWidgetProps) {
  const [useFallback, setUseFallback] = React.useState(false);

  React.useEffect(() => {
    // Проверяем, поддерживается ли Telegram Login Widget
    const checkSupport = () => {
      const testScript = document.createElement('script');
      testScript.src = 'https://telegram.org/js/telegram-widget.js?22';
      testScript.onload = () => setUseFallback(false);
      testScript.onerror = () => setUseFallback(true);
      
      // Удаляем тестовый скрипт
      setTimeout(() => {
        if (testScript.parentNode) {
          testScript.parentNode.removeChild(testScript);
        }
      }, 1000);
    };

    checkSupport();
  }, []);

  if (useFallback) {
    return <TelegramLoginWidgetFallback {...props} />;
  }

  return <TelegramLoginWidget {...props} />;
}

export default TelegramLoginWidgetMain;
