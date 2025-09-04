'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TelegramAuthSuccess() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Получаем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        const telegramId = urlParams.get('telegramId');
        const firstName = urlParams.get('firstName');
        const username = urlParams.get('username');
        const source = urlParams.get('source');
        const fallback = urlParams.get('fallback');

        console.log('🔍 Telegram auth success callback:', {
          telegramId,
          firstName,
          username,
          source,
          fallback
        });

        if (!telegramId) {
          throw new Error('Telegram ID не найден в URL');
        }

        // Отправляем данные на backend для получения токена
        const response = await fetch('/api/telegram-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegramId,
            firstName,
            username,
            source,
            fallback: fallback === 'true'
          }),
        });

        const data = await response.json();
        console.log('🔍 Backend response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка при авторизации через Telegram');
        }

        if (data.token) {
          // Сохраняем токен в localStorage
          localStorage.setItem('token', data.token);
          console.log('✅ Token saved to localStorage');
          
          // Принудительно обновляем состояние в других вкладках
          window.dispatchEvent(new Event('storage'));
          
          // Перенаправляем на главную страницу
          router.push('/');
        } else {
          throw new Error('Токен не получен от сервера');
        }

      } catch (error) {
        console.error('❌ Ошибка при обработке Telegram авторизации:', error);
        setError((error as Error).message);
        setLoading(false);
      }
    };

    processCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-300">
            Обработка авторизации через Telegram...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Ошибка авторизации</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return null;
}
