/**
 * Утилиты для обработки ошибок API в dev режиме
 */

/**
 * Обрабатывает ошибки API в dev режиме, предоставляя fallback данные
 */
export function handleApiError<T>(
  error: any,
  fallbackData: T,
  context: string
): T {
  console.error(`API Error in ${context}:`, error);
  
  if (import.meta.env.DEV) {
    console.log(`🔧 Dev mode: using fallback data for ${context}`);
    return fallbackData;
  }
  
  throw error;
}

/**
 * Безопасный вызов API с fallback для dev режима
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackData: T,
  context: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    return handleApiError(error, fallbackData, context);
  }
}

/**
 * Демо данные для различных API
 */
export const DEMO_DATA = {
  userTools: {
    tools: [
      { id: 1, toolName: 'JavaScript', category: 'frontend' },
      { id: 2, toolName: 'React', category: 'frontend' },
      { id: 3, toolName: 'TypeScript', category: 'frontend' },
      { id: 4, toolName: 'Node.js', category: 'backend' },
    ]
  },
  
  userProfile: {
    id: 'demo_user_123',
    language: 'ru',
    role: 'candidate',
    profession: 'frontend',
  },
  
  slots: {
    slots: [
      { time: '2024-01-15T10:00:00Z', count: 5 },
      { time: '2024-01-15T14:00:00Z', count: 3 },
      { time: '2024-01-15T18:00:00Z', count: 7 },
    ]
  },
  
  notifications: {
    notifications: [
      {
        id: 1,
        type: 'match',
        title: 'Найдено совпадение!',
        message: 'Кандидат готов к интервью',
        createdAt: new Date().toISOString(),
        read: false,
      }
    ]
  }
};

/**
 * Получает демо инструменты для профессии
 */
export function getDemoToolsForProfession(profession?: string): string[] {
  const professionTools: { [key: string]: string[] } = {
    frontend: ['JavaScript', 'React', 'TypeScript', 'Vue.js'],
    backend: ['Node.js', 'Python', 'Java', 'Go'],
    fullstack: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
    devops: ['Docker', 'Kubernetes', 'AWS', 'Linux'],
    data: ['Python', 'SQL', 'Pandas', 'TensorFlow'],
  };
  
  return professionTools[profession || 'frontend'] || professionTools.frontend;
}
