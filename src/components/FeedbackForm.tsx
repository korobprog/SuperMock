'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';

// Определение типов для пропсов компонента
interface FeedbackFormProps {
  token: string | null;
  sessionId: string | number;
  onSubmitSuccess?: () => void;
  onCancel: () => void;
}

// Типы для рейтингов
interface Ratings {
  preparation: number;
  communication: number;
  technicalSkills: number;
  problemSolving: number;
  overall: number;
}

// Типы для данных формы
interface FormData {
  ratings: Ratings;
  comments: string;
  recommendations: string;
}

// Тип для активной секции
type ActiveSection = 'ratings' | 'comments' | 'recommendations';

function FeedbackForm({
  token,
  sessionId,
  onSubmitSuccess,
  onCancel,
}: FeedbackFormProps) {
  const [formData, setFormData] = useState<FormData>({
    ratings: {
      preparation: 0,
      communication: 0,
      technicalSkills: 0,
      problemSolving: 0,
      overall: 0,
    },
    comments: '',
    recommendations: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('ratings');

  const handleRatingChange = (category: keyof Ratings, value: number): void => {
    setFormData((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: parseInt(value.toString(), 10),
      },
    }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Получаем userId из токена или из пропсов
      const userId = getUserIdFromToken(token);
      
      // Определяем toUserId (пока используем тот же userId, но в реальности нужно получать из сессии)
      const toUserId = userId; // TODO: получить правильный toUserId из сессии

      const payload = {
        sessionId,
        fromUserId: userId,
        toUserId: toUserId,
        ratings: formData.ratings,
        comments: formData.comments,
        recommendations: formData.recommendations,
      };

      const response = await fetch(`/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Не удалось отправить обратную связь'
        );
      }

      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Вспомогательная функция для получения userId из токена
  const getUserIdFromToken = (token: string): number => {
    try {
      // Простая реализация - в реальности нужно декодировать JWT токен
      // Пока возвращаем 1 как заглушку
      return 1;
    } catch (error) {
      console.error('Error parsing token:', error);
      return 1;
    }
  };

  const renderRatingInput = (
    category: keyof Ratings,
    label: string,
    description?: string
  ): React.ReactElement => {
    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gray-800 font-semibold">{label}</label>
          <span className="text-sm text-gray-500">
            {formData.ratings[category] > 0
              ? `Оценка: ${formData.ratings[category]}/5`
              : 'Не оценено'}
          </span>
        </div>

        {description && (
          <p className="text-gray-600 text-sm mb-3">{description}</p>
        )}

        <div className="flex justify-between items-center">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRatingChange(category, value)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                formData.ratings[category] === value
                  ? 'bg-blue-600 text-white shadow-md transform scale-110'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="bg-green-50 p-6 rounded-lg text-center mb-6">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Обратная связь успешно отправлена!
          </h3>
          <p className="text-green-700">
            Благодарим за ваш отзыв. Он поможет улучшить качество сессий.
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={onCancel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors shadow-sm"
          >
            Вернуться к списку сессий
          </button>
        </div>
      </div>
    );
  }

  // Функция для проверки заполнения всех оценок
  const allRatingsCompleted = (): boolean => {
    return Object.values(formData.ratings).every((rating) => rating > 0);
  };

  // Функция для перехода к следующему разделу
  const goToNextSection = (): void => {
    if (activeSection === 'ratings') {
      setActiveSection('comments');
    } else if (activeSection === 'comments') {
      setActiveSection('recommendations');
    }
  };

  // Функция для перехода к предыдущему разделу
  const goToPrevSection = (): void => {
    if (activeSection === 'recommendations') {
      setActiveSection('comments');
    } else if (activeSection === 'comments') {
      setActiveSection('ratings');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">
        Форма обратной связи
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-lg mb-6">
          <p className="font-bold">Ошибка</p>
          <p>{error}</p>
        </div>
      )}

      {/* Индикатор прогресса */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <div className="text-sm font-medium text-blue-600">Оценки</div>
          <div className="text-sm font-medium text-gray-500">Комментарии</div>
          <div className="text-sm font-medium text-gray-500">Рекомендации</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{
              width:
                activeSection === 'ratings'
                  ? '33%'
                  : activeSection === 'comments'
                  ? '66%'
                  : '100%',
            }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Раздел с оценками */}
        {activeSection === 'ratings' && (
          <div className="mb-6 transition-opacity duration-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Оценки (от 1 до 5)
            </h3>
            {renderRatingInput(
              'preparation',
              'Подготовка',
              'Оцените уровень подготовки к сессии'
            )}
            {renderRatingInput(
              'communication',
              'Коммуникация',
              'Оцените качество коммуникации во время сессии'
            )}
            {renderRatingInput(
              'technicalSkills',
              'Технические навыки',
              'Оцените уровень технических навыков'
            )}
            {renderRatingInput(
              'problemSolving',
              'Решение проблем',
              'Оцените способность решать проблемы'
            )}
            {renderRatingInput(
              'overall',
              'Общая оценка',
              'Дайте общую оценку сессии'
            )}

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={goToNextSection}
                disabled={!allRatingsCompleted()}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  allRatingsCompleted()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Раздел с комментариями */}
        {activeSection === 'comments' && (
          <div className="mb-6 transition-opacity duration-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Комментарии
            </h3>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <label
                htmlFor="comments"
                className="block text-gray-800 font-semibold mb-2"
              >
                Ваши комментарии о сессии
              </label>
              <p className="text-gray-600 text-sm mb-3">
                Поделитесь своими мыслями о прошедшей сессии. Что было хорошо?
                Что можно улучшить?
              </p>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                rows={6}
                placeholder="Ваши комментарии о сессии..."
              ></textarea>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={goToPrevSection}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={goToNextSection}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Раздел с рекомендациями */}
        {activeSection === 'recommendations' && (
          <div className="mb-6 transition-opacity duration-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Рекомендации
            </h3>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <label
                htmlFor="recommendations"
                className="block text-gray-800 font-semibold mb-2"
              >
                Ваши рекомендации для улучшения
              </label>
              <p className="text-gray-600 text-sm mb-3">
                Какие рекомендации вы можете дать для улучшения навыков и
                будущих сессий?
              </p>
              <textarea
                id="recommendations"
                name="recommendations"
                value={formData.recommendations}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                rows={6}
                placeholder="Ваши рекомендации для улучшения..."
              ></textarea>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={goToPrevSection}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Назад
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Отправка...
                  </div>
                ) : (
                  'Отправить обратную связь'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default FeedbackForm;
