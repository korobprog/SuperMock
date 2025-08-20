import { v4 as uuidv4 } from 'uuid';
import { FRONTEND_URL, getRoomUrl, getRecordingUrl } from '../config/app';

// Интерфейс для параметров встречи
interface MeetingOptions {
  summary: string;
  startTime: Date;
  durationMinutes?: number;
}

// Интерфейс для результата проверки ссылки
interface UrlValidationResult {
  isValid: boolean;
  message: string;
}

// Интерфейс для статуса встречи
interface MeetingStatus {
  status: string;
  message: string;
}

// Интерфейс для комнаты WebRTC
interface WebRTCRoom {
  id: string;
  participants: string[];
  createdAt: Date;
  expiresAt: Date;
}

// Хранилище комнат WebRTC в памяти
const webRTCRooms = new Map<string, WebRTCRoom>();

/**
 * Создает новую WebRTC комнату для видеозвонка
 * @param options - Параметры встречи
 * @returns Ссылка на WebRTC комнату
 */
export async function createMeeting({
  summary,
  startTime,
  durationMinutes = 60,
}: MeetingOptions): Promise<string> {
  try {
    console.log('Создание WebRTC комнаты...');
    console.log('Параметры:', { summary, startTime, durationMinutes });

    // Проверяем параметры
    if (!summary) throw new Error('Не указано название встречи');
    if (!startTime) throw new Error('Не указано время начала встречи');
    if (!durationMinutes)
      throw new Error('Не указана продолжительность встречи');

    // Преобразуем startTime в объект Date, если это строка
    const startDateTime =
      typeof startTime === 'string' ? new Date(startTime) : startTime;

    // Вычисляем время окончания встречи
    const endDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60000
    );

    // Генерируем уникальный ID для комнаты
    const roomId = uuidv4().substring(0, 8);

    // Создаем новую комнату
    const room: WebRTCRoom = {
      id: roomId,
      participants: [],
      createdAt: new Date(),
      expiresAt: endDateTime,
    };

    // Сохраняем комнату в хранилище
    webRTCRooms.set(roomId, room);

    // Формируем ссылку на комнату
    const roomUrl = getRoomUrl(roomId);

    // Расширенное логирование для отладки
    console.log('Создана ссылка на WebRTC комнату:', roomUrl);
    console.log('ID комнаты:', roomId);
    console.log('Проверка валидности ссылки...');

    // Проверяем, пройдет ли сгенерированная ссылка валидацию
    const webRTCRegex = new RegExp(
      `^${FRONTEND_URL.replace(/\./g, '\\.')}\/video-chat\/[a-zA-Z0-9-]{8,}$`
    );
    console.log('Регулярное выражение для проверки:', webRTCRegex);
    console.log('Результат проверки:', webRTCRegex.test(roomUrl));

    return roomUrl;
  } catch (error: unknown) {
    console.error('Ошибка при создании WebRTC комнаты:', error);
    console.error('Стек ошибки:', (error as Error).stack);

    // Более детальная обработка ошибок
    if (error instanceof TypeError) {
      throw new Error(`Ошибка типа данных: ${(error as Error).message}`);
    } else if (error instanceof RangeError) {
      throw new Error(`Ошибка диапазона значений: ${(error as Error).message}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Синтаксическая ошибка: ${(error as Error).message}`);
    } else {
      throw new Error(
        `Ошибка при генерации ссылки на видеозвонок: ${
          (error as Error).message
        }`
      );
    }
  }
}

/**
 * Проверяет валидность ссылки на WebRTC комнату
 * @param url - Ссылка на WebRTC комнату
 * @returns Результат проверки
 */
