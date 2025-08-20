// API Configuration
export const API_CONFIG = {
  // В production используем полный URL к API серверу
  // В development используем относительные пути (через Vite proxy)
  baseURL:
    import.meta.env.PROD && !import.meta.env.VITE_API_URL?.includes('127.0.0.1')
      ? import.meta.env.VITE_API_URL || 'https://api.supermock.ru'
      : '', // В dev режиме или при локальной разработке используем относительные пути

  // Полные пути к API endpoints
  endpoints: {
    init: '/api/init',
    preferences: '/api/preferences',
    match: '/api/match',
    joinSlot: '/api/slots/join',
    sessions: '/api/sessions',
    feedback: '/api/feedback',
    history: '/api/history',
    userSettings: '/api/user-settings',
    telegramAuth: '/api/telegram-auth',
    health: '/api/health',
    profile: '/api/profile',
  },
  // Base URL for self-hosted Jitsi (iframe). Example: https://jitsi.localhost
  jitsiBaseURL: import.meta.env.VITE_JITSI_URL || 'https://meet.jit.si',
};

// ICE servers for WebRTC (P2P)
// VITE_STUN_URLS can be a comma-separated list like: "stun:stun.l.google.com:19302,stun:global.stun.twilio.com:3478"
// VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_PASSWORD are optional
export const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    ...((import.meta.env.VITE_STUN_URLS
      ? String(import.meta.env.VITE_STUN_URLS)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((url) => ({ urls: url }))
      : [{ urls: 'stun:stun.l.google.com:19302' }]) as RTCIceServer[]),
    ...(import.meta.env.VITE_TURN_URL &&
    import.meta.env.VITE_TURN_USERNAME &&
    import.meta.env.VITE_TURN_PASSWORD
      ? ([
          {
            urls: String(import.meta.env.VITE_TURN_URL),
            username: String(import.meta.env.VITE_TURN_USERNAME),
            credential: String(import.meta.env.VITE_TURN_PASSWORD),
          },
        ] as RTCIceServer[])
      : []),
  ],
};

// Хелпер для создания полного URL к API
export function createApiUrl(endpoint: string): string {
  const rawBase = API_CONFIG.baseURL || '';
  const rawEndpoint = endpoint || '';

  // Normalize and trim to avoid malformed URLs like "http://host /api/..."
  const base = rawBase.trim().replace(/\/$/, '');
  const path = rawEndpoint.trim().startsWith('/')
    ? rawEndpoint.trim()
    : `/${rawEndpoint.trim()}`;

  if (base && !path.startsWith('http')) {
    return `${base}${path}`;
  }
  return path;
}
