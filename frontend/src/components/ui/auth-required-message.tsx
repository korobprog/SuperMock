import React, { useEffect, useState } from 'react';
import { useAppTranslation } from '@/lib/i18n';
import { TelegramLoginWidget, TelegramWebLogin, TelegramProductionLogin } from './telegram-login';
import { env } from '@/lib/env';
import { TelegramUser } from '@/lib/telegram-auth';

interface AuthRequiredMessageProps {
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

export function AuthRequiredMessage({ onAuth, className = '' }: AuthRequiredMessageProps) {
  const { t } = useAppTranslation();
  const [isTelegramMiniApps, setIsTelegramMiniApps] = useState(false);
  const [miniAppUser, setMiniAppUser] = useState<any>(null);

  useEffect(() => {
    // Проверяем, находимся ли мы в Telegram Mini Apps
    const checkTelegramMiniApps = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('🔧 AuthRequiredMessage: Detected Telegram Mini Apps environment');
        console.log('🔧 WebApp initData:', tg.initData);
        console.log('🔧 WebApp initDataUnsafe:', tg.initDataUnsafe);
        
        setIsTelegramMiniApps(true);
        
        // Если пользователь уже авторизован в Mini Apps
        if (tg.initDataUnsafe?.user) {
          console.log('🔧 AuthRequiredMessage: User already authenticated in Mini Apps:', tg.initDataUnsafe.user);
          setMiniAppUser(tg.initDataUnsafe.user);
        }
      } else {
        console.log('🔧 AuthRequiredMessage: Not in Telegram Mini Apps environment');
        setIsTelegramMiniApps(false);
      }
    };

    checkTelegramMiniApps();
  }, []);

  // Обработчик авторизации для Mini Apps
  const handleMiniAppAuth = () => {
    if (miniAppUser) {
      console.log('🔧 AuthRequiredMessage: Processing Mini Apps user:', miniAppUser);
      
      // Преобразуем данные пользователя в нужный формат
      const telegramUser: TelegramUser = {
        id: miniAppUser.id,
        first_name: miniAppUser.first_name,
        last_name: miniAppUser.last_name || '',
        username: miniAppUser.username || '',
        photo_url: miniAppUser.photo_url || '',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'telegram_mini_apps_hash',
      };
      
      onAuth(telegramUser);
    } else {
      console.log('🔧 AuthRequiredMessage: No Mini Apps user data available');
      // Показываем сообщение о необходимости авторизации в Telegram
      if (window.Telegram?.WebApp?.MainButton) {
        // Используем MainButton для показа сообщения
        window.Telegram.WebApp.MainButton.setText('Авторизация недоступна');
        window.Telegram.WebApp.MainButton.show();
      }
    }
  };

  // Если мы в Telegram Mini Apps, показываем специальный интерфейс
  if (isTelegramMiniApps) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {miniAppUser ? 'Авторизация в Telegram Mini Apps' : 'Требуется авторизация'}
          </h3>
          <p className="text-blue-700 mb-4">
            {miniAppUser 
              ? `Добро пожаловать, ${miniAppUser.first_name}!`
              : 'Для доступа к платформе необходимо авторизоваться в Telegram Mini Apps'
            }
          </p>
        </div>
        
        {miniAppUser ? (
          <button
            onClick={handleMiniAppAuth}
            className="w-full bg-[#0088cc] hover:bg-[#006fa0] text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Продолжить
          </button>
        ) : (
          // В Telegram Mini Apps показываем кнопку для авторизации
          <div className="space-y-3">
            <p className="text-sm text-blue-600 p-3 bg-blue-100 rounded border">
              Для продолжения необходимо авторизоваться в Telegram
            </p>
            {env.TELEGRAM_BOT_NAME ? (
              <TelegramProductionLogin
                botName={env.TELEGRAM_BOT_NAME}
                onAuth={onAuth}
                className="w-full"
              />
            ) : (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded border">
                Ошибка: VITE_TELEGRAM_BOT_NAME не настроен в переменных окружения
                <br />
                <small>Текущее значение: {String(env.TELEGRAM_BOT_NAME)}</small>
              </div>
            )}
          </div>
        )}
        
        <p className="text-xs text-blue-600 mt-3">
          Авторизация через Telegram обеспечивает безопасный доступ к вашим данным
        </p>
      </div>
    );
  }

  // Для обычного браузера показываем стандартную кнопку авторизации
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
      <div className="mb-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Требуется авторизация
        </h3>
        <p className="text-blue-700 mb-4">
          Для доступа к платформе необходимо войти через Telegram
        </p>
      </div>
      
      {env.TELEGRAM_BOT_NAME ? (
        // В продакшене используем веб-версию для лучшей совместимости
        import.meta.env.PROD ? (
          <TelegramProductionLogin
            botName={env.TELEGRAM_BOT_NAME}
            onAuth={onAuth}
            className="w-full"
          />
        ) : (
          // В dev режиме используем обычный виджет
          <TelegramLoginWidget
            botName={env.TELEGRAM_BOT_NAME}
            onAuth={onAuth}
            className="w-full"
          />
        )
      ) : (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded border">
          Ошибка: VITE_TELEGRAM_BOT_NAME не настроен в переменных окружения
        </div>
      )}
      
      <p className="text-xs text-blue-600 mt-3">
        Авторизация через Telegram обеспечивает безопасный доступ к вашим данным
      </p>
    </div>
  );
}
