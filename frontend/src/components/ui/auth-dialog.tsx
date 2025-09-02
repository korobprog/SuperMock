import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TelegramLogin, TelegramWebLogin } from '@/components/ui/telegram-login';
import { useAppStore } from '@/lib/store';
import {
  TelegramUser,
  saveTelegramUser,
  loadTelegramUser,
  getTelegramUserDisplayName,
  validateTelegramAuth,
} from '@/lib/telegram-auth';
import { apiValidateTelegramAuth } from '@/lib/api';
import { createApiUrl } from '@/lib/config';
import { toast } from 'sonner';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBotAvailable, setIsBotAvailable] = useState(false);
  const {
    setUserId: setStoreUserId,
    setTelegramUser,
    telegramUser,
  } = useAppStore();

  // Определяем, является ли это десктопной версией
  const isDesktop =
    !navigator.userAgent.includes('Mobile') &&
    !navigator.userAgent.includes('Android') &&
    !navigator.userAgent.includes('iPhone') &&
    !navigator.userAgent.includes('iPad');

  // Определяем, находимся ли мы в продакшн режиме
  const isProduction =
    import.meta.env.PROD &&
    !import.meta.env.VITE_API_URL?.includes('127.0.0.1');

  console.log('🔧 Auth Dialog Debug:', {
    PROD: import.meta.env.PROD,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_TELEGRAM_BOT_NAME: import.meta.env.VITE_TELEGRAM_BOT_NAME,
    isProduction,
    isBotAvailable,
    isDesktop,
  });

  // Проверяем доступность бота
  const checkBotAvailability = async () => {
    console.log('Checking bot availability...');
    console.log(
      'VITE_TELEGRAM_BOT_NAME:',
      import.meta.env.VITE_TELEGRAM_BOT_NAME
    );

    if (!import.meta.env.VITE_TELEGRAM_BOT_NAME) {
      console.log('No bot name configured, setting available to false');
      setIsBotAvailable(false);
      return;
    }

    try {
      // Проверяем доступность бота через наш API
      console.log('Fetching /api/telegram-bot-check...');
      const response = await fetch(createApiUrl('/api/telegram-bot-check'));
      const data = await response.json();
      console.log('Bot check response:', data);
      setIsBotAvailable(data.available);
    } catch (error) {
      console.warn('Bot availability check failed:', error);
      setIsBotAvailable(false);
    }
  };

  // Загружаем сохраненные данные пользователя Telegram при открытии диалога
  useEffect(() => {
    if (open) {
      console.log('🔧 Auth dialog opened');
      console.log('🔧 Environment variables:', {
        VITE_TELEGRAM_BOT_NAME: import.meta.env.VITE_TELEGRAM_BOT_NAME,
        VITE_TELEGRAM_BOT_ID: import.meta.env.VITE_TELEGRAM_BOT_ID,
        NODE_ENV: import.meta.env.NODE_ENV,
      });

      // Если пользователь уже авторизован, закрываем диалог
      if (telegramUser) {
        console.log('User already authenticated, closing dialog');
        onOpenChange(false);
        return;
      }

      const savedUser = loadTelegramUser();
      console.log('Auth dialog opened, checking saved user:', savedUser);
      if (savedUser) {
        console.log('Found saved user, setting in store and closing dialog');
        setTelegramUser(savedUser);
        toast.success(
          `Добро пожаловать обратно, ${getTelegramUserDisplayName(savedUser)}!`
        );
        onOpenChange(false);
      }

      // Проверяем, есть ли данные авторизации в URL (callback от Telegram OAuth)
      const urlParams = new URLSearchParams(window.location.search);
      const telegramAuthData = urlParams.get('tgAuth');

      if (telegramAuthData) {
        try {
          console.log('🔧 Found auth data in URL, processing...');
          const userData = JSON.parse(decodeURIComponent(telegramAuthData));
          console.log('🔧 Parsed user data:', userData);
          handleTelegramAuth(userData);

          // Очищаем URL от параметров авторизации
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('tgAuth');
          window.history.replaceState({}, '', newUrl.toString());
        } catch (error) {
          console.error('🔧 Error parsing auth data:', error);
          toast.error('Ошибка обработки данных авторизации');
        }
      }
    }
  }, [open, setTelegramUser, onOpenChange, telegramUser]);

  const handleTelegramAuth = async (user: TelegramUser) => {
    console.log('🔐 Telegram auth started with user:', user);
    console.log('🔐 User details:', {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      auth_date: user.auth_date,
      hash: user.hash,
    });

    try {
      // Показываем индикатор загрузки
      setIsLoading(true);

      // Сначала проверяем локально
      if (!validateTelegramAuth(user)) {
        console.error('Local validation failed for user:', user);
        toast.error(
          'Неверные данные Telegram. Попробуйте авторизоваться заново.'
        );
        return;
      }

      // Пытаемся валидировать на сервере для создания пользователя в БД
      console.log('Validating telegram auth on server...');
      try {
        const result = await apiValidateTelegramAuth(user);
        console.log('Server validation result:', result);

        if (result.success) {
          // После успешной валидации инициализируем пользователя в базе данных
          console.log('Initializing user in database...');
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
            console.log('User initialized in database:', initData);
          } else {
            console.error('Failed to initialize user in database');
          }
        } else {
          console.error(
            'Server validation failed, but continuing with local auth:',
            result
          );
          // Не прерываем процесс, если сервер недоступен - позволяем локальную авторизацию
          toast.warning(
            'Данные сохранены локально. Серверная синхронизация недоступна.'
          );
        }
      } catch (serverError) {
        console.error(
          'Server validation error, continuing with local auth:',
          serverError
        );
        toast.warning('Сервер недоступен. Данные сохранены локально.');
      }

      // Сохраняем данные пользователя
      console.log('Saving telegram user data...');
      saveTelegramUser(user);
      setTelegramUser(user);

      console.log('Telegram auth completed successfully');
      toast.success(`Добро пожаловать, ${getTelegramUserDisplayName(user)}!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Telegram auth error:', error);

      // Более подробная обработка ошибок
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          toast.error(
            'Ошибка соединения с сервером. Проверьте интернет соединение.'
          );
        } else if (error.message.includes('Invalid Telegram authorization')) {
          toast.error(
            'Неверные данные авторизации Telegram. Попробуйте еще раз.'
          );
        } else {
          toast.error(`Ошибка авторизации: ${error.message}`);
        }
      } else {
        toast.error('Ошибка авторизации через Telegram');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[400px] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="mr-2 w-5 h-5" />
            Вход в систему
          </DialogTitle>
          <DialogDescription>
            {isProduction
              ? 'Войдите через Telegram для сохранения настроек и истории интервью в облаке'
              : 'Войдите, чтобы сохранять настройки и историю интервью в облаке'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Telegram Authorization */}
          <div className="space-y-3">
            <div className="text-center">
              <h4 className="text-sm font-medium mb-2">Быстрый вход</h4>
              <div className="flex justify-center w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-12 border border-gray-300 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm">Авторизация...</span>
                  </div>
                ) : import.meta.env.VITE_TELEGRAM_BOT_NAME ? (
                  // Настоящая кнопка Telegram (показываем если есть имя бота)
                  <>
                    {console.log('🔧 Rendering real Telegram button')}
                    {isProduction ? (
                      // В продакшене используем веб-версию для лучшей совместимости
                      <TelegramWebLogin
                        botName={import.meta.env.VITE_TELEGRAM_BOT_NAME}
                        onAuth={handleTelegramAuth}
                        className="w-full"
                      />
                    ) : (
                      // В dev режиме используем обычный виджет
                      <TelegramLogin
                        botName={import.meta.env.VITE_TELEGRAM_BOT_NAME}
                        onAuth={handleTelegramAuth}
                        className="w-full"
                      />
                    )}
                  </>
                ) : (
                  // Если нет имени бота, показываем сообщение о недоступности
                  <>
                    {console.log('🔧 Rendering unavailable message')}
                    <div className="w-full h-12 border border-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        Telegram авторизация недоступна
                      </span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {import.meta.env.VITE_TELEGRAM_BOT_NAME
                  ? 'Войдите через Telegram для автоматического получения имени и аватара'
                  : 'Войдите через Telegram'}
              </p>
            </div>
          </div>

          {/* Убираем пустой блок для production режима */}

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Преимущества входа в систему:
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Сохранение настроек AI между сессиями</li>
              <li>• История интервью в облаке</li>
              <li>• Синхронизация на всех устройствах</li>
              <li>• Персональные рекомендации</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
