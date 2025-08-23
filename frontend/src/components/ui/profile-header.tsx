import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { TelegramHeaderButton } from '@/components/ui/telegram-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, LogOut, User, Target } from 'lucide-react';
import { TelegramAuthButton } from './telegram-login';
import { TelegramUser } from '@/lib/telegram-auth';
import { env } from '@/lib/env';
import { createApiUrl } from '@/lib/config';
import { LanguageSelector } from './language-selector';

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
  }, [userId]);

  const handleLogout = () => {
    setTelegramUser(null);
    setUserId(0);
    setRealUser(null);
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
      } else {
        console.error('ProfileHeader: Failed to initialize user in database');
      }
    } catch (error) {
      console.error('ProfileHeader: Error initializing user:', error);
    }
    
    // Устанавливаем пользователя в store (это также установит userId)
    setTelegramUser(user);
  };

  // Определяем отображаемые данные пользователя
  const displayUser = telegramUser || realUser;
  const displayName = displayUser
    ? telegramUser
      ? telegramUser.first_name
      : realUser?.firstName
      ? realUser.lastName
        ? `${realUser.firstName} ${realUser.lastName}`
        : realUser.firstName
      : t('common.user')
    : userId
    ? `${t('common.user')} #${userId}`
    : t('common.user');

  const displayUsername = displayUser
    ? telegramUser
      ? telegramUser.username
      : realUser?.username
    : userId
    ? `ID: ${userId}`
    : null;

  const displayPhoto = telegramUser?.photo_url;

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
              <span className="font-semibold text-gray-900">{displayName}</span>
              <span className="text-sm text-gray-500">
                {displayUsername
                  ? `@${displayUsername}`
                  : `ID: ${userId || t('common.unknown')}`}
              </span>
              <span className="text-xs text-gray-400">
                {isLoading
                  ? t('common.loading')
                  : telegramUser
                  ? t('common.telegram')
                  : userId
                  ? t('common.localUser')
                  : t('common.notAuthorized')}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Кнопки для веб-версии - скрыты на мобильных */}
            <div className="hidden md:flex items-center space-x-2">
              {(telegramUser || userId) && (
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
                    onClick={() => navigate('/tools')}
                    className="text-gray-500 hover:text-gray-700"
                    title={t('tools.selectTools')}
                  >
                    <Target className="h-5 w-5" />
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
            
            {/* Кнопка выхода - показывается везде */}
            {(telegramUser || userId) && (
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
        {!telegramUser && !userId && (
          <div className="mt-4">
            {env.TELEGRAM_BOT_NAME ? (
              <TelegramAuthButton
                botName={env.TELEGRAM_BOT_NAME}
                onAuth={handleTelegramAuth}
                className="w-full"
              />
            ) : (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded border">
                Ошибка: VITE_TELEGRAM_BOT_NAME не настроен в переменных
                окружения
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
