import React, { useEffect, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  useEffect(() => {
    console.log('🔐 Initializing Telegram Login Widget...');
    console.log('🔐 Bot Username:', import.meta.env.VITE_TELEGRAM_BOT_NAME);
    console.log('🔐 Bot ID:', import.meta.env.VITE_TELEGRAM_BOT_ID);

    // Проверяем, загружен ли уже виджет
    if ((window as any).Telegram?.Login) {
      console.log('✅ Telegram Login Widget already loaded');
      setIsWidgetLoaded(true);
      return;
    }

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

    // Загружаем скрипт Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Telegram Login Widget script loaded');
      
      // Даем время скрипту инициализироваться
      setTimeout(() => {
        if ((window as any).Telegram?.Login) {
          console.log('✅ Telegram Login Widget initialized');
          setIsWidgetLoaded(true);
        } else {
          console.warn('⚠️ Telegram Login Widget not initialized after script load');
          setIsWidgetLoaded(false);
        }
      }, 1000);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Telegram Login Widget script');
      setIsWidgetLoaded(false);
    };

    document.head.appendChild(script);

    // Очистка при размонтировании
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any).onTelegramAuth;
    };
  }, [onAuth]);

  // Fallback кнопка если виджет не загрузился
  if (!isWidgetLoaded) {
    return (
      <Button
        onClick={() => {
          setIsLoading(true);
          
          // Альтернативный способ: открываем Telegram в новой вкладке
          const botUsername = import.meta.env.VITE_TELEGRAM_BOT_NAME;
          if (botUsername) {
            const telegramUrl = `https://t.me/${botUsername.replace('_bot', '')}`;
            console.log('🔐 Opening Telegram bot:', telegramUrl);
            
            const newWindow = window.open(telegramUrl, '_blank', 'noopener,noreferrer');
            if (newWindow) {
              newWindow.focus();
              // Показываем инструкцию пользователю
              alert('Откройте бота в Telegram и нажмите /start для авторизации. После этого вернитесь на сайт.');
            } else {
              // Если popup заблокирован, перенаправляем
              window.location.href = telegramUrl;
            }
          } else {
            // Если нет username, перезагружаем страницу
            window.location.reload();
          }
          
          setIsLoading(false);
        }}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={`bg-[#0088cc] hover:bg-[#006fa0] disabled:bg-gray-400 text-white ${className}`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Открытие Telegram...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="flex-shrink-0 mr-2">
              <circle cx="120" cy="120" r="120" fill="#fff" />
              <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
              <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
              <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
            </svg>
            Открыть в Telegram
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

  // Telegram Login Widget
  return (
    <div ref={containerRef} className={className}>
      <div 
        className="telegram-login-widget"
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
