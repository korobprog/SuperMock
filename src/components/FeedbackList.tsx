'use client';

import { useState, useEffect, FC } from 'react';

interface FeedbackListProps {
  token: string | null;
  userId: string;
}

interface Feedback {
  id: string;
  sessionId: string;
  createdAt: string;
  ratings: {
    preparation?: number;
    communication?: number;
    technicalSkills?: number;
    problemSolving?: number;
    overall?: number;
    [key: string]: number | undefined;
  };
  comments?: string;
  recommendations?: string;
}

const FeedbackList: FC<FeedbackListProps> = ({ token, userId }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!token || !userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${userId}/feedback`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Не удалось получить список обратной связи');
        }

        const data = await response.json();
        setFeedbacks(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [token, userId]);

  if (loading) {
    return <div className="text-center py-4">Загрузка обратной связи...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-lg">
        <p className="font-bold">Ошибка</p>
        <p>{error}</p>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <p className="text-gray-600">
          У вас пока нет полученной обратной связи.
        </p>
      </div>
    );
  }

  // Функция для отображения рейтинга в виде звездочек
  const renderRating = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-500">
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
        <span className="ml-1 text-gray-600">({rating})</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-blue-800">
        Полученная обратная связь
      </h3>

      {feedbacks.map((feedback) => (
        <div
          key={feedback.id}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="mb-2">
            <span className="text-gray-500 text-sm">
              Сессия: {feedback.sessionId.substring(0, 8)}...
            </span>
            <span className="text-gray-500 text-sm ml-4">
              {new Date(feedback.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {Object.entries(feedback.ratings).map(([category, rating]) => (
              <div key={category} className="flex flex-col">
                <span className="text-gray-700 capitalize">
                  {category === 'preparation' && 'Подготовка'}
                  {category === 'communication' && 'Коммуникация'}
                  {category === 'technicalSkills' && 'Технические навыки'}
                  {category === 'problemSolving' && 'Решение проблем'}
                  {category === 'overall' && 'Общая оценка'}
                </span>
                {rating !== undefined && renderRating(rating)}
              </div>
            ))}
          </div>

          {feedback.comments && (
            <div className="mb-3">
              <h4 className="font-medium text-gray-700 mb-1">Комментарии:</h4>
              <p className="text-gray-600">{feedback.comments}</p>
            </div>
          )}

          {feedback.recommendations && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Рекомендации:</h4>
              <p className="text-gray-600">{feedback.recommendations}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FeedbackList;
