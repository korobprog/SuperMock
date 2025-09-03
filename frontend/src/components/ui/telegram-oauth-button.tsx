import React, { useEffect, useRef } from 'react';
import { TelegramUser } from '@/lib/telegram-auth';

interface TelegramOAuthButtonProps {
  onAuth: (user: TelegramUser) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'lg';
}

export function TelegramOAuthButton({ 
  onAuth, 
  className = ''
}: TelegramOAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🔐 Initializing Telegram Login Widget...');
    console.log('🔐 Bot Username:', import.meta.env.VITE_TELEGRAM_BOT_NAME);
    console.log('🔐 Bot ID:', import.meta.env.VITE_TELEGRAM_BOT_ID);

    // Глобальная функция для callback от Telegram
    (window as any).onTelegramAuth = (user: any) => {
      console.log('🔐 Telegram Login Widget callback received:', user);
      
      if (user && user.id) {
        // Преобразуем данные в наш формат
        const telegramUser: TelegramUser = {
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          username: user.username || '',
          photo_url: user.photo_url || '',
          auth_date: user.auth_date || Math.floor(Date.now() / 1000),
          hash: user.hash || ''
        };
        
        console.log('🔐 Processed Telegram user:', telegramUser);
        
        // Отправляем данные на backend для валидации
        fetch('/api/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tg: telegramUser,
            language: 'ru',
            initData: 'telegram_login_widget'
          })
        })
        .then(response => response.json())
        .then(data => {
          console.log('✅ User initialized in backend:', data);
          onAuth(telegramUser);
        })
        .catch(error => {
          console.error('❌ Error initializing user in backend:', error);
          // Продолжаем даже при ошибке backend
          onAuth(telegramUser);
        });
      } else {
        console.error('❌ Invalid user data from Telegram:', user);
      }
    };

    // Очистка при размонтировании
    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [onAuth]);

  return (
    <div ref={containerRef} className={className}>
      {/* Telegram Login Widget - встраивается автоматически */}
      <script
        async
        src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login={import.meta.env.VITE_TELEGRAM_BOT_NAME || ''}
        data-size="large"
        data-radius="8"
        data-request-access="write"
        data-userpic="true"
        data-lang="ru"
        data-onauth="onTelegramAuth(user)"
      />
    </div>
  );
}
