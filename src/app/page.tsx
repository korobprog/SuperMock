'use client';

import { useState, useEffect } from 'react';
import Register from '../components/Register';
import Login from '../components/Login';
import UserProfile from '../components/UserProfile';
import SessionManager from '../components/SessionManager';
import Header from '../components/Header';
import HomePage from '../components/HomePage';

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

  // Слушаем изменения в localStorage для обновления состояния
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        console.log('🔄 Storage change detected, new token:', storedToken ? 'Found' : 'Not found');
        setToken(storedToken);
      }
    };

    // Слушаем изменения в localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Также слушаем события от других вкладок
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
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
        <Header />
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

  // Если пользователь не авторизован, показываем лендинг
  return (
    <>
      <Header />
      <HomePage />
    </>
  );
}
