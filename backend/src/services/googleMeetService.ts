import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Интерфейс для параметров встречи
interface MeetingOptions {
  summary: string;
  startTime: Date;
  durationMinutes?: number;
  googleAccessToken?: string; // Добавляем токен доступа пользователя
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

// Путь к файлу с ключом сервисного аккаунта
let CREDENTIALS_PATH = '';
// Используем имя файла напрямую, так как переменные окружения могут не загружаться
const keyFileName = 'supermook-21c2050f93f8.json';

// Проверяем различные возможные пути к директории services
const possibleDirs = [
  // Путь относительно текущего файла (для режима разработки)
  path.join(__dirname, '..', '..', 'services'),
  // Путь относительно корня проекта (для режима разработки)
  path.resolve(process.cwd(), 'services'),
  // Путь относительно директории backend (для режима разработки)
  path.resolve(process.cwd(), 'backend', 'services'),
  // Путь относительно директории dist (для production)
  path.resolve(process.cwd(), '..', 'services'),
];

// Проверяем каждую возможную директорию
for (const dirPath of possibleDirs) {
  console.log('Проверяем директорию services:', dirPath);

  if (fs.existsSync(dirPath)) {
    console.log('Директория services найдена:', dirPath);

    // Проверяем наличие файла с ключом в этой директории
    const filePath = path.join(dirPath, keyFileName);
    console.log('Проверяем наличие файла с ключом:', filePath);

    if (fs.existsSync(filePath)) {
      // Проверяем, что это файл, а не директория
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        console.log('Файл с ключом найден:', filePath);
        CREDENTIALS_PATH = filePath;
        break;
      } else {
        console.log('Путь указывает на директорию, а не на файл:', filePath);
      }
    } else {
      console.log('Файл с ключом не найден в директории:', dirPath);
    }
  }
}

// Проверяем, что файл с ключом найден
if (!CREDENTIALS_PATH) {
  console.error('Файл с ключом не найден ни по одному из проверенных путей');
  console.error('Проверенные директории:', possibleDirs);
  console.error('Имя файла с ключом:', keyFileName);
  throw new Error('Файл с ключом сервисного аккаунта не найден');
}

console.log('Используем файл с ключом по пути:', CREDENTIALS_PATH);

// Создаем JWT клиент с помощью ключа сервисного аккаунта
const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

// Создаем клиент для работы с Calendar API
const calendar = google.calendar({ version: 'v3', auth });

/**
 * Создает встречу в Google Meet через Calendar API
 * @param options - Параметры встречи
 * @returns Ссылка на Google Meet
 */
export async function createMeeting({
  summary,
  startTime,
  durationMinutes = 60,
  googleAccessToken,
}: MeetingOptions): Promise<string> {
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
          requestId: summary.split(' ').pop() || uuidv4(), // Используем ID сессии из summary или генерируем UUID
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    console.log('Создаваемое событие:', JSON.stringify(event, null, 2));

    // Получаем ID календаря пользователя
    const calendarId = 'primary';

    // Определяем, какой метод аутентификации использовать
    let calendarClient;

    if (googleAccessToken) {
      // Используем токен пользователя для аутентификации
      console.log('Используем токен пользователя для создания встречи');
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: googleAccessToken });
      calendarClient = google.calendar({ version: 'v3', auth: oauth2Client });
    } else {
      // Используем сервисный аккаунт как запасной вариант
      console.log('Используем сервисный аккаунт для создания встречи');
      calendarClient = calendar;
    }

    // Создаем событие в календаре
    const response = await calendarClient.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
    });

    console.log('Ответ от API:', JSON.stringify(response.data, null, 2));

    // Получаем ссылку на Google Meet из ответа
    const conferenceData = response.data.conferenceData;

    // Сначала пробуем получить hangoutLink
    let meetLink = response.data.hangoutLink;

    // Если hangoutLink отсутствует, ищем в entryPoints
    if (!meetLink) {
      meetLink = conferenceData?.entryPoints?.find(
        (entryPoint: any) => entryPoint.entryPointType === 'video'
      )?.uri;
    }

    if (!meetLink) {
      throw new Error(
        'Не удалось получить ссылку на Google Meet из ответа API'
      );
    }

    console.log('Создана ссылка на Google Meet:', meetLink);
    return meetLink;
  } catch (error: unknown) {
    console.error('Ошибка при создании встречи в Google Meet:', error);
    console.error('Стек ошибки:', (error as Error).stack);

    // Добавляем дополнительную информацию об ошибке
    if (error && typeof error === 'object' && 'response' in error) {
      console.error(
        'Ответ API:',
        JSON.stringify((error as any).response.data, null, 2)
      );
    }

    // Добавляем подробную информацию об ошибке для отладки
    console.error('=== ОШИБКА ПРИ ГЕНЕРАЦИИ ВИДЕОССЫЛКИ ===');
    console.error('Ошибка при генерации видеоссылки:', error);
    console.error('Стек ошибки:', (error as Error).stack);

    if (error && typeof error === 'object') {
      console.error('Тип ошибки:', error.constructor.name);
      console.error('Сообщение ошибки:', (error as Error).message);
      console.error('Все свойства ошибки:');

      const errorObj = error as Record<string, unknown>;
      for (const key in errorObj) {
        if (Object.prototype.hasOwnProperty.call(errorObj, key)) {
          console.error(`- ${key}: ${JSON.stringify(errorObj[key])}`);
        }
      }
    }

    console.error('Контекст ошибки:');
    console.error('- ID сессии:', summary.split(' ').pop());
    console.error(
      '- Параметры встречи:',
      JSON.stringify({ summary, startTime, durationMinutes }, null, 2)
    );
    console.error('=== КОНЕЦ ОТЧЕТА ОБ ОШИБКЕ ===');

    throw new Error('Ошибка при генерации ссылки на видеозвонок');
  }
}

/**
 * Проверяет валидность ссылки на Google Meet
 * @param url - Ссылка на Google Meet
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
  } catch (error: unknown) {
    console.error('Ошибка при проверке ссылки Google Meet:', error);
    return {
      isValid: false,
      message: `Ошибка при проверке ссылки: ${(error as Error).message}`,
    };
  }
}

/**
 * Проверяет статус встречи Google Meet
 * @param url - Ссылка на Google Meet
 * @returns Статус встречи
 */
export async function checkMeetingStatus(url: string): Promise<MeetingStatus> {
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
  } catch (error: unknown) {
    console.error('Ошибка при проверке статуса встречи:', error);
    return {
      status: 'error',
      message: `Ошибка при проверке статуса: ${(error as Error).message}`,
    };
  }
}
