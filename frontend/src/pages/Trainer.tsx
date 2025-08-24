import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, BookOpen, Target, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { useAppStore } from '@/lib/store';

export function Trainer() {
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

  // Демо данные для тренажера в зависимости от профессии
  const getDemoData = () => {
    const baseData = {
      totalExercises: 24,
      completedExercises: 8,
      currentStreak: 3,
      totalTime: 12.5,
      categories: [
        {
          name: 'Основы',
          exercises: 8,
          completed: 6,
        },
        {
          name: 'Продвинутые темы',
          exercises: 12,
          completed: 2,
        },
        {
          name: 'Практические задачи',
          exercises: 4,
          completed: 0,
        },
      ],
    };

    // Персонализированные упражнения для разных профессий
    const professionExercises = {
      frontend: [
        {
          id: 1,
          title: 'Основы JavaScript',
          description: 'Переменные, функции, объекты',
          difficulty: 'Начальный',
          estimatedTime: 15,
          completed: true,
          score: 85,
        },
        {
          id: 2,
          title: 'React Hooks',
          description: 'useState, useEffect, useContext',
          difficulty: 'Средний',
          estimatedTime: 25,
          completed: true,
          score: 92,
        },
        {
          id: 3,
          title: 'TypeScript типизация',
          description: 'Интерфейсы, типы, дженерики',
          difficulty: 'Средний',
          estimatedTime: 30,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'CSS Grid и Flexbox',
          description: 'Современная верстка и адаптивность',
          difficulty: 'Средний',
          estimatedTime: 20,
          completed: false,
          score: null,
        },
      ],
      backend: [
        {
          id: 1,
          title: 'Основы Node.js',
          description: 'Серверная разработка и Express',
          difficulty: 'Начальный',
          estimatedTime: 20,
          completed: true,
          score: 88,
        },
        {
          id: 2,
          title: 'Работа с базами данных',
          description: 'SQL, MongoDB, Redis',
          difficulty: 'Средний',
          estimatedTime: 30,
          completed: true,
          score: 90,
        },
        {
          id: 3,
          title: 'REST API дизайн',
          description: 'Принципы и лучшие практики',
          difficulty: 'Средний',
          estimatedTime: 25,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'Аутентификация и авторизация',
          description: 'JWT, OAuth, сессии',
          difficulty: 'Продвинутый',
          estimatedTime: 35,
          completed: false,
          score: null,
        },
      ],
      fullstack: [
        {
          id: 1,
          title: 'Полный стек с MERN',
          description: 'MongoDB, Express, React, Node.js',
          difficulty: 'Средний',
          estimatedTime: 40,
          completed: true,
          score: 87,
        },
        {
          id: 2,
          title: 'State Management',
          description: 'Redux, Zustand, Context API',
          difficulty: 'Средний',
          estimatedTime: 30,
          completed: true,
          score: 91,
        },
        {
          id: 3,
          title: 'Микросервисы',
          description: 'Архитектура и коммуникация',
          difficulty: 'Продвинутый',
          estimatedTime: 45,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'Docker и деплой',
          description: 'Контейнеризация и CI/CD',
          difficulty: 'Продвинутый',
          estimatedTime: 35,
          completed: false,
          score: null,
        },
      ],
      mobile: [
        {
          id: 1,
          title: 'React Native основы',
          description: 'Компоненты и навигация',
          difficulty: 'Начальный',
          estimatedTime: 25,
          completed: true,
          score: 86,
        },
        {
          id: 2,
          title: 'Нативные модули',
          description: 'Интеграция с iOS и Android',
          difficulty: 'Средний',
          estimatedTime: 35,
          completed: true,
          score: 89,
        },
        {
          id: 3,
          title: 'Flutter и Dart',
          description: 'Кроссплатформенная разработка',
          difficulty: 'Средний',
          estimatedTime: 30,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'Push уведомления',
          description: 'Firebase и локальные уведомления',
          difficulty: 'Продвинутый',
          estimatedTime: 25,
          completed: false,
          score: null,
        },
      ],
      devops: [
        {
          id: 1,
          title: 'Docker основы',
          description: 'Контейнеры и образы',
          difficulty: 'Начальный',
          estimatedTime: 20,
          completed: true,
          score: 84,
        },
        {
          id: 2,
          title: 'Kubernetes',
          description: 'Оркестрация контейнеров',
          difficulty: 'Средний',
          estimatedTime: 40,
          completed: true,
          score: 87,
        },
        {
          id: 3,
          title: 'CI/CD пайплайны',
          description: 'GitHub Actions, Jenkins',
          difficulty: 'Средний',
          estimatedTime: 30,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'Мониторинг и логирование',
          description: 'Prometheus, Grafana, ELK',
          difficulty: 'Продвинутый',
          estimatedTime: 35,
          completed: false,
          score: null,
        },
      ],
      qa: [
        {
          id: 1,
          title: 'Автоматизация тестирования',
          description: 'Selenium, Playwright',
          difficulty: 'Средний',
          estimatedTime: 25,
          completed: true,
          score: 88,
        },
        {
          id: 2,
          title: 'API тестирование',
          description: 'Postman, REST Assured',
          difficulty: 'Средний',
          estimatedTime: 20,
          completed: true,
          score: 92,
        },
        {
          id: 3,
          title: 'Performance тестирование',
          description: 'JMeter, LoadRunner',
          difficulty: 'Продвинутый',
          estimatedTime: 30,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'Тестирование безопасности',
          description: 'OWASP, penetration testing',
          difficulty: 'Продвинутый',
          estimatedTime: 35,
          completed: false,
          score: null,
        },
      ],
      designer: [
        {
          id: 1,
          title: 'Figma основы',
          description: 'Интерфейсы и прототипирование',
          difficulty: 'Начальный',
          estimatedTime: 20,
          completed: true,
          score: 85,
        },
        {
          id: 2,
          title: 'UX исследования',
          description: 'Пользовательские интервью и аналитика',
          difficulty: 'Средний',
          estimatedTime: 30,
          completed: true,
          score: 89,
        },
        {
          id: 3,
          title: 'Дизайн системы',
          description: 'Компоненты и стили',
          difficulty: 'Средний',
          estimatedTime: 25,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'Анимации и микровзаимодействия',
          description: 'Framer Motion, Lottie',
          difficulty: 'Продвинутый',
          estimatedTime: 20,
          completed: false,
          score: null,
        },
      ],
      analyst: [
        {
          id: 1,
          title: 'SQL основы',
          description: 'Запросы и агрегация данных',
          difficulty: 'Начальный',
          estimatedTime: 20,
          completed: true,
          score: 86,
        },
        {
          id: 2,
          title: 'Python для анализа',
          description: 'Pandas, NumPy, Matplotlib',
          difficulty: 'Средний',
          estimatedTime: 30,
          completed: true,
          score: 90,
        },
        {
          id: 3,
          title: 'Визуализация данных',
          description: 'Tableau, Power BI, Plotly',
          difficulty: 'Средний',
          estimatedTime: 25,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'A/B тестирование',
          description: 'Статистика и интерпретация результатов',
          difficulty: 'Продвинутый',
          estimatedTime: 35,
          completed: false,
          score: null,
        },
      ],
      scientist: [
        {
          id: 1,
          title: 'Машинное обучение',
          description: 'Scikit-learn, алгоритмы ML',
          difficulty: 'Средний',
          estimatedTime: 35,
          completed: true,
          score: 87,
        },
        {
          id: 2,
          title: 'Глубокое обучение',
          description: 'TensorFlow, PyTorch, нейросети',
          difficulty: 'Продвинутый',
          estimatedTime: 45,
          completed: true,
          score: 89,
        },
        {
          id: 3,
          title: 'Обработка естественного языка',
          description: 'NLP, трансформеры, BERT',
          difficulty: 'Продвинутый',
          estimatedTime: 40,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'MLOps',
          description: 'Деплой и мониторинг ML моделей',
          difficulty: 'Продвинутый',
          estimatedTime: 35,
          completed: false,
          score: null,
        },
      ],
      pm: [
        {
          id: 1,
          title: 'Agile методологии',
          description: 'Scrum, Kanban, спринты',
          difficulty: 'Начальный',
          estimatedTime: 20,
          completed: true,
          score: 88,
        },
        {
          id: 2,
          title: 'Управление продуктом',
          description: 'Roadmap, OKR, метрики',
          difficulty: 'Средний',
          estimatedTime: 30,
          completed: true,
          score: 91,
        },
        {
          id: 3,
          title: 'Аналитика продукта',
          description: 'Google Analytics, Mixpanel, A/B тесты',
          difficulty: 'Средний',
          estimatedTime: 25,
          completed: false,
          score: null,
        },
        {
          id: 4,
          title: 'Управление командой',
          description: 'Мотивация, делегирование, конфликты',
          difficulty: 'Продвинутый',
          estimatedTime: 30,
          completed: false,
          score: null,
        },
      ],
    };

    return {
      ...baseData,
      exercises: professionExercises[profession as keyof typeof professionExercises] || professionExercises.frontend,
    };
  };

  const demoData = getDemoData();

  const progressPercentage = Math.round((demoData.completedExercises / demoData.totalExercises) * 100);

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

        {/* Trainer Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Тренажер для {getProfessionName()}
          </h1>
          <p className="text-muted-foreground">
            Практические задания для улучшения навыков
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{demoData.totalExercises}</div>
                <div className="text-sm text-muted-foreground">Всего заданий</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{demoData.completedExercises}</div>
                <div className="text-sm text-muted-foreground">Завершено</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{demoData.currentStreak}</div>
                <div className="text-sm text-muted-foreground">Дней подряд</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{demoData.totalTime}ч</div>
                <div className="text-sm text-muted-foreground">Время обучения</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Прогресс</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Категории</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoData.categories.map((category, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{category.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {category.completed}/{category.exercises}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${(category.completed / category.exercises) * 100}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Exercises */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Последние задания</h2>
          <div className="space-y-3">
            {demoData.exercises.map((exercise) => (
              <Card key={exercise.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{exercise.title}</h3>
                        {exercise.completed && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Trophy size={16} />
                            <span className="text-sm font-medium">{exercise.score}%</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {exercise.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {exercise.difficulty}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>{exercise.estimatedTime} мин</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={exercise.completed ? "outline" : "default"}
                      size="sm"
                      className="ml-4"
                    >
                      {exercise.completed ? (
                        <>
                          <BookOpen size={16} className="mr-1" />
                          Повторить
                        </>
                      ) : (
                        <>
                          <Play size={16} className="mr-1" />
                          Начать
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="h-16 text-lg" onClick={() => alert('Функция в разработке')}>
              <Target className="mr-2" size={20} />
              Начать новое задание
            </Button>
            <Button variant="outline" className="h-16 text-lg" onClick={() => alert('Функция в разработке')}>
              <Trophy className="mr-2" size={20} />
              Посмотреть достижения
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
