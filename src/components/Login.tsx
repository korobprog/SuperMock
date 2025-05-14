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
    <div className="flex justify-center items-center bg-gray-900 w-full">
      <div className="w-full max-w-md p-4 sm:p-8 rounded-lg bg-gray-800 shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Вход</h2>

        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            Вход выполнен успешно!
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  placeholder="Пароль"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 sm:py-3 px-4 text-sm sm:text-base rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200"
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">Или</span>
                </div>
              </div>

              <a
                href="/api/auth/google"
                className="mt-4 w-full flex justify-center items-center py-2 sm:py-3 px-3 sm:px-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
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
    </div>
  );
};

export default Login;
