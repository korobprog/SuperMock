import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TelegramUser } from '@/lib/telegram-auth';

interface TelegramOAuthButtonProps {
  onAuth: (user: TelegramUser) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function TelegramOAuthButton({ 
  onAuth, 
  className = '',
  variant = 'default',
  size = 'md'
}: TelegramOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthLogin = () => {
    setIsLoading(true);
    
    // Параметры для OAuth
    const botId = import.meta.env.VITE_TELEGRAM_BOT_ID || '6288428793';
    const origin = encodeURIComponent(window.location.origin);
    const returnTo = encodeURIComponent(`${window.location.origin}/auth/callback`);
    
    // Создаем OAuth URL
    const oauthUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}&request_access=write&return_to=${returnTo}`;
    
    console.log('🔐 Redirecting to Telegram OAuth:', oauthUrl);
    
    // Перенаправляем на Telegram OAuth
    window.location.href = oauthUrl;
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
        </>
      )}
    </Button>
  );
}
