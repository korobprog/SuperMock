import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Bell, Users, Home, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTranslation } from '@/lib/i18n';
import { useHapticFeedback } from '@/lib/haptic-feedback';
import { useUserDataCheck } from '@/hooks/use-user-data-check';

export function MobileBottomMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppTranslation();
  const { light } = useHapticFeedback();
  const { isDataComplete } = useUserDataCheck();

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
    // Если данные уже заполнены, перенаправляем на страницу времени
    if (isDataComplete) {
      navigate('/time');
    } else {
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
        <Button
          onClick={handleStartInterview}
          className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-[0_8px_32px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.6)] transform hover:scale-110 active:scale-95 transition-all duration-300 -mt-4 border-4 border-white/20 backdrop-blur-sm"
        >
          <Users className="h-7 w-7" />
        </Button>

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
