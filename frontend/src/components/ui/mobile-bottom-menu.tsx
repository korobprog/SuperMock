import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Bell, Users, Home, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/lib/i18n';
import { useHapticFeedback } from '@/lib/haptic-feedback';
import { useUserDataCheck } from '@/hooks/use-user-data-check';
import { useOnboardingStatus } from '@/hooks/use-onboarding-status';
import { useAppStore } from '@/lib/store';

export function MobileBottomMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppTranslation();
  const { light } = useHapticFeedback();
  const { isDataComplete } = useUserDataCheck();
  const { isComplete: isOnboardingComplete } = useOnboardingStatus();
  
  // Получаем данные из store
  const profession = useAppStore((s) => s.profession);
  const language = useAppStore((s) => s.language);
  const selectedTools = useAppStore((s) => s.selectedTools);
  const userId = useAppStore((s) => s.userId);
  const userSettings = useAppStore((s) => s.userSettings);
  const hasApiKey = !!userSettings.openrouterApiKey;

  const isHomeActive = location.pathname === '/';
  const isProfileActive = location.pathname === '/profile';
  const isNotificationsActive = location.pathname === '/notifications';
  const isProfessionActive = location.pathname === '/profession';

  const handleNavigation = (path: string) => {
    light(); // Вибрация при нажатии
    navigate(path);
  };

  const handleStartInterview = () => {
    light(); // Вибрация при нажатии
    
    console.log('🎯 Smart navigation check:');
    console.log('  - profession:', profession);
    console.log('  - language:', language);
    console.log('  - selectedTools:', selectedTools);
    console.log('  - selectedTools.length:', selectedTools.length);
    console.log('  - userId:', userId);
    console.log('  - isOnboardingComplete:', isOnboardingComplete);
    console.log('  - hasApiKey:', hasApiKey);
    
    // Если onboarding завершен, идем сразу на время
    if (isOnboardingComplete) {
      console.log('🚀 Onboarding завершен, прямой переход на /time');
      navigate('/time');
      return;
    }
    
    // Проверяем, есть ли профессия и язык
    const hasProfessionAndLanguage = profession && language;
    
    console.log('  - hasProfessionAndLanguage:', hasProfessionAndLanguage);
    console.log('  - hasProfessionAndLanguage && selectedTools.length > 0:', hasProfessionAndLanguage && selectedTools.length > 0);
    
    // Если есть профессия, язык и инструменты, но нет API ключа, идем на настройку API
    if (hasProfessionAndLanguage && selectedTools.length > 0 && !hasApiKey) {
      console.log('🔑 Переход на /api-key-setup: нужен API ключ');
      navigate('/api-key-setup');
    }
    // Если есть профессия, язык и инструменты, идем сразу на время
    else if (hasProfessionAndLanguage && selectedTools.length > 0) {
      console.log('🚀 Прямой переход на /time: профессия и язык настроены');
      navigate('/time');
    }
    // Если есть профессия и язык, но нет инструментов, идем на выбор инструментов
    else if (hasProfessionAndLanguage && selectedTools.length === 0) {
      console.log('🔧 Переход на /tools: профессия и язык есть, нужны инструменты');
      navigate(`/tools?profession=${profession}`);
    }
    // Если есть профессия, но нет языка, идем на выбор языка
    else if (profession && !language) {
      console.log('🌍 Переход на /language: профессия есть, нужен язык');
      navigate('/language');
    }
    // В остальных случаях идем на выбор профессии
    else {
      console.log('💼 Переход на /profession: нужна профессия');
      navigate('/profession');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 px-3 py-4 md:hidden z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Кнопка домой */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation('/')}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
            isHomeActive
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)]'
              : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]'
          }`}
        >
          <Home className="h-5 w-5" />
        </Button>

        {/* Большая полукруглая кнопка "Начать интервью" по центру */}
        <div className="relative">
          <Button
            onClick={handleStartInterview}
            className={`flex items-center justify-center w-16 h-16 rounded-full shadow-[0_8px_32px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.6)] transform hover:scale-110 active:scale-95 transition-all duration-300 -mt-4 border-4 backdrop-blur-sm ${
              profession && language && language !== 'ru' && selectedTools.length > 0
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300/30' // Готов к интервью
                : profession && language && language !== 'ru'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 border-yellow-300/30' // Нужны инструменты
                : profession
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-300/30' // Нужен язык
                : 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-300/30' // Нужна профессия
            } text-white`}
          >
            <Users className="h-7 w-7" />
          </Button>
          
          {/* Индикатор прогресса */}
          {profession && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className={`w-2 h-2 rounded-full ${
                profession && language && language !== 'ru' && selectedTools.length > 0
                  ? 'bg-green-500' // Готов к интервью
                  : profession && language && language !== 'ru'
                  ? 'bg-yellow-500' // Нужны инструменты
                  : 'bg-blue-500' // Нужен язык
              }`} />
            </div>
          )}
        </div>

        {/* Кнопка уведомлений */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation('/notifications')}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
            isNotificationsActive
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)]'
              : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]'
          }`}
        >
          <Bell className="h-5 w-5" />
        </Button>

           {/* Кнопка настроек */}
           <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation('/profile')}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
            isProfileActive
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)]'
              : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]'
          }`}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
