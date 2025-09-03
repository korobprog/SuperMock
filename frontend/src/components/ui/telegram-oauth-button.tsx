import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TelegramUser } from '@/lib/telegram-auth';

interface TelegramOAuthButtonProps {
  onAuth: (user: TelegramUser) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'lg';
}

export function TelegramOAuthButton({ 
  onAuth, 
  className = '',
  variant = 'default',
  size = 'lg'
}: TelegramOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthLogin = () => {
    setIsLoading(true);
    
    // Получаем bot username из переменных окружения
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_NAME;
    
    if (!botUsername) {
      console.error('❌ VITE_TELEGRAM_BOT_NAME не настроен в переменных окружения');
      console.error('❌ Все доступные env переменные:', import.meta.env);
      setIsLoading(false);
      return;
    }
    
    // Создаем стандартный Telegram Login Widget URL
    const widgetUrl = `https://oauth.telegram.org/auth?bot_id=${import.meta.env.VITE_TELEGRAM_BOT_ID}&origin=${encodeURIComponent(window.location.origin)}&request_access=write&return_to=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`;
    
    console.log('🔐 Opening Telegram Login Widget:', widgetUrl);
    console.log('🔐 Bot Username:', botUsername);
    console.log('🔐 Bot ID:', import.meta.env.VITE_TELEGRAM_BOT_ID);
    
    try {
      // Открываем в новой вкладке
      const newWindow = window.open(widgetUrl, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        // Проверяем, что окно открылось
        newWindow.focus();
        
        // Сбрасываем состояние загрузки
        setIsLoading(false);
        
        // Показываем уведомление пользователю
        console.log('✅ Telegram Login Widget opened successfully');
      } else {
        // Если popup заблокирован, используем fallback - перенаправление
        console.warn('Popup blocked, using redirect fallback');
        window.location.href = widgetUrl;
      }
    } catch (error) {
      console.error('Error opening Telegram Login Widget:', error);
      // Fallback к перенаправлению
      window.location.href = widgetUrl;
    }
  };

  return (
    <Button
      onClick={handleOAuthLogin}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`bg-[#0088cc] hover:bg-[#006fa0] disabled:bg-gray-400 text-white ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Перенаправление...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="flex-shrink-0 mr-2">
            <circle cx="120" cy="120" r="120" fill="#fff" />
            <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
            <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
            <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
          </svg>
          Войти через Telegram
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15,3 21,3 21,9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </>
      )}
    </Button>
  );
}
