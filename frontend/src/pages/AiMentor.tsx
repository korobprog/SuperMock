import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, BookOpen, Target, TrendingUp, Users, Zap, Star, Clock, CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { AIDashboard } from '@/components/ui/ai-dashboard';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';

export function AiMentor() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const profession = useAppStore((s) => s.profession);
  const [currentView, setCurrentView] = useState<'main' | 'chat' | 'tasks' | 'progress'>('main');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Получаем название профессии для отображения
  const getProfessionName = () => {
    if (!profession) return 'разработчика';
    return t(`profession.${profession}`).toLowerCase();
  };

  const handleBack = () => {
    if (currentView !== 'main') {
      setCurrentView('main');
    } else {
      navigate('/applications');
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatMessages([...chatMessages, newMessage]);
      setMessage('');
      
      // Имитация ответа AI
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          text: getAIResponse(message),
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString(),
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const getAIResponse = (userMessage: string) => {
    const responses = [
      "Отличный вопрос! Для подготовки к собеседованию по этому вопросу рекомендую изучить следующие материалы...",
      "Это важная тема. Вот несколько практических советов, которые помогут вам на собеседовании...",
      "Хороший вопрос! Давайте разберем это пошагово. Сначала нужно понять основные концепции...",
      "Для этого вопроса важно показать не только знание теории, но и практический опыт. Вот что стоит подготовить...",
      "Отличная тема для обсуждения! Рекомендую подготовить конкретные примеры из вашего опыта...",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Демо данные для AI Ментора
  const mentorData = {
    stats: {
      sessionsCompleted: 24,
      questionsAnswered: 156,
      timeSpent: 18.5,
      improvementScore: 87,
    },
    currentTasks: [
      {
        id: 1,
        title: 'Подготовка к техническому собеседованию',
        description: 'Изучение алгоритмов и структур данных',
        progress: 75,
        deadline: '2024-01-20',
        priority: 'high',
        category: 'technical',
      },
      {
        id: 2,
        title: 'Практика поведенческих вопросов',
        description: 'Подготовка ответов на STAR вопросы',
        progress: 45,
        deadline: '2024-01-25',
        priority: 'medium',
        category: 'behavioral',
      },
      {
        id: 3,
        title: 'Изучение системного дизайна',
        description: 'Архитектурные паттерны и масштабирование',
        progress: 30,
        deadline: '2024-02-01',
        priority: 'low',
        category: 'system-design',
      },
    ],
    recentQuestions: [
      {
        id: 1,
        question: 'Как объяснить разницу между React и Vue?',
        answer: 'React использует Virtual DOM и JSX, Vue - шаблоны и реактивность...',
        category: 'frontend',
        timestamp: '2 часа назад',
      },
      {
        id: 2,
        question: 'Что такое замыкания в JavaScript?',
        answer: 'Замыкание - это функция, которая имеет доступ к переменным из внешней области видимости...',
        category: 'javascript',
        timestamp: '1 день назад',
      },
      {
        id: 3,
        question: 'Как оптимизировать производительность React приложения?',
        answer: 'Используйте React.memo, useMemo, useCallback, код-сплиттинг...',
        category: 'performance',
        timestamp: '2 дня назад',
      },
    ],
    quickActions: [
      {
        title: 'Задать вопрос',
        icon: MessageSquare,
        color: 'bg-blue-500',
        action: () => setCurrentView('chat'),
      },
      {
        title: 'Мои задачи',
        icon: Target,
        color: 'bg-green-500',
        action: () => setCurrentView('tasks'),
      },
      {
        title: 'Прогресс',
        icon: TrendingUp,
        color: 'bg-purple-500',
        action: () => setCurrentView('progress'),
      },
      {
        title: 'Найти ментора',
        icon: Users,
        color: 'bg-orange-500',
        action: () => alert('Функция поиска ментора в разработке'),
      },
    ],
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
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
            <span>{currentView !== 'main' ? 'Назад' : 'Назад'}</span>
          </Button>
          <Logo size="md" clickable={true} />
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Profile Header */}
        <ProfileHeader />

        {/* Main View */}
        {currentView === 'main' && (
          <>
            {/* AI Dashboard */}
            <AIDashboard 
              className="mb-6"
              onNavigateToMaterials={() => navigate('/materials')}
              onNavigateToRoadmap={() => navigate('/roadmap')}
              onNavigateToCalendar={() => navigate('/calendar')}
              onNavigateToTrainer={() => navigate('/trainer')}
            />

            {/* Legacy Stats Overview - Скрыто в пользу AI Dashboard */}
            <div className="hidden grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{mentorData.stats.sessionsCompleted}</div>
                  <div className="text-sm text-muted-foreground">Сессий</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{mentorData.stats.questionsAnswered}</div>
                  <div className="text-sm text-muted-foreground">Вопросов</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{mentorData.stats.timeSpent}ч</div>
                  <div className="text-sm text-muted-foreground">Время</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{mentorData.stats.improvementScore}%</div>
                  <div className="text-sm text-muted-foreground">Прогресс</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mentorData.quickActions.map((action, index) => {
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

            {/* Current Tasks */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Текущие задачи</h2>
                <Button variant="ghost" size="sm" onClick={() => setCurrentView('tasks')}>
                  Смотреть все
                </Button>
              </div>
              <div className="space-y-3">
                {mentorData.currentTasks.map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                              {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {task.description}
                          </p>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Прогресс</span>
                                <span>{task.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              До {task.deadline}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Questions */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Последние вопросы</h2>
              <div className="space-y-3">
                {mentorData.recentQuestions.map((q) => (
                  <Card key={q.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <h3 className="font-medium text-sm">{q.question}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{q.answer}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {q.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{q.timestamp}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Chat View */}
        {currentView === 'chat' && (
          <div className="h-[600px] flex flex-col">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold">💬 Чат с AI Ментором</h2>
              <p className="text-sm text-muted-foreground">Задайте любой вопрос о подготовке к собеседованию</p>
            </div>
            
            <div className="flex-1 bg-white rounded-lg border p-4 mb-4 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Начните разговор с AI Ментором</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        msg.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите ваш вопрос..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Tasks View */}
        {currentView === 'tasks' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">📋 Мои задачи</h2>
              <p className="text-muted-foreground">Управляйте своими задачами по подготовке</p>
            </div>
            
            <div className="space-y-4">
              {mentorData.currentTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {task.description}
                        </p>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Прогресс</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            До {task.deadline}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4">
                        Обновить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Progress View */}
        {currentView === 'progress' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">📊 Мой прогресс</h2>
              <p className="text-muted-foreground">Отслеживайте свое развитие</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp size={20} />
                    <span>Общий прогресс</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{mentorData.stats.improvementScore}%</div>
                    <p className="text-sm text-muted-foreground">Улучшение навыков</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock size={20} />
                    <span>Время обучения</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">{mentorData.stats.timeSpent}ч</div>
                    <p className="text-sm text-muted-foreground">Всего времени</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare size={20} />
                    <span>Активность</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Сессий завершено</span>
                      <span className="font-medium">{mentorData.stats.sessionsCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Вопросов задано</span>
                      <span className="font-medium">{mentorData.stats.questionsAnswered}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star size={20} />
                    <span>Достижения</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm">Первая сессия</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm">10 вопросов</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm">5 часов обучения</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
