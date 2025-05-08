import { useState } from 'react';
import SessionList from './SessionList';
import SessionCreate from './SessionCreate';
import SessionJoin from './SessionJoin';
import FeedbackForm from './FeedbackForm';
import FeedbackResults from './FeedbackResults';

function SessionManager({ token }) {
  const [activeView, setActiveView] = useState('list'); // list, create, join, feedback, results
  const [selectedSession, setSelectedSession] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Обработчик создания новой сессии
  const handleSessionCreated = () => {
    // Переключаемся на список сессий и обновляем его
    setActiveView('list');
    setRefreshTrigger((prev) => prev + 1);
  };

  // Обработчик выбора сессии для присоединения
  const handleJoinSession = (session) => {
    setSelectedSession(session);
    setActiveView('join');
  };

  // Обработчик выбора роли в сессии
  const handleRoleSelected = () => {
    // Переключаемся на список сессий и обновляем его
    setActiveView('list');
    setRefreshTrigger((prev) => prev + 1);
  };

  // Обработчик отмены выбора роли
  const handleCancelJoin = () => {
    setSelectedSession(null);
    setActiveView('list');
  };

  // Обработчик для открытия формы обратной связи
  const handleOpenFeedbackForm = (session) => {
    setSelectedSession(session);
    setActiveView('feedback');
  };

  // Обработчик для открытия результатов обратной связи
  const handleOpenFeedbackResults = (session) => {
    setSelectedSession(session);
    setActiveView('results');
  };

  // Обработчик успешной отправки обратной связи
  const handleFeedbackSubmitted = () => {
    setActiveView('list');
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">
          Управление сессиями
        </h2>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-3 font-medium text-sm focus:outline-none ${
            activeView === 'list'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('list')}
        >
          Список сессий
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm focus:outline-none ${
            activeView === 'create'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('create')}
        >
          Создать сессию
        </button>
      </div>

      <div className="p-4">
        {activeView === 'list' && (
          <SessionList
            token={token}
            onJoinSession={handleJoinSession}
            onOpenFeedbackForm={handleOpenFeedbackForm}
            onOpenFeedbackResults={handleOpenFeedbackResults}
            key={refreshTrigger} // Для принудительного обновления при изменении refreshTrigger
          />
        )}

        {activeView === 'create' && (
          <SessionCreate
            token={token}
            onSessionCreated={handleSessionCreated}
          />
        )}

        {activeView === 'join' && selectedSession && (
          <SessionJoin
            token={token}
            session={selectedSession}
            onRoleSelected={handleRoleSelected}
            onCancel={handleCancelJoin}
          />
        )}

        {activeView === 'feedback' && selectedSession && (
          <FeedbackForm
            token={token}
            sessionId={selectedSession.id}
            onSubmitSuccess={handleFeedbackSubmitted}
            onCancel={() => setActiveView('list')}
          />
        )}

        {activeView === 'results' && selectedSession && (
          <FeedbackResults
            token={token}
            sessionId={selectedSession.id}
            onBack={() => setActiveView('list')}
          />
        )}
      </div>
    </div>
  );
}

export default SessionManager;
