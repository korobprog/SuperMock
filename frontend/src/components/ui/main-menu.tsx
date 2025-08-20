import { useNavigate } from 'react-router-dom';
import {
  Users,
  History,
  BookOpen,
  Calendar,
  Bell,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { useAppTranslation } from '@/lib/i18n';

export function MainMenu() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { userSettings } = useAppStore();

  const hasApiKey = !!userSettings.openRouterApiKey;

  const menuItems = [
    {
      title: 'Начать интервью',
      description: 'Выберите роль и начните собеседование',
      icon: Users,
      onClick: () => navigate('/profession'),
      gradient: 'from-blue-500 to-purple-600',
      primary: true,
    },
    {
      title: 'Уведомления',
      description: 'Все события и напоминания',
      icon: Bell,
      onClick: () => navigate('/notifications'),
      gradient: 'from-indigo-500 to-cyan-500',
    },
    {
      title: t('history.title'),
      description: 'Просмотр истории интервью',
      icon: History,
      onClick: () => navigate('/history'),
      gradient: 'from-green-500 to-blue-500',
    },
    {
      title: 'Материалы',
      description: 'Вопросы и советы по подготовке',
      icon: BookOpen,
      onClick: () => {
        /* TODO: implement */
      },
      gradient: 'from-orange-500 to-red-500',
      disabled: true,
    },
    {
      title: 'Календарь',
      description: 'Запланированные интервью',
      icon: Calendar,
      onClick: () => {
        /* TODO: implement */
      },
      gradient: 'from-purple-500 to-pink-500',
      disabled: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* AI Tip Card */}
      {!hasApiKey && (
        <Card
          className="border-2 border-dashed border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group telegram-desktop-fix"
          onClick={() => navigate('/profile')}
        >
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Zap className="text-yellow-500 mt-0.5" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t('home.aiTipTitle')}
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {t('home.aiTipDesc')}
                </p>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/profile');
                    }}
                  >
                    Настроить API
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <ArrowRight
                  className="text-yellow-600 dark:text-yellow-400 group-hover:translate-x-1 transition-transform duration-200"
                  size={16}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <Card
              key={index}
              className={`group transition-all duration-300 hover:shadow-lg p-1 main-menu-item ${
                item.disabled
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer hover:scale-[1.02] telegram-desktop-fix'
              } ${item.primary ? 'md:col-span-2' : ''}`}
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
                        Скоро
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

      {/* Quick Actions */}
      <div className="pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Быстрые действия
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profession')}
            className="text-xs telegram-desktop-fix"
          >
            Интервьюер
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profession')}
            className="text-xs telegram-desktop-fix"
          >
            Кандидат
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/history')}
            className="text-xs telegram-desktop-fix"
          >
            Последнее интервью
          </Button>
        </div>
      </div>
    </div>
  );
}
