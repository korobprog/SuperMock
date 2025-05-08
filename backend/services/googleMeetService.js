/**
 * Сервис для работы с Google Meet API
 *
 * В реальном проекте здесь должна быть настроена аутентификация с использованием
 * сервисного аккаунта Google Cloud Platform и соответствующих ключей.
 *
 * Документация: https://developers.google.com/meet/api/reference/rest
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Загрузка конфигурации из JSON-файла
let GOOGLE_API_CONFIG;
try {
  const keyFilePath = path.join(
    __dirname,
    '../config/supermook-21c2050f93f8.json'
  );
  const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
  const keyData = JSON.parse(keyFileContent);

  GOOGLE_API_CONFIG = {
    clientEmail: keyData.client_email,
    privateKey: keyData.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  };

  console.log('Google API ключ успешно загружен');
} catch (error) {
  console.error('Ошибка при загрузке Google API ключа:', error);
  // Запасная конфигурация для разработки
  GOOGLE_API_CONFIG = {
    clientEmail: 'service-account@project-id.iam.gserviceaccount.com',
    privateKey: 'your-private-key',
    scopes: ['https://www.googleapis.com/auth/calendar'],
  };
}

/**
 * Инициализация клиента Google API
 * В реальном проекте здесь должна быть настройка аутентификации
 * с использованием сервисного аккаунта
 */
function initializeGoogleClient() {
  try {
    // В реальном проекте здесь должна быть настройка JWT клиента
    // с использованием сервисного аккаунта
    const auth = new google.auth.JWT(
      GOOGLE_API_CONFIG.clientEmail,
      null,
      GOOGLE_API_CONFIG.privateKey,
      GOOGLE_API_CONFIG.scopes
    );

    return google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.error('Ошибка при инициализации Google API клиента:', error);
    // В режиме имитации возвращаем null, чтобы использовать запасной вариант
    return null;
  }
}

/**
 * Создание встречи в Google Meet
 * @param {Object} options - Параметры встречи
 * @param {string} options.summary - Название встречи
 * @param {Date} options.startTime - Время начала встречи
 * @param {number} options.durationMinutes - Продолжительность встречи в минутах
 * @returns {Promise<string>} - URL встречи в Google Meet
 */
async function createMeeting(options) {
  try {
    const calendar = initializeGoogleClient();

    // Если клиент не инициализирован (например, в режиме разработки),
    // используем имитацию создания встречи
    if (!calendar) {
      console.log('Используется имитация создания встречи в Google Meet');
      return generateMockMeetingUrl(options);
    }

    // Настройка параметров встречи
    const startTime = options.startTime || new Date();
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (options.durationMinutes || 60));

    // Создание события в календаре с включенной видеоконференцией
    const event = {
      summary: options.summary || 'Собеседование',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 11)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    // Извлечение URL видеоконференции из ответа
    const meetingUrl = response.data.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === 'video'
    )?.uri;

    if (!meetingUrl) {
      throw new Error('Не удалось получить URL видеоконференции');
    }

    return meetingUrl;
  } catch (error) {
    console.error('Ошибка при создании встречи в Google Meet:', error);
    // В случае ошибки используем имитацию
    return generateMockMeetingUrl(options);
  }
}

/**
 * Генерация имитации URL для Google Meet
 * Используется, когда реальная интеграция с API недоступна
 * @param {Object} options - Параметры встречи
 * @returns {string} - Имитация URL встречи
 */
function generateMockMeetingUrl(options) {
  // Генерируем три группы случайных символов в формате xxx-xxxx-xxx
  const part1 = Math.random().toString(36).substring(2, 5);
  const part2 = Math.random().toString(36).substring(2, 6);
  const part3 = Math.random().toString(36).substring(2, 5);
  const meetingId = `${part1}-${part2}-${part3}`;
  return `https://meet.google.com/${meetingId}`;
}

/**
 * Проверка валидности URL Google Meet
 * @param {string} url - URL для проверки
 * @returns {boolean} - true, если URL валиден
 */
function isValidMeetUrl(url) {
  if (!url) return false;

  // Проверка формата URL Google Meet
  const meetRegex = /^https:\/\/meet\.google\.com\/[a-z0-9\-]+$/i;
  return meetRegex.test(url);
}

module.exports = {
  createMeeting,
  isValidMeetUrl,
};
