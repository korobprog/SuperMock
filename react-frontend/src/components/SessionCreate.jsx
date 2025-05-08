import { useState } from 'react';

function SessionCreate({ token, onSessionCreated }) {
  const [videoLink, setVideoLink] = useState('');
  const [startTime, setStartTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoLink,
          startTime: startTime
            ? new Date(startTime).toISOString()
            : new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не удалось создать сессию');
      }

      const sessionData = await response.json();
      setSuccess(true);
      setVideoLink('');
      setStartTime('');

      // Вызываем функцию обратного вызова с данными новой сессии
      if (onSessionCreated) {
        onSessionCreated(sessionData);
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
          Создать новую сессию
        </h3>
      </div>

      <div className="p-6">
        {success && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
            Сессия успешно создана!
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            Ошибка: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="videoLink"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ссылка на видеоконференцию:
            </label>
            <input
              type="text"
              id="videoLink"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Время начала:
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Если не указано, будет использовано текущее время
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Создание...' : 'Создать сессию'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SessionCreate;
