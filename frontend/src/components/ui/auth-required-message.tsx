import React, { useEffect, useState } from 'react';
import { useAppTranslation } from '@/lib/i18n';
import { TelegramLoginWidget, TelegramWebLogin, TelegramProductionLogin } from './telegram-login';
import { env } from '@/lib/env';
import { TelegramUser } from '@/lib/telegram-auth';
import { useAppStore } from '@/lib/store';

interface AuthRequiredMessageProps {
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

export function AuthRequiredMessage({ onAuth, className = '' }: AuthRequiredMessageProps) {
  const { t } = useAppTranslation();
  const [isTelegramMiniApps, setIsTelegramMiniApps] = useState(false);
  const [miniAppUser, setMiniAppUser] = useState<any>(null);
  const { telegramUser, userId } = useAppStore();

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

  // Если пользователь уже авторизован, не показываем блок авторизации
  if (telegramUser || (userId && userId > 0)) {
    return null;
  }

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
            
            {/* Кнопка авторизации через Telegram WebApp */}
            <button
              onClick={() => {
                const tg = window.Telegram?.WebApp;
                if (!tg) {
                  alert('Telegram WebApp не доступен');
                  return;
                }
                
                // В продакшн версии сначала запрашиваем доступ к данным
                if (tg.initDataUnsafe?.user) {
                  console.log('✅ User already authenticated:', tg.initDataUnsafe.user);
                  // Пользователь уже авторизован, вызываем callback
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
                  onAuth(telegramUser);
                  return;
                }
                
                // Запрашиваем доступ к данным пользователя
                if ((tg as any).requestWriteAccess) {
                  console.log('🔐 Requesting write access...');
                  (tg as any).requestWriteAccess();
                  
                  // Показываем инструкции пользователю
                  alert('Пожалуйста, разрешите доступ к данным в Telegram и вернитесь в приложение');
                  
                  // Проверяем авторизацию через интервалы
                  const checkAuth = setInterval(() => {
                    const currentTg = window.Telegram?.WebApp;
                    if (currentTg?.initDataUnsafe?.user) {
                      console.log('✅ User authenticated after write access:', currentTg.initDataUnsafe.user);
                      clearInterval(checkAuth);
                      
                      const user = currentTg.initDataUnsafe.user;
                      const telegramUser: TelegramUser = {
                        id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name || '',
                        username: user.username || '',
                        photo_url: user.photo_url || '',
                        auth_date: Math.floor(Date.now() / 1000),
                        hash: 'telegram_mini_apps_hash',
                      };
                      
                      onAuth(telegramUser);
                    }
                  }, 1000);
                  
                  // Останавливаем проверку через 30 секунд
                  setTimeout(() => {
                    clearInterval(checkAuth);
                  }, 30000);
                  
                } else {
                  // Fallback: открываем бота
                  if (tg.openTelegramLink) {
                    tg.openTelegramLink(`https://t.me/${env.TELEGRAM_BOT_NAME || 'supermock_ai_bot'}?start=auth`);
                  } else {
                    window.open(`https://t.me/${env.TELEGRAM_BOT_NAME || 'supermock_ai_bot'}?start=auth`, '_blank');
                  }
                }
              }}
              className="w-full bg-[#0088cc] hover:bg-[#006fa0] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor">
                <circle cx="120" cy="120" r="120" fill="#fff" />
                <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
                <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
                <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
              </svg>
              <span>Авторизоваться через Telegram</span>
            </button>
            
            {env.TELEGRAM_BOT_NAME ? (
              <TelegramLoginWidget
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
        // Всегда используем обычный виджет для веб-авторизации
        <TelegramLoginWidget
          botName={env.TELEGRAM_BOT_NAME}
          onAuth={onAuth}
          className="w-full"
        />
      ) : (
        // Fallback для продакшена когда переменные окружения не настроены
        import.meta.env.PROD ? (
          <TelegramLoginWidget
            botName="supermock_ai_bot"
            onAuth={onAuth}
            className="w-full"
          />
        ) : (
          <div className="text-sm text-red-500 p-3 bg-red-50 rounded border">
            Ошибка: VITE_TELEGRAM_BOT_NAME не настроен в переменных окружения
          </div>
        )
      )}
      
      <p className="text-xs text-blue-600 mt-3">
        Авторизация через Telegram обеспечивает безопасный доступ к вашим данным
      </p>
    </div>
  );
}
