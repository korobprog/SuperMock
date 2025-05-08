import { useState } from 'react';
import RoleSelector from './RoleSelector';

function SessionJoin({ token, session, onRoleSelected, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRoleSelect = async (selectedRole) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/sessions/${session.id}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка при выборе роли:', errorData);

        // Формируем более информативное сообщение об ошибке
        let errorMessage = errorData.message || 'Не удалось выбрать роль';
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(true);

      // Вызываем функцию обратного вызова с данными обновленной сессии
      if (onRoleSelected) {
        onRoleSelected(data.session);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-50 p-4 border-b border-blue-100">
        <h3 className="text-xl font-semibold text-blue-800">
          Выбор роли для сессии
        </h3>
      </div>

      <div className="p-6">
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ID сессии:</p>
              <p className="font-medium">{session.id.substring(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Статус:</p>
              <p className="font-medium">{session.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Время начала:</p>
              <p className="font-medium">
                {new Date(session.startTime).toLocaleString()}
              </p>
            </div>
            {session.videoLink && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Ссылка на видео:</p>
                <a
                  href={session.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {session.videoLink}
                </a>
              </div>
            )}
          </div>
        </div>

        {success ? (
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-green-800 font-medium mb-4">
              Роль успешно выбрана!
            </p>
            <button
              onClick={() => onCancel()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Вернуться к списку сессий
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="font-bold">Ошибка при выборе роли</span>
                </div>
                <p>{error}</p>
                <p className="text-sm mt-2">
                  Пожалуйста, попробуйте еще раз или выберите другую роль.
                </p>
              </div>
            )}

            <RoleSelector
              session={session}
              onRoleSelect={handleRoleSelect}
              disabled={loading}
            />

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => onCancel()}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                Отмена
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SessionJoin;
