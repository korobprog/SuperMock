import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Target, CheckCircle, Circle, Clock, TrendingUp, Award, BookOpen, Users, Code, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { useAppStore } from '@/lib/store';

export function Roadmap() {
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

  // Демо данные для МИД карты в зависимости от профессии
  const getRoadmapData = () => {
    const baseData = {
      currentLevel: 'Middle',
      nextLevel: 'Senior',
      overallProgress: 65,
      estimatedTimeToNext: '6-8 месяцев',
      skills: {
        technical: 70,
        soft: 60,
        leadership: 40,
        business: 30,
      },
    };

    // Персонализированные этапы для разных профессий
    const professionRoadmaps = {
      frontend: {
        title: 'Frontend Developer Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы веб-разработки',
            status: 'completed',
            skills: ['HTML', 'CSS', 'JavaScript'],
            description: 'Базовые технологии веб-разработки',
            timeEstimate: '2-3 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Фреймворки и библиотеки',
            status: 'completed',
            skills: ['React', 'Vue.js', 'TypeScript'],
            description: 'Современные инструменты разработки',
            timeEstimate: '4-6 месяцев',
            progress: 100,
          },
          {
            id: 3,
            title: 'Продвинутые концепции',
            status: 'in-progress',
            skills: ['State Management', 'Performance', 'Testing'],
            description: 'Углубленное изучение архитектуры',
            timeEstimate: '6-8 месяцев',
            progress: 75,
          },
          {
            id: 4,
            title: 'Системный дизайн',
            status: 'planned',
            skills: ['Архитектура', 'Масштабирование', 'Микросервисы'],
            description: 'Проектирование сложных систем',
            timeEstimate: '8-12 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'Лидерство и менторинг',
            status: 'planned',
            skills: ['Team Lead', 'Code Review', 'Архитектурные решения'],
            description: 'Развитие лидерских качеств',
            timeEstimate: '12-18 месяцев',
            progress: 0,
          },
        ],
      },
      backend: {
        title: 'Backend Developer Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы серверной разработки',
            status: 'completed',
            skills: ['Node.js', 'Python', 'Java'],
            description: 'Базовые технологии backend',
            timeEstimate: '3-4 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Базы данных и API',
            status: 'completed',
            skills: ['SQL', 'MongoDB', 'REST API'],
            description: 'Работа с данными и API',
            timeEstimate: '4-6 месяцев',
            progress: 100,
          },
          {
            id: 3,
            title: 'Микросервисы и DevOps',
            status: 'in-progress',
            skills: ['Docker', 'Kubernetes', 'CI/CD'],
            description: 'Современные подходы к разработке',
            timeEstimate: '6-10 месяцев',
            progress: 60,
          },
          {
            id: 4,
            title: 'Высоконагруженные системы',
            status: 'planned',
            skills: ['Кэширование', 'Балансировка', 'Мониторинг'],
            description: 'Оптимизация производительности',
            timeEstimate: '10-14 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'Архитектурное лидерство',
            status: 'planned',
            skills: ['Архитектура', 'Техническое лидерство', 'Стратегия'],
            description: 'Управление техническими решениями',
            timeEstimate: '14-20 месяцев',
            progress: 0,
          },
        ],
      },
      fullstack: {
        title: 'Fullstack Developer Roadmap',
        stages: [
          {
            id: 1,
            title: 'Frontend основы',
            status: 'completed',
            skills: ['HTML/CSS', 'JavaScript', 'React'],
            description: 'Клиентская часть приложений',
            timeEstimate: '3-4 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Backend основы',
            status: 'completed',
            skills: ['Node.js', 'Express', 'Databases'],
            description: 'Серверная часть приложений',
            timeEstimate: '4-6 месяцев',
            progress: 100,
          },
          {
            id: 3,
            title: 'Интеграция и деплой',
            status: 'in-progress',
            skills: ['API Design', 'Docker', 'Cloud'],
            description: 'Связывание frontend и backend',
            timeEstimate: '6-8 месяцев',
            progress: 80,
          },
          {
            id: 4,
            title: 'Продвинутые технологии',
            status: 'planned',
            skills: ['GraphQL', 'Microservices', 'Serverless'],
            description: 'Современные архитектурные паттерны',
            timeEstimate: '8-12 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'Техническое лидерство',
            status: 'planned',
            skills: ['Architecture', 'Team Lead', 'Project Management'],
            description: 'Управление полным стеком проектов',
            timeEstimate: '12-18 месяцев',
            progress: 0,
          },
        ],
      },
      mobile: {
        title: 'Mobile Developer Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы мобильной разработки',
            status: 'completed',
            skills: ['React Native', 'Flutter', 'Mobile UI'],
            description: 'Кроссплатформенная разработка',
            timeEstimate: '3-4 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Нативные возможности',
            status: 'completed',
            skills: ['iOS', 'Android', 'Native Modules'],
            description: 'Интеграция с нативными возможностями',
            timeEstimate: '4-6 месяцев',
            progress: 100,
          },
          {
            id: 3,
            title: 'Продвинутые функции',
            status: 'in-progress',
            skills: ['Push Notifications', 'Offline', 'Performance'],
            description: 'Сложные мобильные функции',
            timeEstimate: '6-8 месяцев',
            progress: 70,
          },
          {
            id: 4,
            title: 'Публикация и аналитика',
            status: 'planned',
            skills: ['App Store', 'Google Play', 'Analytics'],
            description: 'Публикация и мониторинг приложений',
            timeEstimate: '8-10 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'Мобильная архитектура',
            status: 'planned',
            skills: ['Mobile Architecture', 'Team Lead', 'Strategy'],
            description: 'Архитектурные решения для мобильных приложений',
            timeEstimate: '10-14 месяцев',
            progress: 0,
          },
        ],
      },
      devops: {
        title: 'DevOps Engineer Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы автоматизации',
            status: 'completed',
            skills: ['Docker', 'CI/CD', 'Scripting'],
            description: 'Базовые инструменты автоматизации',
            timeEstimate: '3-4 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Оркестрация и мониторинг',
            status: 'completed',
            skills: ['Kubernetes', 'Prometheus', 'Grafana'],
            description: 'Управление контейнерами и мониторинг',
            timeEstimate: '4-6 месяцев',
            progress: 100,
          },
          {
            id: 3,
            title: 'Инфраструктура как код',
            status: 'in-progress',
            skills: ['Terraform', 'Ansible', 'Cloud'],
            description: 'Автоматизация инфраструктуры',
            timeEstimate: '6-8 месяцев',
            progress: 65,
          },
          {
            id: 4,
            title: 'Безопасность и compliance',
            status: 'planned',
            skills: ['Security', 'Compliance', 'Audit'],
            description: 'Обеспечение безопасности инфраструктуры',
            timeEstimate: '8-10 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'DevOps стратегия',
            status: 'planned',
            skills: ['Strategy', 'Team Lead', 'Architecture'],
            description: 'Стратегическое планирование DevOps процессов',
            timeEstimate: '10-14 месяцев',
            progress: 0,
          },
        ],
      },
      qa: {
        title: 'QA Engineer Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы тестирования',
            status: 'completed',
            skills: ['Manual Testing', 'Test Cases', 'Bug Reports'],
            description: 'Базовые принципы тестирования',
            timeEstimate: '2-3 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Автоматизация тестирования',
            status: 'completed',
            skills: ['Selenium', 'Playwright', 'API Testing'],
            description: 'Автоматизация тестовых сценариев',
            timeEstimate: '4-6 месяцев',
            progress: 100,
          },
          {
            id: 3,
            title: 'Performance и Security',
            status: 'in-progress',
            skills: ['JMeter', 'OWASP', 'Load Testing'],
            description: 'Тестирование производительности и безопасности',
            timeEstimate: '6-8 месяцев',
            progress: 55,
          },
          {
            id: 4,
            title: 'Тестирование в DevOps',
            status: 'planned',
            skills: ['CI/CD', 'Test Automation', 'Monitoring'],
            description: 'Интеграция тестирования в DevOps процессы',
            timeEstimate: '8-10 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'QA стратегия и лидерство',
            status: 'planned',
            skills: ['Test Strategy', 'Team Lead', 'Quality Assurance'],
            description: 'Стратегическое планирование качества',
            timeEstimate: '10-14 месяцев',
            progress: 0,
          },
        ],
      },
      designer: {
        title: 'UX/UI Designer Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы дизайна',
            status: 'completed',
            skills: ['Figma', 'Design Principles', 'Typography'],
            description: 'Базовые принципы дизайна',
            timeEstimate: '2-3 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'UX исследования',
            status: 'completed',
            skills: ['User Research', 'Wireframes', 'Prototyping'],
            description: 'Исследование пользовательского опыта',
            timeEstimate: '3-4 месяца',
            progress: 100,
          },
          {
            id: 3,
            title: 'Дизайн системы',
            status: 'in-progress',
            skills: ['Design Systems', 'Components', 'Branding'],
            description: 'Создание систем дизайна',
            timeEstimate: '4-6 месяцев',
            progress: 70,
          },
          {
            id: 4,
            title: 'Продвинутые техники',
            status: 'planned',
            skills: ['Animation', 'Micro-interactions', 'Accessibility'],
            description: 'Продвинутые техники дизайна',
            timeEstimate: '6-8 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'Дизайн лидерство',
            status: 'planned',
            skills: ['Design Strategy', 'Team Lead', 'Design Ops'],
            description: 'Стратегическое планирование дизайна',
            timeEstimate: '8-12 месяцев',
            progress: 0,
          },
        ],
      },
      analyst: {
        title: 'Data Analyst Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы анализа данных',
            status: 'completed',
            skills: ['SQL', 'Excel', 'Statistics'],
            description: 'Базовые инструменты анализа',
            timeEstimate: '2-3 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Визуализация данных',
            status: 'completed',
            skills: ['Tableau', 'Power BI', 'Python'],
            description: 'Создание дашбордов и отчетов',
            timeEstimate: '3-4 месяца',
            progress: 100,
          },
          {
            id: 3,
            title: 'Продвинутая аналитика',
            status: 'in-progress',
            skills: ['Machine Learning', 'A/B Testing', 'Predictive Analytics'],
            description: 'Продвинутые методы анализа',
            timeEstimate: '4-6 месяцев',
            progress: 60,
          },
          {
            id: 4,
            title: 'Big Data и облачные решения',
            status: 'planned',
            skills: ['Big Data', 'Cloud Analytics', 'Data Engineering'],
            description: 'Работа с большими данными',
            timeEstimate: '6-8 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'Аналитическая стратегия',
            status: 'planned',
            skills: ['Data Strategy', 'Team Lead', 'Business Intelligence'],
            description: 'Стратегическое планирование аналитики',
            timeEstimate: '8-12 месяцев',
            progress: 0,
          },
        ],
      },
      scientist: {
        title: 'Data Scientist Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы машинного обучения',
            status: 'completed',
            skills: ['Python', 'Scikit-learn', 'Statistics'],
            description: 'Базовые алгоритмы ML',
            timeEstimate: '3-4 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Глубокое обучение',
            status: 'completed',
            skills: ['TensorFlow', 'PyTorch', 'Neural Networks'],
            description: 'Нейронные сети и глубокое обучение',
            timeEstimate: '4-6 месяцев',
            progress: 100,
          },
          {
            id: 3,
            title: 'Специализированные области',
            status: 'in-progress',
            skills: ['NLP', 'Computer Vision', 'Recommendation Systems'],
            description: 'Специализация в конкретных областях',
            timeEstimate: '6-8 месяцев',
            progress: 50,
          },
          {
            id: 4,
            title: 'MLOps и продакшн',
            status: 'planned',
            skills: ['MLOps', 'Model Deployment', 'Monitoring'],
            description: 'Деплой и поддержка ML моделей',
            timeEstimate: '8-10 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'AI стратегия и лидерство',
            status: 'planned',
            skills: ['AI Strategy', 'Team Lead', 'Research'],
            description: 'Стратегическое планирование AI проектов',
            timeEstimate: '10-14 месяцев',
            progress: 0,
          },
        ],
      },
      pm: {
        title: 'Product Manager Roadmap',
        stages: [
          {
            id: 1,
            title: 'Основы управления продуктом',
            status: 'completed',
            skills: ['Agile', 'Scrum', 'Product Strategy'],
            description: 'Базовые принципы управления продуктом',
            timeEstimate: '2-3 месяца',
            progress: 100,
          },
          {
            id: 2,
            title: 'Аналитика и метрики',
            status: 'completed',
            skills: ['Analytics', 'A/B Testing', 'User Research'],
            description: 'Анализ данных и принятие решений',
            timeEstimate: '3-4 месяца',
            progress: 100,
          },
          {
            id: 3,
            title: 'Управление командой',
            status: 'in-progress',
            skills: ['Team Management', 'Stakeholder Management', 'Communication'],
            description: 'Эффективное управление командой',
            timeEstimate: '4-6 месяцев',
            progress: 65,
          },
          {
            id: 4,
            title: 'Стратегия и планирование',
            status: 'planned',
            skills: ['Product Strategy', 'Roadmapping', 'Business Development'],
            description: 'Стратегическое планирование продукта',
            timeEstimate: '6-8 месяцев',
            progress: 0,
          },
          {
            id: 5,
            title: 'Продуктовое лидерство',
            status: 'planned',
            skills: ['Product Leadership', 'Team Lead', 'Innovation'],
            description: 'Лидерство в продуктовой разработке',
            timeEstimate: '8-12 месяцев',
            progress: 0,
          },
        ],
      },
    };

    return {
      ...baseData,
      ...professionRoadmaps[profession as keyof typeof professionRoadmaps] || professionRoadmaps.frontend,
    };
  };

  const roadmapData = getRoadmapData();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in-progress':
        return Clock;
      case 'planned':
        return Circle;
      default:
        return Circle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-blue-600';
      case 'planned':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
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

        {/* Roadmap Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            МИД карта {getProfessionName()}
          </h1>
          <p className="text-muted-foreground">
            Ваша дорожная карта к цели
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold mb-2">Текущий уровень: {roadmapData.currentLevel}</h2>
              <p className="text-muted-foreground">Следующий уровень: {roadmapData.nextLevel}</p>
            </div>
            
            {/* Overall Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Общий прогресс</span>
                <span>{roadmapData.overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${roadmapData.overallProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{roadmapData.skills.technical}%</div>
                <div className="text-xs text-muted-foreground">Технические</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{roadmapData.skills.soft}%</div>
                <div className="text-xs text-muted-foreground">Soft Skills</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{roadmapData.skills.leadership}%</div>
                <div className="text-xs text-muted-foreground">Лидерство</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{roadmapData.skills.business}%</div>
                <div className="text-xs text-muted-foreground">Бизнес</div>
              </div>
            </div>

            <div className="text-center mt-4">
              <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock size={16} />
                <span>До следующего уровня: {roadmapData.estimatedTimeToNext}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap Stages */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Этапы развития</h2>
          <div className="space-y-4">
            {roadmapData.stages.map((stage, index) => {
              const StatusIcon = getStatusIcon(stage.status);
              return (
                <Card key={stage.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(stage.status)}`}>
                        <StatusIcon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{stage.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {stage.timeEstimate}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {stage.description}
                        </p>
                        
                        {/* Skills */}
                        <div className="mb-3">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Навыки:</div>
                          <div className="flex flex-wrap gap-1">
                            {stage.skills.map((skill, skillIndex) => (
                              <Badge key={skillIndex} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Progress */}
                        {stage.status === 'in-progress' && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Прогресс</span>
                              <span>{stage.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${stage.progress}%` }}
                              ></div>
                            </div>
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

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => alert('Функция в разработке')}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center mx-auto mb-2">
                  <Target size={20} />
                </div>
                <h3 className="text-sm font-medium">Установить цели</h3>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => alert('Функция в разработке')}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center mx-auto mb-2">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-sm font-medium">Найти курсы</h3>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => alert('Функция в разработке')}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center mx-auto mb-2">
                  <Users size={20} />
                </div>
                <h3 className="text-sm font-medium">Найти ментора</h3>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => alert('Функция в разработке')}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center mx-auto mb-2">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-sm font-medium">Отслеживать прогресс</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