export async function isValidMeetUrl(
  url: string
): Promise<UrlValidationResult> {
  try {
    if (!url) {
      return { isValid: false, message: 'Ссылка не указана' };
    }

    // Проверяем формат ссылки с помощью регулярного выражения
    // Поддерживаем как наши WebRTC ссылки, так и ссылки на другие сервисы
    const webRTCRegex = new RegExp(
      `^${FRONTEND_URL.replace(/\./g, '\\.')}\/video-chat\/[a-zA-Z0-9-]{8,}$`
    );

    // Добавляем логирование для отладки
    console.log('Проверка ссылки на видеозвонок:', url);
    console.log('Регулярное выражение для WebRTC:', webRTCRegex);
    console.log('Результат проверки WebRTC:', webRTCRegex.test(url));
    const googleMeetRegex =
      /^https:\/\/meet\.google\.com\/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/;
    const zoomRegex =
      /^https:\/\/zoom\.us\/j\/[0-9]{9,}(\?pwd=[a-zA-Z0-9]{10,})?$/;
    const teamsRegex =
      /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[a-zA-Z0-9\/%]+$/;
    // Добавляем поддержку новых форматов ссылок
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com\/)[0-9]{6,}$/;
    const jitsiRegex = /^https:\/\/meet\.jit\.si\/[a-zA-Z0-9-_]+$/;
    const discordRegex = /^https:\/\/discord\.gg\/[a-zA-Z0-9-_]+$/;
    const skypeRegex = /^https:\/\/join\.skype\.com\/[a-zA-Z0-9-_]+$/;

    if (webRTCRegex.test(url)) {
      // Проверяем существование комнаты
      const roomId = url.split('/').pop();
      if (roomId && webRTCRooms.has(roomId)) {
        return { isValid: true, message: 'Ссылка на WebRTC комнату валидна' };
      } else {
        return { isValid: false, message: 'Комната не найдена' };
      }
    } else if (
      googleMeetRegex.test(url) ||
      zoomRegex.test(url) ||
      teamsRegex.test(url) ||
      youtubeRegex.test(url) ||
      vimeoRegex.test(url) ||
      jitsiRegex.test(url) ||
      discordRegex.test(url) ||
      skypeRegex.test(url)
    ) {
      // Поддерживаем внешние сервисы
      // Определяем тип сервиса для более информативного сообщения
      let serviceType = 'внешний сервис';
      if (googleMeetRegex.test(url)) serviceType = 'Видео Чат';
      else if (zoomRegex.test(url)) serviceType = 'Zoom';
      else if (teamsRegex.test(url)) serviceType = 'Microsoft Teams';
      else if (youtubeRegex.test(url)) serviceType = 'YouTube';
      else if (vimeoRegex.test(url)) serviceType = 'Vimeo';
      else if (jitsiRegex.test(url)) serviceType = 'Jitsi Meet';
      else if (discordRegex.test(url)) serviceType = 'Discord';
      else if (skypeRegex.test(url)) serviceType = 'Skype';

      return { isValid: true, message: `Ссылка на ${serviceType} валидна` };
    }

    return {
      isValid: false,
      message: 'Неверный формат ссылки на видеозвонок',
    };
  } catch (error: unknown) {
    console.error('Ошибка при проверке ссылки на видеозвонок:', error);

    // Более детальная обработка ошибок
    let errorMessage = 'Неизвестная ошибка';

    if (error instanceof URIError) {
      errorMessage = `Некорректный формат URL: ${(error as Error).message}`;
    } else if (error instanceof TypeError) {
      errorMessage = `Ошибка типа данных: ${(error as Error).message}`;
    } else {
      errorMessage = `Ошибка при проверке ссылки: ${(error as Error).message}`;
    }

    return {
      isValid: false,
      message: errorMessage,
    };
  }
}

/**
 * Проверяет статус WebRTC комнаты
 * @param url - Ссылка на WebRTC комнату
 * @returns Статус комнаты
 */
