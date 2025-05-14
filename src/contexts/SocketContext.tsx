'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Используем переменную окружения для URL бэкенда
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Определяем тип для контекста
interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnect: () => void;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  // Методы для работы с календарем
  subscribeToCalendarUpdates: () => void;
  unsubscribeFromCalendarUpdates: () => void;
}

// Расширяем тип Error для поддержки дополнительных свойств
interface SocketError extends Error {
  data?: any;
}

// Создаем контекст для Socket.IO
export const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
  token: string | null;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  token,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 секунды

  useEffect(() => {
    // Если нет токена, не создаем соединение
    if (!token) {
      console.log('SocketContext: Токен отсутствует, соединение не создается');
      setSocket(null);
      setConnected(false);
      return;
    }

    console.log(
      'SocketContext: Попытка создания WebSocket соединения с токеном:',
      token ? `${token.substring(0, 10)}...` : 'отсутствует'
    );

    // Проверяем наличие /socket.io/ в URL
    const socketURL = BACKEND_URL.endsWith('/')
      ? BACKEND_URL
      : `${BACKEND_URL}/`;
    console.log(`SocketContext: Итоговый URL для Socket.IO: ${socketURL}`);

    const socketInstance = io(socketURL, {
      auth: { token },
      transports: ['polling', 'websocket'], // Поддержка обоих транспортов
      upgrade: true, // Разрешаем обновление до WebSocket
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: reconnectDelay * 2,
      timeout: 30000, // Увеличиваем таймаут до 30 секунд
      forceNew: true, // Принудительно создаем новое соединение
    });

    // Обработчики событий Socket.IO
    socketInstance.on('connect', () => {
      console.log('SocketContext: WebSocket соединение установлено');
      console.log(
        'SocketContext: Используемый транспорт:',
        socketInstance.io.engine?.transport?.name
      );
      console.log('SocketContext: ID сокета:', socketInstance.id);
      setConnected(true);
      setError(null);
      setReconnectAttempts(0); // Сбрасываем счетчик попыток при успешном подключении
    });

    socketInstance.on('connect_error', (err: SocketError) => {
      console.error('SocketContext: Ошибка подключения WebSocket:', err);
      console.error('SocketContext: Сообщение ошибки:', err.message);
      if (err.data) {
        console.error('SocketContext: Данные ошибки:', err.data);
      }

      setConnected(false);
      setError(`Ошибка подключения: ${err.message}`);
      setReconnectAttempts((prev) => prev + 1);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('SocketContext: WebSocket соединение закрыто:', reason);
      setConnected(false);

      // Если разрыв соединения произошел не по инициативе клиента, пытаемся переподключиться
      if (reason !== 'io client disconnect') {
        console.log(
          'SocketContext: Попытка автоматического переподключения...'
        );
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket переподключен после ${attemptNumber} попыток`);
      setConnected(true);
      setError(null);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Попытка переподключения WebSocket #${attemptNumber}`);
      setReconnectAttempts(attemptNumber);
    });

    socketInstance.on('reconnect_error', (err: Error) => {
      console.error('Ошибка при переподключении WebSocket:', err.message);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error(
        'Не удалось переподключиться к WebSocket после максимального количества попыток'
      );
      setError(
        'Не удалось восстановить соединение. Пожалуйста, обновите страницу.'
      );
    });

    // Сохраняем экземпляр Socket.IO в состоянии
    setSocket(socketInstance);

    // Очистка при размонтировании компонента
    return () => {
      if (socketInstance) {
        console.log('Закрытие WebSocket соединения');
        socketInstance.disconnect();
      }
    };
  }, [token]);

  // Функция для принудительного переподключения
  const reconnect = () => {
    if (socket) {
      console.log('Принудительное переподключение WebSocket...');
      socket.connect();
    }
  };

  // Значение контекста
  const contextValue: SocketContextType = {
    socket,
    connected,
    error,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnect,
    // Вспомогательные методы
    joinSession: (sessionId: string) => {
      if (socket && connected) {
        socket.emit('join-session', sessionId);
      }
    },
    leaveSession: (sessionId: string) => {
      if (socket && connected) {
        socket.emit('leave-session', sessionId);
      }
    },
    // Методы для работы с календарем
    subscribeToCalendarUpdates: () => {
      if (socket && connected) {
        socket.emit('subscribe-calendar');
      }
    },
    unsubscribeFromCalendarUpdates: () => {
      if (socket && connected) {
        socket.emit('unsubscribe-calendar');
      }
    },
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
