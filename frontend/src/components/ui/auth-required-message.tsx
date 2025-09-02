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
  const [authStep, setAuthStep] = useState<'initial' | 'authing' | 'instructions' | 'success'>('initial');

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

  const handleTelegramAuth = async () => {
    try {
      setAuthStep('authing');
      console.log('🚀 Starting Telegram WebApp authorization...');
      
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        console.log('❌ Telegram WebApp not available');
        setAuthStep('initial');
        return;
      }

      // Получаем initDataRaw согласно документации Telegram Mini Apps
      const initDataRaw = tg.initData;
      console.log('🔑 initDataRaw:', initDataRaw);
      
      if (!initDataRaw) {
        console.log('⚠️ initData отсутствует, запрашиваем доступ к данным...');
        
        // Запрашиваем доступ к данным пользователя
        if ((tg as any).requestWriteAccess) {
          console.log('✅ Запрашиваем доступ через requestWriteAccess');
          (tg as any).requestWriteAccess();
        } else {
          console.log('⚠️ requestWriteAccess недоступен, открываем бота');
          if (tg.openTelegramLink) {
            tg.openTelegramLink(`https://t.me/${env.TELEGRAM_BOT_NAME || 'SuperMock_bot'}?start=auth`);
          } else {
            window.open(`https://t.me/${env.TELEGRAM_BOT_NAME || 'SuperMock_bot'}?start=auth`, '_blank');
          }
        }
        
        // Показываем инструкции пользователю
        setAuthStep('instructions');
        
        // Проверяем авторизацию через интервалы
        const checkAuth = setInterval(() => {
          const currentTg = window.Telegram?.WebApp;
          if (currentTg?.initData) {
            console.log('✅ initData получен после запроса доступа:', currentTg.initData);
            clearInterval(checkAuth);
            // Повторно вызываем авторизацию с полученными данными
            handleTelegramAuth();
          }
        }, 2000);
        
        // Останавливаем проверку через 30 секунд
        setTimeout(() => {
          clearInterval(checkAuth);
          if (authStep === 'instructions') {
            console.log('⏰ Auth timeout, resetting to initial state');
            setAuthStep('initial');
          }
        }, 30000);
        
        return;
      }

      // Отправляем initDataRaw на сервер согласно документации
      console.log('📤 Отправляем initDataRaw на сервер для авторизации...');
      
      const response = await fetch('/api/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `tma ${initDataRaw}` // Правильный заголовок согласно документации
        },
        body: JSON.stringify({
          language: 'ru',
          initData: initDataRaw
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Сервер успешно авторизовал пользователя:', data);
      
      if (data.user) {
        // Используем данные от сервера
        onAuth({
          id: data.user.id,
          first_name: data.user.first_name,
          last_name: data.user.last_name || '',
          username: data.user.username || '',
          photo_url: data.user.photo_url || '',
          auth_date: Math.floor(Date.now() / 1000),
          hash: data.user.hash || 'telegram_mini_apps_hash',
        });
      } else if (tg.initDataUnsafe?.user) {
        // Fallback на данные из WebApp
        const user = tg.initDataUnsafe.user;
        onAuth({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name || '',
          username: user.username || '',
          photo_url: user.photo_url || '',
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'telegram_mini_apps_hash',
        });
      }
      
      setAuthStep('success');
      
    } catch (error) {
      console.error('❌ Ошибка авторизации:', error);
      
      // Fallback: используем данные из WebApp если сервер недоступен
      const tg = window.Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        console.log('🔄 Используем fallback авторизацию через WebApp');
        const user = tg.initDataUnsafe.user;
        onAuth({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name || '',
          username: user.username || '',
          photo_url: user.photo_url || '',
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'telegram_mini_apps_hash',
        });
        setAuthStep('success');
      } else {
        console.log('❌ Fallback авторизация не удалась');
        setAuthStep('initial');
      }
    }
  };

  // Если пользователь уже авторизован, не показываем компонент
  if (telegramUser || (userId && userId > 0)) {
    return null;
  }

  // Отображение для разных состояний авторизации
  if (authStep === 'authing') {
    return (
      <div className={`${className}`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-800 font-medium">Авторизация в процессе...</span>
          </div>
          <p className="text-sm text-blue-600">Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  if (authStep === 'instructions') {
    return (
      <div className={`${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="text-yellow-600">
              <circle cx="120" cy="120" r="120" fill="#fff" />
              <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
              <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
              <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
            </svg>
            <span className="text-yellow-800 font-medium">Разрешите доступ к данным</span>
          </div>
          <p className="text-sm text-yellow-600 mb-3">
            В Telegram появится запрос на доступ к вашим данным. Нажмите "Разрешить" и вернитесь в приложение.
          </p>
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Ожидание разрешения...
          </div>
        </div>
      </div>
    );
  }

  if (authStep === 'success') {
    return (
      <div className={`${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-green-600">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">Авторизация успешна!</span>
          </div>
          <p className="text-sm text-green-600">Перенаправление...</p>
        </div>
      </div>
    );
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
            onClick={handleTelegramAuth}
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
                                    tg.openTelegramLink(`https://t.me/${env.TELEGRAM_BOT_NAME || 'SuperMock_bot'}?start=auth`);
              } else {
                window.open(`https://t.me/${env.TELEGRAM_BOT_NAME || 'SuperMock_bot'}?start=auth`, '_blank');
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
            botName="SuperMock_bot"
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
