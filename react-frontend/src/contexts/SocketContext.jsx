import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Создаем контекст для Socket.IO
export const SocketContext = createContext(null);

export const SocketProvider = ({ children, token }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 секунды

  useEffect(() => {
    // Если нет токена, не создаем соединение
    if (!token) {
      setSocket(null);
      setConnected(false);
      return;
    }

    // Создаем новое соединение с сервером
    const socketInstance = io('http://localhost:9877', {
      auth: { token },
      transports: ['polling'], // Используем только polling транспорт
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: reconnectDelay * 2,
      timeout: 20000, // Увеличиваем таймаут до 20 секунд
      forceNew: true, // Принудительно создаем новое соединение
    });

    // Обработчики событий Socket.IO
    socketInstance.on('connect', () => {
      console.log('WebSocket соединение установлено');
      setConnected(true);
      setError(null);
      setReconnectAttempts(0); // Сбрасываем счетчик попыток при успешном подключении
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Ошибка подключения WebSocket:', err.message);
      setConnected(false);
      setError(err.message);
      setReconnectAttempts((prev) => prev + 1);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('WebSocket соединение закрыто:', reason);
      setConnected(false);

      // Если разрыв соединения произошел не по инициативе клиента, пытаемся переподключиться
      if (reason !== 'io client disconnect') {
        console.log('Попытка автоматического переподключения...');
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

    socketInstance.on('reconnect_error', (err) => {
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
  const contextValue = {
    socket,
    connected,
    error,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnect,
    // Вспомогательные методы
    joinSession: (sessionId) => {
      if (socket && connected) {
        socket.emit('join-session', sessionId);
      }
    },
    leaveSession: (sessionId) => {
      if (socket && connected) {
        socket.emit('leave-session', sessionId);
      }
    },
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
