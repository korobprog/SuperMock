import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Clock, Users, Target, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { useAppStore } from '@/lib/store';

export function Calendar() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const profession = useAppStore((s) => s.profession);

  // Получаем название профессии для отображения
  const getProfessionName = () => {
    if (!profession) return 'разработчика';
    return t(`profession.${profession}`).toLowerCase();
  };

  const handleBack = () => {
    navigate('/applications');
  };

  // Демо данные для календаря
  const calendarData = {
    upcomingEvents: [
      {
        id: 1,
        title: 'Собеседование в Google',
        type: 'interview',
        date: '2024-01-15',
        time: '14:00',
        duration: 60,
        status: 'confirmed',
        description: 'Техническое собеседование на позицию Senior Frontend Developer',
        participants: ['Вы', 'HR менеджер', 'Технический лид'],
        location: 'Google Meet',
        preparation: [
          'Повторить алгоритмы и структуры данных',
          'Подготовить вопросы о проектах',
          'Изучить последние обновления React 18',
        ],
      },
      {
        id: 2,
        title: 'Изучение TypeScript',
        type: 'study',
        date: '2024-01-16',
        time: '10:00',
        duration: 120,
        status: 'planned',
        description: 'Углубленное изучение продвинутых типов TypeScript',
        participants: ['Вы'],
        location: 'Дома',
        preparation: [
          'Установить TypeScript playground',
          'Подготовить примеры кода',
          'Составить список вопросов',
        ],
      },
      {
        id: 3,
        title: 'Практика алгоритмов',
        type: 'practice',
        date: '2024-01-17',
        time: '16:00',
        duration: 90,
        status: 'planned',
        description: 'Решение задач на LeetCode и HackerRank',
        participants: ['Вы'],
        location: 'Онлайн',
        preparation: [
          'Выбрать задачи по сложности',
          'Подготовить среду разработки',
          'Настроить таймер',
        ],
      },
      {
        id: 4,
        title: 'Собеседование в Meta',
        type: 'interview',
        date: '2024-01-18',
        time: '11:00',
        duration: 45,
        status: 'pending',
        description: 'Первичное интервью с рекрутером',
        participants: ['Вы', 'Рекрутер'],
        location: 'Zoom',
        preparation: [
          'Подготовить рассказ о себе',
          'Изучить информацию о компании',
          'Составить список вопросов',
        ],
      },
    ],
    weeklyStats: {
      interviews: 3,
      studyHours: 12,
      practiceSessions: 5,
      completedTasks: 8,
    },
    monthlyGoals: [
      {
        id: 1,
        title: 'Пройти 5 технических собеседований',
        progress: 60,
        target: 5,
        current: 3,
        category: 'interviews',
      },
      {
        id: 2,
        title: 'Изучить 3 новых технологии',
        progress: 33,
        target: 3,
        current: 1,
        category: 'learning',
      },
      {
        id: 3,
        title: 'Решить 50 алгоритмических задач',
        progress: 80,
        target: 50,
        current: 40,
        category: 'practice',
      },
      {
        id: 4,
        title: 'Создать 2 пет-проекта',
        progress: 50,
        target: 2,
        current: 1,
        category: 'projects',
      },
    ],
    quickActions: [
      {
        title: 'Запланировать собеседование',
        icon: Users,
        color: 'bg-blue-500',
        action: () => alert('Функция планирования собеседований в разработке'),
      },
      {
        title: 'Добавить время обучения',
        icon: BookOpen,
        color: 'bg-green-500',
        action: () => alert('Функция планирования обучения в разработке'),
      },
      {
        title: 'Запланировать практику',
        icon: Target,
        color: 'bg-purple-500',
        action: () => alert('Функция планирования практики в разработке'),
      },
      {
        title: 'Просмотреть статистику',
        icon: TrendingUp,
        color: 'bg-orange-500',
        action: () => alert('Функция просмотра статистики в разработке'),
      },
    ],
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'interview':
        return 'bg-red-100 text-red-800';
      case 'study':
        return 'bg-blue-100 text-blue-800';
      case 'practice':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'interview':
        return Users;
      case 'study':
        return BookOpen;
      case 'practice':
        return Target;
      default:
        return CalendarIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 pb-24 md:pb-4">
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
            <span>Назад</span>
          </Button>
          <Logo size="md" clickable={true} />
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Profile Header */}
        <ProfileHeader />

        {/* Calendar Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Календарь {getProfessionName()}
          </h1>
          <p className="text-muted-foreground">
            Планирование собеседований и обучения
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {calendarData.quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-10 h-10 rounded-lg ${action.color} text-white flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="text-sm font-medium">{action.title}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Статистика недели</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{calendarData.weeklyStats.interviews}</div>
                <div className="text-sm text-muted-foreground">Собеседований</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{calendarData.weeklyStats.studyHours}ч</div>
                <div className="text-sm text-muted-foreground">Обучения</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{calendarData.weeklyStats.practiceSessions}</div>
                <div className="text-sm text-muted-foreground">Практик</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{calendarData.weeklyStats.completedTasks}</div>
                <div className="text-sm text-muted-foreground">Задач выполнено</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Monthly Goals */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Цели месяца</h2>
          <div className="space-y-3">
            {calendarData.monthlyGoals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{goal.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Прогресс</span>
                    <span>{goal.progress}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ближайшие события</h2>
            <Button variant="outline" size="sm" onClick={() => alert('Функция добавления событий в разработке')}>
              <Plus size={16} className="mr-1" />
              Добавить
            </Button>
          </div>
          <div className="space-y-4">
            {calendarData.upcomingEvents.map((event) => {
              const EventIcon = getEventTypeIcon(event.type);
              return (
                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-lg ${getEventTypeColor(event.type)} flex items-center justify-center flex-shrink-0`}>
                        <EventIcon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{event.title}</h3>
                          <Badge variant="outline" className={getStatusColor(event.status)}>
                            {event.status === 'confirmed' ? 'Подтверждено' : 
                             event.status === 'pending' ? 'Ожидает' : 'Запланировано'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {event.description}
                        </p>
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <CalendarIcon size={12} />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock size={12} />
                            <span>{event.time} ({event.duration} мин)</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Users size={12} />
                            <span>{event.participants.length} участников</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <strong>Место:</strong> {event.location}
                        </div>
                        {event.preparation && event.preparation.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Подготовка:</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {event.preparation.slice(0, 2).map((item, index) => (
                                <li key={index} className="flex items-center space-x-1">
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                  <span>{item}</span>
                                </li>
                              ))}
                              {event.preparation.length > 2 && (
                                <li className="text-xs text-primary">
                                  +{event.preparation.length - 2} еще
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
