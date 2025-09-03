import React, { useState } from 'react';
import { TelegramLoginButtonComponent } from './ui/telegram-login-button';

export function TestTelegramLogin() {
  const [testUser, setTestUser] = useState(null);

  const handleAuth = (user) => {
    console.log('✅ Тест: Получен пользователь:', user);
    setTestUser(user);
    alert(`Добро пожаловать, ${user.first_name}!`);
  };

  const handleLogout = () => {
    console.log('✅ Тест: Выход пользователя');
    setTestUser(null);
    alert('Вы вышли из аккаунта');
  };

  const handleTestUser = () => {
    // Создаем тестового пользователя для демонстрации
    const mockUser = {
      id: 123456789,
      first_name: "Тест",
      last_name: "Пользователь",
      username: "test_user",
      photo_url: null, // Можно добавить реальное фото для теста
      auth_date: Math.floor(Date.now() / 1000),
      hash: "test_hash_123"
    };
    setTestUser(mockUser);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Тест Telegram Login
          </h1>
          
          {/* Кнопки для тестирования */}
          <div className="mb-6 space-y-2">
            <button 
              onClick={handleTestUser}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              🧪 Создать тестового пользователя
            </button>
            
            {testUser && (
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                  🚪 Выйти из тестового аккаунта
              </button>
            )}
          </div>
          
          {/* Компонент Telegram Login */}
          <TelegramLoginButtonComponent
            botName="SuperMock_bot"
            onAuth={handleAuth}
            user={testUser}
            onLogout={handleLogout}
            className="w-full"
          />
          
          {/* Информация о текущем состоянии */}
          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-800 mb-2">
                📊 Текущее состояние:
              </p>
              <p className="text-xs text-gray-600">
                {testUser 
                  ? `Авторизован как: ${testUser.first_name} ${testUser.last_name || ''} (@${testUser.username})`
                  : 'Не авторизован'
                }
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Это тестовый компонент для проверки интеграции react-telegram-login
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Используйте кнопки выше для тестирования разных состояний
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
