import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Интерфейс для пользователя
interface User {
  id: string;
  tgId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

// Интерфейс для ответа API
interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

/**
 * Страница обработки callback'а от Telegram авторизации
 * Обрабатывает редирект с токеном и сохраняет данные пользователя
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Получаем параметры из URL
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        console.log('🔍 Auth callback params:', { token, userId, success, error, errorMessage });

        // Если есть ошибка
        if (error) {
          setStatus('error');
          setMessage(errorMessage || 'Произошла ошибка при авторизации');
          return;
        }

        // Если нет токена
        if (!token) {
          setStatus('error');
          setMessage('Токен авторизации не получен');
          return;
        }

        // Проверяем статус токена через API
        const response = await fetch(`/api/auth/telegram/status?token=${token}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AuthResponse = await response.json();
        
        if (data.success && data.user) {
          // Сохраняем данные пользователя
          setUser(data.user);
          
          // Сохраняем токен в localStorage
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user_id', data.user.id);
          localStorage.setItem('telegram_user', JSON.stringify({
            id: data.user.tgId,
            first_name: data.user.firstName,
            last_name: data.user.lastName || '',
            username: data.user.username || '',
            photo_url: data.user.photoUrl || '',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'telegram_auth_hash',
          }));

          // Устанавливаем статус успеха
          setStatus('success');
          setMessage('Авторизация успешна! Перенаправление...');

          // Перенаправляем на главную страницу через 2 секунды
          setTimeout(() => {
            navigate('/');
          }, 2000);

        } else {
          throw new Error('Неверный ответ от сервера');
        }

      } catch (error) {
        console.error('❌ Error handling auth callback:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Неизвестная ошибка');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  // Функция для повторной попытки
  const handleRetry = () => {
    setStatus('loading');
    setMessage('');
    // Перезагружаем страницу для повторной попытки
    window.location.reload();
  };

  // Функция для перехода на главную страницу
  const handleGoHome = () => {
    navigate('/');
  };

  // Функция для перехода к авторизации
  const handleGoToAuth = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Авторизация...'}
            {status === 'success' && 'Успешно!'}
            {status === 'error' && 'Ошибка'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Обработка данных авторизации'}
            {status === 'success' && 'Вы успешно вошли в систему'}
            {status === 'error' && 'Не удалось завершить авторизацию'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Индикатор загрузки */}
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Пожалуйста, подождите...</p>
            </div>
          )}

          {/* Успешная авторизация */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              {user && (
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    {user.photoUrl ? (
                      <img 
                        src={user.photoUrl} 
                        alt="Avatar" 
                        className="w-16 h-16 rounded-full border-2 border-green-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-600">
                          {user.firstName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg">
                    {user.firstName} {user.lastName || ''}
                  </h3>
                  
                  {user.username && (
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  )}
                </div>
              )}

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Вы будете перенаправлены на главную страницу через несколько секунд
                </AlertDescription>
              </Alert>

              <Button onClick={handleGoHome} className="w-full">
                Перейти сейчас
              </Button>
            </div>
          )}

          {/* Ошибка авторизации */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  Попробовать снова
                </Button>
                
                <Button onClick={handleGoToAuth} className="w-full">
                  Вернуться к авторизации
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
