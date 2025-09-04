import React, { useState, useEffect, FC } from 'react';

interface UserData {
  _id: string;
  email: string;
  createdAt: string;
  googleId?: string;
  telegramId?: string;
  firstName?: string;
  username?: string;
  roleHistory?: Array<{
    role: string;
    sessionId?: string;
    timestamp: string;
  }>;
}

interface UserProfileProps {
  token: string | null;
  onLogout: () => void;
}

const UserProfile: FC<UserProfileProps> = ({ token, onLogout }) => {
  const [showFeedbacks, setShowFeedbacks] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Не удалось получить данные пользователя');
        }

        const data = await response.json();
        setUserData(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const handleLogout = () => {
    // Удаляем токен из localStorage
    localStorage.removeItem('token');

    // Принудительно обновляем состояние в других вкладках
    window.dispatchEvent(new Event('storage'));

    // Вызываем функцию обратного вызова для обновления состояния в родительском компоненте
    if (onLogout) {
      onLogout();
    }
  };

  if (loading) {
    return <div>Загрузка данных пользователя...</div>;
  }

  if (error) {
    return <div className="error-message">Ошибка: {error}</div>;
  }

  if (!userData) {
    return <div>Пользователь не авторизован</div>;
  }

  return (
    <div className="user-profile">
      <h2 className="text-blue-600 text-2xl font-bold mb-4">
        Профиль пользователя
      </h2>

      <div className="profile-info bg-gray-800 p-4 rounded-lg shadow-sm">
        {/* Аватарка пользователя */}
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
            {userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 
             userData.email ? userData.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-white text-xl font-semibold">
              {userData.firstName || 'Пользователь'}
            </h3>
            {userData.username && (
              <p className="text-gray-400 text-sm">@{userData.username}</p>
            )}
          </div>
        </div>
        <p className="text-white mb-2">
          <strong className="text-blue-300">Email:</strong> {userData.email}
        </p>
        <p className="text-white mb-2">
          <strong className="text-blue-300">ID:</strong> {userData._id}
        </p>
        <p className="text-white mb-2">
          <strong className="text-blue-300">Дата регистрации:</strong>{' '}
          {new Date(userData.createdAt).toLocaleString()}
        </p>

        {/* Отображение статуса Google-аутентификации */}
        <p className="text-white mb-2">
          <strong className="text-blue-300">Google аккаунт:</strong>{' '}
          {userData.googleId ? (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
              Подключен
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
              Не подключен
            </span>
          )}
        </p>

        {/* Отображение статуса Telegram-аутентификации */}
        <p className="text-white mb-2">
          <strong className="text-blue-300">Telegram аккаунт:</strong>{' '}
          {userData.telegramId ? (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              Подключен
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
              Не подключен
            </span>
          )}
        </p>

        {userData.roleHistory && userData.roleHistory.length > 0 && (
          <div className="mt-4">
            <p className="text-white mb-2">
              <strong className="text-blue-300">История ролей:</strong>
            </p>
            <ul className="list-disc pl-5">
              {userData.roleHistory.map((roleEntry, index) => (
                <li key={index} className="text-gray-200">
                  Роль: <span className="font-medium">{roleEntry.role}</span> |
                  Сессия:{' '}
                  <span className="font-medium">
                    {roleEntry.sessionId?.substring(0, 8)}
                  </span>{' '}
                  | Дата:{' '}
                  <span className="font-medium">
                    {new Date(roleEntry.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white font-medium rounded hover:bg-red-600 transition-colors"
      >
        Выйти
      </button>

      <div className="mt-6">
        <button
          onClick={() => setShowFeedbacks(!showFeedbacks)}
          className="px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors"
        >
          {showFeedbacks ? 'Скрыть обратную связь' : 'Показать обратную связь'}
        </button>

        {showFeedbacks && (
          <div className="mt-4">
            {/* Здесь будет компонент FeedbackList, который нужно будет создать отдельно */}
            {/* <FeedbackList token={token} userId={userData._id} /> */}
            <p>Компонент обратной связи будет добавлен позже</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
