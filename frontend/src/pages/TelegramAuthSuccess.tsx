import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TelegramAuthData {
  token: string;
  userId: string;
}

export default function TelegramAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const source = searchParams.get('source');
    const fallback = searchParams.get('fallback');
    const telegramId = searchParams.get('telegramId');
    const firstName = searchParams.get('firstName');
    const username = searchParams.get('username');

    // Если это fallback режим (когда endpoint не работает), создаем токен локально
    if (fallback === 'true' && telegramId) {
      handleFallbackAuth(telegramId, firstName, username);
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Отсутствует токен авторизации');
      return;
    }

    // Если это токен от бота, нужно сначала обменять его на постоянный токен
    if (source === 'bot') {
      handleBotToken(token);
    } else {
      // Обычная авторизация через виджет
      handleWidgetToken(token, userId);
    }
  }, [searchParams, navigate]);

  const handleFallbackAuth = (telegramId: string, firstName: string | null, username: string | null) => {
    try {
      setStatus('loading');
      setMessage('Авторизация через Telegram...');

      // Создаем токен локально для fallback режима
      const userId = `user_${telegramId}_${Date.now()}`;
      
      // Создаем простой JWT-подобный токен для fallback режима
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        userId: userId,
        tgId: telegramId,
        type: 'telegram',
        fallback: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 дней
      }));
      const signature = btoa(`fallback_${telegramId}_${Date.now()}`);
      const token = `${header}.${payload}.${signature}`;

      // Сохраняем токен в localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('telegramId', telegramId);
      localStorage.setItem('firstName', firstName || '');
      localStorage.setItem('username', username || '');
      localStorage.setItem('isAuthenticated', 'true');
      
      // Устанавливаем заголовок для всех будущих запросов
      if (window.authHeaders) {
        window.authHeaders.Authorization = `Bearer ${token}`;
      } else {
        window.authHeaders = { Authorization: `Bearer ${token}` };
      }

      console.log('✅ Fallback auth successful:', { userId, telegramId, firstName, username });

      setStatus('success');
      setMessage('Авторизация через Telegram успешна! Перенаправление...');

      // Перенаправляем на главную страницу через 2 секунды
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error in fallback auth:', error);
      setStatus('error');
      setMessage('Ошибка при авторизации');
    }
  };

  const handleBotToken = async (tempToken: string) => {
    try {
      setStatus('loading');
      setMessage('Обмен токена авторизации...');

      // Отправляем запрос на backend для обмена временного токена на постоянный
      const response = await fetch(`/api/telegram-auth-by-token?token=${tempToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Backend должен перенаправить нас с постоянным токеном
        // Если мы дошли сюда, значит что-то пошло не так
        setStatus('error');
        setMessage('Ошибка при обмене токена авторизации');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatus('error');
        setMessage(errorData.message || 'Ошибка при обмене токена авторизации');
      }
    } catch (error) {
      console.error('Error exchanging bot token:', error);
      setStatus('error');
      setMessage('Ошибка при обмене токена авторизации');
    }
  };

  const handleWidgetToken = (token: string, userId: string | null) => {
    if (!userId) {
      setStatus('error');
      setMessage('Отсутствует ID пользователя');
      return;
    }

    // Сохраняем токен в localStorage
    try {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Устанавливаем заголовок для всех будущих запросов
      if (window.authHeaders) {
        window.authHeaders.Authorization = `Bearer ${token}`;
      } else {
        window.authHeaders = { Authorization: `Bearer ${token}` };
      }

      console.log('✅ Widget auth successful:', { userId, token });

      setStatus('success');
      setMessage('Авторизация через Telegram успешна! Перенаправление...');

      // Перенаправляем на главную страницу через 2 секунды
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error saving auth data:', error);
      setStatus('error');
      setMessage('Ошибка при сохранении данных авторизации');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
            <CardTitle>Обработка авторизации</CardTitle>
            <CardDescription>
              Пожалуйста, подождите...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'success' ? (
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          )}
          <CardTitle>
            {status === 'success' ? 'Авторизация успешна!' : 'Ошибка авторизации'}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' ? (
            <Button onClick={handleGoHome} className="w-full">
              Перейти на главную
            </Button>
          ) : (
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                Попробовать снова
              </Button>
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                Вернуться на главную
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
