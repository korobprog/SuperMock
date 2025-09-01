import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiGetUserSettings, apiSaveUserSettings, apiCheckUserData } from './api';
import { TelegramUser } from './telegram-auth';

type Role = 'interviewer' | 'candidate' | null;

export interface UserSettings {
  id: number;
  userId: string;
  openrouterApiKey?: string;
  preferredModel: string;
  questionsLevel: string;
  useAiGeneration: boolean;
  questionsCount: number;
  stackblitzApiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaSettings {
  videoDeviceId: string;
  audioDeviceId: string;
  audioOutputDeviceId: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  volume: number;
}

export type AppState = {
  userId: number | null;
  telegramUser: TelegramUser | null;
  role: Role;
  lastRole: Role; // Добавляем последнюю роль
  profession: string | null;
  language: string;
  slotsLocal: string[];
  sessionId: string | null;
  jitsiRoom: string | null;
  userSettings: UserSettings;
  mediaSettings: MediaSettings | null; // Добавляем медиа настройки
  selectedTools: string[]; // Добавляем выбранные инструменты
  demoMode: boolean; // Добавляем режим демо
  setUserId: (id: number) => void;
  setTelegramUser: (user: TelegramUser | null) => void;
  loadUserSettings: (userId: number) => Promise<void>;
  loadUserData: (userId: number) => Promise<void>;
  setRole: (role: Role) => void;
  setProfession: (p: string) => void;
  setLanguage: (lng: string) => void;
  setSlotsLocal: (slots: string[]) => void;
  setSession: (s: { sessionId: string; jitsiRoom: string } | null) => void;
  setUserSettings: (settings: Partial<UserSettings>) => void;
  setMediaSettings: (settings: MediaSettings) => void; // Добавляем функцию для установки медиа настроек
  setSelectedTools: (tools: string[]) => void; // Добавляем функцию для установки инструментов
  setDemoMode: (mode: boolean) => void; // Добавляем функцию для установки режима демо
  saveCurrentRoleAsLast: () => void; // Функция для сохранения текущей роли как последней
  reset: () => void;
  clearAll: () => void;
};

// Генерируем локальный userId если его нет
function generateLocalUserId(): number {
  const existingId = localStorage.getItem('Super Mock-local-user-id');
  if (existingId) {
    return parseInt(existingId);
  }

  // Генерируем уникальный ID для локального пользователя
  // Используем timestamp + случайное число, но убеждаемся что это не конфликтует с Telegram ID
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const localId = parseInt(
    `1${timestamp.toString().slice(-8)}${random.toString().padStart(3, '0')}`
  );

  localStorage.setItem('Super Mock-local-user-id', localId.toString());
  return localId;
}

// Функция для получения или генерации userId
function getOrGenerateUserId(): number {
  const existingId = localStorage.getItem('Super Mock-local-user-id');
  if (existingId) {
    return parseInt(existingId);
  }
  return generateLocalUserId();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: getOrGenerateUserId(), // Автоматически генерируем userId при инициализации
      telegramUser: null,
      role: null,
      lastRole: null,
      profession: null,
      language: 'ru',
      slotsLocal: [],
      sessionId: null,
      jitsiRoom: null,
      mediaSettings: null, // Инициализируем медиа настройки как null
      selectedTools: [], // Инициализируем пустым массивом
      demoMode: false, // Инициализируем режим демо как false
      userSettings: {
        id: 0,
        userId: '',
        openrouterApiKey: null,
        stackblitzApiKey: null,
        preferredModel: 'openai/gpt-4o-mini',
        questionsLevel: 'middle',
        useAiGeneration: false,
        questionsCount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      setUserId: (id) => {
        console.log('🔧 setUserId called with:', id, 'Type:', typeof id);
        // Если передается 0 или null, генерируем новый ID
        const finalId = id && id > 0 ? id : getOrGenerateUserId();
        set({ userId: finalId });
        console.log('🔧 userId set in store to:', finalId);
        // Автоматически загружаем данные пользователя при установке userId
        if (finalId > 0) {
          const store = useAppStore.getState();
          store.loadUserData(finalId).catch(() => {
            // Silent error handling
          });
        }
      },
      setTelegramUser: (user) => {
        console.log('🔧 setTelegramUser called with:', user);
        set({ telegramUser: user });
        // Если пользователь Telegram установлен, используем его ID как userId
        if (user) {
          console.log('🔧 Setting userId from telegramUser:', user.id);
          // Используем setTimeout для избежания race condition
          setTimeout(() => {
            const store = useAppStore.getState();
            console.log('🔧 About to set userId:', user.id, 'Current state:', store.userId);
            store.setUserId(user.id);
            console.log('🔧 userId set to:', user.id, 'New state:', useAppStore.getState().userId);
          }, 0);
        }
      },
      loadUserSettings: async (userId) => {
        try {
          const settings = await apiGetUserSettings(userId);
          set((state) => ({
            userSettings: { ...state.userSettings, ...settings },
          }));
        } catch (error) {
          // Не показываем ошибку пользователю, просто используем дефолтные настройки
        }
      },
      loadUserData: async (userId) => {
        try {
          console.log('🔍 Loading user data for userId:', userId);
          
          // Загружаем настройки пользователя
          const settings = await apiGetUserSettings(userId);
          set((state) => ({
            userSettings: { ...state.userSettings, ...settings },
          }));
          
          // Загружаем данные пользователя (профессия, язык, инструменты)
          const userData = await apiCheckUserData(userId);
          console.log('📊 Loaded user data:', userData);
          
          if (userData.hasProfession && userData.profession) {
            set({ profession: userData.profession });
          }
          
          if (userData.tools && userData.tools.length > 0) {
            set({ selectedTools: userData.tools });
          }
          
          console.log('✅ User data loaded successfully');
        } catch (error) {
          console.warn('⚠️ Failed to load user data:', error);
          // Не показываем ошибку пользователю, просто используем дефолтные настройки
        }
      },
      setRole: (role) => {
        set({ role }); // Просто устанавливаем новую роль, не меняем lastRole
      },
      setProfession: (p) => set({ profession: p }),
      setLanguage: (lng) => set({ language: lng }),
      setSlotsLocal: (slots) => set({ slotsLocal: slots }),
      setSession: (s) => {
        const currentState = get();
        // Если сессия завершается (s === null), сохраняем текущую роль как lastRole
        if (s === null && currentState.role) {
          set({
            sessionId: null,
            jitsiRoom: null,
            lastRole: currentState.role, // Сохраняем текущую роль как последнюю
          });
        } else {
          set({
            sessionId: s?.sessionId ?? null,
            jitsiRoom: s?.jitsiRoom ?? null,
          });
        }
      },
      setUserSettings: (settings) => {
        set((state) => ({
          userSettings: { ...state.userSettings, ...settings },
        }));

        // Асинхронно сохраняем в БД
        const currentUserId = get().userId;
        const normalizedUserId = Number(currentUserId) || 0;
        
        apiSaveUserSettings({
          userId: normalizedUserId,
          ...settings,
        }).catch(() => {
          // Не показываем ошибку пользователю, данные уже сохранены в localStorage
        });
      },
      setSelectedTools: (tools) => set({ selectedTools: tools }), // Добавляем функцию для установки инструментов
      setMediaSettings: (settings) => set({ mediaSettings: settings }), // Добавляем функцию для установки медиа настроек
      setDemoMode: (mode) => set({ demoMode: mode }), // Добавляем функцию для установки режима демо
      saveCurrentRoleAsLast: () => {
        const currentState = get();
        if (currentState.role) {
          console.log('Saving current role as lastRole:', currentState.role);
          set({ lastRole: currentState.role });
        }
      },
      reset: () =>
        set({
          role: null,
          lastRole: null,
          profession: null,
          slotsLocal: [],
          sessionId: null,
          jitsiRoom: null,
          selectedTools: [], // Сбрасываем инструменты при reset
          mediaSettings: null, // Сбрасываем медиа настройки при reset
          demoMode: false, // Сбрасываем режим демо при reset
        }),
      clearAll: () =>
        set({
          userId: Number(getOrGenerateUserId()) || 0, // Генерируем новый userId вместо 0
          telegramUser: null,
          role: null,
          lastRole: null,
          profession: null,
          slotsLocal: [],
          sessionId: null,
          jitsiRoom: null,
          selectedTools: [], // Очищаем инструменты при clearAll
          mediaSettings: null, // Очищаем медиа настройки при clearAll
          demoMode: false, // Очищаем режим демо при clearAll
          userSettings: {
            id: 0,
            userId: '',
            openrouterApiKey: null,
            stackblitzApiKey: null,
            preferredModel: 'openai/gpt-4o-mini',
            questionsLevel: 'middle',
            useAiGeneration: false,
            questionsCount: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
    }),
    {
      name: 'Super Mock-storage', // имя ключа в localStorage
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только настройки пользователя, язык и некоторые данные
      partialize: (state) => ({
        userSettings: state.userSettings,
        language: state.language,
        telegramUser: state.telegramUser,
        userId: state.userId,
        role: state.role,
        lastRole: state.lastRole, // Сохраняем последнюю роль
        profession: state.profession,
        selectedTools: state.selectedTools, // Сохраняем выбранные инструменты
        mediaSettings: state.mediaSettings, // Сохраняем медиа настройки
        demoMode: state.demoMode, // Сохраняем режим демо
      }),
      // Версия для миграции в будущем
      version: 1,
      // Инициализация после загрузки из localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Проверяем, не выходил ли пользователь только что
          const justLoggedOut = sessionStorage.getItem('just_logged_out');
          const logoutTimestamp = sessionStorage.getItem('logout_timestamp');

          // Проверяем, не прошло ли больше часа с момента выхода
          const isRecentlyLoggedOut =
            justLoggedOut &&
            logoutTimestamp &&
            Date.now() - parseInt(logoutTimestamp) < 60 * 60 * 1000; // 1 час

          if (isRecentlyLoggedOut) {
            // Если пользователь недавно вышел, очищаем все данные
            console.log('User recently logged out, clearing all data');
            state.userId = Number(getOrGenerateUserId()) || 0; // Генерируем новый userId вместо 0
            state.telegramUser = null;
            state.role = null;
            state.lastRole = null;
            state.selectedTools = []; // Очищаем инструменты при выходе
            state.userSettings = {
              id: 0,
              userId: '',
              openrouterApiKey: null,
              stackblitzApiKey: null,
              preferredModel: 'openai/gpt-4o-mini',
              questionsLevel: 'middle',
              useAiGeneration: false,
              questionsCount: 10,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            // Очищаем флаги выхода
            sessionStorage.removeItem('just_logged_out');
            sessionStorage.removeItem('logout_timestamp');
            return;
          }

          // Если нет userId (не авторизован через Telegram), создаем локального пользователя (только в development)
          if (!state.userId && !state.telegramUser && import.meta.env.DEV) {
            const localUserId = Number(generateLocalUserId()) || 0;
            state.userId = localUserId;
            console.log('Initialized local user ID:', localUserId);
          }
        }
      },
    }
  )
);
