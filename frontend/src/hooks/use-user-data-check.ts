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
  const setProfessionStore = useAppStore((s) => s.setProfession);
  const setSelectedToolsStore = useAppStore((s) => s.setSelectedTools);

  useEffect(() => {
    async function checkUserData() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const userData = await apiCheckUserData(userId);
        
        setHasProfession(userData.hasProfession);
        setHasTools(userData.hasTools);
        setProfession(userData.profession || null);
        setTools(userData.tools || []);

        // Обновляем store если данные найдены
        if (userData.profession) {
          setProfessionStore(userData.profession);
        }
        if (userData.tools && userData.tools.length > 0) {
          setSelectedToolsStore(userData.tools);
        }
      } catch (err) {
        console.log('User data not found in database, using local data');
        // Не устанавливаем ошибку для 404 - это нормальное поведение
        // Пользователь может не иметь данных в БД
        setError(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkUserData();
  }, [userId, setProfessionStore, setSelectedToolsStore]);

  const isDataComplete = hasProfession && hasTools;

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
