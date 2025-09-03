import React, { useState, useEffect, useRef } from 'react';
import { TelegramUser } from '@/lib/telegram-auth';

interface TelegramWebAuthProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

export function TelegramWebAuth({ 
  botName, 
  onAuth, 
  className = '' 
}: TelegramWebAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Глобальная функция для callback'а от Telegram
    window.onTelegramAuth = (user: TelegramUser) => {
      console.log('🔧 TelegramWebAuth: Авторизация получена:', user);
      setIsLoading(false);
      onAuth(user);
    };

    // Очистка при размонтировании
    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [onAuth]);

  const handleAuth = () => {
    if (!containerRef.current) return;
    
    setIsLoading(true);
    setIframeLoaded(false);
    
    // Очищаем контейнер
    containerRef.current.innerHTML = '';
    
    // Создаем iframe с Telegram авторизацией в стиле easyoffer.ru
    const iframe = document.createElement('iframe');
    iframe.src = `https://oauth.telegram.org/embed/${botName}?origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(window.location.href)}&size=large&userpic=false&request_access=write&radius=8`;
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.backgroundColor = '#ffffff';
    
    // Обработчик загрузки iframe
    iframe.onload = () => {
      console.log('✅ Telegram auth iframe загружен');
      setIframeLoaded(true);
      setIsLoading(false);
    };
    
    // Обработчик ошибок
    iframe.onerror = () => {
      console.error('❌ Ошибка загрузки Telegram auth iframe');
      setIsLoading(false);
      setIframeLoaded(false);
    };
    
    // Добавляем iframe в контейнер
    containerRef.current.appendChild(iframe);
  };

  const handleRetry = () => {
    setIframeLoaded(false);
    handleAuth();
  };

  return (
    <div className={className}>
      {/* Кнопка для запуска авторизации */}
      {!iframeLoaded && (
        <button 
          onClick={handleAuth}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-[#0088cc] hover:bg-[#006fa0] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Загрузка...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="flex-shrink-0">
                <circle cx="120" cy="120" r="120" fill="#fff" />
                <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
                <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
                <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
              </svg>
              Войти через Telegram
            </>
          )}
        </button>
      )}
      
      {/* Контейнер для iframe */}
      <div 
        ref={containerRef} 
        className="mt-4 min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
      >
        {!iframeLoaded && !isLoading && (
          <div className="text-center text-gray-500">
            <p className="text-sm">Нажмите кнопку выше для авторизации</p>
          </div>
        )}
      </div>
      
      {/* Кнопка повтора если что-то пошло не так */}
      {iframeLoaded && (
        <div className="mt-3 text-center">
          <button 
            onClick={handleRetry}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Попробовать снова
          </button>
        </div>
      )}
      
      {/* Информация о том, как работает авторизация */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-blue-800 mb-2">
            🔐 Безопасная авторизация через Telegram
          </p>
          <p className="text-xs text-blue-600">
            Ваши данные защищены официальным API Telegram. 
            Мы не получаем доступ к вашему паролю или личным сообщениям.
          </p>
        </div>
      </div>
    </div>
  );
}
