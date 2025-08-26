import React, { useState, useEffect } from 'react';
import { Brain, Target, Trophy, Code, BookOpen, Play, CheckCircle, Clock, Lightbulb, Zap, Cpu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

// 🏋️ Типы для AI Training
interface AITrainingTask {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'coding' | 'theory' | 'practice';
  skill: string;
  estimatedTime: number; // в минутах
  examples?: string[];
  hints?: string[];
  isCompleted: boolean;
  progress: number;
  createdAt: string;
}

interface AITrainingSectionProps {
  className?: string;
  showHeader?: boolean;
  maxItems?: number;
  onTaskClick?: (task: AITrainingTask) => void;
  onTaskStart?: (task: AITrainingTask) => void;
  onTaskComplete?: (task: AITrainingTask) => void;
}

// 🎯 Компонент отдельного задания
function AITrainingTaskCard({ 
  task, 
  onTaskClick,
  onTaskStart,
  onTaskComplete
}: { 
  task: AITrainingTask;
  onTaskClick?: (task: AITrainingTask) => void;
  onTaskStart?: (task: AITrainingTask) => void;
  onTaskComplete?: (task: AITrainingTask) => void;
}) {
  const { t } = useAppTranslation();
  const [showHints, setShowHints] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coding':
        return <Code className="h-4 w-4 text-green-500" />;
      case 'theory':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'practice':
        return <Target className="h-4 w-4 text-orange-500" />;
      default:
        return <Cpu className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'coding':
        return 'border-green-500 bg-green-50';
      case 'theory':
        return 'border-blue-500 bg-blue-50';
      case 'practice':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeText = (type: string): string => {
    switch (type) {
      case 'coding':
        return t('ai.training.coding', 'Программирование');
      case 'theory':
        return t('ai.training.theory', 'Теория');
      case 'practice':
        return t('ai.training.practice', 'Практика');
      default:
        return type;
    }
  };

  const getDifficultyText = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return t('ai.training.easy', 'Лёгкий');
      case 'medium':
        return t('ai.training.medium', 'Средний');
      case 'hard':
        return t('ai.training.hard', 'Сложный');
      default:
        return difficulty;
    }
  };

  return (
    <Card 
      className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${getTypeColor(task.type)} ${task.isCompleted ? 'opacity-75' : ''}`}
      onClick={() => onTaskClick?.(task)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getTypeIcon(task.type)}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Brain className="h-4 w-4 text-blue-500" />
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  AI Generated
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getDifficultyColor(task.difficulty)}`}
                >
                  {getDifficultyText(task.difficulty)}
                </Badge>
                {task.isCompleted && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    ✓ Выполнено
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base group-hover:text-blue-600 transition-colors">
                {task.title}
              </CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {task.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Прогресс (если задание в процессе) */}
        {task.progress > 0 && task.progress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Прогресс</span>
              <span className="font-semibold">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        )}

        {/* Метаданные */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>~{task.estimatedTime}м</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Target className="h-4 w-4" />
            <span>{getTypeText(task.type)}</span>
          </div>
        </div>

        {/* Навык */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Навык:</span>
          <Badge variant="secondary" className="text-xs">
            {task.skill}
          </Badge>
        </div>

        {/* Примеры (сворачиваемые) */}
        {task.examples && task.examples.length > 0 && (
          <Collapsible open={showExamples} onOpenChange={setShowExamples}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <BookOpen className="h-3 w-3" />
                <span>Примеры ({task.examples.length})</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {task.examples.map((example, index) => (
                <div 
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border text-sm font-mono"
                >
                  {example}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Подсказки (сворачиваемые) */}
        {task.hints && task.hints.length > 0 && (
          <Collapsible open={showHints} onOpenChange={setShowHints}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Lightbulb className="h-3 w-3" />
                <span>Подсказки ({task.hints.length})</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {task.hints.map((hint, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{hint}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Действия */}
        <div className="flex gap-2 pt-2 border-t">
          {!task.isCompleted && task.progress === 0 && onTaskStart && (
            <Button 
              size="sm" 
              className="flex-1 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                onTaskStart(task);
              }}
            >
              <Play className="h-3 w-3" />
              <span>Начать</span>
            </Button>
          )}
          
          {!task.isCompleted && task.progress > 0 && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                // Продолжить задание
              }}
            >
              <Play className="h-3 w-3" />
              <span>Продолжить</span>
            </Button>
          )}

          {!task.isCompleted && task.progress > 0 && onTaskComplete && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                onTaskComplete(task);
              }}
            >
              <CheckCircle className="h-3 w-3" />
              <span>Завершить</span>
            </Button>
          )}

          {task.isCompleted && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                // Повторить задание
              }}
            >
              <Trophy className="h-3 w-3" />
              <span>Повторить</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 🧩 Основной компонент секции AI Training
export function AITrainingSection({ 
  className = '', 
  showHeader = true,
  maxItems,
  onTaskClick,
  onTaskStart,
  onTaskComplete
}: AITrainingSectionProps) {
  const { t } = useAppTranslation();
  const userId = useAppStore((s) => s.user?.id);
  
  const [tasks, setTasks] = useState<AITrainingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [completedFilter, setCompletedFilter] = useState<string>('all');

  // 📡 Загрузка AI training заданий
  useEffect(() => {
    const fetchAITasks = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Формируем параметры запроса
        const params = new URLSearchParams();
        if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (skillFilter !== 'all') params.append('skill', skillFilter);
        if (completedFilter !== 'all') params.append('completed', completedFilter);
        
        const response = await fetch(
          `/api/users/${userId}/ai-training-tasks?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          let tasksData = data.trainingTasks || [];
          
          // Применяем лимит элементов если указан
          if (maxItems) {
            tasksData = tasksData.slice(0, maxItems);
          }
          
          setTasks(tasksData);
        } else {
          console.error('Failed to fetch AI training tasks:', response.statusText);
          // Fallback к mock данным
          setTasks(mockAITrainingTasks.slice(0, maxItems || mockAITrainingTasks.length));
        }
      } catch (error) {
        console.error('Error fetching AI training tasks:', error);
        // Fallback к mock данным
        setTasks(mockAITrainingTasks.slice(0, maxItems || mockAITrainingTasks.length));
      } finally {
        setLoading(false);
      }
    };

    fetchAITasks();
  }, [userId, difficultyFilter, typeFilter, skillFilter, completedFilter, maxItems]);

  // Фильтрация заданий
  const filteredTasks = tasks;
  const uniqueSkills = [...new Set(tasks.map(t => t.skill))];

  // Статистика
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const inProgressTasks = tasks.filter(t => t.progress > 0 && !t.isCompleted).length;
  const totalEstimatedTime = tasks
    .filter(t => !t.isCompleted)
    .reduce((acc, task) => acc + task.estimatedTime, 0);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
            <h3 className="text-lg font-semibold">
              {t('ai.training.loading', 'Загружаем AI задания...')}
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
                {t('ai.training.title', 'AI Тренажёр')}
              </h3>
              <Badge variant="outline" className="ml-2">
                {filteredTasks.length} заданий
              </Badge>
            </div>
          </div>

          {/* Статистика */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                  <div className="text-sm text-gray-600">Выполнено</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
                  <div className="text-sm text-gray-600">В процессе</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">~{totalEstimatedTime}м</div>
                  <div className="text-sm text-gray-600">Осталось времени</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Фильтры */}
      {!maxItems && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Сложность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="easy">Лёгкий</SelectItem>
              <SelectItem value="medium">Средний</SelectItem>
              <SelectItem value="hard">Сложный</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="coding">Код</SelectItem>
              <SelectItem value="theory">Теория</SelectItem>
              <SelectItem value="practice">Практика</SelectItem>
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

          <Select value={completedFilter} onValueChange={setCompletedFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="false">Активные</SelectItem>
              <SelectItem value="true">Выполненные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Список заданий */}
      {filteredTasks.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {t('ai.training.empty', 'Пока нет AI заданий. Пройдите собеседование, чтобы получить персонализированные задачи для развития.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <AITrainingTaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              onTaskStart={onTaskStart}
              onTaskComplete={onTaskComplete}
            />
          ))}
        </div>
      )}

      {/* Показать больше */}
      {maxItems && tasks.length > maxItems && (
        <div className="text-center pt-4">
          <Button variant="outline">
            {t('ai.training.show_more', 'Показать все задания')} ({tasks.length - maxItems} ещё)
          </Button>
        </div>
      )}
    </div>
  );
}

// 🎭 Mock данные для разработки
const mockAITrainingTasks: AITrainingTask[] = [
  {
    id: 'task_algorithms_1',
    title: 'algorithms - Задание 1',
    description: 'Практическое задание 1 по навыку algorithms для Frontend Developer',
    difficulty: 'easy',
    type: 'coding',
    skill: 'algorithms',
    estimatedTime: 90,
    examples: [
      'Реализуйте алгоритм быстрой сортировки',
      'function quickSort(arr) { /* ваш код */ }'
    ],
    hints: [
      'Подумайте о крайних случаях',
      'Оптимизируйте по времени и памяти',
      'Используйте рекурсию'
    ],
    isCompleted: false,
    progress: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_react_optimization',
    title: 'Оптимизация React компонентов',
    description: 'Практическое задание по оптимизации производительности React приложения',
    difficulty: 'medium',
    type: 'practice',
    skill: 'react',
    estimatedTime: 120,
    examples: [
      'Оптимизируйте рендеринг списка из 1000 элементов',
      'Реализуйте виртуализацию для больших списков'
    ],
    hints: [
      'Используйте React.memo',
      'Рассмотрите использование useMemo и useCallback',
      'Изучите техники виртуализации'
    ],
    isCompleted: false,
    progress: 25,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_system_design_theory',
    title: 'Основы проектирования систем',
    description: 'Изучение базовых принципов системного дизайна',
    difficulty: 'hard',
    type: 'theory',
    skill: 'system_design',
    estimatedTime: 180,
    examples: [
      'Спроектируйте систему как Twitter',
      'Рассмотрите масштабирование до 100M пользователей'
    ],
    hints: [
      'Начните с требований',
      'Рассмотрите trade-offs',
      'Подумайте о bottlenecks'
    ],
    isCompleted: true,
    progress: 100,
    createdAt: new Date().toISOString()
  }
];

export type { AITrainingTask, AITrainingSectionProps };
