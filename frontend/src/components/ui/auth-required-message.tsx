import React, { useEffect, useState, useRef } from 'react';
import { useAppTranslation } from '@/lib/i18n';
import { TelegramLoginWidget, TelegramWebLogin, TelegramProductionLogin } from './telegram-login';
import { TelegramWebAuth } from './telegram-web-auth';
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
  const [isWebAuth, setIsWebAuth] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
            setAuthStep('initial');
          }
        }, 30000);
        
        return;
      }

      // Если есть initData, обрабатываем авторизацию
      console.log('✅ initData получен, обрабатываем авторизацию...');
      
      // Здесь должна быть логика обработки initData
      // В реальном приложении нужно отправить данные на сервер для валидации
      
      setAuthStep('success');
      console.log('✅ Авторизация в Telegram Mini Apps успешна');
      
    } catch (error) {
      console.error('❌ Ошибка авторизации в Telegram Mini Apps:', error);
      setAuthStep('initial');
    }
  };

  const handleWebAuth = () => {
    console.log('🌐 Starting web Telegram authorization...');
    setAuthStep('authing');
    setIsWebAuth(true);
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
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('✅ User already authenticated in Mini Apps');
                // Здесь можно вызвать onAuth с данными пользователя
                if (miniAppUser) {
                  onAuth({
                    id: miniAppUser.id,
                    first_name: miniAppUser.first_name,
                    last_name: miniAppUser.last_name || '',
                    username: miniAppUser.username || '',
                    photo_url: miniAppUser.photo_url || '',
                    auth_date: Math.floor(Date.now() / 1000),
                    hash: 'telegram_mini_apps_hash',
                  });
                }
              }}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Продолжить
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleTelegramAuth}
              disabled={authStep === 'authing'}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {authStep === 'authing' ? 'Авторизация...' : 'Авторизоваться'}
            </button>
            
            {authStep === 'instructions' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Для авторизации необходимо разрешить доступ к данным в Telegram Mini Apps
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Для веб-версии используем новый компонент TelegramWebAuth
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Войдите в аккаунт
        </h3>
        <p className="text-gray-600">
          Для продолжения необходимо авторизоваться через Telegram
        </p>
      </div>
      
      {/* Используем новый компонент для веб-авторизации */}
      <TelegramWebAuth
        botName="SuperMock_bot"
        onAuth={onAuth}
        className="w-full"
      />
    </div>
  );
}
