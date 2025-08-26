import React, { useState, useEffect } from 'react';
import { Brain, Calendar, Clock, Users, BookOpen, Target, AlertCircle, Play, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

// 📅 Типы для AI Calendar
interface AICalendarEvent {
  id: string;
  title: string;
  description: string;
  type: 'study' | 'practice' | 'interview' | 'review';
  date: string;
  duration: number; // в минутах
  relatedSkill: string;
  priority: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface AICalendarSectionProps {
  className?: string;
  showHeader?: boolean;
  maxItems?: number;
  viewMode?: 'upcoming' | 'week' | 'month';
  onEventClick?: (event: AICalendarEvent) => void;
  onEventJoin?: (event: AICalendarEvent) => void;
}

// 📊 Компонент отдельного события календаря
function AICalendarEventCard({ 
  event, 
  onEventClick,
  onEventJoin
}: { 
  event: AICalendarEvent;
  onEventClick?: (event: AICalendarEvent) => void;
  onEventJoin?: (event: AICalendarEvent) => void;
}) {
  const { t } = useAppTranslation();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'practice':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'interview':
        return <Users className="h-4 w-4 text-red-500" />;
      case 'review':
        return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'study':
        return 'border-blue-500 bg-blue-50';
      case 'practice':
        return 'border-green-500 bg-green-50';
      case 'interview':
        return 'border-red-500 bg-red-50';
      case 'review':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getTypeText = (type: string): string => {
    switch (type) {
      case 'study':
        return t('ai.calendar.study', 'Изучение');
      case 'practice':
        return t('ai.calendar.practice', 'Практика');
      case 'interview':
        return t('ai.calendar.interview', 'Собеседование');
      case 'review':
        return t('ai.calendar.review', 'Повторение');
      default:
        return type;
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 9) {
      return <Badge variant="destructive" className="text-xs">Критично</Badge>;
    }
    if (priority >= 7) {
      return <Badge variant="default" className="text-xs">Важно</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Обычно</Badge>;
  };

  const eventDate = new Date(event.date);
  const now = new Date();
  const isToday = eventDate.toDateString() === now.toDateString();
  const isUpcoming = eventDate > now;
  const isLive = Math.abs(eventDate.getTime() - now.getTime()) < 30 * 60 * 1000; // 30 минут

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date): string => {
    if (isToday) return 'Сегодня';
    
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'Завтра';
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <Card 
      className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${getTypeColor(event.type)} ${isLive ? 'ring-2 ring-green-300' : ''}`}
      onClick={() => onEventClick?.(event)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getTypeIcon(event.type)}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Brain className="h-4 w-4 text-blue-500" />
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  AI Planned
                </Badge>
                {getPriorityBadge(event.priority)}
                {isLive && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    В эфире
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base group-hover:text-blue-600 transition-colors">
                {event.title}
              </CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {event.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Время и дата */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(eventDate)}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatTime(eventDate)} ({event.duration}м)</span>
            </div>
          </div>
        </div>

        {/* Метаданные */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Target className="h-4 w-4" />
            <span>{getTypeText(event.type)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Badge variant="secondary" className="text-xs">
              {event.relatedSkill}
            </Badge>
          </div>
        </div>

        {/* Статус и действия */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-gray-500">
            {isUpcoming ? (
              <span>Запланировано</span>
            ) : (
              <span>Завершено</span>
            )}
          </div>
          
          {isLive && onEventJoin && (
            <Button 
              size="sm" 
              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onEventJoin(event);
              }}
            >
              <Play className="h-3 w-3" />
              <span>Присоединиться</span>
            </Button>
          )}
          
          {isUpcoming && !isLive && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                // Добавить в личный календарь
              }}
            >
              <Calendar className="h-3 w-3" />
              <span>В календарь</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 🧩 Основной компонент секции AI Calendar
export function AICalendarSection({ 
  className = '', 
  showHeader = true,
  maxItems,
  viewMode = 'upcoming',
  onEventClick,
  onEventJoin
}: AICalendarSectionProps) {
  const { t } = useAppTranslation();
  const userId = useAppStore((s) => s.user?.id);
  
  const [events, setEvents] = useState<AICalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [upcomingEvents, setUpcomingEvents] = useState(0);

  // 📡 Загрузка AI календарных событий
  useEffect(() => {
    const fetchAICalendar = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Формируем параметры запроса
        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (skillFilter !== 'all') params.append('skill', skillFilter);
        
        // Добавляем фильтр по времени для разных режимов просмотра
        const now = new Date();
        switch (viewMode) {
          case 'week':
            const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            params.append('from', now.toISOString());
            params.append('to', weekEnd.toISOString());
            break;
          case 'month':
            const monthEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            params.append('from', now.toISOString());
            params.append('to', monthEnd.toISOString());
            break;
          case 'upcoming':
          default:
            params.append('from', now.toISOString());
            break;
        }
        
        const response = await fetch(
          `/api/users/${userId}/ai-calendar?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          let eventsData = data.calendarEvents || [];
          
          // Сортируем по дате
          eventsData.sort((a: AICalendarEvent, b: AICalendarEvent) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          
          // Применяем лимит элементов если указан
          if (maxItems) {
            eventsData = eventsData.slice(0, maxItems);
          }
          
          setEvents(eventsData);
          setUpcomingEvents(data.upcomingEvents || 0);
        } else {
          console.error('Failed to fetch AI calendar:', response.statusText);
          // Fallback к mock данным
          setEvents(mockAICalendarEvents.slice(0, maxItems || mockAICalendarEvents.length));
          setUpcomingEvents(3);
        }
      } catch (error) {
        console.error('Error fetching AI calendar:', error);
        // Fallback к mock данным
        setEvents(mockAICalendarEvents.slice(0, maxItems || mockAICalendarEvents.length));
        setUpcomingEvents(3);
      } finally {
        setLoading(false);
      }
    };

    fetchAICalendar();
  }, [userId, typeFilter, skillFilter, viewMode, maxItems]);

  // Фильтрация событий
  const filteredEvents = events;
  const uniqueSkills = [...new Set(events.map(e => e.relatedSkill))];

  // Статистика
  const todayEvents = events.filter(e => 
    new Date(e.date).toDateString() === new Date().toDateString()
  ).length;
  const thisWeekEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= now && eventDate <= weekFromNow;
  }).length;

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
            <h3 className="text-lg font-semibold">
              {t('ai.calendar.loading', 'Загружаем AI календарь...')}
            </h3>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">
                {t('ai.calendar.title', 'AI Календарь')}
              </h3>
              <Badge variant="outline" className="ml-2">
                {filteredEvents.length} событий
              </Badge>
            </div>
          </div>

          {/* Статистика */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{todayEvents}</div>
                  <div className="text-sm text-gray-600">Сегодня</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{thisWeekEvents}</div>
                  <div className="text-sm text-gray-600">На этой неделе</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{upcomingEvents}</div>
                  <div className="text-sm text-gray-600">Предстоящих</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Фильтры */}
      {!maxItems && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Тип события" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="study">Изучение</SelectItem>
              <SelectItem value="practice">Практика</SelectItem>
              <SelectItem value="interview">Собеседование</SelectItem>
              <SelectItem value="review">Повторение</SelectItem>
            </SelectContent>
          </Select>

          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Навык" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все навыки</SelectItem>
              {uniqueSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Список событий */}
      {filteredEvents.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {t('ai.calendar.empty', 'Пока нет AI запланированных событий. Пройдите собеседование, чтобы получить персонализированное расписание обучения.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <AICalendarEventCard
              key={event.id}
              event={event}
              onEventClick={onEventClick}
              onEventJoin={onEventJoin}
            />
          ))}
        </div>
      )}

      {/* Показать больше */}
      {maxItems && events.length > maxItems && (
        <div className="text-center pt-4">
          <Button variant="outline">
            {t('ai.calendar.show_more', 'Показать все события')} ({events.length - maxItems} ещё)
          </Button>
        </div>
      )}
    </div>
  );
}

// 🎭 Mock данные для разработки
const mockAICalendarEvents: AICalendarEvent[] = [
  {
    id: 'event_algorithms_study_1',
    title: 'Изучение algorithms - Сессия 1',
    description: 'Учебная сессия 1 по навыку algorithms. Теория и практические упражнения.',
    type: 'study',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    relatedSkill: 'algorithms',
    priority: 10,
    status: 'scheduled'
  },
  {
    id: 'event_react_practice',
    title: 'Практика React оптимизации',
    description: 'Практическая сессия по оптимизации React компонентов.',
    type: 'practice',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    relatedSkill: 'react',
    priority: 8,
    status: 'scheduled'
  },
  {
    id: 'follow_up_interview',
    title: 'Контрольное собеседование',
    description: 'Контрольное собеседование для проверки прогресса по ключевым навыкам: algorithms, react',
    type: 'interview',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    relatedSkill: 'overall',
    priority: 9,
    status: 'scheduled'
  }
];

export type { AICalendarEvent, AICalendarSectionProps };
