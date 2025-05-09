import { useState, useEffect } from 'react';

function SessionCreate({ token, onSessionCreated }) {
  const [videoLink, setVideoLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dateError, setDateError] = useState('');

  // Функция для форматирования даты в формат YYYY-MM-DD
  const formatDateForDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Функция для форматирования времени в формат HH:MM
  const formatTimeForTimeInput = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');

    // Округляем минуты до ближайших 10 минут
    let minutes = Math.ceil(date.getMinutes() / 10) * 10;
    if (minutes === 60) {
      minutes = 0;
      // Не изменяем часы здесь, так как это может привести к проблемам с датой
    }
    minutes = String(minutes).padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  // Функция для объединения даты и времени
  const combineDateAndTime = (dateString, timeString) => {
    if (!dateString || !timeString) return '';

    const [year, month, day] = dateString.split('-');
    const [hours, minutes] = timeString.split(':');

    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date;
  };

  // Состояния для отдельных полей даты и времени
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  // Инициализация dateValue и timeValue с минимальной допустимой датой при загрузке компонента
  useEffect(() => {
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 2);
    setDateValue(formatDateForDateInput(minDate));
    setTimeValue(formatTimeForTimeInput(minDate));
  }, []);

  // Функция для получения минимальной допустимой даты
  const getMinDate = () => {
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 2);
    return minDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoLink,
          startTime:
            dateValue && timeValue
              ? (() => {
                  // Создаем новую дату из выбранной даты и времени
                  const date = combineDateAndTime(dateValue, timeValue);
                  // Обнуляем секунды и миллисекунды
                  date.setSeconds(0, 0);
                  return date.toISOString();
                })()
              : (() => {
                  // Создаем новую дату из текущего времени
                  const date = new Date();
                  // Обнуляем секунды и миллисекунды
                  date.setSeconds(0, 0);
                  // Округляем минуты до ближайших 10 минут
                  const minutes = Math.ceil(date.getMinutes() / 10) * 10;
                  if (minutes === 60) {
                    date.setMinutes(0);
                    date.setHours(date.getHours() + 1);
                  } else {
                    date.setMinutes(minutes);
                  }
                  return date.toISOString();
                })(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не удалось создать сессию');
      }

      const sessionData = await response.json();
      setSuccess(true);
      setVideoLink('');
      setDateValue('');
      setTimeValue('');

      // Вызываем функцию обратного вызова с данными новой сессии
      if (onSessionCreated) {
        onSessionCreated(sessionData);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-50 p-4 border-b border-blue-100">
        <h3 className="text-xl font-semibold text-blue-800">
          Создать новую сессию
        </h3>
      </div>

      <div className="p-6">
        {success && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
            Сессия успешно создана!
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            Ошибка: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="videoLink"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ссылка на видеоконференцию:
            </label>
            <input
              type="text"
              id="videoLink"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-1 text-xs text-gray-500 space-y-1">
              <p>
                <span className="font-medium">
                  Это поле можно оставить пустым.
                </span>{' '}
                Ссылка на видеозвонок может быть сгенерирована позже.
              </p>
              <p>Правила использования:</p>
              <ul className="list-disc pl-5">
                <li>
                  Если поле оставлено пустым, вы сможете сгенерировать ссылку на
                  Google Meet после присоединения к сессии в роли интервьюера
                </li>
                <li>
                  Если у вас уже есть ссылка на Google Meet, вы можете указать
                  её здесь
                </li>
                <li>
                  Ссылка должна быть в формате
                  https://meet.google.com/xxx-xxxx-xxx
                </li>
                <li>
                  Кнопка для генерации ссылки появится только в списке сессий и
                  только для пользователя в роли интервьюера
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Время начала:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dateValue"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Дата:
                </label>
                <input
                  type="date"
                  id="dateValue"
                  value={dateValue}
                  onChange={(e) => {
                    const newDateValue = e.target.value;
                    setDateValue(newDateValue);

                    // Проверяем, что выбранная дата и время валидны
                    if (newDateValue && timeValue) {
                      const selectedDate = combineDateAndTime(
                        newDateValue,
                        timeValue
                      );
                      const minDate = getMinDate();

                      // Если выбранная дата меньше минимальной, показываем ошибку и устанавливаем минимальную
                      if (selectedDate < minDate) {
                        setDateError(
                          'Нельзя выбрать дату и время в прошлом. Минимальное время: текущее + 2 часа'
                        );
                        setDateValue(formatDateForDateInput(minDate));
                        setTimeValue(formatTimeForTimeInput(minDate));
                      } else {
                        setDateError('');
                      }
                    }
                  }}
                  min={formatDateForDateInput(getMinDate())}
                  className={`w-full px-3 py-2 border ${
                    dateError ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
              <div>
                <label
                  htmlFor="timeValue"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Время:
                </label>
                <input
                  type="time"
                  id="timeValue"
                  value={timeValue}
                  onChange={(e) => {
                    const newTimeValue = e.target.value;
                    setTimeValue(newTimeValue);

                    // Проверяем, что выбранная дата и время валидны
                    if (dateValue && newTimeValue) {
                      const selectedDate = combineDateAndTime(
                        dateValue,
                        newTimeValue
                      );
                      const minDate = getMinDate();

                      // Если выбранная дата меньше минимальной, показываем ошибку и устанавливаем минимальную
                      if (selectedDate < minDate) {
                        setDateError(
                          'Нельзя выбрать дату и время в прошлом. Минимальное время: текущее + 2 часа'
                        );
                        setDateValue(formatDateForDateInput(minDate));
                        setTimeValue(formatTimeForTimeInput(minDate));
                      } else {
                        setDateError('');

                        // Округляем минуты выбранного времени до ближайших 10 минут
                        const [hours, minutes] = newTimeValue
                          .split(':')
                          .map(Number);
                        const roundedMinutes = Math.ceil(minutes / 10) * 10;
                        if (roundedMinutes === 60) {
                          setTimeValue(
                            `${String(hours + 1).padStart(2, '0')}:00`
                          );
                        } else {
                          setTimeValue(
                            `${String(hours).padStart(2, '0')}:${String(
                              roundedMinutes
                            ).padStart(2, '0')}`
                          );
                        }
                      }
                    }
                  }}
                  step="600" // Шаг в 10 минут (600 секунд)
                  className={`w-full px-3 py-2 border ${
                    dateError ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
            {dateError && (
              <p className="mt-1 text-xs text-red-600">{dateError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Если не указано, будет использовано текущее время
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Создание...' : 'Создать сессию'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SessionCreate;
