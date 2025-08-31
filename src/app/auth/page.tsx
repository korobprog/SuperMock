'use client';

import { useState } from 'react';
import Register from '../../components/Register';
import Login from '../../components/Login';
import Header from '../../components/Header';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  // Обработчик успешного входа или регистрации
  const handleAuthSuccess = (newToken: string) => {
    // Перенаправляем на главную страницу после успешной авторизации
    window.location.href = '/';
  };

  return (
    <>
      <Header />
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
    </>
  );
}
