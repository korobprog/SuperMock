'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

// Определение типов для пропсов компонента
interface FeedbackResultsProps {
  token: string | null;
  sessionId: string;
  onBack: () => void;
}

// Типы для рейтингов
interface Ratings {
  preparation: number;
  communication: number;
  technicalSkills: number;
  problemSolving: number;
  overall: number;
  [key: string]: number; // Для динамического доступа к свойствам
}

// Типы для данных обратной связи
interface Feedback {
  id: string;
  userId: string;
  ratings: Ratings;
  comments: string;
  recommendations: string;
  [key: string]: any; // Для динамических обновлений
}

// Типы для сессии
interface Session {
  id: string;
  interviewerId: string;
  intervieweeId: string;
  observerIds?: string[];
  [key: string]: any;
}

// Типы для данных, получаемых от API
interface FeedbackData {
  feedbacks: Feedback[];
  bothSidesSubmitted: boolean;
  session: Session;
}

// Типы для событий WebSocket
interface FeedbackUpdatedEvent {
  sessionId: string;
  feedbackId: string;
  updates: Partial<Feedback>;
  newFeedback?: Feedback;
}

interface SessionCompletedEvent {
  sessionId: string;
}

function FeedbackResults({ token, sessionId, onBack }: FeedbackResultsProps) {
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  // Счетчик обновлений в реальном времени
  const [realTimeUpdates, setRealTimeUpdates] = useState<number>(0);

  // Используем хук useSocket для подписки на обновления обратной связи
  const {
    connected,
    isSubscribed,
    error: socketError,
  } = useSocket({
    sessionId,
    events: {
      // Обработчик события обновления обратной связи
      'feedback-updated': (data: FeedbackUpdatedEvent) => {
        console.log('Получено обновление обратной связи:', data);
        if (data.sessionId === sessionId) {
          // Обновляем данные без перезагрузки с сервера
          setFeedbackData((prevData) => {
            if (!prevData) return null;

            // Создаем новый объект с обновленными данными
            const updatedFeedbacks = prevData.feedbacks.map((feedback) =>
              feedback.id === data.feedbackId
                ? { ...feedback, ...data.updates }
                : feedback
            );

            // Если это новый отзыв, добавляем его
            if (
              !updatedFeedbacks.some((f) => f.id === data.feedbackId) &&
              data.newFeedback
            ) {
              updatedFeedbacks.push(data.newFeedback);
            }

            // Проверяем, заполнены ли обе стороны
            const bothSidesSubmitted =
              updatedFeedbacks.some(
                (f) => f.userId === prevData.session.interviewerId
              ) &&
              updatedFeedbacks.some(
                (f) => f.userId === prevData.session.intervieweeId
              );

            return {
              ...prevData,
              feedbacks: updatedFeedbacks,
              bothSidesSubmitted,
            };
          });

          // Увеличиваем счетчик обновлений
          setRealTimeUpdates((prev) => prev + 1);
        }
      },
      // Обработчик события завершения сессии
      'session-completed': (data: SessionCompletedEvent) => {
        if (data.sessionId === sessionId) {
          // Перезагружаем данные с сервера, так как сессия завершена
          fetchFeedbackResults();
        }
      },
    },
  });

  // Функция для загрузки данных обратной связи
  const fetchFeedbackResults = async (): Promise<void> => {
    console.log('FeedbackResults: token =', token);
    if (!token || !sessionId) {
      console.log(
        'FeedbackResults: token или sessionId отсутствуют, прерываем запрос'
      );
      setLoading(false);
      return;
    }

    try {
      console.log('FeedbackResults: отправляем запрос с token =', token);
      const response = await fetch(`/api/sessions/${sessionId}/feedback`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось получить результаты обратной связи');
      }

      const data = await response.json();
      setFeedbackData(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchFeedbackResults();
  }, [token, sessionId]);

  // Функция для отображения рейтинга в виде звездочек
  const renderRating = (rating: number): React.ReactElement => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-500 text-xl">
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
        <span className="ml-1 text-gray-600">({rating})</span>
      </div>
    );
  };

  // Функция для получения названия роли
  const getRoleName = (userId: string, session: Session): string => {
    if (userId === session.interviewerId) return 'Интервьюер';
    if (userId === session.intervieweeId) return 'Интервьюируемый';
    if (session.observerIds && session.observerIds.includes(userId))
      return 'Наблюдатель';
    return 'Неизвестная роль';
  };

  // Функция для получения среднего рейтинга
  const getAverageRating = (ratings: Ratings): string => {
    if (!ratings || Object.keys(ratings).length === 0) return '0';

    const sum = Object.values(ratings).reduce((acc, val) => acc + val, 0);
    return (sum / Object.keys(ratings).length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Отображаем ошибку HTTP запроса или WebSocket соединения
  if (error || socketError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-lg mb-4">
        <p className="font-bold">Ошибка</p>
        <p>{error || socketError}</p>
        {socketError && (
          <p className="mt-2 text-sm">
            <span className="font-medium">Статус WebSocket:</span>{' '}
            {connected ? 'Подключен' : 'Отключен'}
          </p>
        )}
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors"
        >
          Вернуться
        </button>
      </div>
    );
  }

  if (!feedbackData) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center mb-4">
        <p className="text-gray-600">Нет данных для отображения</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
        >
          Вернуться
        </button>
      </div>
    );
  }

  const { feedbacks, bothSidesSubmitted, session } = feedbackData;

  if (!bothSidesSubmitted) {
    return (
      <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 p-6 rounded-lg shadow-md mb-4">
        <h2 className="text-xl font-bold mb-4">Результаты пока недоступны</h2>
        <p className="mb-4">
          Результаты обратной связи будут доступны после того, как обе стороны
          (интервьюер и интервьюируемый) заполнят формы обратной связи.
        </p>
        <div className="flex flex-col space-y-2 mb-4">
          <div className="flex items-center">
            <span className="font-medium mr-2">Интервьюер:</span>
            {feedbacks.some((f) => f.userId === session.interviewerId) ? (
              <span className="text-green-600">✓ Заполнено</span>
            ) : (
              <span className="text-red-600">✗ Не заполнено</span>
            )}
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">Интервьюируемый:</span>
            {feedbacks.some((f) => f.userId === session.intervieweeId) ? (
              <span className="text-green-600">✓ Заполнено</span>
            ) : (
              <span className="text-red-600">✗ Не заполнено</span>
            )}
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
        >
          Вернуться
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800">
          Результаты обратной связи
        </h2>

        {/* Индикатор статуса WebSocket и обновлений */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Статус:</span>
            {connected ? (
              <span className="flex items-center text-green-600 text-sm">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                Онлайн
              </span>
            ) : (
              <span className="flex items-center text-red-600 text-sm">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span>
                Офлайн
              </span>
            )}
          </div>

          {isSubscribed && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Сессия:</span>{' '}
              {sessionId.substring(0, 8)}...
            </div>
          )}

          {realTimeUpdates > 0 && (
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              Обновлений: {realTimeUpdates}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {feedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-700">
                {getRoleName(feedback.userId, session)}
              </h3>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Средняя оценка: {getAverageRating(feedback.ratings)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {Object.entries(feedback.ratings).map(([category, rating]) => (
                <div key={category} className="flex flex-col">
                  <span className="text-gray-700 font-medium capitalize">
                    {category === 'preparation' && 'Подготовка'}
                    {category === 'communication' && 'Коммуникация'}
                    {category === 'technicalSkills' && 'Технические навыки'}
                    {category === 'problemSolving' && 'Решение проблем'}
                    {category === 'overall' && 'Общая оценка'}
                  </span>
                  {renderRating(rating)}
                </div>
              ))}
            </div>

            {feedback.comments && (
              <div className="mb-3 bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-gray-700 mb-1">Комментарии:</h4>
                <p className="text-gray-600">{feedback.comments}</p>
              </div>
            )}

            {feedback.recommendations && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-gray-700 mb-1">
                  Рекомендации:
                </h4>
                <p className="text-gray-600">{feedback.recommendations}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Вернуться к списку сессий
        </button>
      </div>
    </div>
  );
}

export default FeedbackResults;
