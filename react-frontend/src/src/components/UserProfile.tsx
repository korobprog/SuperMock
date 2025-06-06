import { useState, useEffect, FC } from 'react';
import FeedbackList from './FeedbackList';

interface UserData {
  _id: string;
  email: string;
  createdAt: string;
  googleId?: string;
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
            <FeedbackList token={token} userId={userData._id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
