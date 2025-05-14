'use client';

import { useState, FC } from 'react';
import { SocketProvider } from '../contexts/SocketContext';

// Примечание: Следующие компоненты нужно будет создать отдельно
// import SessionList from './SessionList';
// import SessionCreate from './SessionCreate';
// import SessionJoin from './SessionJoin';
// import FeedbackForm from './FeedbackForm';
// import FeedbackResults from './FeedbackResults';
// import Calendar from './Calendar';

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
            <div className="p-4 bg-yellow-100 rounded-md">
              <p className="text-yellow-800">
                Компонент SessionList будет добавлен позже
              </p>
              {/*
              <SessionList
                token={token}
                onJoinSession={handleJoinSession}
                onOpenFeedbackForm={handleOpenFeedbackForm}
                onOpenFeedbackResults={handleOpenFeedbackResults}
                key={refreshTrigger} // Для принудительного обновления при изменении refreshTrigger
              />
              */}
            </div>
          </SocketProvider>
        )}

        {activeView === 'create' && (
          <div className="p-4 bg-yellow-100 rounded-md">
            <p className="text-yellow-800">
              Компонент SessionCreate будет добавлен позже
            </p>
            {/* 
            <SessionCreate
              token={token}
              onSessionCreated={handleSessionCreated}
            />
            */}
          </div>
        )}

        {activeView === 'join' && selectedSession && (
          <div className="p-4 bg-yellow-100 rounded-md">
            <p className="text-yellow-800">
              Компонент SessionJoin будет добавлен позже
            </p>
            {/* 
            <SessionJoin
              token={token}
              session={selectedSession}
              onRoleSelected={handleRoleSelected}
              onCancel={handleCancelJoin}
            />
            */}
          </div>
        )}

        {activeView === 'feedback' && selectedSession && (
          <div className="p-4 bg-yellow-100 rounded-md">
            <p className="text-yellow-800">
              Компонент FeedbackForm будет добавлен позже
            </p>
            {/* 
            <FeedbackForm
              token={token}
              sessionId={selectedSession.id}
              onSubmitSuccess={handleFeedbackSubmitted}
              onCancel={() => setActiveView('list')}
            />
            */}
          </div>
        )}

        {activeView === 'results' && selectedSession && (
          <div className="p-4 bg-yellow-100 rounded-md">
            <p className="text-yellow-800">
              Компонент FeedbackResults будет добавлен позже
            </p>
            {/* 
            <FeedbackResults
              token={token}
              sessionId={selectedSession.id}
              onBack={() => setActiveView('list')}
            />
            */}
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="p-4 bg-yellow-100 rounded-md">
            <p className="text-yellow-800">
              Компонент Calendar будет добавлен позже
            </p>
            {/* 
            <SocketProvider token={token}>
              <Calendar token={token} />
            </SocketProvider>
            */}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager;
