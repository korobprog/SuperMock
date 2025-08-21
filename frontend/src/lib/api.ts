import { createApiUrl, API_CONFIG } from './config';
import type { TelegramUser } from './telegram-auth';

export type InitPayload = {
  tg?: Partial<TelegramUser> | null;
  language?: string;
  initData?: string | null;
};

export async function apiInit(payload: InitPayload) {
  const res = await fetch(createApiUrl(API_CONFIG.endpoints.init), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    console.error('API Init error:', {
      status: res.status,
      statusText: res.statusText,
      error: errorData,
    });
    throw new Error(
      errorData.error || `Init failed: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

export async function apiSavePreferences(payload: {
  userId: number;
  role: 'interviewer' | 'candidate';
  profession: string;
  language: string;
  slotsUtc: string[];
}) {
  const res = await fetch(createApiUrl(API_CONFIG.endpoints.preferences), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Save preferences failed');
  return res.json();
}

export async function apiMatch(payload: {
  userId: number;
  role: 'interviewer' | 'candidate';
  profession: string;
  language: string;
  slotsUtc: string[];
}) {
  const res = await fetch(createApiUrl(API_CONFIG.endpoints.match), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Match failed');
  return res.json();
}

export async function apiJoinSlot(payload: {
  userId: number;
  role: 'interviewer' | 'candidate';
  profession?: string;
  language?: string;
  slotUtc: string;
  tools?: string[];
}) {
  const res = await fetch(createApiUrl(API_CONFIG.endpoints.joinSlot), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Join slot failed');
  return res.json();
}

export async function apiGetNotifications(userId: number) {
  const url = new URL(
    createApiUrl('/api/notifications'),
    window.location.origin
  );
  url.searchParams.set('userId', String(userId));
  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load notifications');
  return res.json();
}

export async function apiUnreadCount(userId: number) {
  const url = new URL(
    createApiUrl('/api/notifications/unread-count'),
    window.location.origin
  );
  url.searchParams.set('userId', String(userId));
  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load unread count');
  return res.json();
}

export async function apiMarkNotificationRead(id: number) {
  const res = await fetch(createApiUrl(`/api/notifications/${id}/read`), {
    method: 'PUT',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to mark read');
  return res.json();
}

export async function apiDeleteNotification(id: number) {
  const res = await fetch(createApiUrl(`/api/notifications/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete notification');
  return res.json();
}

export async function apiClearAllNotifications(userId: number) {
  const url = new URL(
    createApiUrl('/api/notifications/clear-all'),
    window.location.origin
  );
  url.searchParams.set('userId', String(userId));
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to clear notifications');
  return res.json();
}

export async function apiGetSlots(params: {
  role: 'candidate' | 'interviewer';
  profession?: string;
  language?: string;
  date?: string; // YYYY-MM-DD local date
  timezone?: string;
}) {
  const url = new URL(createApiUrl('/api/slots'), window.location.origin);
  url.searchParams.set('role', params.role);
  if (params.profession) url.searchParams.set('profession', params.profession);
  if (params.language) url.searchParams.set('language', params.language);
  if (params.date) url.searchParams.set('date', params.date);
  if (params.timezone) url.searchParams.set('timezone', params.timezone);
  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load slots');
  return res.json() as Promise<{ slots: { time: string; count: number }[] }>;
}

export async function apiGetSession(sessionId: string, userId?: string) {
  const url = new URL(createApiUrl(`/api/session/${sessionId}`));
  if (userId) {
    url.searchParams.append('userId', userId);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to get session');
  return res.json();
}

export async function apiCompleteSession(sessionId: string) {
  const res = await fetch(
    createApiUrl(`${API_CONFIG.endpoints.sessions}/${sessionId}/complete`),
    {
      method: 'PUT',
      credentials: 'include',
    }
  );
  if (!res.ok) throw new Error('Complete session failed');
  return res.json();
}

// Dev endpoints
export async function apiDevSeed(params: {
  time?: string;
  profession?: string;
  language?: string;
  join?: 'both' | 'candidate' | 'interviewer' | 'none';
}) {
  const res = await fetch(createApiUrl('/api/dev/seed-users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Dev seed failed');
  return res.json();
}

export async function apiDevCleanup() {
  const res = await fetch(createApiUrl('/api/dev/cleanup'), {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Dev cleanup failed');
  return res.json();
}

export async function apiDevStatus() {
  const res = await fetch(createApiUrl('/api/dev/status'), {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Dev status failed');
  return res.json();
}

export async function apiDevLatestSession() {
  const res = await fetch(createApiUrl('/api/dev/latest-session'), {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Dev latest session failed');
  return res.json();
}

export async function apiFeedback(payload: {
  sessionId: string;
  fromUserId: number;
  toUserId: number;
  rating: number;
  comments: string;
}) {
  const res = await fetch(createApiUrl(API_CONFIG.endpoints.feedback), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Feedback failed');
  return res.json();
}

export async function apiHistory(userId: number) {
  const res = await fetch(
    createApiUrl(`${API_CONFIG.endpoints.history}/${userId}`),
    {
      credentials: 'include',
    }
  );
  if (!res.ok) throw new Error('History failed');
  return res.json();
}

export async function apiMyBookings(userId: number) {
  const res = await fetch(createApiUrl(`/api/my-bookings/${userId}`), {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('My bookings failed');
  return res.json() as Promise<{
    queues: Array<{
      id: string;
      userId: number;
      role: 'interviewer' | 'candidate';
      profession?: string;
      language?: string;
      slotUtc: string;
      createdAt?: string;
    }>;
    sessions: Array<{
      id: string;
      jitsiRoom?: string | null;
      createdAt?: string;
    }>;
  }>;
}

export async function apiGetUserSettings(userId: number) {
  const res = await fetch(
    createApiUrl(`${API_CONFIG.endpoints.userSettings}/${userId}`),
    {
      credentials: 'include',
    }
  );
  if (!res.ok) throw new Error('Get user settings failed');
  return res.json();
}

export async function apiSaveUserSettings(payload: {
  userId: number;
  openRouterApiKey?: string | null;
  stackblitzApiKey?: string | null;
  preferredModel?: string;
  questionsLevel?: 'junior' | 'middle' | 'senior';
  useAIGeneration?: boolean;
  questionsCount?: number;
}) {
  const res = await fetch(createApiUrl(API_CONFIG.endpoints.userSettings), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Save user settings failed');
  return res.json();
}

export async function apiGetProfile(userId: number) {
  const res = await fetch(
    createApiUrl(`${API_CONFIG.endpoints.profile}/${userId}`),
    {
      credentials: 'include',
    }
  );
  if (!res.ok) throw new Error('Get profile failed');
  return res.json();
}

export async function apiSaveProfile(payload: {
  userId: number;
  language?: string;
  role?: 'interviewer' | 'candidate';
  profession?: string;
  tools?: string[];
}) {
  const res = await fetch(createApiUrl(API_CONFIG.endpoints.profile), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Save profile failed');
  return res.json();
}

// API для работы с инструментами пользователей
export async function apiSaveUserTools(payload: {
  userId: number;
  profession: string;
  tools: string[];
}) {
  const res = await fetch(createApiUrl('/api/user-tools'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Save user tools failed');
  return res.json();
}

export async function apiGetUserTools(userId: number, profession?: string) {
  const url = new URL(createApiUrl('/api/user-tools'), window.location.origin);
  url.searchParams.set('userId', String(userId));
  if (profession) url.searchParams.set('profession', profession);

  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) throw new Error('Get user tools failed');
  return res.json() as Promise<{
    tools: Array<{ id: number; toolName: string; category?: string }>;
  }>;
}

export async function apiGetSlotsWithTools(params: {
  role: 'candidate' | 'interviewer';
  profession?: string;
  language?: string;
  date?: string;
  timezone?: string;
  tools?: string[];
  matchStrictness?: 'exact' | 'partial' | 'any'; // exact - все инструменты должны совпадать, partial - хотя бы 2, any - хотя бы 1
}) {
  const url = new URL(
    createApiUrl('/api/slots/with-tools'),
    window.location.origin
  );
  url.searchParams.set('role', params.role);
  if (params.profession) url.searchParams.set('profession', params.profession);
  if (params.language) url.searchParams.set('language', params.language);
  if (params.date) url.searchParams.set('date', params.date);
  if (params.timezone) url.searchParams.set('timezone', params.timezone);
  if (params.tools?.length) {
    params.tools.forEach((tool) => url.searchParams.append('tools', tool));
  }
  if (params.matchStrictness)
    url.searchParams.set('matchStrictness', params.matchStrictness);

  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load slots with tools');
  return res.json() as Promise<{
    slots: Array<{
      time: string;
      count: number;
      matchedTools?: string[];
      matchScore?: number;
    }>;
  }>;
}

// Валидация Telegram авторизации на сервере
export async function apiValidateTelegramAuth(
  telegramData: TelegramUser | Record<string, unknown>
) {
  const res = await fetch(createApiUrl(API_CONFIG.endpoints.telegramAuth), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(telegramData),
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMessage = 'Failed to validate Telegram auth';
    try {
      const error = await res.json();
      errorMessage = error.error || errorMessage;
    } catch (e) {
      // Silent error handling
    }
    throw new Error(errorMessage);
  }

  const result = await res.json();
  return result;
}

// Проверка заполненных данных пользователя
export async function apiCheckUserData(userId: number) {
  const res = await fetch(createApiUrl(`/api/user-data-check/${userId}`), {
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 404) {
      // User not found - return default values
      return {
        hasProfession: false,
        hasTools: false,
        profession: null,
        tools: [],
      };
    }
    throw new Error('Failed to check user data');
  }
  return res.json() as Promise<{
    hasProfession: boolean;
    hasTools: boolean;
    profession?: string;
    tools?: string[];
  }>;
}
