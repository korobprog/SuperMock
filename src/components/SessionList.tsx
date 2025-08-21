'use client';

import { useState, useEffect, FC } from 'react';
import { useSocket } from '../hooks/useSocket';
import Link from 'next/link';

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

interface SessionListProps {
  token: string | null;
  onJoinSession: (session: Session) => void;
  onOpenFeedbackForm: (session: Session) => void;
  onOpenFeedbackResults: (session: Session) => void;
}

const SessionList: FC<SessionListProps> = ({
  token,
  onJoinSession,
  onOpenFeedbackForm,
  onOpenFeedbackResults,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Используем хук для WebSocket
  const { socket, connected, subscribe } = useSocket({
    events: {
      'session-updated': handleSessionUpdated,
      'session-created': handleSessionCreated,
    },
  });

  // Обработчик обновления сессии через WebSocket
  function handleSessionUpdated(updatedSession: Session) {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
  }

  // Обработчик создания новой сессии через WebSocket
  function handleSessionCreated(newSession: Session) {
    setSessions((prevSessions) => [...prevSessions, newSession]);
  }

  // Загрузка списка сессий
  useEffect(() => {
    const fetchSessions = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Загружаем информацию о текущем пользователе
        const userResponse = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Не удалось загрузить данные пользователя');
        }

        const userData = await userResponse.json();
        setUserId(userData.id);

        // Загружаем список сессий
        const sessionsResponse = await fetch('/api/sessions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!sessionsResponse.ok) {
          throw new Error('Не удалось загрузить список сессий');
        }

        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);
      } catch (err) {
        setError((err as Error).message);
        console.error('Ошибка при загрузке сессий:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [token]);

  // Функция для форматирования даты
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Функция для определения роли пользователя в сессии
  const getUserRole = (session: Session): string => {
    if (!userId) return 'неизвестно';
    if (session.interviewerId === userId) return 'int.';
    if (session.intervieweeId === userId) return 'соискатель';
    if (session.observerIds?.includes(userId)) return 'наблюдатель';
    return 'не участвует';
  };

  // Функция для определения статуса сессии
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Ожидает участников';
      case 'scheduled':
        return 'Запланирована';
      case 'active':
        return 'Активна';
      case 'completed':
        return 'Завершена';
      case 'cancelled':
        return 'Отменена';
      default:
        return status;
    }
  };

  // Функция для определения, может ли пользователь присоединиться к сессии
  const canJoinSession = (session: Session): boolean => {
    if (!userId) return false;
    if (session.status === 'completed' || session.status === 'cancelled')
      return false;

    // Если пользователь уже участвует в сессии, он не может присоединиться снова
    if (
      session.interviewerId === userId ||
      session.intervieweeId === userId ||
      session.observerIds?.includes(userId)
    ) {
      return false;
    }

    return true;
  };

  // Функция для определения, может ли пользователь оставить отзыв
  const canLeaveFeedback = (session: Session): boolean => {
    if (!userId) return false;
    if (session.status !== 'completed') return false;

    // Только участники сессии могут оставлять отзывы
    return (
      session.interviewerId === userId ||
      session.intervieweeId === userId ||
      session.observerIds?.includes(userId) ||
      false
    );
  };

  // Функция для определения, может ли пользователь просмотреть отзывы
  const canViewFeedback = (session: Session): boolean => {
    if (!userId) return false;
    if (session.status !== 'completed') return false;

    // Только участники сессии могут просматривать отзывы
    return (
      session.interviewerId === userId ||
      session.intervieweeId === userId ||
      session.observerIds?.includes(userId) ||
      false
    );
  };

  // Функция для определения, может ли пользователь присоединиться к видеочату
  const canJoinVideoChat = (session: Session): boolean => {
    if (!userId) return false;
    if (session.status !== 'active') return false;

    // Только участники сессии могут присоединиться к видеочату
    return (
      session.interviewerId === userId ||
      session.intervieweeId === userId ||
      session.observerIds?.includes(userId) ||
      false
    );
  };

  if (loading) {
    return <div className="loading">Загрузка сессий...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="empty-list">
        <p>Нет доступных сессий</p>
        <p>Создайте новую сессию, чтобы начать</p>
      </div>
    );
  }

  return (
    <div className="sessions-list">
      <h3 className="text-lg font-semibold mb-4">Доступные сессии</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ваша роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(session.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      session.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : session.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {getStatusText(session.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getUserRole(session)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {canJoinSession(session) && (
                      <button
                        onClick={() => onJoinSession(session)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Присоединиться
                      </button>
                    )}
                    {canJoinVideoChat(session) && (
                      <Link
                        href={`/video-chat/${session.id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Видеочат
                      </Link>
                    )}
                    {canLeaveFeedback(session) && (
                      <button
                        onClick={() => onOpenFeedbackForm(session)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Оставить отзыв
                      </button>
                    )}
                    {canViewFeedback(session) && (
                      <button
                        onClick={() => onOpenFeedbackResults(session)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Просмотреть отзывы
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionList;
