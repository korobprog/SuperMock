import React, { useEffect, useRef, useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { CheckCircle, AlertCircle, User, LogOut, Loader2 } from 'lucide-react';

// Интерфейс для данных пользователя Telegram
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginSimpleProps {
  onAuth?: (user: TelegramUser) => void;
  onLogout?: () => void;
  className?: string;
}

/**
 * Простой компонент для авторизации через Telegram
 * Использует официальный Telegram Login Widget
 */
export function TelegramLoginSimple({
  onAuth,
  onLogout,
  className = ''
}: TelegramLoginSimpleProps) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Получаем имя бота из переменных окружения
  const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'SuperMock_bot';

  // Загружаем пользователя из localStorage при монтировании
  useEffect(() => {
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser) as TelegramUser;
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('telegram_user');
      }
    }
  }, []);

  // Загружаем Telegram Login Widget
  useEffect(() => {
    if (!widgetRef.current) return;

    // Проверяем, не загружен ли уже скрипт
    if ((window as any).TelegramLoginWidget) {
      console.log('✅ Telegram widget script already loaded');
      return;
    }

    console.log('📥 Loading Telegram widget script...');
    
    // Загружаем Telegram Login Widget скрипт
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    
    // Устанавливаем атрибуты для виджета
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-use-pic', 'true');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-lang', 'ru');
    
    // Обработчик успешной загрузки
    script.onload = () => {
      console.log('✅ Telegram widget script loaded successfully');
      
      // Устанавливаем глобальный обработчик для callback
      (window as any).onTelegramAuth = (telegramUser: TelegramUser) => {
        console.log('✅ Telegram auth successful:', telegramUser);
        handleAuthSuccess(telegramUser);
      };

      // Проверяем, что виджет действительно загрузился
      setTimeout(() => {
        if (!widgetRef.current?.querySelector('[data-telegram-login]')) {
          console.warn('⚠️ Telegram widget not rendered, trying fallback');
          setError('Telegram виджет не загрузился. Попробуйте обновить страницу или использовать альтернативный способ входа.');
        }
      }, 2000);
    };

    // Обработчик ошибки загрузки
    script.onerror = () => {
      console.error('❌ Telegram widget script load error');
      setError('Ошибка загрузки виджета Telegram. Попробуйте обновить страницу.');
    };

    // Добавляем скрипт в DOM
    widgetRef.current.appendChild(script);

    // Очистка при размонтировании
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any).onTelegramAuth;
    };
  }, [botName]);

  // Обработчик успешной авторизации
  const handleAuthSuccess = async (telegramUser: TelegramUser) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess('Авторизация успешна! Обработка данных...');

      console.log('✅ Telegram auth successful:', telegramUser);

      // Сохраняем пользователя в состоянии
      setUser(telegramUser);

      // Сохраняем в localStorage
      localStorage.setItem('telegram_user', JSON.stringify(telegramUser));

      // Отправляем данные на сервер
      const response = await fetch('/api/telegram-auth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramUser),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (data.success && data.token) {
        // Сохраняем токен
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);

        setSuccess('Авторизация завершена! Пользователь успешно создан/обновлен.');
        
        // Вызываем callback если передан
        if (onAuth) {
          onAuth(telegramUser);
        }
      } else {
        throw new Error('Неверный ответ от сервера');
      }

    } catch (error) {
      console.error('❌ Error during auth:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      setSuccess(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик выхода
  const handleLogout = () => {
    setUser(null);
    setError(null);
    setSuccess(null);
    
    // Очищаем localStorage
    localStorage.removeItem('telegram_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    
    console.log('✅ User logged out');
    
    // Вызываем callback если передан
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className={`telegram-login-simple ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 240 240" fill="currentColor" className="text-blue-600">
              <circle cx="120" cy="120" r="120" fill="#fff" />
              <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
              <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
              <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
            </svg>
            Войти через Telegram
          </CardTitle>
          <CardDescription>
            Авторизуйтесь через Telegram для доступа к системе
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Если пользователь не авторизован */}
          {!user && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Нажмите на виджет ниже для авторизации
                </p>
              </div>
              
              {/* Telegram Login Widget */}
              <div className="flex justify-center">
                <div ref={widgetRef} style={{ minHeight: '40px' }} />
              </div>

              {/* Альтернативный способ входа */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-3">
                  Если виджет не работает, используйте альтернативный способ:
                </p>
                <button
                  onClick={() => {
                    const botUrl = `https://t.me/${botName}?start=auth`;
                    window.open(botUrl, '_blank');
                    setSuccess('Откройте бота в Telegram. Бот автоматически отправит сообщение с кнопкой авторизации. Нажмите "🔐 Confirm Authorization", затем "🚀 Open SuperMock".');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006fa0] text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 240 240" fill="currentColor" className="flex-shrink-0">
                    <circle cx="120" cy="120" r="120" fill="#fff" />
                    <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
                    <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
                    <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
                  </svg>
                  <span>Открыть бота в Telegram</span>
                </button>
              </div>

              {/* Информация о боте */}
              <div className="text-xs text-gray-500 text-center">
                <p>Бот: @{botName}</p>
                <p>Данные защищены HMAC-SHA256 подписью</p>
              </div>
            </div>
          )}

          {/* Если пользователь авторизован */}
          {user && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {user.photo_url ? (
                    <img 
                      src={user.photo_url} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full border-4 border-green-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-200">
                      <User className="w-10 h-10 text-green-600" />
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold mb-2">
                  {user.first_name} {user.last_name || ''}
                </h3>
                
                {user.username && (
                  <p className="text-lg text-blue-600 mb-2">@{user.username}</p>
                )}
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Авторизация:</strong> {new Date(user.auth_date * 1000).toLocaleString('ru-RU')}</p>
                </div>
              </div>

              {/* Кнопка выхода */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 w-4" />
                  Выйти
                </Button>
              </div>
            </div>
          )}

          {/* Сообщения об ошибках */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Сообщения об успехе */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Индикатор загрузки */}
          {isLoading && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Обработка авторизации...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TelegramLoginSimple;