export async function checkMeetingStatus(url: string): Promise<MeetingStatus> {
  try {
    if (!url) {
      return { status: 'error', message: 'Ссылка не указана' };
    }

    // Проверяем, является ли ссылка WebRTC ссылкой
    const webRTCRegex = new RegExp(
      `^${FRONTEND_URL.replace(/\./g, '\\.')}\/video-chat\/[a-zA-Z0-9-]{8,}$`
    );

    // Добавляем логирование для отладки
    console.log('Проверка статуса комнаты:', url);
    console.log('Регулярное выражение для WebRTC:', webRTCRegex);
    console.log('Результат проверки WebRTC:', webRTCRegex.test(url));

    if (webRTCRegex.test(url)) {
      // Извлекаем ID комнаты из ссылки
      const roomId = url.split('/').pop();

      if (!roomId) {
        return { status: 'error', message: 'Неверный формат ссылки' };
      }

      // Проверяем существование комнаты
      const room = webRTCRooms.get(roomId);

      if (!room) {
        return { status: 'expired', message: 'Комната не найдена или истекла' };
      }

      // Проверяем, не истекла ли комната
      if (room.expiresAt < new Date()) {
        return { status: 'expired', message: 'Срок действия комнаты истек' };
      }

      return { status: 'active', message: 'Комната активна' };
    } else {
      // Для внешних сервисов всегда возвращаем активный статус
      return { status: 'active', message: 'Внешний сервис видеозвонков' };
    }
  } catch (error: unknown) {
    console.error('Ошибка при проверке статуса комнаты:', error);

    // Более детальная обработка ошибок
    let errorMessage = 'Неизвестная ошибка';
    let errorStatus = 'error';

    if (error instanceof URIError) {
      errorMessage = `Некорректный формат URL: ${(error as Error).message}`;
    } else if (error instanceof TypeError) {
      errorMessage = `Ошибка типа данных: ${(error as Error).message}`;
    } else if (error instanceof RangeError) {
      errorMessage = `Ошибка диапазона значений: ${(error as Error).message}`;
      errorStatus = 'invalid_range';
    } else {
      errorMessage = `Ошибка при проверке статуса: ${(error as Error).message}`;
    }

    return {
      status: errorStatus,
      message: errorMessage,
    };
  }
}

/**
 * Интерфейс для результата записи видеозвонка
 */
interface RecordingResult {
  success: boolean;
  recordingId?: string;
  message: string;
  error?: string;
}

/**
 * Хранилище записей видеозвонков
 */
const recordings = new Map<
  string,
  {
    roomId: string;
    startTime: Date;
    endTime?: Date;
    participants: string[];
    url?: string;
    status: 'recording' | 'completed' | 'failed';
  }
>();

/**
 * Начинает запись видеозвонка
 * @param roomId - ID комнаты
 * @param userId - ID пользователя, инициировавшего запись
 * @returns Результат начала записи
 */
export function startRecording(
  roomId: string,
  userId: string
): RecordingResult {
  try {
    // Проверяем существование комнаты
    const room = webRTCRooms.get(roomId);

    if (!room) {
      return {
        success: false,
        message: 'Комната не найдена',
        error: 'room_not_found',
      };
    }

    // Проверяем, что пользователь находится в комнате
    if (!room.participants.includes(userId)) {
      return {
        success: false,
        message: 'Пользователь не является участником комнаты',
        error: 'user_not_in_room',
      };
    }

    // Генерируем ID для записи
    const recordingId = uuidv4();

    // Создаем запись о записи
    recordings.set(recordingId, {
      roomId,
      startTime: new Date(),
      participants: [...room.participants],
      status: 'recording',
    });

    console.log(`Начата запись ${recordingId} для комнаты ${roomId}`);

    return {
      success: true,
      recordingId,
      message: 'Запись начата',
    };
  } catch (error: unknown) {
    console.error('Ошибка при начале записи:', error);
    return {
      success: false,
      message: `Ошибка при начале записи: ${(error as Error).message}`,
      error: 'recording_start_error',
    };
  }
}

/**
 * Останавливает запись видеозвонка
 * @param recordingId - ID записи
 * @param userId - ID пользователя, останавливающего запись
 * @returns Результат остановки записи
 */
export function stopRecording(
  recordingId: string,
  userId: string
): RecordingResult {
  try {
    // Проверяем существование записи
    const recording = recordings.get(recordingId);

    if (!recording) {
      return {
        success: false,
        message: 'Запись не найдена',
        error: 'recording_not_found',
      };
    }

    // Проверяем, что запись активна
    if (recording.status !== 'recording') {
      return {
        success: false,
        message: `Запись уже ${
          recording.status === 'completed' ? 'завершена' : 'прервана'
        }`,
        error: 'recording_not_active',
      };
    }

    // Проверяем, что пользователь находится в комнате
    const room = webRTCRooms.get(recording.roomId);

    if (!room || !room.participants.includes(userId)) {
      return {
        success: false,
        message: 'Пользователь не является участником комнаты',
        error: 'user_not_in_room',
      };
    }

    // Обновляем запись
    recording.endTime = new Date();
    recording.status = 'completed';
    recording.url = getRecordingUrl(recordingId);

    // Обновляем запись в хранилище
    recordings.set(recordingId, recording);

    console.log(
      `Запись ${recordingId} для комнаты ${recording.roomId} завершена`
    );

    return {
      success: true,
      recordingId,
      message: 'Запись завершена',
    };
  } catch (error: unknown) {
    console.error('Ошибка при остановке записи:', error);
    return {
      success: false,
      message: `Ошибка при остановке записи: ${(error as Error).message}`,
      error: 'recording_stop_error',
    };
  }
}

