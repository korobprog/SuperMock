import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { TelegramUser } from '@/lib/telegram-auth';
import { createApiUrl } from '@/lib/config';

// Расширяем Window interface для authHeaders
declare global {
  interface Window {
    authHeaders?: {
      Authorization?: string;
    };
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserId, setTelegramUser } = useAppStore();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processAuth = async () => {
      try {
        console.log('🔐 Processing Telegram auth callback...');
        
        // Получаем данные из хэша URL (Telegram OAuth возвращает данные в хэше)
        const hash = window.location.hash;
        console.log('🔐 Hash from URL:', hash);
        
        if (!hash || !hash.includes('tgAuthResult=')) {
          // Fallback: проверяем query параметры
          const token = searchParams.get('token');
          const userId = searchParams.get('userId');
          
          if (!token || !userId) {
            setStatus('error');
            setMessage('Отсутствуют необходимые параметры авторизации');
            return;
          }

          console.log('🔐 Using query params:', { token: token ? 'present' : 'missing', userId });

          // Сохраняем токен в localStorage
          localStorage.setItem('authToken', token);
          localStorage.setItem('userId', userId);
          
          // Устанавливаем заголовок для всех будущих запросов
          if (window.authHeaders) {
            window.authHeaders.Authorization = `Bearer ${token}`;
          } else {
            window.authHeaders = { Authorization: `Bearer ${token}` };
          }

          // Сохраняем userId в store
          setUserId(Number(userId));
          
          setStatus('success');
          setMessage('Авторизация через Telegram успешна! Перенаправление...');
          
          // Через 2 секунды перенаправляем на главную
          setTimeout(() => {
            navigate('/');
          }, 2000);
          
          return;
        }

        // Парсим данные из хэша
        const tgAuthResult = hash.split('tgAuthResult=')[1];
        if (!tgAuthResult) {
          setStatus('error');
          setMessage('Не удалось получить данные авторизации из URL');
          return;
        }

        console.log('🔐 tgAuthResult from hash:', tgAuthResult);

        // Декодируем и парсим JSON
        let telegramUser: TelegramUser;
        try {
          telegramUser = JSON.parse(decodeURIComponent(tgAuthResult));
          console.log('🔐 Parsed Telegram user:', telegramUser);
        } catch (parseError) {
          console.error('Error parsing tgAuthResult:', parseError);
          setStatus('error');
          setMessage('Ошибка при парсинге данных авторизации');
          return;
        }

        // Проверяем обязательные поля
        if (!telegramUser.id || !telegramUser.first_name) {
          setStatus('error');
          setMessage('Данные пользователя Telegram неполные');
          return;
        }

        // Инициализируем пользователя в базе данных
        try {
          console.log('🔐 Initializing user in database...');
          const initResponse = await fetch(createApiUrl('/api/init'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tg: telegramUser,
              language: 'ru',
              initData: 'telegram_oauth_hash'
            })
          });
          
          if (initResponse.ok) {
            const initData = await initResponse.json();
            console.log('✅ User initialized in database:', initData);
          } else {
            console.warn('⚠️ Failed to initialize user in database, but continuing...');
          }
        } catch (initError) {
          console.warn('⚠️ Error initializing user in database:', initError);
          // Продолжаем даже при ошибке инициализации
        }

        // Сохраняем пользователя Telegram в store
        setTelegramUser(telegramUser);
        setUserId(telegramUser.id);
        
        // Сохраняем в localStorage для персистентности
        localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
        localStorage.setItem('userId', telegramUser.id.toString());
        
        console.log('✅ Telegram user saved to store and localStorage');
        
        setStatus('success');
        setMessage('Авторизация через Telegram успешна! Перенаправление...');
        
        // Через 2 секунды перенаправляем на главную
        setTimeout(() => {
          navigate('/');
        }, 2000);
        
      } catch (error) {
        console.error('Error processing auth callback:', error);
        setStatus('error');
        setMessage('Произошла ошибка при обработке авторизации');
      }
    };

    processAuth();
  }, [searchParams, navigate, setUserId, setTelegramUser]);

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
