/**
 * Утилиты для работы с API
 * Файл содержит функции для взаимодействия с бэкендом
 */

// Базовый URL для API запросов
// В production будет заменен на https://supermock.ru/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Добавляем логирование для отладки
console.log('API URL:', API_URL);

/**
 * Выполняет запрос к API
 * @param endpoint - конечная точка API
 * @param options - опции запроса
 * @returns результат запроса
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    // Добавляем логирование для отладки
    console.log(`Выполняется запрос к ${API_URL}${endpoint}`);
    console.log('Опции запроса:', options);

    // Получаем токен из localStorage
    const token = localStorage.getItem('token');

    // Настраиваем заголовки
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Выполняем запрос
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Добавляем логирование для отладки
    console.log(`Ответ от ${API_URL}${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    // Проверяем статус ответа
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Ошибка запроса: ${response.status}`
      );
    }

    // Парсим ответ
    const data = await response.json();

    // Добавляем логирование для отладки
    console.log(`Данные от ${API_URL}${endpoint}:`, data);

    return data;
  } catch (error) {
    // Добавляем логирование для отладки
    console.error(`Ошибка при запросе к ${API_URL}${endpoint}:`, error);
    throw error;
  }
}

/**
 * Получает список сессий
 * @returns список сессий
 */
export async function getSessions() {
  return fetchApi('/sessions');
}

/**
 * Создает новую сессию
 * @param sessionData - данные сессии
 * @returns созданная сессия
 */
export async function createSession(sessionData: any) {
  return fetchApi('/sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  });
}

/**
 * Получает данные пользователя
 * @returns данные пользователя
 */
export async function getUserProfile() {
  return fetchApi('/auth/profile');
}

/**
 * Выполняет вход пользователя
 * @param credentials - учетные данные пользователя
 * @returns данные пользователя и токен
 */
export async function login(credentials: { email: string; password: string }) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Регистрирует нового пользователя
 * @param userData - данные пользователя
 * @returns данные пользователя и токен
 */
export async function register(userData: {
  email: string;
  password: string;
  name: string;
}) {
  return fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}
