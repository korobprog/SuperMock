import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Brain,
  ArrowLeft,
  ArrowRight,
  Map,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { useAppStore } from '@/lib/store';

export function Applications() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const profession = useAppStore((s) => s.profession);

  // Получаем название профессии для отображения
  const getProfessionName = () => {
    if (!profession) return 'разработчика';
    return t(`profession.${profession}`).toLowerCase();
  };

  const appItems = [
    {
      title: `Тренажер для ${getProfessionName()}`,
      description: 'Практические задания для улучшения навыков',
      icon: Target,
      onClick: () => {
        navigate('/trainer');
      },
      gradient: 'from-orange-500 to-red-500',
      disabled: false,
    },
    {
      title: t('home.materials'),
      description: t('home.materialsDesc'),
      icon: BookOpen,
      onClick: () => {
        navigate('/materials');
      },
      gradient: 'from-purple-500 to-pink-500',
      disabled: false,
    },
    {
      title: t('home.calendar'),
      description: t('home.calendarDesc'),
      icon: Calendar,
      onClick: () => {
        navigate('/calendar');
      },
      gradient: 'from-indigo-500 to-purple-500',
      disabled: false,
    },
    {
      title: 'AI Ментор',
      description: 'Поможет дойти до оффера',
      icon: Brain,
      onClick: () => {
        navigate('/ai-mentor');
      },
      gradient: 'from-emerald-500 to-teal-500',
      disabled: false,
    },
    {
      title: 'МИД карта',
      description: 'Ваша дорожная карта к цели',
      icon: Map,
      onClick: () => {
        navigate('/roadmap');
      },
      gradient: 'from-blue-500 to-indigo-500',
      disabled: false,
    },
  ];

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 pb-24 md:pb-4">
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="lg" className="mb-1" clickable={true} />
          </div>
        </div>

        {/* Profile Header */}
        <ProfileHeader />

        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-2 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-foreground">
              Приложения
            </h1>
          </div>
        </div>

        <p className="text-center text-muted-foreground mb-6">
          Дополнительные инструменты для вашего развития
        </p>

        {/* Applications Grid - мобильная версия */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:hidden">
          {appItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <Card
                key={index}
                className={`group transition-all duration-300 hover:shadow-lg p-1 main-menu-item ${
                  item.disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-[1.01] telegram-desktop-fix'
                }`}
                onClick={item.disabled ? undefined : item.onClick}
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

                      {item.disabled && (
                        <span className="inline-block mt-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                          {t('common.comingSoon')}
                        </span>
                      )}
                    </div>

                    {!item.disabled && (
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

        {/* Applications Grid - десктопная версия */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
          {appItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <Card
                key={index}
                className={`group transition-all duration-300 hover:shadow-lg p-1 main-menu-item ${
                  item.disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-[1.02] telegram-desktop-fix'
                }`}
                onClick={item.disabled ? undefined : item.onClick}
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

                      {item.disabled && (
                        <span className="inline-block mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                          {t('common.comingSoon')}
                        </span>
                      )}
                    </div>

                    {!item.disabled && (
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
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
