import React, { useState } from 'react';
import { TelegramLoginWidget, TelegramUser } from './telegram-login-widget';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { CheckCircle, AlertCircle, User, LogOut, Info } from 'lucide-react';

/**
 * Пример использования Telegram Login Widget
 * Демонстрирует все возможности компонента
 */
export function TelegramLoginExample() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Получаем имя бота из переменных окружения
  const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'SuperMockBot';

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
      const response = await fetch('/api/auth/telegram/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramUser),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.token) {
        // Сохраняем токен
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_id', data.user.id);

        setSuccess('Авторизация завершена! Пользователь успешно создан/обновлен.');
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

  // Обработчик ошибки авторизации
  const handleAuthError = (errorMessage: string) => {
    console.error('❌ Telegram auth error:', errorMessage);
    setError(errorMessage);
    setSuccess(null);
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
  };

  // Загружаем пользователя из localStorage при монтировании
  React.useEffect(() => {
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('telegram_user');
      }
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 240 240" fill="currentColor" className="text-blue-600">
              <circle cx="120" cy="120" r="120" fill="#fff" />
              <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
              <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
              <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
            </svg>
            Telegram OAuth Demo
          </CardTitle>
          <CardDescription>
            Демонстрация авторизации через Telegram Login Widget
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Информация о боте */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Бот:</strong> @{botName} | 
              <strong>Callback URL:</strong> https://app.supermock.ru/auth/callback
            </AlertDescription>
          </Alert>

          {/* Если пользователь не авторизован */}
          {!user && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-lg mb-2">
                  Войдите через Telegram
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Нажмите на виджет ниже для авторизации
                </p>
              </div>
              
              {/* Telegram Login Widget */}
              <div className="flex justify-center">
                <TelegramLoginWidget
                  botName={botName}
                  onAuth={handleAuthSuccess}
                  onError={handleAuthError}
                  dataOnauth="https://app.supermock.ru/auth/callback"
                  requestAccess={true}
                  usePic={true}
                  cornerRadius={8}
                  lang="ru"
                />
              </div>

              {/* Дополнительная информация */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>Используется официальный Telegram Login Widget</p>
                <p>Данные защищены HMAC-SHA256 подписью</p>
                <p>Автоматическая регистрация в системе</p>
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
                  <LogOut className="w-4 h-4" />
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Обработка авторизации...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Информация о компоненте */}
      <Card>
        <CardHeader>
          <CardTitle>О компоненте</CardTitle>
          <CardDescription>
            Технические детали реализации
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Фронтенд</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• React + TypeScript</li>
                <li>• Официальный Telegram Widget</li>
                <li>• Автоматический fallback</li>
                <li>• Обработка ошибок</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Бэкенд</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Node.js + Express</li>
                <li>• HMAC-SHA256 валидация</li>
                <li>• JWT токены</li>
                <li>• Prisma ORM</li>
              </ul>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            <p><strong>Безопасность:</strong> Все данные проходят проверку подписи через токен бота</p>
            <p><strong>Время жизни:</strong> Данные авторизации действительны 1 час</p>
            <p><strong>Токены:</strong> JWT токены действительны 30 дней</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TelegramLoginExample;
