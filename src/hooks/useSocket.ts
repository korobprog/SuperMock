'use client';

import { useContext, useEffect, useState, useCallback } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import { Socket } from 'socket.io-client';

// Типы для событий WebSocket
type EventHandler = (data: any) => void;
type EventsMap = Record<string, EventHandler>;

// Типы для опций хука
interface UseSocketOptions {
  sessionId?: string;
  events?: EventsMap;
  autoJoin?: boolean;
}

// Типы для возвращаемого значения хука
interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  isSubscribed: boolean;
  emit: (event: string, data: any) => boolean;
  subscribe: (event: string, handler: EventHandler) => void;
  unsubscribe: (event: string, handler?: EventHandler) => void;
  subscribeToSession: (sid: string) => void;
  unsubscribeFromSession: (sid: string) => void;
  reconnect: () => void;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastEventTimestamp: number | null;
  activeEvents: Record<string, EventHandler[]>;
}

/**
 * Хук для использования WebSocket соединения в компонентах React
 *
 * @param options - Опции хука
 * @param options.sessionId - ID сессии для подписки (опционально)
 * @param options.events - Объект с обработчиками событий в формате { eventName: handlerFunction }
 * @param options.autoJoin - Автоматически подписываться на сессию при монтировании (по умолчанию true)
 * @returns - Объект с состоянием соединения и методами для работы с WebSocket
 */
export const useSocket = ({
  sessionId,
  events = {},
  autoJoin = true,
}: UseSocketOptions = {}): UseSocketReturn => {
  const socketContext = useContext(SocketContext);

  if (!socketContext) {
    throw new Error('useSocket должен использоваться внутри SocketProvider');
  }

  const {
    socket,
    connected,
    error,
    joinSession,
    leaveSession,
    reconnect: contextReconnect,
    reconnectAttempts,
    maxReconnectAttempts,
  } = socketContext;

  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [activeEvents, setActiveEvents] = useState<
    Map<string, Set<EventHandler>>
  >(new Map());
  const [lastEventTimestamp, setLastEventTimestamp] = useState<number | null>(
    null
  );

  /**
   * Подписка на событие WebSocket
   * @param event - Название события
   * @param handler - Обработчик события
   */
  const subscribe = useCallback(
    (event: string, handler: EventHandler): void => {
      if (!socket || !connected) return;

      socket.on(event, handler);
      setActiveEvents((prev) => {
        const newMap = new Map(prev);
        if (!newMap.has(event)) {
          newMap.set(event, new Set());
        }
        newMap.get(event)?.add(handler);
        return newMap;
      });
    },
    [socket, connected]
  );

  /**
   * Отписка от события WebSocket
   * @param event - Название события
   * @param handler - Обработчик события (опционально, если не указан - отписываемся от всех обработчиков события)
   */
  const unsubscribe = useCallback(
    (event: string, handler?: EventHandler): void => {
      if (!socket) return;

      if (handler) {
        socket.off(event, handler);
        setActiveEvents((prev) => {
          const newMap = new Map(prev);
          if (newMap.has(event)) {
            const handlers = newMap.get(event);
            if (handlers) {
              handlers.delete(handler);
              if (handlers.size === 0) {
                newMap.delete(event);
              }
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
   * @param sid - ID сессии
   */
  const subscribeToSession = useCallback(
    (sid: string): void => {
      if (!socket || !connected || !sid) return;

      joinSession(sid);
      setIsSubscribed(true);
    },
    [socket, connected, joinSession]
  );

  /**
   * Отписка от сессии
   * @param sid - ID сессии
   */
  const unsubscribeFromSession = useCallback(
    (sid: string): void => {
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
   * @param event - Название события
   * @param data - Данные для отправки
   * @returns - Успешность отправки
   */
  const emit = useCallback(
    (event: string, data: any): boolean => {
      if (!socket || !connected) return false;

      socket.emit(event, data);
      return true;
    },
    [socket, connected]
  );

  /**
   * Переподключение WebSocket соединения
   */
  const reconnect = useCallback((): void => {
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
