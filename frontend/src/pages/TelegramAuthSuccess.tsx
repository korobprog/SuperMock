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

    if (!token || !userId) {
      setStatus('error');
      setMessage('Отсутствуют необходимые параметры авторизации');
      return;
    }

    // Сохраняем токен в localStorage
    try {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      
      // Устанавливаем заголовок для всех будущих запросов
      if (window.authHeaders) {
        window.authHeaders.Authorization = `Bearer ${token}`;
      } else {
        window.authHeaders = { Authorization: `Bearer ${token}` };
      }

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
  }, [searchParams, navigate]);

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
