'use client';

import { useState, FC } from 'react';
import { useRouter } from 'next/navigation';

interface LoginProps {
  onLoginSuccess?: (token: string) => void;
}

const Login: FC<LoginProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const { email, password } = formData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Добавляем отладочное логирование для авторизации
      console.log('=== ОТЛАДКА АВТОРИЗАЦИИ ===');
      console.log('Выполняем fetch запрос к /api/login');
      console.log('Данные для авторизации:', {
        email,
        password: '***скрыто***',
      });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log(
        'Получен ответ от API авторизации:',
        response.status,
        response.statusText
      );

      const data = await response.json();
      console.log('Данные ответа (без токена):', {
        ...data,
        token: data.token ? '***скрыто***' : null,
      });

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при входе');
      }

      // Сохраняем токен в localStorage
      localStorage.setItem('token', data.token);

      setSuccess(true);

      // Вызываем функцию обратного вызова для обновления состояния в родительском компоненте
      if (onLoginSuccess) {
        onLoginSuccess(data.token);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Вход</h2>

      {success ? (
        <div className="success-message">Вход выполнен успешно!</div>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="login-email">Email:</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Пароль:</label>
              <input
                type="password"
                id="login-password"
                name="password"
                value={password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="w-full">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Или</span>
              </div>
            </div>

            <a
              href="/api/auth/google"
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={(e) => {
                // Предотвращаем стандартное поведение ссылки для логирования
                e.preventDefault();

                console.log('=== ОТЛАДКА GOOGLE АВТОРИЗАЦИИ ===');
                console.log('Нажата кнопка Google авторизации');
                console.log('URL для авторизации:', '/api/auth/google');
                console.log(
                  'Полный URL:',
                  window.location.origin + '/api/auth/google'
                );

                // После логирования продолжаем перенаправление
                window.location.href = '/api/auth/google';
              }}
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              Войти через Google
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default Login;
