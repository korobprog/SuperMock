import React, { useEffect, useState, useRef } from 'react';
import { useAppTranslation } from '@/lib/i18n';
import { TelegramLoginButtonComponent } from './telegram-login-button';
import { useAppStore } from '@/lib/store';

export function AuthRequiredMessage({ onAuth, className = '' }) {
  const { t } = useAppTranslation();
  const [isTelegramMiniApps, setIsTelegramMiniApps] = useState(false);
  const [miniAppUser, setMiniAppUser] = useState(null);
  const { telegramUser, userId } = useAppStore();
  const ref = useRef(null);

  useEffect(() => {
    // Проверяем, находимся ли мы в Telegram Mini Apps
    const checkTelegramMiniApps = () => {
      console.log('🔧 AuthRequiredMessage: Checking environment...');
      console.log('🔧 Window location:', window.location.href);
      console.log('🔧 User agent:', navigator.userAgent);
      
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('🔧 AuthRequiredMessage: Detected Telegram Mini Apps environment');
        console.log('🔧 WebApp initData:', tg.initData);
        console.log('🔧 WebApp initDataUnsafe:', tg.initDataUnsafe);
        console.log('🔧 WebApp version:', tg.version);
        console.log('🔧 WebApp platform:', tg.platform);
        
        setIsTelegramMiniApps(true);
        
        // Если пользователь уже авторизован в Mini Apps
        if (tg.initDataUnsafe?.user) {
          console.log('🔧 AuthRequiredMessage: User already authenticated in Mini Apps:', tg.initDataUnsafe.user);
          setMiniAppUser(tg.initDataUnsafe.user);
        }
      } else {
        console.log('🔧 AuthRequiredMessage: Not in Telegram Mini Apps environment');
        console.log('🔧 This is a regular web browser, will use Telegram Web Auth');
        setIsTelegramMiniApps(false);
      }
    };

    checkTelegramMiniApps();
  }, []);

  // Функция выхода для веб-версии
  const handleWebLogout = () => {
    console.log('🔧 AuthRequiredMessage: Web logout requested');
    // Очищаем данные пользователя
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('userId');
    // Перезагружаем страницу для сброса состояния
    window.location.reload();
  };

  // Если мы в Telegram Mini Apps, показываем специальный интерфейс
  if (isTelegramMiniApps) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Авторизация успешна!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Добро пожаловать, {miniAppUser.first_name}!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🚀 Добро пожаловать в SuperMock!
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Вы уже авторизованы в Telegram. Приложение автоматически загрузит ваши данные.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Для веб-версии используем новый компонент с react-telegram-login
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Войдите в аккаунт
        </h3>
        <p className="text-gray-600">
          Для продолжения необходимо авторизоваться через Telegram
        </p>
      </div>
      
      {/* Используем новый компонент с react-telegram-login */}
      <TelegramLoginButtonComponent
        botName="SuperMock_bot"
        onAuth={onAuth}
        user={telegramUser} // Передаем данные пользователя если он авторизован
        onLogout={handleWebLogout} // Передаем функцию выхода
        className="w-full"
      />
    </div>
  );
}
