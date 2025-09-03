import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { TelegramUser } from '@/lib/telegram-auth';

/**
 * Хук для отслеживания OAuth авторизации через localStorage
 * Полезно когда OAuth открывается в новой вкладке
 */
export function useOAuthListener() {
  const { setTelegramUser, setUserId } = useAppStore();

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === 'telegram_oauth_data' && event.newValue) {
      try {
        const oauthData = JSON.parse(event.newValue);
        console.log('🔐 OAuth data received from storage:', oauthData);
        
        if (oauthData.user && oauthData.success) {
          // Устанавливаем пользователя в store
          setTelegramUser(oauthData.user);
          if (oauthData.userId) {
            setUserId(oauthData.userId);
          }
          
          // Очищаем данные из localStorage
          localStorage.removeItem('telegram_oauth_data');
          
          console.log('✅ User authenticated via OAuth storage listener');
        }
      } catch (error) {
        console.error('Error parsing OAuth data from storage:', error);
      }
    }
  }, [setTelegramUser, setUserId]);

  useEffect(() => {
    // Слушаем изменения в localStorage (для cross-tab communication)
    window.addEventListener('storage', handleStorageChange);
    
    // Также проверяем localStorage при монтировании компонента
    const checkExistingOAuth = () => {
      const oauthData = localStorage.getItem('telegram_oauth_data');
      if (oauthData) {
        try {
          const data = JSON.parse(oauthData);
          if (data.user && data.success) {
            setTelegramUser(data.user);
            if (data.userId) {
              setUserId(data.userId);
            }
            localStorage.removeItem('telegram_oauth_data');
            console.log('✅ User authenticated via existing OAuth data');
          }
        } catch (error) {
          console.error('Error parsing existing OAuth data:', error);
        }
      }
    };
    
    checkExistingOAuth();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange, setTelegramUser, setUserId]);
}
