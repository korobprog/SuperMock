import { useNavigate } from 'react-router-dom';
import {
  Users,
  History,
  Bell,
  ArrowRight,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';
import { useUserDataCheck } from '@/hooks/use-user-data-check';

export function MainMenu() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { userSettings } = useAppStore();
  const { isDataComplete } = useUserDataCheck();

  const hasApiKey = !!userSettings.openRouterApiKey;

  const handleStartInterview = () => {
    // Если данные уже заполнены, перенаправляем на страницу времени
    if (isDataComplete) {
      navigate('/time');
    } else {
      navigate('/profession');
    }
  };

  const menuItems = [
    {
      title: t('home.startInterview'),
      description: t('home.startInterviewDesc'),
      icon: Users,
      onClick: handleStartInterview,
      gradient: 'from-blue-500 to-purple-600',
      primary: true,
    },
    {
      title: t('home.notifications'),
      description: t('home.notificationsDesc'),
      icon: Bell,
      onClick: () => navigate('/notifications'),
      gradient: 'from-indigo-500 to-cyan-500',
    },
    {
      title: t('history.title'),
      description: t('history.description'),
      icon: History,
      onClick: () => navigate('/history'),
      gradient: 'from-green-500 to-blue-500',
    },
    {
      title: 'Приложения',
      description: 'Дополнительные инструменты',
      icon: Grid3X3,
      onClick: () => navigate('/applications'),
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-4">


      {/* Main Menu Grid - мобильная версия */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <Card
              key={index}
                              className={`group transition-all duration-300 hover:shadow-lg p-1 main-menu-item ${
                  (item as any).disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-[1.01] telegram-desktop-fix'
                }`}
                onClick={(item as any).disabled ? undefined : item.onClick}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} text-white flex-shrink-0`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>

                    {(item as any).disabled && (
                      <span className="inline-block mt-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                        {t('common.comingSoon')}
                      </span>
                    )}
                  </div>

                                      {!(item as any).disabled && (
                      <ArrowRight
                        className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
                        size={16}
                      />
                    )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Menu Grid - десктопная версия */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <Card
              key={index}
              className={`group transition-all duration-300 hover:shadow-lg p-1 main-menu-item ${
                (item as any).disabled
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer hover:scale-[1.02] telegram-desktop-fix'
              } ${(item as any).primary ? 'md:col-span-2' : ''}`}
              onClick={(item as any).disabled ? undefined : item.onClick}
            >
              <CardContent className="p-2">
                <div className="flex items-start space-x-4 p-5">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} text-white flex-shrink-0 mt-1`}
                  >
                    <Icon size={24} />
                  </div>

                  <div className="flex-1 min-w-0 mt-0.5">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>

                    {(item as any).disabled && (
                      <span className="inline-block mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                        {t('common.comingSoon')}
                      </span>
                    )}
                  </div>

                  {!(item as any).disabled && (
                    <ArrowRight
                      className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
                      size={20}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions - мобильная версия */}
      <div className="md:hidden pt-3">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">
          {t('common.quickActions')}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartInterview}
            className="text-xs h-7 px-2 telegram-desktop-fix"
          >
            {t('common.interviewer')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartInterview}
            className="text-xs h-7 px-2 telegram-desktop-fix"
          >
            {t('common.candidate')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/history')}
            className="text-xs h-7 px-2 telegram-desktop-fix"
          >
            {t('history.title')}
          </Button>
        </div>
      </div>

      {/* Quick Actions - десктопная версия */}
      <div className="hidden md:block pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {t('common.quickActions')}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartInterview}
            className="text-xs telegram-desktop-fix"
          >
            {t('common.interviewer')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartInterview}
            className="text-xs telegram-desktop-fix"
          >
            {t('common.candidate')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/history')}
            className="text-xs telegram-desktop-fix"
          >
            {t('common.lastInterview')}
          </Button>
        </div>
      </div>
    </div>
  );
}
