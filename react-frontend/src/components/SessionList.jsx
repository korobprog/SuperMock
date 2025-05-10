import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from '../hooks/useSocket';

function SessionList({
  token,
  onJoinSession,
  onOpenFeedbackForm,
  onOpenFeedbackResults,
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userFeedbackStatus, setUserFeedbackStatus] = useState({});
  const [sessionFeedbackStatus, setSessionFeedbackStatus] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [generatingVideoLink, setGeneratingVideoLink] = useState(null); // ID сессии, для которой генерируется ссылка
  const [videoLinkError, setVideoLinkError] = useState(null); // Ошибка при генерации ссылки
  const [manualVideoLinks, setManualVideoLinks] = useState({}); // Ручные ссылки на видеозвонок для каждой сессии

  // Выносим функцию fetchSessions из useEffect, чтобы использовать ее для обновления списка
  const fetchSessions = useCallback(async () => {
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

      const response = await fetch('/api/sessions', {
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
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Ошибка при разборе JSON:', parseError);
        throw new Error(`Ошибка при разборе JSON: ${parseError.message}`);
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
      setError(error.message || 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Функция для получения профиля пользователя с информацией о статусе обратной связи
  const fetchUserProfile = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/user', {
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
  const handleSessionUpdated = useCallback((data) => {
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
        return [...updatedSessions, data.session];
      }

      return updatedSessions;
    });

    // Не вызываем checkSessionFeedbackStatus здесь, так как это будет сделано в useEffect
  }, []);

  // Обработчик события feedback-required
  const handleFeedbackRequired = useCallback(
    (data) => {
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
  const handleVideoLinkUpdated = useCallback((data) => {
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
  }, []);

  // Используем useEffect для первоначальной загрузки данных
  useEffect(() => {
    fetchSessions();
    fetchUserProfile();
  }, [token]); // Используем только token как зависимость, так как обе функции зависят от него

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
    let reconnectInterval;

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
  // Используем useCallback для мемоизации функции checkSessionFeedbackStatus
  const checkSessionFeedbackStatus = useCallback(
    async (sessionId) => {
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
        const response = await fetch(`/api/sessions/${sessionId}/feedback`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
  const generateVideoLink = async (sessionId, manualLink = null) => {
    if (!token || !sessionId) return;

    setGeneratingVideoLink(sessionId);
    setVideoLinkError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          manualLink: manualLink || '',
        }),
      });

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
        throw new Error(`Ошибка при разборе JSON: ${parseError.message}`);
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

      return data.videoLink;
    } catch (error) {
      console.error('Ошибка при генерации ссылки на видеозвонок:', error);
      setVideoLinkError(error.message);
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
  }, [sessions, token, checkSessionFeedbackStatus]);

  const getStatusText = (status) => {
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

  const getStatusColor = (status) => {
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

  const formatDate = (dateString) => {
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
              <div className="p-4">
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

                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Дата начала:</span>{' '}
                    {formatDate(session.startTime)}
                  </p>

                  {/* Отображение ссылки на Видео Чат, если она есть */}
                  {session.videoLink && (
                    <div className="mt-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-700">
                          <span className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Видео Чат
                          </span>
                        </p>
                        <div className="flex items-center space-x-2">
                          {/* Статус ссылки */}
                          {session.videoLinkStatus && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                session.videoLinkStatus === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : session.videoLinkStatus === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {session.videoLinkStatus === 'active'
                                ? 'Активна'
                                : session.videoLinkStatus === 'expired'
                                ? 'Истекла'
                                : 'Ручная'}
                            </span>
                          )}

                          {/* Метка "Только просмотр" для наблюдателей */}
                          {session.observerIds &&
                            session.observerIds.includes(
                              userFeedbackStatus.userId
                            ) && (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                Только просмотр
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Уведомления о статусе ссылки */}
                      {session.videoLinkStatus === 'expired' && (
                        <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-2">
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
                                Ссылка на видеозвонок истекла
                              </p>
                              {session.interviewerId ===
                                userFeedbackStatus.userId && (
                                <p className="text-xs text-red-700 mt-1">
                                  Ссылка истекла, сгенерируйте новую.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Предупреждение для автоматически сгенерированных ссылок */}
                      {session.videoLinkStatus === 'active' &&
                        !session.videoLink.includes(
                          'meet.google.com/lookup/'
                        ) && (
                          <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-md p-2">
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
                                  Автоматически сгенерированная ссылка
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                  Если, возникнет ошибка, создайте встречу
                                  вручную через Google Meet или любые другие
                                  сирвисы введите ссылку ниже.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      <div className="flex flex-col space-y-2">
                        <a
                          href={session.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 truncate hover:text-gray-700"
                        >
                          {session.videoLink}
                        </a>
                        {(session.videoLinkStatus === 'active' ||
                          session.videoLinkStatus === 'manual') && (
                          <button
                            onClick={() =>
                              window.open(session.videoLink, '_blank')
                            }
                            className="w-full py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center transition-colors duration-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Присоединиться к видеозвонку
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Уведомление о необходимости заполнить форму обратной связи */}
                {showFeedbackReminder && (
                  <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
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
                          Необходимо заполнить форму обратной связи
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Пожалуйста, заполните форму обратной связи для этой
                          сессии.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Собеседующий</p>
                    <p className="text-sm font-medium">
                      {session.interviewerId ? 'Занято' : 'Свободно'}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Отвечающий</p>
                    <p className="text-sm font-medium">
                      {session.intervieweeId ? 'Занято' : 'Свободно'}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500">Наблюдатели</p>
                    <p className="text-sm font-medium">
                      {session.observerIds ? session.observerIds.length : 0}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
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
                      className="py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                      Отзыв
                    </button>
                  </div>

                  {/* Кнопки и поле для управления ссылкой на видеозвонок (только для интервьюера) */}
                  {session.interviewerId === userFeedbackStatus.userId && (
                    <div className="mt-3 space-y-3">
                      {/* Поле для ввода ручной ссылки */}
                      <div className="flex flex-col space-y-2">
                        <label
                          htmlFor={`manual-link-${session.id}`}
                          className="text-xs text-gray-600 font-medium"
                        >
                          Ручная ссылка на видеозвонок (резервный вариант)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            id={`manual-link-${session.id}`}
                            type="text"
                            placeholder="https://meet.google.com/xxx-xxxx-xxx"
                            value={manualVideoLinks[session.id] || ''}
                            onChange={(e) =>
                              setManualVideoLinks((prev) => ({
                                ...prev,
                                [session.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={() => {
                              generateVideoLink(
                                session.id,
                                manualVideoLinks[session.id]
                              );
                              setManualVideoLinks((prev) => ({
                                ...prev,
                                [session.id]: '',
                              }));
                            }}
                            disabled={
                              !manualVideoLinks[session.id] ||
                              generatingVideoLink === session.id
                            }
                            className={`px-3 py-2 rounded-md text-white font-medium ${
                              !manualVideoLinks[session.id] ||
                              generatingVideoLink === session.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            Сохранить
                          </button>
                        </div>
                      </div>

                      {/* Кнопка для генерации/обновления ссылки */}
                      <button
                        onClick={() => generateVideoLink(session.id)}
                        disabled={generatingVideoLink === session.id}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium flex items-center justify-center
                          ${
                            generatingVideoLink === session.id
                              ? 'bg-gray-400 cursor-not-allowed'
                              : session.videoLink &&
                                session.videoLinkStatus !== 'expired'
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                      >
                        {generatingVideoLink === session.id ? (
                          <>
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
                            Генерация...
                          </>
                        ) : session.videoLink ? (
                          session.videoLinkStatus === 'expired' ? (
                            'Сгенерировать новую ссылку'
                          ) : (
                            'Обновить ссылку на видеозвонок'
                          )
                        ) : (
                          'Сгенерировать ссылку на видеозвонок'
                        )}
                      </button>
                    </div>
                  )}

                  {/* Информационное сообщение для пользователей, которые не являются интервьюерами */}
                  {session.interviewerId !== userFeedbackStatus.userId && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                      <p className="text-xs text-blue-800">
                        <svg
                          className="inline-block h-4 w-4 mr-1 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {!session.videoLink ||
                        session.videoLinkStatus === 'pending'
                          ? 'Ссылка на видеозвонок будет доступна после выбора Собеседующего'
                          : 'Ссылка на видеозвонок может быть сгенерирована только пользователем в роли интервьюера'}
                      </p>
                    </div>
                  )}

                  {/* Эта секция удалена, так как она дублирует функциональность, которая теперь включена в блок выше */}

                  {/* Сообщение об ошибке при генерации ссылки */}
                  {videoLinkError && session.id === generatingVideoLink && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
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
                            Ошибка при генерации ссылки
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            {videoLinkError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
}

export default SessionList;
