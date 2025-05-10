import { useState, useEffect } from 'react';

function RoleSelector({ session, onRoleSelect, disabled = false }) {
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');

  // Проверяем, вошел ли пользователь через Google
  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setIsGoogleUser(!!userData.googleId);
        }
      } catch (error) {
        console.error('Ошибка при проверке Google аутентификации:', error);
      }
    };

    checkGoogleAuth();
  }, []);

  // Проверяем доступность ролей
  const isInterviewerAvailable = !session.interviewerId && isGoogleUser;
  const isInterviewerTaken = !!session.interviewerId; // Исправлено: роль занята, если есть interviewerId
  const isIntervieweeAvailable = !session.intervieweeId;
  // Наблюдателей может быть сколько угодно

  const handleRoleChange = (role) => {
    // Проверяем, может ли пользователь выбрать роль "interviewer"
    if (role === 'interviewer' && !isGoogleUser) {
      setError(
        'Для выбора роли Собеседующего необходимо войти через Google аккаунт'
      );
      return;
    }

    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedRole) {
      setError('Пожалуйста, выберите роль');
      return;
    }

    onRoleSelect(selectedRole);
  };

  return (
    <div className="w-full">
      {!isGoogleUser && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md mb-4 border border-yellow-300">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Внимание!</span>
          </div>
          <p className="mt-1">
            Для выбора роли Собеседующего и генерации ссылок на Видео Чат
            необходимо войти через Google аккаунт.
          </p>
          <a
            href="/auth/google"
            className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Войти через Google
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Выберите роль:
          </p>

          <div className="space-y-2">
            <label
              className={`flex items-center p-3 rounded-md border ${
                !isInterviewerAvailable
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="interviewer"
                checked={selectedRole === 'interviewer'}
                onChange={() => handleRoleChange('interviewer')}
                disabled={!isInterviewerAvailable || disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="font-medium">Собеседующий</span>
                {!isGoogleUser && (
                  <span className="ml-2 text-sm text-red-500">
                    (требуется Google аккаунт)
                  </span>
                )}
                {isGoogleUser && !isInterviewerTaken && (
                  <span className="ml-2 text-sm text-green-500">
                    (доступно)
                  </span>
                )}
                {isInterviewerTaken && (
                  <span className="ml-2 text-sm text-red-500">(занято)</span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Проводит собеседование и задает вопросы.
                  <span className="text-indigo-600 font-medium">
                    {' '}
                    Может генерировать ссылки на видеозвонки Видео Чат.
                  </span>
                </p>
                {!isGoogleUser && (
                  <p className="text-xs text-red-500 mt-1">
                    <strong>Важно:</strong> Для выбора этой роли необходимо
                    войти в аккаунт. Это требуется для доступа к API Видео Чат.
                    <a
                      href="/auth/google"
                      className="ml-1 text-blue-500 underline block mt-1"
                    >
                      Войти через Google
                    </a>
                  </p>
                )}
              </div>
            </label>

            <label
              className={`flex items-center p-3 rounded-md border ${
                !isIntervieweeAvailable
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="interviewee"
                checked={selectedRole === 'interviewee'}
                onChange={() => handleRoleChange('interviewee')}
                disabled={!isIntervieweeAvailable || disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="font-medium">Отвечающий</span>
                {!isIntervieweeAvailable && (
                  <span className="ml-2 text-sm text-red-500">(занято)</span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Отвечает на вопросы и решает задачи
                </p>
              </div>
            </label>

            <label className="flex items-center p-3 rounded-md border bg-white hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="observer"
                checked={selectedRole === 'observer'}
                onChange={() => handleRoleChange('observer')}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="font-medium">Наблюдатель</span>
                <p className="text-xs text-gray-500 mt-1">
                  Наблюдает за процессом собеседования
                </p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedRole || disabled}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            !selectedRole || disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Выбрать роль
        </button>
      </form>
    </div>
  );
}

export default RoleSelector;
