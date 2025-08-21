'use client';

import React, { useState, useEffect, FC } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface VideoLinkManagerProps {
  token: string;
  isInterviewer: boolean;
  sessionId?: string;
  onVideoLinkUpdated?: (videoLink: string) => void;
}

const VideoLinkManager: FC<VideoLinkManagerProps> = ({
  token,
  isInterviewer,
  sessionId: propSessionId,
  onVideoLinkUpdated,
}) => {
  const router = useRouter();
  const params = useParams();

  // Получаем sessionId из параметров URL или из пропсов
  const paramSessionId = params?.sessionId as string;
  const sessionId = propSessionId || paramSessionId;

  const [videoLink, setVideoLink] = useState<string>('');
  const [videoLinkStatus, setVideoLinkStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Загрузка текущей ссылки на видео при монтировании компонента
  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  // Получение данных сессии с сервера
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      console.log('VideoLinkManager: Начало запроса данных сессии');
      console.log('VideoLinkManager: ID сессии:', sessionId);

      // Добавляем дополнительные логи для отладки
      console.log(
        'VideoLinkManager: Текущий URL страницы:',
        typeof window !== 'undefined' ? window.location.href : 'SSR'
      );
      console.log(
        'VideoLinkManager: Текущий origin:',
        typeof window !== 'undefined' ? window.location.origin : 'SSR'
      );
      console.log(
        'VideoLinkManager: Текущий hostname:',
        typeof window !== 'undefined' ? window.location.hostname : 'SSR'
      );
      console.log(
        'VideoLinkManager: Текущий порт:',
        typeof window !== 'undefined' ? window.location.port : 'SSR'
      );
      console.log(
        'VideoLinkManager: Текущий протокол:',
        typeof window !== 'undefined' ? window.location.protocol : 'SSR'
      );

      // Проверяем, что sessionId определен и не пустой
      if (!sessionId) {
        console.error('VideoLinkManager: sessionId не определен или пустой');
        setError('Ошибка: ID сессии не определен');
        setLoading(false);
        return;
      }

      console.log('VideoLinkManager: Тип sessionId:', typeof sessionId);
      console.log('VideoLinkManager: Длина sessionId:', sessionId.length);

      // Проверяем, как формируется URL и как он обрабатывается
      const apiUrl = `/api/sessions/${sessionId}`;
      console.log(`VideoLinkManager: Запрос к API: ${apiUrl}`);
      console.log(
        'VideoLinkManager: Полный URL запроса:',
        typeof window !== 'undefined'
          ? `${window.location.origin}${apiUrl}`
          : `${apiUrl}`
      );

      // Проверяем, что токен определен
      if (!token) {
        console.error('VideoLinkManager: Токен авторизации отсутствует');
        setError('Ошибка: Токен авторизации отсутствует');
        setLoading(false);
        return;
      }

      console.log('VideoLinkManager: Начало выполнения fetch запроса');
      console.log('VideoLinkManager: URL для fetch:', apiUrl);
      console.log('VideoLinkManager: Тип URL:', typeof apiUrl);

      // В Next.js мы можем использовать относительные URL для API-запросов
      // Next.js автоматически обрабатывает их через свой прокси
      let response;
      try {
        response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('VideoLinkManager: Fetch запрос выполнен');

        console.log(
          'VideoLinkManager: Статус ответа API:',
          response.status,
          response.statusText
        );

        // Логируем заголовки ответа
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, name) => {
          responseHeaders[name] = value;
        });
        console.log('VideoLinkManager: Заголовки ответа:', responseHeaders);

        // Если ответ не OK, пытаемся получить текст ошибки
        if (!response.ok) {
          try {
            const errorText = await response.text();
            console.log('VideoLinkManager: Текст ошибки:', errorText);
          } catch (textError) {
            console.error(
              'VideoLinkManager: Не удалось получить текст ошибки:',
              textError
            );
          }
        }
      } catch (fetchError) {
        console.error(
          'VideoLinkManager: Ошибка при выполнении fetch запроса:',
          fetchError
        );
        if (fetchError instanceof Error) {
          console.error('VideoLinkManager: Тип ошибки:', fetchError.name);
          console.error(
            'VideoLinkManager: Сообщение ошибки:',
            fetchError.message
          );
          console.error('VideoLinkManager: Стек ошибки:', fetchError.stack);
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error('Не удалось получить данные сессии');
      }

      const data = await response.json();
      console.log('VideoLinkManager: Получен ответ от API:', data);

      if (data.videoLink) {
        setVideoLink(data.videoLink);
        console.log(
          'VideoLinkManager: Установлена ссылка на видео:',
          data.videoLink
        );
      }
      if (data.videoLinkStatus) {
        setVideoLinkStatus(data.videoLinkStatus);
        console.log(
          'VideoLinkManager: Установлен статус ссылки:',
          data.videoLinkStatus
        );
      }
      setError('');
    } catch (err) {
      console.error('Ошибка при получении данных сессии:', err);
      if (err instanceof Error) {
        console.error('VideoLinkManager: Тип ошибки:', err.name);
        console.error('VideoLinkManager: Сообщение ошибки:', err.message);
        console.error('VideoLinkManager: Стек ошибки:', err.stack);
      }
      setError('Не удалось загрузить данные сессии');
    } finally {
      setLoading(false);
    }
  };

  // Проверка, что ссылка не пустая
  const validateVideoLink = (link: string) => {
    if (!link.trim()) {
      setValidationMessage('Ссылка не может быть пустой');
      return false;
    }

    // Базовая проверка на URL
    try {
      new URL(link);
      return true;
    } catch (err) {
      console.error('Ошибка при валидации URL:', err);
      if (err instanceof Error) {
        console.error('VideoLinkManager: Тип ошибки:', err.name);
        console.error('VideoLinkManager: Сообщение ошибки:', err.message);
      }
      setValidationMessage('Введите корректный URL');
      return false;
    }
  };

  // Обновление ссылки на видео
  const updateVideoLink = async () => {
    if (!videoLink.trim()) {
      setError('Ссылка на видео не может быть пустой');
      return;
    }

    try {
      // Проверяем базовую валидность ссылки
      const isValid = validateVideoLink(videoLink);
      if (!isValid) {
        setError('Некорректная ссылка на видео');
        return;
      }

      setLoading(true);

      // Добавляем дополнительные логи для отладки
      console.log('VideoLinkManager: Обновление ссылки на видео');
      console.log('VideoLinkManager: ID сессии:', sessionId);
      console.log('VideoLinkManager: Новая ссылка:', videoLink);

      const apiUrl = `/api/sessions/${sessionId}/video`;
      console.log(`VideoLinkManager: Запрос к API для обновления: ${apiUrl}`);
      console.log(
        'VideoLinkManager: Токен авторизации для обновления:',
        token ? `${token.substring(0, 10)}...` : 'отсутствует'
      );

      // В Next.js мы можем использовать относительные URL для API-запросов
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manualLink: videoLink,
        }),
      });

      console.log(
        'VideoLinkManager: Статус ответа API при обновлении:',
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error('Не удалось обновить ссылку на видео');
      }

      const data = await response.json();
      setVideoLinkStatus(data.videoLinkStatus || 'manual');
      setError('');

      // Вызываем колбэк, если он предоставлен
      if (onVideoLinkUpdated) {
        onVideoLinkUpdated(videoLink);
      }

      setValidationMessage('Ссылка на видео успешно обновлена');
    } catch (err) {
      console.error('Ошибка при обновлении ссылки на видео:', err);
      if (err instanceof Error) {
        console.error('VideoLinkManager: Тип ошибки:', err.name);
        console.error('VideoLinkManager: Сообщение ошибки:', err.message);
        console.error('VideoLinkManager: Стек ошибки:', err.stack);
      }
      setError('Не удалось обновить ссылку на видео');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения поля ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoLink(e.target.value);
    setValidationMessage('');
    setError('');
  };

  // Обработчик нажатия на кнопку "Присоединиться"
  const handleJoinClick = () => {
    if (videoLink) {
      window.open(videoLink, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Видеосвязь</h3>

      {/* Форма для ввода ссылки (только для int.) */}
      {isInterviewer && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ссылка на видео (YouTube, Vimeo, Zoom и др.)
          </label>
          <div className="flex">
            <input
              type="text"
              value={videoLink}
              onChange={handleInputChange}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              onClick={updateVideoLink}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md font-medium"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>

          {/* Сообщение о валидации */}
          {validationMessage && (
            <p
              className={`mt-1 text-sm ${
                validationMessage.includes('успешно')
                  ? 'text-green-600'
                  : 'text-blue-600'
              }`}
            >
              {validationMessage}
            </p>
          )}

          {/* Сообщение об ошибке */}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

          <p className="mt-2 text-xs text-gray-500">
            Поддерживаются ссылки на YouTube, Vimeo, Zoom, Google Meet,
            Microsoft Teams и другие сервисы видеоконференций.
          </p>
        </div>
      )}

      {/* Информация о ссылке на видео (для всех участников) */}
      {videoLink ? (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Статус видеосвязи:
              </p>
              <p className="text-sm text-gray-600">
                {videoLinkStatus === 'manual'
                  ? 'Ссылка добавлена вручную'
                  : videoLinkStatus === 'active'
                  ? 'Активна'
                  : videoLinkStatus === 'pending'
                  ? 'Ожидание'
                  : videoLinkStatus === 'expired'
                  ? 'Истекла'
                  : 'Неизвестно'}
              </p>
            </div>
            <button
              onClick={handleJoinClick}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Присоединиться
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-gray-600">
            {isInterviewer
              ? 'Добавьте ссылку на видеоконференцию выше'
              : 'Ссылка на видеоконференцию еще не добавлена'}
          </p>
        </div>
      )}

      {/* Ссылка на встроенный WebRTC видеочат */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Встроенный видеочат:
        </p>
        <a
          href={
            typeof window !== 'undefined'
              ? `${window.location.origin}/video-chat/${sessionId}`
              : `/video-chat/${sessionId}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Открыть встроенный видеочат
        </a>
        <p className="mt-1 text-xs text-gray-500">
          Встроенный видеочат поддерживает до 4 участников с видео/аудио и
          демонстрацией экрана.
        </p>
      </div>
    </div>
  );
};

export default VideoLinkManager;
