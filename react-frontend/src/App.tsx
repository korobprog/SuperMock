import { useState, useEffect, FC } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import './App.css';
// Импорт компонентов с указанием расширений для ясности
import Register from './components/Register.jsx';
import Login from './components/Login';
import UserProfile from './components/UserProfile.jsx';
import SessionManager from './components/SessionManager.jsx';
import AuthCallback from './components/AuthCallback.jsx';
import VideoChat from './components/VideoChat';
import { SocketProvider } from './contexts/SocketContext';
import './components/Auth.css';

// Добавим отладочный лог для проверки загрузки компонента
console.log('App.tsx загружен');

// Определение типов для компонентов
interface RegisterProps {
  onRegisterSuccess: (token: string) => void;
}

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

interface UserProfileProps {
  token: string | null;
  onLogout: () => void;
}

interface SessionManagerProps {
  token: string | null;
}

const App: FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [apiData, setApiData] = useState<string>('Загрузка данных...');
  const navigate = useNavigate();

  useEffect(() => {
    // Добавляем отладочное логирование для API запросов
    console.log('=== ОТЛАДКА API ЗАПРОСОВ ===');
    console.log('Выполняем fetch запрос к /api');
    console.log('Текущий URL:', window.location.href);
    console.log('Базовый URL:', window.location.origin);

    fetch('/api')
      .then((response) => {
        console.log(
          'Получен ответ от API:',
          response.status,
          response.statusText
        );
        console.log('Заголовки ответа:', response.headers);
        return response.text();
      })
      .then((data) => {
        console.log('Данные от API:', data);
        setApiData(data);
      })
      .catch((error) => {
        console.error('Ошибка при запросе к API:', error);
        setApiData('Ошибка при загрузке данных: ' + error.message);
      });
  }, []);

  // Проверяем токен при изменении и в URL
  useEffect(() => {
    // Проверяем наличие токена в URL (для Google OAuth)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
      // Сохраняем токен из URL в localStorage
      localStorage.setItem('token', urlToken);
      // Удаляем токен из URL для безопасности
      navigate('/', { replace: true });
      // Устанавливаем токен и статус аутентификации
      setToken(urlToken);
      setIsAuthenticated(true);
    } else {
      // Если токена в URL нет, проверяем localStorage
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
      setIsAuthenticated(!!storedToken);
    }
  }, [navigate]);

  const handleLoginSuccess = (token: string): void => {
    setToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const MainContent: FC = () => (
    <>
      <div>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Тренировочные собеседования</h1>

      <div className="card">
        <h2>Данные с сервера:</h2>
        <p>{apiData}</p>
      </div>

      <div className="auth-container">
        {isAuthenticated ? (
          <div className="authenticated-content">
            <UserProfile token={token} onLogout={handleLogout} />
            <SessionManager token={token} />
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Вход
              </button>
              <button
                className={`auth-tab ${
                  activeTab === 'register' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('register')}
              >
                Регистрация
              </button>
            </div>

            {activeTab === 'login' ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Register onRegisterSuccess={handleLoginSuccess} />
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <Routes>
      <Route path="/" element={<MainContent />} />
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route
        path="/video-chat/:sessionId?"
        element={
          isAuthenticated ? (
            <SocketProvider token={token}>
              <VideoChat />
            </SocketProvider>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
