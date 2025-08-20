'use client';

import { useEffect, useState, FC } from 'react';
import { useRouter } from 'next/navigation';

const AuthCallback: FC = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const processCallback = () => {
      try {
        // Получаем токен из URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          throw new Error('Токен не найден в URL');
        }

        // Сохраняем токен в localStorage
        localStorage.setItem('token', token);

        // Перенаправляем пользователя на главную страницу
        setLoading(false);
        router.push('/');
      } catch (error) {
        console.error('Ошибка при обработке обратного вызова:', error);
        setError(
          (error as Error).message ||
            'Произошла ошибка при обработке обратного вызова'
        );
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
            Обработка аутентификации...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 text-white p-6 rounded-lg max-w-md shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-red-400">
            Ошибка аутентификации
          </h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
