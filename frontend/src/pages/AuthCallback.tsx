import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { TelegramUser } from '@/lib/telegram-auth';
import { createApiUrl } from '@/lib/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTelegramUser, setUserId } = useAppStore();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Получаем параметры из URL
        const hash = searchParams.get('hash');
        const userParam = searchParams.get('user');
        
        if (!hash || !userParam) {
          setStatus('error');
          setMessage('Отсутствуют необходимые параметры авторизации');
          return;
        }

        console.log('🔐 Processing OAuth callback:', { hash, userParam });

        // Парсим данные пользователя
        let userData: TelegramUser;
        try {
          userData = JSON.parse(decodeURIComponent(userParam));
        } catch (error) {
          console.error('Error parsing user data:', error);
          setStatus('error');
          setMessage('Ошибка при обработке данных пользователя');
          return;
        }

        // Отправляем данные на сервер для проверки
        const response = await fetch(createApiUrl('/api/auth/telegram-oauth'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: userData,
            hash: hash,
            initData: searchParams.toString()
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ OAuth verification successful:', result);
          
          // Сохраняем пользователя в store
          setTelegramUser(userData);
          if (result.userId) {
            setUserId(result.userId);
          }
          
          // Сохраняем данные в localStorage для cross-tab communication
          const oauthData = {
            user: userData,
            userId: result.userId,
            success: true,
            timestamp: Date.now()
          };
          localStorage.setItem('telegram_oauth_data', JSON.stringify(oauthData));
          
          setUser(userData);
          setStatus('success');
          setMessage('Авторизация прошла успешно!');
          
          // Через 2 секунды перенаправляем на главную
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          const errorData = await response.json();
          console.error('OAuth verification failed:', errorData);
          setStatus('error');
          setMessage(errorData.message || 'Ошибка при проверке авторизации');
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        setStatus('error');
        setMessage('Произошла ошибка при обработке авторизации');
      }
    };

    processAuth();
  }, [searchParams, navigate, setTelegramUser, setUserId]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Обработка авторизации...
            </h2>
            <p className="text-gray-600">
              Пожалуйста, подождите
            </p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Авторизация успешна!
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            {user && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  Добро пожаловать, <strong>{user.first_name}</strong>!
                </p>
                {user.username && (
                  <p className="text-xs text-green-600 mt-1">
                    @{user.username}
                  </p>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500">
              Перенаправление на главную страницу...
            </p>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ошибка авторизации
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/')} className="w-full">
                Вернуться на главную
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                Попробовать снова
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Telegram Авторизация</CardTitle>
          <CardDescription>
            Обработка входа через Telegram
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
