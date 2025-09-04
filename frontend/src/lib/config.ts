// API Configuration
export const API_CONFIG = {
  // В production используем полный URL к API серверу
  // В development используем относительные пути (через Vite proxy)
  baseURL:
    import.meta.env.PROD 
      ? (import.meta.env.VITE_API_URL || 'https://app.supermock.ru')
      : '', // В dev режиме используем относительные пути для proxy

  // WebSocket URL для dev режима
  wsURL: import.meta.env.DEV 
    ? 'ws://localhost:3000' // В dev режиме подключаемся к локальному серверу
    : (import.meta.env.VITE_WS_URL || 'wss://app.supermock.ru'), // В production используем тот же домен что и frontend

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
// TURN credentials are now fetched dynamically from the server
export const getIceConfig = async (userId?: string): Promise<RTCConfiguration> => {
  console.log('🔧 Getting ICE configuration for user:', userId);
  
  const stunServers = (import.meta.env.VITE_STUN_URLS
    ? String(import.meta.env.VITE_STUN_URLS)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((url) => ({ urls: url }))
    : [{ urls: 'stun:stun.l.google.com:19302' }]) as RTCIceServer[];

  console.log('🧊 STUN servers:', stunServers);

  // Try to get TURN credentials from server
  let turnServers: RTCIceServer[] = [];
  if (userId && import.meta.env.VITE_TURN_URL) {
    console.log('🔑 Attempting to get TURN credentials from server...');
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/turn-credentials?userId=${userId}`);
      if (response.ok) {
        const credentials = await response.json();
        console.log('✅ TURN credentials received:', {
          username: credentials.username,
          urls: credentials.urls,
          ttl: credentials.ttl
        });
        turnServers = credentials.urls.map((url: string) => ({
          urls: url,
          username: credentials.username,
          credential: credentials.password,
        }));
      } else {
        console.warn('❌ Failed to get TURN credentials, response not ok:', response.status);
      }
    } catch (error) {
      console.warn('❌ Failed to get TURN credentials, using fallback:', error);
      // Fallback to static credentials if available
      if (import.meta.env.VITE_TURN_USERNAME && import.meta.env.VITE_TURN_PASSWORD) {
        console.log('🔄 Using fallback TURN credentials');
        turnServers = [{
          urls: String(import.meta.env.VITE_TURN_URL),
          username: String(import.meta.env.VITE_TURN_USERNAME),
          credential: String(import.meta.env.VITE_TURN_PASSWORD),
        }];
      }
    }
  } else {
    console.log('⚠️ No userId or VITE_TURN_URL, skipping TURN servers');
  }

  const iceConfig = {
    iceServers: [...stunServers, ...turnServers],
  };

  console.log('🌐 Final ICE configuration:', {
    totalServers: iceConfig.iceServers.length,
    stunCount: stunServers.length,
    turnCount: turnServers.length,
    servers: iceConfig.iceServers.map(s => ({
      urls: s.urls,
      type: s.urls.includes('turn:') ? 'TURN' : 'STUN'
    }))
  });

  return iceConfig;
};

// Legacy ICE_CONFIG for backward compatibility
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
  // Проверяем, находимся ли мы на продакшн домене
  const isProductionDomain = window.location.hostname === 'supermock.ru' || 
                            window.location.hostname === 'www.supermock.ru' ||
                            window.location.hostname === 'app.supermock.ru' ||
                            window.location.hostname === 'api.supermock.ru';
  
  // Добавляем отладочную информацию
  console.log('🔧 createApiUrl debug:', {
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    isProductionDomain,
    hostname: window.location.hostname,
    viteApiUrl: import.meta.env.VITE_API_URL,
    apiConfigBaseUrl: API_CONFIG.baseURL,
    endpoint
  });

  // Если мы на продакшн домене, всегда используем продакшн API
  if (isProductionDomain) {
    const base = 'https://app.supermock.ru';
    const path = endpoint.trim().startsWith('/') ? endpoint.trim() : `/${endpoint.trim()}`;
    const result = `${base}${path}`;
    
    console.log('🔧 createApiUrl (PROD DOMAIN):', { endpoint, base, path, result });
    return result;
  }

  // В development режиме всегда используем относительные пути для proxy
  if (import.meta.env.DEV) {
    const path = endpoint.trim().startsWith('/') ? endpoint.trim() : `/${endpoint.trim()}`;
    console.log('🔧 createApiUrl (DEV):', { endpoint, result: path });
    return path;
  }

  // В production всегда используем полный HTTPS URL
  const base = API_CONFIG.baseURL || 'https://app.supermock.ru';
  const path = endpoint.trim().startsWith('/') ? endpoint.trim() : `/${endpoint.trim()}`;
  
  // Убеждаемся, что используем HTTPS
  const secureBase = base.replace('http://', 'https://');
  const result = `${secureBase}${path}`;
  
  console.log('🔧 createApiUrl (PROD):', { endpoint, base: secureBase, path, result });
  
  return result;
}
