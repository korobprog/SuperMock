'use client';

import { useState, useEffect } from 'react';
import Register from '../components/Register';
import Login from '../components/Login';
import UserProfile from '../components/UserProfile';
import SessionManager from '../components/SessionManager';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Проверяем наличие токена при загрузке страницы
  useEffect(() => {
    // Выполняем только на стороне клиента
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      console.log(
        'Токен из localStorage:',
        storedToken ? 'Найден' : 'Не найден'
      );
      setToken(storedToken);
    }
  }, []);

  // Обработчик успешного входа или регистрации
  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
  };

  // Обработчик выхода из системы
  const handleLogout = () => {
    setToken(null);
  };

  // Если пользователь авторизован, показываем личный кабинет
  if (token) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <UserProfile token={token} onLogout={handleLogout} />
            </div>
            <div className="md:col-span-2">
              <SessionManager token={token} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем формы входа/регистрации
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                isLogin
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                !isLogin
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Регистрация
            </button>
          </div>
        </div>

        {isLogin ? (
          <Login onLoginSuccess={handleAuthSuccess} />
        ) : (
          <Register onRegisterSuccess={handleAuthSuccess} />
        )}
      </div>
    </div>
  );
}
