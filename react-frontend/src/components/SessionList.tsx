import { useState, useEffect, useCallback, useMemo } from 'react';
import React from 'react';
import { useSocket } from '../hooks/useSocket';

// Определение типов
interface Session {
  id: string;
  interviewerId: string | null;
  intervieweeId: string | null;
  observerIds?: string[];
  status: string;
  startTime: string;
  date: string; // Добавляем поле date для совместимости с SessionManager
  videoLink?: string;
  videoLinkStatus?: string;
}

interface UserFeedbackStatus {
  status: string;
  userId: string;
}

interface SessionFeedbackStatus {
  hasFeedback: boolean;
  bothSidesSubmitted: boolean;
}

interface Notification {
  id: number;
  type: string;
  sessionId: string;
  message: string;
}

interface SessionListProps {
  token: string | null;
  onJoinSession: (session: Session) => void;
  onOpenFeedbackForm: (session: Session) => void;
  onOpenFeedbackResults: (session: Session) => void;
}

// Явно указываем тип возвращаемого значения как React.ReactElement
const SessionList = ({
  token,
  onJoinSession,
  onOpenFeedbackForm,
  onOpenFeedbackResults,
}: SessionListProps): React.ReactElement => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [userFeedbackStatus, setUserFeedbackStatus] =
    useState<UserFeedbackStatus>({} as UserFeedbackStatus);
  const [sessionFeedbackStatus, setSessionFeedbackStatus] = useState<
    Record<string, SessionFeedbackStatus>
  >({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [generatingVideoLink, setGeneratingVideoLink] = useState<string | null>(
    null
  ); // ID сессии, для которой генерируется ссылка
  const [videoLinkError, setVideoLinkError] = useState<string | null>(null); // Ошибка при генерации ссылки
  const [manualVideoLinks, setManualVideoLinks] = useState<
    Record<string, string>
  >({});
  // Выносим функцию fetchSessions из useEffect, чтобы использовать ее для обновления списка
  const fetchSessions = useCallback(async (): Promise<void> => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Устанавливаем состояние загрузки
    setLoading(true);
    setError('');

    console.log(
      'Токен:',
      token ? `${token.substring(0, 10)}...` : 'отсутствует'
    );

    try {
      // Проверяем, что токен действителен (не пустой и не null)
      if (!token || token.trim() === '') {
        throw new Error('Токен отсутствует или недействителен');
      }

      // Выполняем запрос с явным указанием, что ожидаем JSON
      console.log(
        'Отправляем запрос на /api/sessions с токеном:',
        token.substring(0, 10) + '...'
      );

      console.log('Отправка запроса на API. Переменные окружения:', {
        VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
        MODE: import.meta.env.MODE,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD,
      });

      // Используем переменную окружения для URL бэкенда
      const apiUrl = import.meta.env.VITE_BACKEND_URL || '';
      const endpoint = `${apiUrl}/api/sessions`;
      console.log('Полный URL запроса:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json', // Явно указываем, что ожидаем JSON
        },
        credentials: 'include', // Включаем передачу куки
      });

      console.log('Статус ответа:', response.status);
      console.log(
        'Заголовки ответа:',
        Object.fromEntries(response.headers.entries())
      );

      // Проверяем тип контента ответа
      const contentType = response.headers.get('content-type');
      console.log('Тип контента:', contentType);

      // Получаем текст ответа для анализа
      const responseText = await response.text();
      console.log(
        'Текст ответа (первые 100 символов):',
        responseText.substring(0, 100)
      );

      // Если ответ не успешный, обрабатываем ошибку
      if (!response.ok) {
        let errorMessage = `Ошибка сервера: ${response.status}`;

        try {
          // Пытаемся распарсить ответ как JSON
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // Если не удалось распарсить как JSON, используем текст ответа
          console.error('Ответ не является JSON:', parseError);
          errorMessage = `${errorMessage} - ${responseText.substring(
            0,
            100
          )}...`;
        }

        throw new Error(errorMessage);
      }

      // Проверяем, что ответ в формате JSON
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Неверный формат ответа:', contentType);
        console.error('Содержимое ответа:', responseText);
        throw new Error(
          `Неверный формат ответа: ${contentType || 'не указан'}`
        );
      }

      // Парсим ответ как JSON
      let data: Session[];
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Ошибка при разборе JSON:', parseError);
        throw new Error(
          `Ошибка при разборе JSON: ${(parseError as Error).message}`
        );
      }

      console.log('Полученные данные:', data);

      // Сохраняем сессии
      setSessions(data);

      // Проверяем статус ссылок на видеозвонок для каждой сессии
      data.forEach(async (session) => {
        if (session.videoLink && session.videoLinkStatus === 'active') {
          try {
            const videoResponse = await fetch(
              `/api/sessions/${session.id}/video`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (videoResponse.ok) {
              const videoData = await videoResponse.json();

              // Если статус ссылки изменился, обновляем сессию в списке
              if (videoData.videoLinkStatus !== session.videoLinkStatus) {
                setSessions((prevSessions) => {
                  return prevSessions.map((s) => {
                    if (s.id === session.id) {
                      return {
                        ...s,
                        videoLinkStatus: videoData.videoLinkStatus,
                      };
                    }
                    return s;
                  });
                });
              }
            }
          } catch (error) {
            console.error(
              `Ошибка при проверке статуса ссылки для сессии ${session.id}:`,
              error
            );
          }
        }
      });
    } catch (error) {
      console.error('Ошибка при получении сессий:', error);
      setError(
        (error as Error).message || 'Произошла ошибка при загрузке данных'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Функция для получения профиля пользователя с информацией о статусе обратной связи
  const fetchUserProfile = useCallback(async (): Promise<void> => {
    if (!token) return;

    try {
      // Используем переменную окружения для URL бэкенда
      const apiUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${apiUrl}/api/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось получить профиль пользователя');
      }

      const userData = await response.json();

      // Сохраняем статус обратной связи пользователя
      if (userData.feedbackStatus) {
        setUserFeedbackStatus({
          status: userData.feedbackStatus,
          userId: userData.id,
        });
      }
    } catch (error) {
      console.error('Ошибка при получении профиля пользователя:', error);
    }
  }, [token]);

  // Обработчик события session-updated
  const handleSessionUpdated = useCallback(
    (data: { sessionId: string; session: Partial<Session> }): void => {
      console.log('Получено событие session-updated:', data);

      // Обновляем сессию в списке, если она уже есть
      setSessions((prevSessions) => {
        const updatedSessions = prevSessions.map((session) => {
          if (session.id === data.sessionId) {
            return { ...session, ...data.session };
          }
          return session;
        });

        // Если сессии нет в списке, добавляем ее
        const sessionExists = updatedSessions.some(
          (session) => session.id === data.sessionId
        );

        if (!sessionExists && data.session) {
          return [...updatedSessions, data.session as Session];
        }

        return updatedSessions;
      });

      // Не вызываем checkSessionFeedbackStatus здесь, так как это будет сделано в useEffect
    },
    []
  );

  // Обработчик события feedback-required
  const handleFeedbackRequired = useCallback(
    (data: { sessionId: string }): void => {
      console.log('Получено событие feedback-required:', data);

      // Добавляем уведомление
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'feedback-required',
          sessionId: data.sessionId,
          message: 'Необходимо заполнить форму обратной связи',
        },
      ]);

      // Обновляем статус обратной связи для сессии
      fetchUserProfile();
    },
    [fetchUserProfile]
  );

  // Обработчик события video-link-updated
  const handleVideoLinkUpdated = useCallback(
    (data: {
      sessionId: string;
      videoLink: string;
      videoLinkStatus: string;
    }): void => {
      console.log('Получено событие video-link-updated:', data);

      // Обновляем статус ссылки на видеозвонок в списке сессий
      setSessions((prevSessions) => {
        return prevSessions.map((session) => {
          if (session.id === data.sessionId) {
            return {
              ...session,
              videoLink: data.videoLink,
              videoLinkStatus: data.videoLinkStatus,
            };
          }
          return session;
        });
      });

      // Если статус ссылки изменился на 'expired', добавляем уведомление
      if (data.videoLinkStatus === 'expired') {
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: 'video-link-expired',
            sessionId: data.sessionId,
            message: 'Ссылка на видеозвонок истекла',
          },
        ]);
      }
    },
    []
  );

  // Используем useEffect для первоначальной загрузки данных
  useEffect(() => {
    fetchSessions();
    fetchUserProfile();
  }, [fetchSessions, fetchUserProfile]);

  // Мемоизируем объект events, чтобы он не создавался заново при каждом рендере
  const socketEvents = useMemo(
    () => ({
      'session-updated': handleSessionUpdated,
      'feedback-required': handleFeedbackRequired,
      'video-link-updated': handleVideoLinkUpdated,
    }),
    [handleSessionUpdated, handleFeedbackRequired, handleVideoLinkUpdated]
  );

  // Используем хук useSocket для подключения к WebSocket
  const { connected, reconnect, reconnectAttempts, maxReconnectAttempts } =
    useSocket({
      events: socketEvents,
    });

  // Эффект для автоматического переподключения при разрыве соединения
  useEffect(() => {
    let reconnectInterval: NodeJS.Timeout | undefined;

    if (!connected && reconnectAttempts < maxReconnectAttempts) {
      console.log('WebSocket соединение разорвано, попытка переподключения...');

      // Пытаемся переподключиться каждые 5 секунд, но только если не достигли максимального количества попыток
      reconnectInterval = setInterval(() => {
        console.log(
          `Попытка переподключения ${
            reconnectAttempts + 1
          }/${maxReconnectAttempts}...`
        );
        reconnect();
      }, 5000);
    }

    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, [connected, reconnect, reconnectAttempts, maxReconnectAttempts]);
  // Функция для проверки статуса обратной связи для сессии
  const checkSessionFeedbackStatus = useCallback(
    async (sessionId: string): Promise<void> => {
      if (!token || !sessionId) return;

      // Находим сессию по ID
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      // Проверяем, участвует ли пользователь в сессии
      const isUserParticipant =
        userFeedbackStatus.userId === session.interviewerId ||
        userFeedbackStatus.userId === session.intervieweeId ||
        (session.observerIds &&
          session.observerIds.includes(userFeedbackStatus.userId));

      // Если пользователь не участвует в сессии, устанавливаем статус "нет обратной связи" без запроса
      if (!isUserParticipant) {
        return setSessionFeedbackStatus((prev) => ({
          ...prev,
          [sessionId]: { hasFeedback: false, bothSidesSubmitted: false },
        }));
      }

      try {
        // Используем переменную окружения для URL бэкенда
        const apiUrl = import.meta.env.VITE_BACKEND_URL || '';
        const response = await fetch(
          `${apiUrl}/api/sessions/${sessionId}/feedback`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // Если ошибка 404 или 403, устанавливаем статус "нет обратной связи"
          if (response.status === 404 || response.status === 403) {
            return setSessionFeedbackStatus((prev) => ({
              ...prev,
              [sessionId]: { hasFeedback: false, bothSidesSubmitted: false },
            }));
          }

          // Для других ошибок пытаемся получить сообщение об ошибке
          try {
            const errorData = await response.json();
            throw new Error(
              errorData.message || 'Не удалось получить статус обратной связи'
            );
          } catch {
            throw new Error('Не удалось получить статус обратной связи');
          }
        }

        const data = await response.json();

        // Сохраняем статус обратной связи для сессии
        setSessionFeedbackStatus((prev) => ({
          ...prev,
          [sessionId]: {
            hasFeedback: data.feedbacks && data.feedbacks.length > 0,
            bothSidesSubmitted: data.bothSidesSubmitted || false,
          },
        }));
      } catch (error) {
        console.error('Ошибка при получении статуса обратной связи:', error);
        // Устанавливаем дефолтный статус при ошибке
        setSessionFeedbackStatus((prev) => ({
          ...prev,
          [sessionId]: { hasFeedback: false, bothSidesSubmitted: false },
        }));
      }
    },
    [token, sessions, userFeedbackStatus.userId]
  );

  // Функция для генерации ссылки на видеозвонок
  const generateVideoLink = async (
    sessionId: string,
    manualLink: string | null = null
  ): Promise<string | null> => {
    if (!token || !sessionId) return null;

    console.log('generateVideoLink: manualLink получен:', manualLink);

    setGeneratingVideoLink(sessionId);
    setVideoLinkError(null);

    try {
      // Используем переменную окружения для URL бэкенда
      const apiUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(
        `${apiUrl}/api/sessions/${sessionId}/video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            manualLink: manualLink || '',
          }),
        }
      );

      // Получаем текст ответа для анализа
      const responseText = await response.text();

      // Если ответ не успешный, обрабатываем ошибку
      if (!response.ok) {
        let errorMessage = `Ошибка сервера: ${response.status}`;

        try {
          // Пытаемся распарсить ответ как JSON
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // Если не удалось распарсить как JSON, используем текст ответа
          console.error('Ответ не является JSON:', parseError);
          errorMessage = `${errorMessage} - ${responseText.substring(
            0,
            100
          )}...`;
        }

        throw new Error(errorMessage);
      }

      // Парсим ответ как JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Ошибка при разборе JSON:', parseError);
        throw new Error(
          `Ошибка при разборе JSON: ${(parseError as Error).message}`
        );
      }

      // Обновляем сессию в списке
      setSessions((prevSessions) => {
        return prevSessions.map((session) => {
          if (session.id === sessionId) {
            return {
              ...session,
              videoLink: data.videoLink,
              videoLinkStatus: data.videoLinkStatus,
            };
          }
          return session;
        });
      });

      // Если была передана ручная ссылка, сохраняем её в состоянии
      if (manualLink) {
        console.log(
          'generateVideoLink: Сохраняем manualLink в состоянии:',
          manualLink
        );
        setManualVideoLinks((prev) => ({
          ...prev,
          [sessionId]: manualLink,
        }));
      }

      return data.videoLink;
    } catch (error) {
      console.error('Ошибка при генерации ссылки на видеозвонок:', error);
      setVideoLinkError((error as Error).message);
      return null;
    } finally {
      setGeneratingVideoLink(null);
    }
  };

  // Проверяем статус обратной связи для всех сессий
  useEffect(() => {
    if (sessions.length > 0) {
      sessions.forEach((session) => {
        checkSessionFeedbackStatus(session.id);
      });
    }
  }, [sessions, checkSessionFeedbackStatus]);

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Ожидание';
      case 'active':
        return 'Активна';
      case 'completed':
        return 'Завершена';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    // Форматируем дату без секунд
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24-часовой формат
    });
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse text-blue-600">
          Загрузка списка сессий...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-lg">
        <p className="font-medium">Ошибка:</p>
        <p>{error}</p>
        <button
          onClick={fetchSessions}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 mb-4">Нет доступных сессий</p>
        <button
          onClick={fetchSessions}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Обновить список
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Статус WebSocket соединения */}
      <div
        className={`mb-2 text-xs flex items-center ${
          connected ? 'text-green-600' : 'text-red-600'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-1 ${
            connected ? 'bg-green-600' : 'bg-red-600'
          }`}
        ></div>
        <span>
          {connected
            ? 'Подключено'
            : reconnectAttempts < maxReconnectAttempts
            ? `Отключено (попытка переподключения ${reconnectAttempts}/${maxReconnectAttempts})`
            : 'Отключено (не удалось переподключиться)'}
        </span>
        {!connected && reconnectAttempts >= maxReconnectAttempts && (
          <button
            onClick={() => {
              reconnect();
            }}
            className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Переподключиться
          </button>
        )}
      </div>

      {/* Уведомления об ошибках генерации ссылок */}
      {videoLinkError && (
        <div className="mb-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2 flex justify-between items-center">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-400 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Ошибка при генерации ссылки на видеозвонок
                </p>
                <p className="text-xs text-red-700 mt-1">{videoLinkError}</p>
              </div>
            </div>
            <button
              onClick={() => setVideoLinkError(null)}
              className="text-sm px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Уведомления */}
      {notifications.length > 0 && (
        <div className="mb-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2 flex justify-between items-center"
            >
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-yellow-400 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {notification.message}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Сессия: {notification.sessionId.substring(0, 8)}...
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNotifications(
                    notifications.filter((n) => n.id !== notification.id)
                  );

                  // Находим сессию и открываем форму обратной связи
                  const session = sessions.find(
                    (s) => s.id === notification.sessionId
                  );
                  if (session && notification.type === 'feedback-required') {
                    onOpenFeedbackForm(session);
                  }
                }}
                className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                Заполнить
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Список сессий</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {connected
              ? 'Обновляется автоматически'
              : 'Автообновление недоступно'}
          </span>
          <button
            onClick={fetchSessions}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Обновить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => {
          // Проверяем, участвовал ли пользователь в сессии
          const isUserParticipant =
            userFeedbackStatus.userId === session.interviewerId ||
            userFeedbackStatus.userId === session.intervieweeId ||
            (session.observerIds &&
              session.observerIds.includes(userFeedbackStatus.userId));

          // Проверяем, нужно ли показать уведомление о необходимости заполнить форму обратной связи
          const showFeedbackReminder =
            session.status === 'completed' &&
            isUserParticipant &&
            userFeedbackStatus.status === 'pending' &&
            (userFeedbackStatus.userId === session.interviewerId ||
              userFeedbackStatus.userId === session.intervieweeId);

          // Проверяем, доступны ли результаты обратной связи
          const feedbackResults = sessionFeedbackStatus[session.id];
          const showResultsButton =
            feedbackResults && feedbackResults.bothSidesSubmitted;

          return (
            <div
              key={session.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Содержимое карточки сессии */}
              <div className="p-4">
                {/* Заголовок с ID и статусом */}
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">
                    ID: {session.id.substring(0, 8)}...
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                      session.status
                    )}`}
                  >
                    {getStatusText(session.status)}
                  </span>
                </div>

                {/* Информация о сессии */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Дата начала:</span>{' '}
                    {formatDate(session.startTime)}
                  </p>

                  {/* Отображение ручной ссылки на видеозвонок, если она есть */}
                  {manualVideoLinks[session.id] && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Ручная ссылка:</span>{' '}
                        <a
                          href={manualVideoLinks[session.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 break-all"
                        >
                          {manualVideoLinks[session.id]}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Кнопки действий */}
                <div className="flex flex-col space-y-2">
                  {/* Индикатор генерации ссылки */}
                  {generatingVideoLink === session.id && (
                    <div className="text-xs text-blue-600 animate-pulse mb-2">
                      Генерация ссылки на видеозвонок...
                    </div>
                  )}

                  {/* Кнопка для генерации ссылки на видеозвонок */}
                  {session.status === 'active' && (
                    <button
                      onClick={() => {
                        // Запрашиваем у пользователя ручную ссылку (опционально)
                        const manualLink = window.prompt(
                          'Введите ссылку на видеозвонок (оставьте пустым для автоматической генерации):'
                        );

                        // Генерируем ссылку
                        generateVideoLink(session.id, manualLink || null).then(
                          (link) => {
                            if (link) {
                              // Если ссылка успешно сгенерирована, показываем сообщение
                              alert(
                                `Ссылка на видеозвонок успешно сгенерирована: ${link}`
                              );
                            }
                          }
                        );
                      }}
                      disabled={generatingVideoLink === session.id}
                      className={`w-full py-2 px-4 rounded-md text-white font-medium mb-2
                        ${
                          generatingVideoLink === session.id
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    >
                      {session.videoLink
                        ? 'Обновить ссылку'
                        : 'Создать ссылку на видеозвонок'}
                    </button>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => onJoinSession(session)}
                      disabled={session.status === 'completed'}
                      className={`flex-1 py-2 px-4 rounded-md text-white font-medium
                        ${
                          session.status === 'completed'
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                      Присоединиться
                    </button>
                    <button
                      onClick={() => onOpenFeedbackForm(session)}
                      className={`py-2 px-4 rounded-md text-white font-medium relative
                        ${
                          showFeedbackReminder
                            ? 'bg-yellow-600 hover:bg-yellow-700 animate-pulse'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                      Отзыв
                      {showFeedbackReminder && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          !
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Кнопка для просмотра результатов обратной связи */}
                  {showResultsButton && (
                    <button
                      onClick={() => onOpenFeedbackResults(session)}
                      className="w-full py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Результаты обратной связи
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionList;
