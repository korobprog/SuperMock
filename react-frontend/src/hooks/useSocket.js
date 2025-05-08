import { useContext, useEffect, useState, useCallback } from 'react';
import { SocketContext } from '../contexts/SocketContext';

/**
 * Хук для использования WebSocket соединения в компонентах React
 *
 * @param {Object} options - Опции хука
 * @param {string} options.sessionId - ID сессии для подписки (опционально)
 * @param {Object} options.events - Объект с обработчиками событий в формате { eventName: handlerFunction }
 * @param {boolean} options.autoJoin - Автоматически подписываться на сессию при монтировании (по умолчанию true)
 * @returns {Object} - Объект с состоянием соединения и методами для работы с WebSocket
 *
 * @example
 * // Базовое использование
 * const { emit, connected } = useSocket();
 *
 * @example
 * // Подписка на сессию и события
 * const { emit, connected, isSubscribed } = useSocket({
 *   sessionId: 'session-123',
 *   events: {
 *     'new-feedback': (data) => console.log('Новый отзыв:', data),
 *     'session-update': (data) => console.log('Обновление сессии:', data)
 *   }
 * });
 *
 * @example
 * // Динамическая подписка на события
 * const { subscribe, unsubscribe } = useSocket();
 *
 * // Подписка на событие
 * useEffect(() => {
 *   const handler = (data) => console.log('Новые данные:', data);
 *   subscribe('new-data', handler);
 *
 *   return () => unsubscribe('new-data', handler);
 * }, []);
 */
export const useSocket = ({ sessionId, events = {}, autoJoin = true } = {}) => {
  const {
    socket,
    connected,
    error,
    joinSession,
    leaveSession,
    reconnect: contextReconnect,
    reconnectAttempts,
    maxReconnectAttempts,
  } = useContext(SocketContext);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeEvents, setActiveEvents] = useState(new Map());
  const [lastEventTimestamp, setLastEventTimestamp] = useState(null);

  /**
   * Подписка на событие WebSocket
   * @param {string} event - Название события
   * @param {Function} handler - Обработчик события
   */
  const subscribe = useCallback(
    (event, handler) => {
      if (!socket || !connected) return;

      socket.on(event, handler);
      setActiveEvents((prev) => {
        const newMap = new Map(prev);
        if (!newMap.has(event)) {
          newMap.set(event, new Set());
        }
        newMap.get(event).add(handler);
        return newMap;
      });
    },
    [socket, connected]
  );

  /**
   * Отписка от события WebSocket
   * @param {string} event - Название события
   * @param {Function} handler - Обработчик события (опционально, если не указан - отписываемся от всех обработчиков события)
   */
  const unsubscribe = useCallback(
    (event, handler) => {
      if (!socket) return;

      if (handler) {
        socket.off(event, handler);
        setActiveEvents((prev) => {
          const newMap = new Map(prev);
          if (newMap.has(event)) {
            newMap.get(event).delete(handler);
            if (newMap.get(event).size === 0) {
              newMap.delete(event);
            }
          }
          return newMap;
        });
      } else {
        socket.off(event);
        setActiveEvents((prev) => {
          const newMap = new Map(prev);
          newMap.delete(event);
          return newMap;
        });
      }
    },
    [socket]
  );

  /**
   * Подписка на сессию
   * @param {string} sid - ID сессии
   */
  const subscribeToSession = useCallback(
    (sid) => {
      if (!socket || !connected || !sid) return;

      joinSession(sid);
      setIsSubscribed(true);
    },
    [socket, connected, joinSession]
  );

  /**
   * Отписка от сессии
   * @param {string} sid - ID сессии
   */
  const unsubscribeFromSession = useCallback(
    (sid) => {
      if (!socket || !sid) return;

      leaveSession(sid);
      setIsSubscribed(false);
    },
    [socket, leaveSession]
  );

  // Подписка на события из опций
  useEffect(() => {
    if (!socket || !connected) return;

    // Регистрируем обработчики событий
    Object.entries(events).forEach(([event, handler]) => {
      subscribe(event, handler);
    });

    // Подписываемся на сессию, если указан sessionId и autoJoin=true
    if (sessionId && autoJoin) {
      subscribeToSession(sessionId);
    }

    // Очистка при размонтировании
    return () => {
      // Отписываемся от событий
      Object.entries(events).forEach(([event, handler]) => {
        unsubscribe(event, handler);
      });

      // Отписываемся от сессии, если были подписаны
      if (sessionId && isSubscribed) {
        unsubscribeFromSession(sessionId);
      }
    };
  }, [
    socket,
    connected,
    sessionId,
    autoJoin,
    events,
    subscribe,
    unsubscribe,
    subscribeToSession,
    unsubscribeFromSession,
    isSubscribed,
  ]);

  /**
   * Отправка события через WebSocket
   * @param {string} event - Название события
   * @param {any} data - Данные для отправки
   * @returns {boolean} - Успешность отправки
   */
  const emit = useCallback(
    (event, data) => {
      if (!socket || !connected) return false;

      socket.emit(event, data);
      return true;
    },
    [socket, connected]
  );

  /**
   * Переподключение WebSocket соединения
   */
  const reconnect = useCallback(() => {
    if (!socket) return;

    contextReconnect();

    // Обновляем временную метку последней попытки переподключения
    setLastEventTimestamp(Date.now());
  }, [socket, contextReconnect]);

  // Эффект для отслеживания активности соединения
  useEffect(() => {
    if (!socket || !connected) return;

    // Функция для проверки активности соединения
    const checkConnection = () => {
      // Если прошло более 30 секунд с последнего события, отправляем пинг
      const now = Date.now();
      if (lastEventTimestamp && now - lastEventTimestamp > 30000) {
        console.log('Проверка активности соединения...');
        socket.emit('ping', () => {
          console.log('Соединение активно');
          setLastEventTimestamp(now);
        });
      }
    };

    // Проверяем соединение каждые 30 секунд
    const interval = setInterval(checkConnection, 30000);

    // Обработчик для всех событий
    const handleAnyEvent = () => {
      setLastEventTimestamp(Date.now());
    };

    socket.onAny(handleAnyEvent);

    return () => {
      clearInterval(interval);
      socket.offAny(handleAnyEvent);
    };
  }, [socket, connected, lastEventTimestamp]);

  return {
    socket,
    connected,
    error,
    isSubscribed,
    emit,
    subscribe,
    unsubscribe,
    subscribeToSession,
    unsubscribeFromSession,
    reconnect,
    reconnectAttempts,
    maxReconnectAttempts,
    lastEventTimestamp,
    activeEvents: Object.fromEntries(
      Array.from(activeEvents.entries()).map(([key, value]) => [
        key,
        Array.from(value),
      ])
    ),
  };
};
