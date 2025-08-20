import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { TelegramHeaderButton } from '@/components/ui/telegram-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import { TelegramAuthButton } from './telegram-login';
import { TelegramUser } from '@/lib/telegram-auth';
import { env } from '@/lib/env';
import { createApiUrl } from '@/lib/config';

interface RealUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  language?: string;
}

export function ProfileHeader() {
  const navigate = useNavigate();
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
        console.error('Error loading user data:', error);
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

  const handleTelegramAuth = (user: TelegramUser) => {
    console.log('ProfileHeader: Received Telegram auth:', user);
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
      : 'Пользователь'
    : userId
    ? `Пользователь #${userId}`
    : 'Пользователь';

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
                  : `ID: ${userId || 'Неизвестен'}`}
              </span>
              <span className="text-xs text-gray-400">
                {isLoading
                  ? 'Загрузка...'
                  : telegramUser
                  ? 'Telegram'
                  : userId
                  ? 'Локальный пользователь'
                  : 'Не авторизован'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TelegramHeaderButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/notifications')}
              className="text-gray-500 hover:text-gray-700"
            >
              <Bell className="h-5 w-5" />
            </TelegramHeaderButton>
            <TelegramHeaderButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="h-5 w-5" />
            </TelegramHeaderButton>
            {(telegramUser || userId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
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
