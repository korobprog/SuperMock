import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface UseTelegramAuthReturn extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEYS = {
  TOKEN: 'telegram_auth_token',
  USER: 'telegram_auth_user'
};

export const useTelegramAuth = (): UseTelegramAuthReturn => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
  });

  // Загрузка данных из localStorage при инициализации
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setState({
            isAuthenticated: true,
            user,
            token,
            loading: false,
            error: null
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных авторизации:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Ошибка при загрузке данных авторизации' 
        }));
      }
    };

    loadAuthData();
  }, []);

  // Функция входа
  const login = useCallback((token: string, user: User) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      setState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Ошибка при сохранении данных авторизации:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Ошибка при сохранении данных авторизации' 
      }));
    }
  }, []);

  // Функция выхода
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Ошибка при удалении данных авторизации:', error);
    }
  }, []);

  // Функция обновления данных пользователя
  const refreshUser = useCallback(async () => {
    if (!state.token) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/telegram-auth/me', {
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const user = data.user;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        
        setState(prev => ({
          ...prev,
          user,
          loading: false,
          error: null
        }));
      } else {
        // Если токен недействителен, выходим из системы
        logout();
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: data.message || 'Сессия истекла' 
        }));
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных пользователя:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Ошибка сети при обновлении данных' 
      }));
    }
  }, [state.token, logout]);

  // Функция очистки ошибок
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshUser,
    clearError
  };
};

// Хук для создания авторизованных запросов
export const useAuthenticatedFetch = () => {
  const { token } = useTelegramAuth();

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers
    });
  }, [token]);

  return authenticatedFetch;
};

// Хук для проверки авторизации
export const useRequireAuth = (redirectTo: string = '/auth') => {
  const { isAuthenticated, loading } = useTelegramAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // В реальном приложении здесь должен быть редирект
      console.warn(`Пользователь не авторизован. Редирект на ${redirectTo}`);
    }
  }, [isAuthenticated, loading, redirectTo]);

  return { isAuthenticated, loading };
};
