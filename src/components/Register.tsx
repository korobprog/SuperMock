'use client';

import { useState, FC, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface RegisterProps {
  onRegisterSuccess?: (token: string) => void;
}

const Register: FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const { email, password, confirmPassword } = formData;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    // Проверка длины пароля
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при регистрации');
      }

      // Сохраняем токен в localStorage
      localStorage.setItem('token', data.token);

      setSuccess(true);

      // Вызываем функцию обратного вызова для обновления состояния в родительском компоненте
      if (onRegisterSuccess) {
        onRegisterSuccess(data.token);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Регистрация</h2>

      {success ? (
        <div className="success-message">
          Регистрация успешна! Вы вошли в систему.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="w-full">
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Register;
