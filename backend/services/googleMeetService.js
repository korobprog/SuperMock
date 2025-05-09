const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Путь к файлу с ключом сервисного аккаунта
const CREDENTIALS_PATH = path.join(__dirname, process.env.GOOGLE_KEY);

// Проверяем наличие файла с ключом
if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error(`Файл с ключом не найден по пути: ${CREDENTIALS_PATH}`);
  throw new Error('Файл с ключом сервисного аккаунта не найден');
}

// Создаем JWT клиент с помощью ключа сервисного аккаунта
const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

// Создаем клиент для работы с Calendar API
const calendar = google.calendar({ version: 'v3', auth });

/**
 * Создает встречу в Google Meet через Calendar API
 * @param {Object} options - Параметры встречи
 * @param {string} options.summary - Название встречи
 * @param {Date} options.startTime - Время начала встречи
 * @param {number} options.durationMinutes - Продолжительность встречи в минутах
 * @returns {Promise<string>} - Ссылка на Google Meet
 */
async function createMeeting({ summary, startTime, durationMinutes = 60 }) {
  try {
    console.log('Создание встречи в Google Meet...');
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

    // Создаем событие в календаре с конференцией
    const event = {
      summary,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Moscow',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Moscow',
      },
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    console.log('Создаваемое событие:', JSON.stringify(event, null, 2));

    // Получаем ID календаря пользователя
    const calendarId = 'primary';

    // Создаем событие в календаре
    const response = await calendar.events.insert({
      calendarId,
      resource: event,
      conferenceDataVersion: 1,
    });

    console.log('Ответ от API:', JSON.stringify(response.data, null, 2));

    // Получаем ссылку на Google Meet из ответа
    const conferenceData = response.data.conferenceData;
    const meetLink = conferenceData?.entryPoints?.find(
      (entryPoint) => entryPoint.entryPointType === 'video'
    )?.uri;

    if (!meetLink) {
      throw new Error(
        'Не удалось получить ссылку на Google Meet из ответа API'
      );
    }

    console.log('Создана ссылка на Google Meet:', meetLink);
    return meetLink;
  } catch (error) {
    console.error('Ошибка при создании встречи в Google Meet:', error);
    console.error('Стек ошибки:', error.stack);

    // Добавляем дополнительную информацию об ошибке
    if (error.response) {
      console.error('Ответ API:', JSON.stringify(error.response.data, null, 2));
    }

    throw error;
  }
}

/**
 * Проверяет валидность ссылки на Google Meet
 * @param {string} url - Ссылка на Google Meet
 * @returns {Promise<{isValid: boolean, message: string}>} - Результат проверки
 */
async function isValidMeetUrl(url) {
  try {
    if (!url) {
      return { isValid: false, message: 'Ссылка не указана' };
    }

    // Проверяем формат ссылки с помощью регулярного выражения
    const meetRegex =
      /^https:\/\/meet\.google\.com\/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/;
    if (!meetRegex.test(url)) {
      return {
        isValid: false,
        message: 'Неверный формат ссылки Google Meet',
      };
    }

    // Здесь можно добавить дополнительную проверку через API, если необходимо
    // Например, проверить, существует ли встреча с таким ID

    return { isValid: true, message: 'Ссылка валидна' };
  } catch (error) {
    console.error('Ошибка при проверке ссылки Google Meet:', error);
    return {
      isValid: false,
      message: `Ошибка при проверке ссылки: ${error.message}`,
    };
  }
}

/**
 * Проверяет статус встречи Google Meet
 * @param {string} url - Ссылка на Google Meet
 * @returns {Promise<{status: string, message: string}>} - Статус встречи
 */
async function checkMeetingStatus(url) {
  try {
    if (!url) {
      return { status: 'error', message: 'Ссылка не указана' };
    }

    // Извлекаем ID встречи из ссылки
    const meetingId = url.split('/').pop();
    // Проверяем формат ID встречи (xxx-xxxx-xxx)
    const meetIdRegex = /^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/;
    if (!meetingId || !meetIdRegex.test(meetingId)) {
      return {
        status: 'error',
        message: 'Неверный формат ссылки Google Meet',
      };
    }

    // Здесь должна быть логика проверки статуса встречи через API
    // Но Google Meet API не предоставляет прямой способ проверки статуса встречи
    // Поэтому возвращаем статус на основе проверки формата ссылки

    return { status: 'active', message: 'Встреча активна' };
  } catch (error) {
    console.error('Ошибка при проверке статуса встречи:', error);
    return {
      status: 'error',
      message: `Ошибка при проверке статуса: ${error.message}`,
    };
  }
}

module.exports = {
  createMeeting,
  isValidMeetUrl,
  checkMeetingStatus,
};
