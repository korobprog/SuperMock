import React, { useState, useEffect } from 'react';
import { Brain, Map, Target, CheckCircle, Circle, Clock, TrendingUp, Award, PlayCircle, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

// 🗺️ Типы для AI Roadmap
interface AIRoadmapStage {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  priority: number;
  estimatedHours: number;
  skills: string[];
  progress?: number;
  dueDate?: string;
  createdAt: string;
}

interface AIRoadmapSectionProps {
  className?: string;
  showHeader?: boolean;
  maxItems?: number;
  onStageClick?: (stage: AIRoadmapStage) => void;
  onStageStart?: (stage: AIRoadmapStage) => void;
  onStageComplete?: (stage: AIRoadmapStage) => void;
}

// 🎯 Компонент отдельного этапа roadmap
function AIRoadmapStageCard({ 
  stage, 
  onStageClick,
  onStageStart,
  onStageComplete
}: { 
  stage: AIRoadmapStage;
  onStageClick?: (stage: AIRoadmapStage) => void;
  onStageStart?: (stage: AIRoadmapStage) => void;
  onStageComplete?: (stage: AIRoadmapStage) => void;
}) {
  const { t } = useAppTranslation();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'in-progress':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return t('ai.roadmap.completed', 'Завершено');
      case 'in-progress':
        return t('ai.roadmap.in_progress', 'В процессе');
      default:
        return t('ai.roadmap.not_started', 'Не начато');
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

  const progress = stage.progress || 0;
  const isOverdue = stage.dueDate && new Date(stage.dueDate) < new Date() && stage.status !== 'completed';

  return (
    <Card 
      className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${getStatusColor(stage.status)} ${isOverdue ? 'border-red-300' : ''}`}
      onClick={() => onStageClick?.(stage)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getStatusIcon(stage.status)}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Brain className="h-4 w-4 text-blue-500" />
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  AI Generated
                </Badge>
                {getPriorityBadge(stage.priority)}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Просрочено
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base group-hover:text-blue-600 transition-colors">
                {stage.title}
              </CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {stage.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Прогресс */}
        {stage.status === 'in-progress' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Прогресс</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Метаданные */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{stage.estimatedHours}ч</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Target className="h-4 w-4" />
            <span>{getStatusText(stage.status)}</span>
          </div>
        </div>

        {/* Навыки */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Навыки:</span>
          <div className="flex flex-wrap gap-1">
            {stage.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Дедлайн */}
        {stage.dueDate && (
          <div className="text-xs text-gray-500">
            Завершить до: {new Date(stage.dueDate).toLocaleDateString()}
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2 pt-2 border-t">
          {stage.status === 'not-started' && onStageStart && (
            <Button 
              size="sm" 
              className="flex-1 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                onStageStart(stage);
              }}
            >
              <PlayCircle className="h-3 w-3" />
              <span>Начать</span>
            </Button>
          )}
          
          {stage.status === 'in-progress' && onStageComplete && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                onStageComplete(stage);
              }}
            >
              <CheckCircle className="h-3 w-3" />
              <span>Завершить</span>
            </Button>
          )}

          {stage.status === 'completed' && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                // Можно добавить функцию для повторения этапа
              }}
            >
              <RotateCcw className="h-3 w-3" />
              <span>Повторить</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 🧩 Основной компонент секции AI Roadmap
export function AIRoadmapSection({ 
  className = '', 
  showHeader = true,
  maxItems,
  onStageClick,
  onStageStart,
  onStageComplete
}: AIRoadmapSectionProps) {
  const { t } = useAppTranslation();
  const userId = useAppStore((s) => s.user?.id);
  
  const [stages, setStages] = useState<AIRoadmapStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [overallProgress, setOverallProgress] = useState(0);
  const [estimatedCompletion, setEstimatedCompletion] = useState<string>('');

  // 📡 Загрузка AI roadmap этапов
  useEffect(() => {
    const fetchAIRoadmap = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Формируем параметры запроса
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (skillFilter !== 'all') params.append('skill', skillFilter);
        
        const response = await fetch(
          `/api/users/${userId}/ai-roadmap?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          let stagesData = data.roadmapStages || [];
          
          // Применяем лимит элементов если указан
          if (maxItems) {
            stagesData = stagesData.slice(0, maxItems);
          }
          
          setStages(stagesData);
          setOverallProgress(data.overallProgress || 0);
          setEstimatedCompletion(data.estimatedCompletion || '');
        } else {
          console.error('Failed to fetch AI roadmap:', response.statusText);
          // Fallback к mock данным
          setStages(mockAIRoadmapStages.slice(0, maxItems || mockAIRoadmapStages.length));
          setOverallProgress(15);
          setEstimatedCompletion('2-3 месяца');
        }
      } catch (error) {
        console.error('Error fetching AI roadmap:', error);
        // Fallback к mock данным
        setStages(mockAIRoadmapStages.slice(0, maxItems || mockAIRoadmapStages.length));
        setOverallProgress(15);
        setEstimatedCompletion('2-3 месяца');
      } finally {
        setLoading(false);
      }
    };

    fetchAIRoadmap();
  }, [userId, statusFilter, skillFilter, maxItems]);

  // Фильтрация этапов
  const filteredStages = stages;
  const uniqueSkills = [...new Set(stages.flatMap(s => s.skills))];

  // Статистика
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const inProgressStages = stages.filter(s => s.status === 'in-progress').length;
  const totalEstimatedHours = stages.reduce((acc, stage) => acc + stage.estimatedHours, 0);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
            <h3 className="text-lg font-semibold">
              {t('ai.roadmap.loading', 'Загружаем AI roadmap...')}
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
                <div className="h-2 bg-gray-200 rounded w-full" />
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
                {t('ai.roadmap.title', 'AI Roadmap')}
              </h3>
              <Badge variant="outline" className="ml-2">
                {filteredStages.length} этапов
              </Badge>
            </div>
          </div>

          {/* Общий прогресс */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
                  <div className="text-sm text-gray-600">Общий прогресс</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedStages}</div>
                  <div className="text-sm text-gray-600">Завершено этапов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{totalEstimatedHours}ч</div>
                  <div className="text-sm text-gray-600">Всего времени</div>
                </div>
              </div>
              {estimatedCompletion && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Ожидаемое завершение: {estimatedCompletion}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Фильтры */}
      {!maxItems && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="not-started">Не начато</SelectItem>
              <SelectItem value="in-progress">В процессе</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
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

      {/* Список этапов */}
      {filteredStages.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {t('ai.roadmap.empty', 'Пока нет AI roadmap этапов. Пройдите собеседование, чтобы получить персонализированный план развития.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStages.map((stage) => (
            <AIRoadmapStageCard
              key={stage.id}
              stage={stage}
              onStageClick={onStageClick}
              onStageStart={onStageStart}
              onStageComplete={onStageComplete}
            />
          ))}
        </div>
      )}

      {/* Показать больше */}
      {maxItems && stages.length > maxItems && (
        <div className="text-center pt-4">
          <Button variant="outline">
            {t('ai.roadmap.show_more', 'Показать все этапы')} ({stages.length - maxItems} ещё)
          </Button>
        </div>
      )}
    </div>
  );
}

// 🎭 Mock данные для разработки
const mockAIRoadmapStages: AIRoadmapStage[] = [
  {
    id: 'stage_algorithms_mastery',
    title: 'Освоение алгоритмов',
    description: 'Комплексное изучение алгоритмов для роли Frontend Developer. Включает теорию, практику и реальные проекты.',
    status: 'in-progress',
    priority: 10,
    estimatedHours: 50,
    skills: ['algorithms', 'problem-solving'],
    progress: 25,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'stage_react_optimization',
    title: 'Оптимизация React приложений',
    description: 'Изучение продвинутых техник оптимизации производительности React.',
    status: 'not-started',
    priority: 8,
    estimatedHours: 30,
    skills: ['react', 'performance'],
    progress: 0,
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'stage_system_design_basics',
    title: 'Основы системного дизайна',
    description: 'Изучение принципов проектирования масштабируемых систем.',
    status: 'not-started',
    priority: 9,
    estimatedHours: 40,
    skills: ['system_design', 'architecture'],
    progress: 0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

export type { AIRoadmapStage, AIRoadmapSectionProps };
