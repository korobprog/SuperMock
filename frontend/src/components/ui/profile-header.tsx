import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { TelegramHeaderButton } from '@/components/ui/telegram-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import { TelegramLoginWidget } from './telegram-login';
import { TelegramUser } from '@/lib/telegram-auth';
import { env } from '@/lib/env';
import { createApiUrl } from '@/lib/config';
import { LanguageSelector } from './language-selector';
import { AuthRequiredMessage } from './auth-required-message';
import { TelegramWebAuth } from './telegram-web-auth';

interface RealUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  language?: string;
}

export function ProfileHeader() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { telegramUser, setTelegramUser, userId, setUserId } = useAppStore();
  const [realUser, setRealUser] = useState<RealUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Загружаем данные реального пользователя
  useEffect(() => {
    const loadRealUser = async () => {
      if (!userId) {
        setRealUser(null);
        return;
      }

      // В продакшене не загружаем данные для локального пользователя
      if (!import.meta.env.DEV && !telegramUser) {
        setRealUser(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(createApiUrl(`/api/user/${userId}`));
        if (response.ok) {
          const userData = await response.json();
          setRealUser(userData);
        } else if (response.status === 404) {
          console.log('User not found in database, using local data');
          setRealUser(null);
        } else {
          console.error('Error loading user data:', response.status);
          // Не устанавливаем realUser в null при ошибке БД
          // Пользователь может быть в локальном состоянии
        }
      } catch (error) {
        console.log('Network error loading user data, using local data');
        // При ошибке сети/БД не очищаем realUser
        // Возможно, у нас есть локальные данные
      } finally {
        setIsLoading(false);
      }
    };

    loadRealUser();
  }, [userId, telegramUser]);

  const handleLogout = () => {
    // Очищаем все данные пользователя
    setTelegramUser(null);
    setUserId(0);
    setRealUser(null);
    
    // Очищаем данные из localStorage
    localStorage.removeItem('Super Mock-storage');
    localStorage.removeItem('telegram_user');
    
    // Устанавливаем флаги выхода
    sessionStorage.setItem('just_logged_out', 'true');
    sessionStorage.setItem('logout_timestamp', Date.now().toString());
    
    // В продакшене не перезагружаем страницу, просто очищаем состояние
    if (import.meta.env.DEV) {
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const handleTelegramAuth = async (user: TelegramUser) => {
    console.log('ProfileHeader: Received Telegram auth:', user);
    
    try {
      // Инициализируем пользователя в базе данных
      const initResponse = await fetch(createApiUrl('/api/init'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg: user,
          language: 'ru',
          initData: 'telegram_auth_hash'
        })
      });
      
      if (initResponse.ok) {
        const initData = await initResponse.json();
        console.log('ProfileHeader: User initialized in database:', initData);
        
        // Устанавливаем пользователя в store (это также установит userId)
        setTelegramUser(user);
        
        // Показываем уведомление об успешной авторизации
        console.log('✅ User successfully authenticated and initialized');
      } else {
        console.error('ProfileHeader: Failed to initialize user in database');
        // Даже если инициализация в БД не удалась, устанавливаем пользователя в store
        setTelegramUser(user);
      }
    } catch (error) {
      console.error('ProfileHeader: Error initializing user:', error);
      // Даже при ошибке устанавливаем пользователя в store
      setTelegramUser(user);
    }
  };

  // Определяем отображаемые данные пользователя
  const displayUser = telegramUser || realUser;
  
  // Исправляем логику отображения имени пользователя
  const displayName = displayUser
    ? telegramUser
      ? telegramUser.first_name
      : realUser?.firstName
      ? realUser.lastName
        ? `${realUser.firstName} ${realUser.lastName}`
        : realUser.firstName
      : t('common.user')
    : null; // Убираем fallback на "Не авторизован"

  const displayUsername = displayUser
    ? telegramUser
      ? telegramUser.username
      : realUser?.username
    : null;

  const displayPhoto = telegramUser?.photo_url;

  // Определяем, авторизован ли пользователь
  const isAuthorized = !!(telegramUser || (userId && userId > 0));

  // Проверяем, находимся ли мы в Telegram Mini Apps
  const isInTelegramMiniApps = !!window.Telegram?.WebApp;

  // В Telegram Mini Apps не показываем блок авторизации, так как пользователь уже авторизован в Telegram
  const shouldShowAuthBlock = !isAuthorized && !isInTelegramMiniApps;

  // Дополнительная проверка для Telegram Mini Apps
  // Если мы в Telegram Mini Apps и у нас нет пользователя, но есть initData, то пользователь авторизован
  const isTelegramMiniAppsAuthorized = isInTelegramMiniApps && (
    isAuthorized || 
    !!window.Telegram?.WebApp?.initData ||
    !!window.Telegram?.WebApp?.initDataUnsafe?.user
  );

  // Финальное решение о показе блока авторизации
  const finalShouldShowAuthBlock = shouldShowAuthBlock && !isTelegramMiniAppsAuthorized;

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={displayPhoto} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {displayName ? (
                  displayName.charAt(0).toUpperCase()
                ) : (
                  <User className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">
                {isAuthorized ? (displayName || t('common.user')) : t('common.notAuthorized')}
              </span>
              <span className="text-sm text-gray-500">
                {isAuthorized 
                  ? (displayUsername ? `@${displayUsername}` : `ID: ${userId}`)
                  : t('common.notAuthorized')
                }
              </span>
              <span className="text-xs text-gray-400">
                {isLoading
                  ? t('common.loading')
                  : isAuthorized
                  ? (telegramUser ? t('common.telegram') : t('common.authorized'))
                  : t('common.notAuthorized')}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Кнопки для веб-версии - скрыты на мобильных */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthorized && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/notifications')}
                    className="text-gray-500 hover:text-gray-700"
                    title={t('common.notifications')}
                  >
                    <Bell className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="text-gray-500 hover:text-gray-700"
                    title={t('common.settings')}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Языковое меню - показывается везде */}
            <LanguageSelector />
            
            {/* Кнопка выхода - показывается только для авторизованных пользователей */}
            {isAuthorized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
                title={t('common.logout')}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Telegram Auth Button - показываем только если нет пользователя */}
        {finalShouldShowAuthBlock && (
          <div className="mt-4">
            {/* Для веб-версии используем новый компонент, для Mini Apps - старый */}
            {isInTelegramMiniApps ? (
              <AuthRequiredMessage onAuth={handleTelegramAuth} />
            ) : (
              <TelegramWebAuth 
                botName="SuperMock_bot" 
                onAuth={handleTelegramAuth} 
              />
            )}
          </div>
        )}
        
        {/* Информация для пользователей в Telegram Mini Apps */}
        {isInTelegramMiniApps && !isAuthorized && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-blue-800 mb-2">
                🚀 Добро пожаловать в SuperMock!
              </p>
              <p className="text-xs text-blue-600">
                Вы уже авторизованы в Telegram. Приложение автоматически загрузит ваши данные.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
