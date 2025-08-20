import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiGetUserSettings, apiSaveUserSettings } from './api';
import { TelegramUser } from './telegram-auth';

type Role = 'interviewer' | 'candidate' | null;

export interface UserSettings {
  openRouterApiKey: string | null;
  stackblitzApiKey: string | null;
  preferredModel: string;
  questionsLevel: 'junior' | 'middle' | 'senior';
  useAIGeneration: boolean;
  questionsCount: number;
}

export type AppState = {
  userId: number | null;
  telegramUser: TelegramUser | null;
  role: Role;
  profession: string | null;
  language: string;
  slotsLocal: string[];
  sessionId: string | null;
  jitsiRoom: string | null;
  userSettings: UserSettings;
  selectedTools: string[]; // Добавляем выбранные инструменты
  setUserId: (id: number) => void;
  setTelegramUser: (user: TelegramUser | null) => void;
  loadUserSettings: (userId: number) => Promise<void>;
  setRole: (role: Role) => void;
  setProfession: (p: string) => void;
  setLanguage: (lng: string) => void;
  setSlotsLocal: (slots: string[]) => void;
  setSession: (s: { sessionId: string; jitsiRoom: string } | null) => void;
  setUserSettings: (settings: Partial<UserSettings>) => void;
  setSelectedTools: (tools: string[]) => void; // Добавляем функцию для установки инструментов
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      telegramUser: null,
      role: null,
      profession: null,
      language: 'ru',
      slotsLocal: [],
      sessionId: null,
      jitsiRoom: null,
      selectedTools: [], // Инициализируем пустым массивом
      userSettings: {
        openRouterApiKey: null,
        stackblitzApiKey: null,
        preferredModel: 'meta-llama/llama-3.1-8b-instruct',
        questionsLevel: 'middle',
        useAIGeneration: false,
        questionsCount: 10,
      },
      setUserId: (id) => {
        set({ userId: id });
        // Автоматически загружаем настройки пользователя при установке userId
        if (id > 0) {
          const store = useAppStore.getState();
          store.loadUserSettings(id).catch(() => {
            // Silent error handling
          });
        }
      },
      setTelegramUser: (user) => {
        set({ telegramUser: user });
        // Если пользователь Telegram установлен, используем его ID как userId
        if (user) {
          const store = useAppStore.getState();
          store.setUserId(user.id);
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
      setRole: (role) => set({ role }),
      setProfession: (p) => set({ profession: p }),
      setLanguage: (lng) => set({ language: lng }),
      setSlotsLocal: (slots) => set({ slotsLocal: slots }),
      setSession: (s) =>
        set({
          sessionId: s?.sessionId ?? null,
          jitsiRoom: s?.jitsiRoom ?? null,
        }),
      setUserSettings: (settings) => {
        set((state) => ({
          userSettings: { ...state.userSettings, ...settings },
        }));

        // Автоматически пытаемся сохранить в БД
        const currentState = get();
        let userId = currentState.userId;

        // Если нет userId, создаем локального пользователя (только в development)
        if (!userId && import.meta.env.DEV) {
          userId = generateLocalUserId();
          set({ userId });
        }

        // Асинхронно сохраняем в БД
        apiSaveUserSettings({
          userId,
          ...settings,
        }).catch(() => {
          // Не показываем ошибку пользователю, данные уже сохранены в localStorage
        });
      },
      setSelectedTools: (tools) => set({ selectedTools: tools }), // Добавляем функцию для установки инструментов
      reset: () =>
        set({
          role: null,
          profession: null,
          slotsLocal: [],
          sessionId: null,
          jitsiRoom: null,
          selectedTools: [], // Сбрасываем инструменты при reset
        }),
      clearAll: () =>
        set({
          userId: 0,
          telegramUser: null,
          role: null,
          profession: null,
          slotsLocal: [],
          sessionId: null,
          jitsiRoom: null,
          selectedTools: [], // Очищаем инструменты при clearAll
          userSettings: {
            openRouterApiKey: null,
            stackblitzApiKey: null,
            preferredModel: 'openai/gpt-4o-mini',
            questionsLevel: 'middle',
            useAIGeneration: false,
            questionsCount: 10,
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
        profession: state.profession,
        selectedTools: state.selectedTools, // Сохраняем выбранные инструменты
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
            state.userId = 0;
            state.telegramUser = null;
            state.selectedTools = []; // Очищаем инструменты при выходе
            state.userSettings = {
              openRouterApiKey: null,
              stackblitzApiKey: null,
              preferredModel: 'openai/gpt-4o-mini',
              questionsLevel: 'middle',
              useAIGeneration: false,
              questionsCount: 10,
            };
            // Очищаем флаги выхода
            sessionStorage.removeItem('just_logged_out');
            sessionStorage.removeItem('logout_timestamp');
            return;
          }

          // Если нет userId (не авторизован через Telegram), создаем локального пользователя (только в development)
          if (!state.userId && !state.telegramUser && import.meta.env.DEV) {
            const localUserId = generateLocalUserId();
            state.userId = localUserId;
            console.log('Initialized local user ID:', localUserId);
          }
        }
      },
    }
  )
);
