import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { apiCheckUserData } from '@/lib/api';

export function useUserDataCheck() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfession, setHasProfession] = useState(false);
  const [hasTools, setHasTools] = useState(false);
  const [profession, setProfession] = useState<string | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const userId = useAppStore((s) => s.userId);
  const telegramUser = useAppStore((s) => s.telegramUser);
  const currentProfession = useAppStore((s) => s.profession);
  const setProfessionStore = useAppStore((s) => s.setProfession);
  const setSelectedToolsStore = useAppStore((s) => s.setSelectedTools);

  useEffect(() => {
    async function checkUserData() {
      // Если нет userId, но есть telegramUser, ждем установки userId
      if (!userId && telegramUser) {
        console.log('🔍 Waiting for userId to be set from telegramUser...', {
          telegramUser,
          telegramUserId: telegramUser.id,
          currentUserId: userId
        });
        
        // Попробуем установить userId из telegramUser
        const setUserId = useAppStore.getState().setUserId;
        if (setUserId && telegramUser.id) {
          console.log('🔧 Attempting to set userId from telegramUser in useUserDataCheck');
          setUserId(telegramUser.id);
        }
        
        // Добавляем таймаут для предотвращения бесконечного ожидания
        setTimeout(() => {
          const currentUserId = useAppStore.getState().userId;
          if (!currentUserId && telegramUser) {
            console.log('⚠️ Timeout waiting for userId, forcing set');
            setUserId(telegramUser.id);
          }
        }, 2000);
        
        return;
      }
      
      if (!userId) {
        console.log('🔍 No userId available, stopping check');
        setIsLoading(false);
        return;
      }

      // Всегда пытаемся загрузить данные из базы данных
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Checking user data for userId:', userId);
        
        // Добавляем таймаут для API вызова (увеличиваем для продакшена)
        const checkPromise = apiCheckUserData(userId, currentProfession || undefined);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Check user data timeout')), 5000)
        );
        
        const userData = await Promise.race([checkPromise, timeoutPromise]) as {
          hasProfession: boolean;
          hasTools: boolean;
          profession?: string;
          tools?: string[];
        };
        
        console.log('📊 User data from database:', userData);
        
        setHasProfession(userData.hasProfession);
        // If a profession is selected, require tools for that profession specifically
        const hasToolsForProfession =
          Array.isArray(userData.tools) && userData.tools.length > 0;
        setHasTools(hasToolsForProfession);
        setProfession(userData.profession || null);
        setTools(userData.tools || []);

        // Обновляем store если данные найдены
        if (userData.profession) {
          console.log('💾 Updating store with profession:', userData.profession);
          setProfessionStore(userData.profession);
        }
        if (userData.tools && userData.tools.length > 0) {
          console.log('💾 Updating store with tools:', userData.tools);
          setSelectedToolsStore(userData.tools);
        }
      } catch (err) {
        console.log('⚠️ API error or timeout, using local data as fallback:', err);
        // Не устанавливаем ошибку для 404 или таймаутов - это нормальное поведение
        setError(null);
        
        // Используем локальные данные как fallback
        setHasProfession(!!currentProfession);
        setHasTools(false);
        setProfession(currentProfession);
        setTools([]);
        
        // Если есть telegramUser, но нет profession, устанавливаем дефолтную профессию
        if (telegramUser && !currentProfession) {
          console.log('🔧 Setting default profession for new user');
          setProfessionStore('Frontend Developer');
          setHasProfession(true);
          setProfession('Frontend Developer');
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkUserData();
  }, [userId, telegramUser, currentProfession, setProfessionStore, setSelectedToolsStore]);

  const isDataComplete = hasProfession && hasTools;

  // Добавляем отладочную информацию
  console.log('🔍 useUserDataCheck state:', {
    isLoading,
    hasProfession,
    hasTools,
    profession,
    tools,
    isDataComplete,
    userId,
    telegramUser: telegramUser ? { id: telegramUser.id, first_name: telegramUser.first_name } : null,
    currentProfession
  });

  return {
    isLoading,
    hasProfession,
    hasTools,
    profession,
    tools,
    isDataComplete,
    error,
  };
}
