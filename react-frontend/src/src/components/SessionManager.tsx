import { useState, FC } from 'react';
import SessionList from './SessionList';
import SessionCreate from './SessionCreate';
import SessionJoin from './SessionJoin';
import FeedbackForm from './FeedbackForm';
import FeedbackResults from './FeedbackResults';
import Calendar from './Calendar';
import { SocketProvider } from '../contexts/SocketContext';

interface Session {
  id: string;
  interviewerId: string | null;
  intervieweeId: string | null;
  observerIds?: string[];
  status: string;
  date: string;
  videoLink?: string;
  videoLinkStatus?: string;
}

interface SessionManagerProps {
  token: string | null;
}

const SessionManager: FC<SessionManagerProps> = ({ token }) => {
  const [activeView, setActiveView] = useState<string>('list'); // list, create, join, feedback, results, calendar
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Обработчик создания новой сессии
  const handleSessionCreated = (): void => {
    // Переключаемся на список сессий и обновляем его
    setActiveView('list');
    setRefreshTrigger((prev) => prev + 1);
  };

  // Обработчик выбора сессии для присоединения
  const handleJoinSession = (session: Session): void => {
    setSelectedSession(session);
    setActiveView('join');
  };

  // Обработчик выбора роли в сессии
  const handleRoleSelected = (): void => {
    // Переключаемся на список сессий и обновляем его
    setActiveView('list');
    setRefreshTrigger((prev) => prev + 1);
  };

  // Обработчик отмены выбора роли
  const handleCancelJoin = (): void => {
    setSelectedSession(null);
    setActiveView('list');
  };

  // Обработчик для открытия формы обратной связи
  const handleOpenFeedbackForm = (session: Session): void => {
    setSelectedSession(session);
    setActiveView('feedback');
  };

  // Обработчик для открытия результатов обратной связи
  const handleOpenFeedbackResults = (session: Session): void => {
    setSelectedSession(session);
    setActiveView('results');
  };

  // Обработчик успешной отправки обратной связи
  const handleFeedbackSubmitted = (): void => {
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
        <button
          className={`px-4 py-3 font-medium text-sm focus:outline-none ${
            activeView === 'calendar'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('calendar')}
        >
          Календарь
        </button>
      </div>

      <div className="p-4">
        {activeView === 'list' && (
          <SocketProvider token={token}>
            <SessionList
              token={token}
              onJoinSession={handleJoinSession}
              onOpenFeedbackForm={handleOpenFeedbackForm}
              onOpenFeedbackResults={handleOpenFeedbackResults}
              key={refreshTrigger} // Для принудительного обновления при изменении refreshTrigger
            />
          </SocketProvider>
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
          <>
            {console.log(
              'SessionManager: передаем token в FeedbackResults, token =',
              token
            )}
            <FeedbackResults
              token={token}
              sessionId={selectedSession.id}
              onBack={() => setActiveView('list')}
            />
          </>
        )}

        {activeView === 'calendar' && (
          <SocketProvider token={token}>
            <Calendar token={token} />
          </SocketProvider>
        )}
      </div>
    </div>
  );
};

export default SessionManager;
