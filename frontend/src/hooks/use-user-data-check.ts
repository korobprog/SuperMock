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
  const currentProfession = useAppStore((s) => s.profession);
  const setProfessionStore = useAppStore((s) => s.setProfession);
  const setSelectedToolsStore = useAppStore((s) => s.setSelectedTools);

  useEffect(() => {
    async function checkUserData() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Всегда пытаемся загрузить данные из базы данных
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Checking user data for userId:', userId);
        
        // Добавляем таймаут для API вызова
        const checkPromise = apiCheckUserData(userId, currentProfession || undefined);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Check user data timeout')), 3000)
        );
        
        const userData = await Promise.race([checkPromise, timeoutPromise]);
        
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
        console.log('User data not found in database, using local data');
        // Не устанавливаем ошибку для 404 - это нормальное поведение
        // Пользователь может не иметь данных в БД
        setError(null);
        
        // Используем локальные данные как fallback
        setHasProfession(!!currentProfession);
        setHasTools(false);
        setProfession(currentProfession);
        setTools([]);
      } finally {
        setIsLoading(false);
      }
    }

    checkUserData();
  }, [userId, currentProfession, setProfessionStore, setSelectedToolsStore]);

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
