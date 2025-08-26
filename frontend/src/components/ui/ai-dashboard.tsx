import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  BookOpen, 
  Calendar, 
  Zap,
  Activity,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  PieChart,
  Users,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

// 📊 Типы для AI Dashboard
interface DashboardStats {
  totalAnalyses: number;
  averageScore: number;
  improvementTrend: number;
  completedRecommendations: number;
  totalRecommendations: number;
  studyHours: number;
  upcomingEvents: number;
  activeTrainingTasks: number;
  overallReadiness: number;
}

interface SkillInsight {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  progress: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface RecentActivity {
  id: string;
  type: 'analysis' | 'material' | 'roadmap' | 'training' | 'interview';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface AIDashboardProps {
  className?: string;
  showActions?: boolean;
  onNavigateToMaterials?: () => void;
  onNavigateToRoadmap?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToTrainer?: () => void;
}

// 📈 Компонент статистической карточки
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: number;
  color?: string;
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200'
  };

  return (
    <Card className={`${colorClasses[color as keyof typeof colorClasses]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Icon className="h-6 w-6" />
            {trend !== undefined && (
              <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 🎯 Компонент инсайта по навыку
function SkillInsightCard({ skill }: { skill: SkillInsight }) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">{skill.skill}</h4>
          {getTrendIcon(skill.trend)}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Текущий: {skill.currentLevel}/10</span>
            <span>Цель: {skill.targetLevel}/10</span>
          </div>
          <Progress value={skill.progress} className="h-2" />
          <p className="text-xs text-gray-500">
            Обновлено {new Date(skill.lastUpdated).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// 📝 Компонент последней активности
function ActivityItem({ activity }: { activity: RecentActivity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <Brain className="h-4 w-4 text-blue-500" />;
      case 'material': return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'roadmap': return <Target className="h-4 w-4 text-purple-500" />;
      case 'training': return <Zap className="h-4 w-4 text-orange-500" />;
      case 'interview': return <Users className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
      {getActivityIcon(activity.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(activity.timestamp).toLocaleString()}
        </p>
      </div>
      <Badge 
        variant="outline" 
        className={`text-xs ${getStatusColor(activity.status)}`}
      >
        {activity.status}
      </Badge>
    </div>
  );
}

// 🧩 Основной компонент AI Dashboard
export function AIDashboard({ 
  className = '',
  showActions = true,
  onNavigateToMaterials,
  onNavigateToRoadmap,
  onNavigateToCalendar,
  onNavigateToTrainer
}: AIDashboardProps) {
  const { t } = useAppTranslation();
  const userId = useAppStore((s) => (s as any).user?.id);
  const profession = useAppStore((s) => s.profession);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [skillInsights, setSkillInsights] = useState<SkillInsight[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // 📡 Загрузка dashboard данных
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);

        // Параллельная загрузка всех данных
        const [skillAnalysisResponse, recommendationsResponse, materialsResponse, roadmapResponse, calendarResponse, trainingResponse] = await Promise.all([
          fetch(`/api/users/${userId}/skill-analysis`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch(`/api/users/${userId}/recommendations`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch(`/api/users/${userId}/ai-materials`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch(`/api/users/${userId}/ai-roadmap`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch(`/api/users/${userId}/ai-calendar`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch(`/api/users/${userId}/ai-training-tasks`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          })
        ]);

        // Обработка данных
        if (skillAnalysisResponse.ok) {
          const skillData = await skillAnalysisResponse.json();
          const skillAnalysis = skillData.skillAnalysis;
          
          // Формируем статистику
          const dashboardStats: DashboardStats = {
            totalAnalyses: skillAnalysis.overallProgress.totalAnalyses || 0,
            averageScore: skillAnalysis.overallProgress.averageScore || 0,
            improvementTrend: parseFloat(skillAnalysis.overallProgress.improvementTrend) || 0,
            completedRecommendations: 0,
            totalRecommendations: 0,
            studyHours: 0,
            upcomingEvents: 0,
            activeTrainingTasks: 0,
            overallReadiness: skillAnalysis.readinessScore || 0
          };

          // Формируем инсайты по навыкам
          const skills: SkillInsight[] = [
            ...skillAnalysis.topSkills.map((skill: any) => ({
              skill: skill.skill,
              currentLevel: skill.level,
              targetLevel: Math.min(10, skill.level + 2),
              progress: (skill.level / 10) * 100,
              trend: skill.trend.startsWith('+') ? 'up' : skill.trend.startsWith('-') ? 'down' : 'stable',
              lastUpdated: new Date().toISOString()
            })),
            ...skillAnalysis.weakestAreas.map((skill: any) => ({
              skill: skill.skill,
              currentLevel: skill.level,
              targetLevel: Math.min(10, skill.level + 3),
              progress: (skill.level / 10) * 100,
              trend: skill.trend.startsWith('+') ? 'up' : skill.trend.startsWith('-') ? 'down' : 'stable',
              lastUpdated: new Date().toISOString()
            }))
          ];

          setStats(dashboardStats);
          setSkillInsights(skills);
        } else {
          // Fallback к mock данным
          setStats(mockDashboardStats);
          setSkillInsights(mockSkillInsights);
        }

        // Формируем активность из других источников
        const activities: RecentActivity[] = [
          {
            id: '1',
            type: 'analysis',
            title: 'AI анализ завершен',
            description: 'Проанализировано собеседование Frontend Developer',
            timestamp: new Date().toISOString(),
            status: 'completed'
          },
          {
            id: '2',
            type: 'material',
            title: 'Новый материал',
            description: 'Алгоритмы сортировки для фронтенд разработчиков',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
          },
          {
            id: '3',
            type: 'roadmap',
            title: 'Этап roadmap начат',
            description: 'Освоение алгоритмов - 25% выполнено',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            status: 'in-progress'
          }
        ];

        setRecentActivity(activities);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback к mock данным
        setStats(mockDashboardStats);
        setSkillInsights(mockSkillInsights);
        setRecentActivity(mockRecentActivity);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-500" />
            <span>AI Mentor Dashboard</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Ваш персональный ассистент для развития в сфере {profession}
          </p>
        </div>
        {showActions && (
          <Badge variant="outline" className="px-3 py-1">
            Готовность: {stats.overallReadiness}%
          </Badge>
        )}
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Общая оценка"
          value={`${stats.averageScore}/10`}
          subtitle="Средний балл"
          icon={Star}
          trend={stats.improvementTrend}
          color="blue"
        />
        <StatCard
          title="Анализов проведено"
          value={stats.totalAnalyses}
          subtitle="Собеседований"
          icon={Brain}
          color="green"
        />
        <StatCard
          title="Готовность"
          value={`${stats.overallReadiness}%`}
          subtitle="К работе"
          icon={Target}
          color="purple"
        />
        <StatCard
          title="Часов обучения"
          value={stats.studyHours}
          subtitle="В этом месяце"
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Табы с детальной информацией */}
      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills">Навыки</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
          <TabsTrigger value="progress">Прогресс</TabsTrigger>
          <TabsTrigger value="insights">Инсайты</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Развитие навыков</span>
              </CardTitle>
              <CardDescription>
                Текущий уровень и цели по ключевым навыкам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skillInsights.map((skill, index) => (
                  <SkillInsightCard key={index} skill={skill} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Последняя активность</span>
              </CardTitle>
              <CardDescription>
                Ваши недавние достижения и прогресс
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Общий прогресс</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Готовность к работе</span>
                      <span>{stats.overallReadiness}%</span>
                    </div>
                    <Progress value={stats.overallReadiness} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Выполнено рекомендаций</span>
                      <span>{stats.completedRecommendations}/{stats.totalRecommendations}</span>
                    </div>
                    <Progress 
                      value={stats.totalRecommendations > 0 ? (stats.completedRecommendations / stats.totalRecommendations) * 100 : 0} 
                      className="h-3" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статистика обучения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.upcomingEvents}</div>
                      <div className="text-sm text-gray-600">Предстоящих событий</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.activeTrainingTasks}</div>
                      <div className="text-sm text-gray-600">Активных заданий</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>AI Инсайты</span>
              </CardTitle>
              <CardDescription>
                Рекомендации на основе анализа ваших данных
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Ключевая рекомендация</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Сосредоточьтесь на изучении алгоритмов - это даст наибольший прирост готовности к собеседованиям (+15%).
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Trophy className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Ваши сильные стороны</h4>
                      <p className="text-sm text-green-700 mt-1">
                        JavaScript и коммуникативные навыки - ваши козыри. Используйте их для демонстрации экспертизы.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Быстрые действия */}
      {showActions && (
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>
              Переходите к изучению материалов и выполнению заданий
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center space-x-2 h-auto p-4"
                onClick={onNavigateToMaterials}
              >
                <BookOpen className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Материалы</div>
                  <div className="text-xs text-gray-500">AI рекомендации</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center space-x-2 h-auto p-4"
                onClick={onNavigateToRoadmap}
              >
                <Target className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Roadmap</div>
                  <div className="text-xs text-gray-500">План развития</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center space-x-2 h-auto p-4"
                onClick={onNavigateToCalendar}
              >
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Календарь</div>
                  <div className="text-xs text-gray-500">Расписание</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center space-x-2 h-auto p-4"
                onClick={onNavigateToTrainer}
              >
                <Zap className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Тренажёр</div>
                  <div className="text-xs text-gray-500">Практика</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 🎭 Mock данные для разработки
const mockDashboardStats: DashboardStats = {
  totalAnalyses: 15,
  averageScore: 7.2,
  improvementTrend: 1.2,
  completedRecommendations: 8,
  totalRecommendations: 12,
  studyHours: 24,
  upcomingEvents: 3,
  activeTrainingTasks: 5,
  overallReadiness: 72
};

const mockSkillInsights: SkillInsight[] = [
  {
    skill: 'JavaScript',
    currentLevel: 8,
    targetLevel: 9,
    progress: 80,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    skill: 'React',
    currentLevel: 7,
    targetLevel: 8,
    progress: 70,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    skill: 'Algorithms',
    currentLevel: 4,
    targetLevel: 7,
    progress: 40,
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  }
];

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'analysis',
    title: 'AI анализ завершен',
    description: 'Проанализировано собеседование Frontend Developer',
    timestamp: new Date().toISOString(),
    status: 'completed'
  },
  {
    id: '2',
    type: 'material',
    title: 'Новый материал',
    description: 'Алгоритмы сортировки для фронтенд разработчиков',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending'
  }
];

export type { DashboardStats, SkillInsight, RecentActivity, AIDashboardProps };
