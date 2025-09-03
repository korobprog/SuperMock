import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import { TelegramUser } from '@/lib/telegram-auth';
import { createApiUrl } from '@/lib/config';
import { LanguageSelector } from './language-selector';
import { useNavigate } from 'react-router-dom';
import { useOAuthListener } from '@/hooks/useOAuthListener';
import { TelegramOAuthButton } from './telegram-oauth-button';

interface RealUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  language?: string;
  phone?: string;
}

export function ProfileHeader() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { telegramUser, setTelegramUser, userId, setUserId } = useAppStore();
  
  // Отладочная информация (только в development)
  if (import.meta.env.DEV) {
    console.log('🔍 ProfileHeader: Component loaded with state:', {
      telegramUser: telegramUser ? { id: telegramUser.id, first_name: telegramUser.first_name } : null,
      userId,
      hasTelegramUser: !!telegramUser,
      hasUserId: !!userId
    });
  }
  
  // Слушаем OAuth авторизацию из других вкладок
  useOAuthListener();
  const [realUser, setRealUser] = useState<RealUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Загружаем данные реального пользователя
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 ProfileHeader: useEffect triggered with:', { userId, telegramUser });
    }
    
    const loadRealUser = async () => {
      if (!userId) {
        if (import.meta.env.DEV) {
          console.log('⚠️ ProfileHeader: No userId, skipping user data load');
        }
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
        if (import.meta.env.DEV) {
          console.log('🔍 ProfileHeader: Loading user data for userId:', userId);
        }
        const response = await fetch(createApiUrl(`/api/user/${userId}`));
        if (response.ok) {
          const userData = await response.json();
          if (import.meta.env.DEV) {
            console.log('✅ ProfileHeader: User data loaded:', userData);
          }
          setRealUser(userData);
        } else if (response.status === 404) {
          if (import.meta.env.DEV) {
            console.log('⚠️ ProfileHeader: User not found in database, using local data');
          }
          setRealUser(null);
        } else {
          if (import.meta.env.DEV) {
            console.error('❌ ProfileHeader: Error loading user data:', response.status);
          }
          // Не устанавливаем realUser в null при ошибке БД
          // Пользователь может быть в локальном состоянии
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.log('⚠️ ProfileHeader: Network error loading user data, using local data:', error);
        }
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
    
    // Добавить навигацию на главную страницу
    navigate('/');
    
    // В продакшене не перезагружаем страницу, просто очищаем состояние
    if (import.meta.env.DEV) {
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const handleTelegramAuth = async (user: TelegramUser) => {
    if (import.meta.env.DEV) {
      console.log('ProfileHeader: Received Telegram auth:', user);
    }
    
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
        if (import.meta.env.DEV) {
          console.log('ProfileHeader: User initialized in database:', initData);
        }
        
        // Устанавливаем пользователя в store (это также установит userId)
        setTelegramUser(user);
        
        // Показываем уведомление об успешной авторизации
        if (import.meta.env.DEV) {
          console.log('✅ User successfully authenticated and initialized');
        }
      } else {
        if (import.meta.env.DEV) {
          console.error('ProfileHeader: Failed to initialize user in database');
        }
        // Даже если инициализация в БД не удалась, устанавливаем пользователя в store
        setTelegramUser(user);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('ProfileHeader: Error initializing user:', error);
      }
      // Даже при ошибке устанавливаем пользователя в store
      setTelegramUser(user);
    }
  };

  // Определяем отображаемые данные пользователя
  // Приоритет: telegramUser > realUser > null
  const displayUser = telegramUser || realUser;
  
  if (import.meta.env.DEV) {
    console.log('🔍 ProfileHeader: displayUser calculation:', {
      telegramUser: telegramUser ? { id: telegramUser.id, first_name: telegramUser.first_name } : null,
      realUser: realUser ? { id: realUser.id, firstName: realUser.firstName } : null,
      displayUser: displayUser ? { id: displayUser.id } : null
    });
  }
  
  // Исправляем логику отображения имени пользователя
  let displayName = null;
  
  if (telegramUser) {
    // Если есть telegramUser, используем его данные
    displayName = telegramUser.first_name || 'Пользователь Telegram';
  } else if (realUser) {
    // Если есть realUser, используем его данные
    if (realUser.firstName) {
      displayName = realUser.lastName 
        ? `${realUser.firstName} ${realUser.lastName}`
        : realUser.firstName;
    } else {
      displayName = 'Пользователь';
    }
  }
  
  if (import.meta.env.DEV) {
    console.log('🔍 ProfileHeader: displayName calculation:', {
      telegramUser: !!telegramUser,
      realUser: !!realUser,
      displayName
    });
  }

  // Исправляем логику отображения username
  let displayUsername = null;
  
  if (telegramUser) {
    displayUsername = telegramUser.username;
  } else if (realUser) {
    displayUsername = realUser.username;
  }
  
  if (import.meta.env.DEV) {
    console.log('🔍 ProfileHeader: displayUsername calculation:', {
      telegramUser: !!telegramUser,
      realUser: !!realUser,
      displayUsername
    });
  }

  // Исправляем логику отображения фото
  const displayPhoto = telegramUser?.photo_url || null;
  
  if (import.meta.env.DEV) {
    console.log('🔍 ProfileHeader: displayPhoto calculation:', {
      telegramUser: !!telegramUser,
      hasPhoto: !!displayPhoto
    });
  }

  // Определяем, авторизован ли пользователь
  // Пользователь считается авторизованным если есть telegramUser ИЛИ userId > 0
  // НО временные пользователи (с hash === 'telegram_mini_apps_temp_hash') не считаются авторизованными
  const isAuthorized = !!(telegramUser || (userId && userId > 0)) && 
    !(telegramUser?.hash === 'telegram_mini_apps_temp_hash');
  
  // Отладочная информация (только в development)
  if (import.meta.env.DEV) {
    console.log('🔍 ProfileHeader Debug:', {
      telegramUser,
      userId,
      isAuthorized,
      displayUser,
      displayName,
      displayUsername
    });
  }

  // Проверяем, находимся ли мы в Telegram Mini Apps
  const isInTelegramMiniApps = !!window.Telegram?.WebApp;

  // В Telegram Mini Apps пользователь уже авторизован через Telegram
  // В веб-версии показываем блок авторизации только если пользователь не авторизован
  // В продакшн версии всегда показываем блок авторизации для неавторизованных пользователей
  const shouldShowAuthBlock = !isAuthorized && (!isInTelegramMiniApps || import.meta.env.PROD);

  // Отладочная информация при рендере (только в development)
  if (import.meta.env.DEV) {
    console.log('🔍 ProfileHeader: Rendering with state:', {
      telegramUser,
      userId,
      isAuthorized,
      displayUser,
      displayName,
      displayUsername,
      realUser
    });
  }

  // Отладочная информация для продакшн версии
  if (import.meta.env.PROD) {
    console.log('🔍 ProfileHeader PRODUCTION: Rendering with state:', {
      telegramUser: telegramUser ? { id: telegramUser.id, first_name: telegramUser.first_name, hash: telegramUser.hash } : null,
      userId,
      isAuthorized,
      isInTelegramMiniApps,
      shouldShowAuthBlock,
      displayUser: displayUser ? { id: displayUser.id } : null
    });
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex items-center justify-between">
          {isAuthorized ? ( 
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
                    ? (telegramUser ? t('common.telegram') : 'Авторизован')
                    : t('common.notAuthorized')}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {shouldShowAuthBlock && (
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Войти в аккаунт
                  </h3>
                  <p className="text-gray-600 text-center mb-4 max-w-xs">
                    Для доступа к платформе необходимо авторизоваться через Telegram
                  </p>
                  <TelegramOAuthButton
                    onAuth={handleTelegramAuth}
                    className="w-full max-w-xs"
                    size="lg"
                  />
                </div>
              )}
            </div>
          )}
          
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

        {/* Информация для пользователей в Telegram Mini Apps - скрыта в продакшене */}
        {import.meta.env.DEV && isInTelegramMiniApps && !isAuthorized && (
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
