import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Пользовательские метрики
const errorRate = new Rate('errors');

// Параметры теста по умолчанию
export const options = {
  // Базовая конфигурация
  vus: 10, // Количество виртуальных пользователей
  duration: '30s', // Продолжительность теста

  // Пороговые значения для успешного прохождения теста
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% запросов должны выполняться быстрее 500 мс
    'http_req_duration{name:healthCheck}': ['p(99)<100'], // 99% запросов к /health должны выполняться быстрее 100 мс
    'http_req_duration{name:getUsers}': ['p(95)<1000'], // 95% запросов к /api/users должны выполняться быстрее 1000 мс
    errors: ['rate<0.1'], // Уровень ошибок должен быть меньше 10%
  },

  // Сценарии тестирования
  scenarios: {
    // Постоянная нагрузка
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
    },
    // Нарастающая нагрузка
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 20 },
        { duration: '10s', target: 0 },
      ],
    },
    // Стресс-тест
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 10 },
      ],
    },
  },
};

// Базовый URL API
const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

// Функция для настройки заголовков запроса
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// Функция для получения токена аутентификации (если требуется)
function getAuthToken() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: __ENV.TEST_USER_EMAIL || 'test@example.com',
      password: __ENV.TEST_USER_PASSWORD || 'password123',
    }),
    {
      headers: getHeaders(),
    }
  );

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return body.token;
  }

  console.error(
    `Не удалось получить токен аутентификации: ${loginRes.status} ${loginRes.body}`
  );
  return null;
}

// Основная функция теста
export default function () {
  // Проверка работоспособности сервиса
  const healthCheck = http.get(`${BASE_URL}/health`, {
    tags: { name: 'healthCheck' },
  });

  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Получение списка пользователей (требует аутентификации)
  let token = getAuthToken();
  if (token) {
    const authHeaders = {
      ...getHeaders(),
      Authorization: `Bearer ${token}`,
    };

    const usersRes = http.get(`${BASE_URL}/api/users`, {
      headers: authHeaders,
      tags: { name: 'getUsers' },
    });

    check(usersRes, {
      'get users status is 200': (r) => r.status === 200,
      'get users response has users': (r) => {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      },
    }) || errorRate.add(1);
  }

  // Тестирование создания сессии
  const createSessionRes = http.post(
    `${BASE_URL}/api/sessions`,
    JSON.stringify({
      name: `Test Session ${Date.now()}`,
      description: 'Created by performance test',
    }),
    {
      headers: token
        ? { ...getHeaders(), Authorization: `Bearer ${token}` }
        : getHeaders(),
      tags: { name: 'createSession' },
    }
  );

  check(createSessionRes, {
    'create session status is 201': (r) => r.status === 201,
  }) || errorRate.add(1);

  // Пауза между итерациями
  sleep(1);
}
