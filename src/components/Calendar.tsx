'use client';

import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import { Socket } from 'socket.io-client';

// Определение типов
interface CalendarProps {
  token: string | null;
}

interface CalendarEntry {
  id: string;
  sessionId: string;
  videoLink: string | null;
  startTime: Date;
  participants: Array<any>; // Можно уточнить тип участников при необходимости
}

interface CalendarUpdate {
  calendarEntryId: string;
  sessionId: string;
  videoLink: string;
  startTime: string | Date;
  participants: Array<any>; // Можно уточнить тип участников при необходимости
}

// Определяем тип для SocketContext
interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnect: () => void;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  subscribeToCalendarUpdates: () => void;
  unsubscribeFromCalendarUpdates: () => void;
}

function Calendar({ token }: CalendarProps) {
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const socketContext = useContext(SocketContext) as SocketContextType | null;

  // Функция для форматирования даты
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Функция для получения записей календаря с сервера
  const fetchCalendarEntries = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('Calendar: Отправка запроса на API');

      // Используем относительный URL для API
      const endpoint = `/api/calendar`;
      console.log('Calendar: Полный URL запроса:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось получить данные календаря');
      }

      const data = await response.json();
      setCalendarEntries(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка при получении данных календаря:', err);
      setError(
        'Не удалось загрузить данные календаря. Пожалуйста, попробуйте позже.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Подписка на обновления календаря через WebSocket
  useEffect(() => {
    if (socketContext && socketContext.socket && socketContext.connected) {
      // Подписываемся на обновления календаря
      socketContext.subscribeToCalendarUpdates();

      // Обработчик события обновления календаря
      const handleCalendarUpdated = (update: CalendarUpdate) => {
        console.log('Получено обновление календаря:', update);
        // Обновляем список записей календаря
        setCalendarEntries((prevEntries) => {
          // Ищем запись с таким же ID
          const index = prevEntries.findIndex(
            (entry) => entry.id === update.calendarEntryId
          );

          if (index !== -1) {
            // Обновляем существующую запись
            const updatedEntries = [...prevEntries];
            updatedEntries[index] = {
              ...updatedEntries[index],
              videoLink: update.videoLink,
              startTime: new Date(update.startTime),
              participants: update.participants,
            };
            return updatedEntries;
          } else {
            // Добавляем новую запись, если она не найдена
            return [
              ...prevEntries,
              {
                id: update.calendarEntryId,
                sessionId: update.sessionId,
                videoLink: update.videoLink,
                startTime: new Date(update.startTime),
                participants: update.participants,
              },
            ];
          }
        });
      };

      // Регистрируем обработчик события
      socketContext.socket?.on('calendar-updated', handleCalendarUpdated);

      // Очистка при размонтировании компонента
      return () => {
        socketContext.unsubscribeFromCalendarUpdates();
        socketContext.socket?.off('calendar-updated', handleCalendarUpdated);
      };
    }
  }, [socketContext]);

  // Загружаем данные календаря при монтировании компонента
  useEffect(() => {
    if (token) {
      fetchCalendarEntries();
    }
  }, [token]);

  // Фильтруем записи календаря по выбранному месяцу и году
  const filteredEntries = calendarEntries.filter((entry) => {
    const entryDate = new Date(entry.startTime);
    return (
      entryDate.getMonth() === selectedMonth &&
      entryDate.getFullYear() === selectedYear
    );
  });

  // Генерируем список месяцев для выбора
  const months = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  // Генерируем список лет (текущий год и 5 лет вперед)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Календарь сессий
      </h2>

      {/* Фильтры по месяцу и году */}
      <div className="flex mb-4 space-x-4">
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Месяц
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Год
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Отображение ошибки */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Индикатор загрузки */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Список записей календаря */}
          {filteredEntries.length > 0 ? (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Сессия: {entry.sessionId}
                      </h3>
                      <p className="text-gray-600">
                        <span className="font-medium">Дата и время:</span>{' '}
                        {formatDate(entry.startTime)}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Участники:</span>{' '}
                        {entry.participants.length}
                      </p>
                    </div>
                    {entry.videoLink && (
                      <a
                        href={entry.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Присоединиться к видео
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Нет запланированных сессий на {months[selectedMonth]}{' '}
              {selectedYear}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Calendar;