/**
 * Получает информацию о записи
 * @param recordingId - ID записи
 * @returns Информация о записи или null, если запись не найдена
 */
export function getRecordingInfo(recordingId: string) {
  return recordings.get(recordingId) || null;
}

/**
 * Получает список записей для комнаты
 * @param roomId - ID комнаты
 * @returns Список записей для комнаты
 */
export function getRoomRecordings(roomId: string) {
  const roomRecordings: { id: string; recording: any }[] = [];

  recordings.forEach((recording, id) => {
    if (recording.roomId === roomId) {
      roomRecordings.push({
        id,
        recording,
      });
    }
  });

  return roomRecordings;
}

/**
 * Добавляет участника в комнату
 * @param roomId - ID комнаты
 * @param userId - ID пользователя
 * @returns Обновленная комната или null, если комната не найдена
 */
export function addParticipant(
  roomId: string,
  userId: string
): WebRTCRoom | null {
  console.log(
    `webRTCService: Добавление участника ${userId} в комнату ${roomId}`
  );

  const room = webRTCRooms.get(roomId);

  if (!room) {
    console.log(`webRTCService: Комната ${roomId} не найдена`);

    // Создаем комнату, если она не существует
    console.log(`webRTCService: Создание новой комнаты ${roomId}`);
    const newRoom: WebRTCRoom = {
      id: roomId,
      participants: [userId],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
    };

    webRTCRooms.set(roomId, newRoom);
    console.log(
      `webRTCService: Комната ${roomId} создана с участником ${userId}`
    );
    return newRoom;
  }

  // Проверяем, не добавлен ли уже пользователь
  if (!room.participants.includes(userId)) {
    console.log(
      `webRTCService: Добавление нового участника ${userId} в существующую комнату ${roomId}`
    );
    room.participants.push(userId);
  } else {
    console.log(
      `webRTCService: Участник ${userId} уже находится в комнате ${roomId}`
    );
  }

  console.log(
    `webRTCService: Текущие участники комнаты ${roomId}:`,
    room.participants
  );
  return room;
}

/**
 * Удаляет участника из комнаты
 * @param roomId - ID комнаты
 * @param userId - ID пользователя
 * @returns Обновленная комната или null, если комната не найдена
 */
export function removeParticipant(
  roomId: string,
  userId: string
): WebRTCRoom | null {
  console.log(
    `webRTCService: Удаление участника ${userId} из комнаты ${roomId}`
  );

  const room = webRTCRooms.get(roomId);

  if (!room) {
    console.log(`webRTCService: Комната ${roomId} не найдена`);
    return null;
  }

  // Проверяем, есть ли пользователь в комнате
  if (!room.participants.includes(userId)) {
    console.log(
      `webRTCService: Участник ${userId} не найден в комнате ${roomId}`
    );
    return room;
  }

  // Удаляем пользователя из списка участников
  room.participants = room.participants.filter((id) => id !== userId);
  console.log(`webRTCService: Участник ${userId} удален из комнаты ${roomId}`);
  console.log(`webRTCService: Оставшиеся участники:`, room.participants);

  // Если комната пуста, можно удалить её
  if (room.participants.length === 0) {
    console.log(`webRTCService: Комната ${roomId} пуста, удаляем её`);
    webRTCRooms.delete(roomId);
    return null;
  }

  return room;
}

/**
 * Получает информацию о комнате
 * @param roomId - ID комнаты
 * @returns Информация о комнате или null, если комната не найдена
 */
export function getRoomInfo(roomId: string): WebRTCRoom | null {
  console.log(`webRTCService: Запрос информации о комнате ${roomId}`);

  const room = webRTCRooms.get(roomId);

  if (!room) {
    console.log(`webRTCService: Комната ${roomId} не найдена`);
    return null;
  }

  console.log(`webRTCService: Информация о комнате ${roomId}:`, {
    id: room.id,
    participants: room.participants,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    isExpired: room.expiresAt < new Date(),
  });

  return room;
}
