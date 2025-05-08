import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';
import Register from './components/Register';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import SessionManager from './components/SessionManager';
import './components/Auth.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [activeTab, setActiveTab] = useState('login');
  const [apiData, setApiData] = useState('Загрузка данных...');

  useEffect(() => {
    fetch('/api')
      .then((response) => response.text())
      .then((data) => setApiData(data))
      .catch((error) =>
        setApiData('Ошибка при загрузке данных: ' + error.message)
      );
  }, []);

  const handleLoginSuccess = (token) => {
    setToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
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
}

export default App;
