import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
import { TelegramLoginWidget } from '@/components/ui/telegram-login-widget';

// Интерфейс для данных пользователя Telegram
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Страница авторизации с Telegram Login Widget
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Получаем имя бота из переменных окружения
  const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'SuperMockBot';

  // Обработчик успешной авторизации
  const handleAuthSuccess = async (user: TelegramUser) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess('Авторизация успешна! Перенаправление...');

      console.log('✅ Telegram auth successful:', user);

      // Сохраняем данные пользователя в localStorage
      localStorage.setItem('telegram_user', JSON.stringify(user));

      // Отправляем данные на сервер для создания/обновления пользователя
      const response = await fetch('/api/auth/telegram/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.token) {
        // Сохраняем токен
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_id', data.user.id);

        // Показываем сообщение об успехе
        setSuccess('Авторизация завершена! Перенаправление на главную страницу...');

        // Перенаправляем на главную страницу через 2 секунды
        setTimeout(() => {
          navigate('/');
        }, 2000);
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

  // Обработчик перехода на главную страницу
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 240 240" fill="currentColor" className="text-blue-600">
                <circle cx="120" cy="120" r="120" fill="#fff" />
                <path d="m98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80" fill="#c8daea" />
                <path d="m98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035" fill="#a9c9dd" />
                <path d="m100 144-15.958-12.035L170 80" fill="#f6fbfe" />
              </svg>
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
          <CardDescription>
            Авторизуйтесь через Telegram для доступа к SuperMock
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Информация о боте */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Для авторизации используется официальный Telegram Login Widget. 
              После успешной авторизации вы будете автоматически зарегистрированы в системе.
            </AlertDescription>
          </Alert>

          {/* Telegram Login Widget */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium text-sm text-gray-700 mb-2">
                Нажмите кнопку ниже для входа через Telegram
              </h3>
            </div>
            
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
              <Info className="h-4 w-4" />
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

          {/* Кнопка возврата */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleGoHome} 
              variant="outline" 
              className="w-full"
              disabled={isLoading}
            >
              Вернуться на главную
            </Button>
          </div>

          {/* Дополнительная информация */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>
              Авторизация происходит через официальный Telegram API
            </p>
            <p>
              Ваши данные защищены и не передаются третьим лицам
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
