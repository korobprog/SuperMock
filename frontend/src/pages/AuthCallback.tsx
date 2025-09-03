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
        
        // Telegram OAuth возвращает данные в query параметрах, а не в хэше
        // Согласно документации: https://core.telegram.org/widgets/login
        const id = searchParams.get('id');
        const first_name = searchParams.get('first_name');
        const last_name = searchParams.get('last_name');
        const username = searchParams.get('username');
        const photo_url = searchParams.get('photo_url');
        const auth_date = searchParams.get('auth_date');
        const hash = searchParams.get('hash');
        
        console.log('🔐 Query params from Telegram:', { id, first_name, last_name, username, photo_url, auth_date, hash });
        
        // Проверяем обязательные поля согласно документации Telegram
        if (!id || !first_name || !auth_date || !hash) {
          setStatus('error');
          setMessage('Отсутствуют необходимые параметры авторизации от Telegram');
          console.error('❌ Missing required params:', { id, first_name, auth_date, hash });
          return;
        }

        // Создаем объект пользователя Telegram
        const telegramUser: TelegramUser = {
          id: parseInt(id),
          first_name,
          last_name: last_name || '',
          username: username || '',
          photo_url: photo_url || '',
          auth_date: parseInt(auth_date),
          hash
        };

        console.log('🔐 Created Telegram user object:', telegramUser);

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
