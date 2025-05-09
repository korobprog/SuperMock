import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import './App.css';
import Register from './components/Register';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import SessionManager from './components/SessionManager';
import AuthCallback from './components/AuthCallback';
import './components/Auth.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [activeTab, setActiveTab] = useState('login');
  const [apiData, setApiData] = useState('Загрузка данных...');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api')
      .then((response) => response.text())
      .then((data) => setApiData(data))
      .catch((error) =>
        setApiData('Ошибка при загрузке данных: ' + error.message)
      );
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

  const handleLoginSuccess = (token) => {
    setToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const MainContent = () => (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
