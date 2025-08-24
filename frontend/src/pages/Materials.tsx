import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Search, Filter, Star, Clock, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppTranslation } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ProfileHeader } from '@/components/ui/profile-header';
import { MobileBottomMenu } from '@/components/ui/mobile-bottom-menu';
import { useAppStore } from '@/lib/store';

export function Materials() {
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

  // Демо данные для материалов
  const materialsData = {
    categories: [
      {
        id: 'interview-questions',
        name: 'Вопросы на собеседовании',
        count: 156,
        icon: '💬',
        color: 'bg-blue-100 text-blue-800',
      },
      {
        id: 'technical-tasks',
        name: 'Технические задания',
        count: 89,
        icon: '⚡',
        color: 'bg-green-100 text-green-800',
      },
      {
        id: 'system-design',
        name: 'Системный дизайн',
        count: 34,
        icon: '🏗️',
        color: 'bg-purple-100 text-purple-800',
      },
      {
        id: 'behavioral',
        name: 'Поведенческие вопросы',
        count: 67,
        icon: '🧠',
        color: 'bg-orange-100 text-orange-800',
      },
      {
        id: 'algorithms',
        name: 'Алгоритмы и структуры данных',
        count: 123,
        icon: '📊',
        color: 'bg-red-100 text-red-800',
      },
      {
        id: 'best-practices',
        name: 'Лучшие практики',
        count: 78,
        icon: '⭐',
        color: 'bg-yellow-100 text-yellow-800',
      },
    ],
    popularMaterials: [
      {
        id: 1,
        title: 'Топ-50 вопросов по JavaScript',
        description: 'Самые частые вопросы на собеседованиях по JavaScript с подробными ответами',
        category: 'interview-questions',
        difficulty: 'Средний',
        readTime: 15,
        rating: 4.8,
        reads: 1247,
        tags: ['JavaScript', 'Основы', 'ES6+'],
        isNew: false,
        isPopular: true,
      },
      {
        id: 2,
        title: 'React Hooks: полное руководство',
        description: 'Глубокий разбор всех хуков React с примерами использования',
        category: 'best-practices',
        difficulty: 'Продвинутый',
        readTime: 25,
        rating: 4.9,
        reads: 892,
        tags: ['React', 'Hooks', 'Frontend'],
        isNew: true,
        isPopular: true,
      },
      {
        id: 3,
        title: 'Системный дизайн: масштабируемые приложения',
        description: 'Принципы проектирования высоконагруженных систем',
        category: 'system-design',
        difficulty: 'Продвинутый',
        readTime: 40,
        rating: 4.7,
        reads: 567,
        tags: ['Архитектура', 'Масштабирование', 'Backend'],
        isNew: false,
        isPopular: false,
      },
      {
        id: 4,
        title: 'Алгоритмы сортировки и поиска',
        description: 'Практическое руководство по алгоритмам с примерами кода',
        category: 'algorithms',
        difficulty: 'Средний',
        readTime: 30,
        rating: 4.6,
        reads: 734,
        tags: ['Алгоритмы', 'Структуры данных', 'Оптимизация'],
        isNew: false,
        isPopular: true,
      },
      {
        id: 5,
        title: 'Поведенческие вопросы: как отвечать',
        description: 'Стратегии ответов на вопросы о конфликтах, лидерстве и достижениях',
        category: 'behavioral',
        difficulty: 'Начальный',
        readTime: 20,
        rating: 4.5,
        reads: 445,
        tags: ['Soft Skills', 'Коммуникация', 'Лидерство'],
        isNew: false,
        isPopular: false,
      },
      {
        id: 6,
        title: 'Docker для разработчиков',
        description: 'От основ до продвинутых техник контейнеризации',
        category: 'best-practices',
        difficulty: 'Средний',
        readTime: 35,
        rating: 4.8,
        reads: 678,
        tags: ['Docker', 'DevOps', 'Контейнеры'],
        isNew: true,
        isPopular: false,
      },
    ],
    recentMaterials: [
      {
        id: 7,
        title: 'TypeScript: продвинутые типы',
        description: 'Углубленное изучение системы типов TypeScript',
        category: 'interview-questions',
        difficulty: 'Продвинутый',
        readTime: 18,
        rating: 4.7,
        reads: 234,
        tags: ['TypeScript', 'Типизация', 'Frontend'],
        isNew: true,
        isPopular: false,
      },
      {
        id: 8,
        title: 'GraphQL vs REST API',
        description: 'Сравнение подходов к проектированию API',
        category: 'best-practices',
        difficulty: 'Средний',
        readTime: 22,
        rating: 4.6,
        reads: 189,
        tags: ['API', 'GraphQL', 'REST'],
        isNew: true,
        isPopular: false,
      },
    ],
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Начальный':
        return 'bg-green-100 text-green-800';
      case 'Средний':
        return 'bg-yellow-100 text-yellow-800';
      case 'Продвинутый':
        return 'bg-red-100 text-red-800';
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

        {/* Materials Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Материалы для {getProfessionName()}
          </h1>
          <p className="text-muted-foreground">
            Вопросы и советы по подготовке к собеседованиям
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Поиск материалов..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter size={16} />
              <span>Фильтры</span>
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Категории</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {materialsData.categories.map((category) => (
              <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">{category.count} материалов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Materials */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Популярные материалы</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              Смотреть все
            </Button>
          </div>
          <div className="space-y-4">
            {materialsData.popularMaterials.map((material) => (
              <Card key={material.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{material.title}</h3>
                        {material.isNew && (
                          <Badge variant="secondary" className="text-xs">Новое</Badge>
                        )}
                        {material.isPopular && (
                          <Badge className="text-xs bg-orange-100 text-orange-800">Популярное</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {material.description}
                      </p>
                      <div className="flex items-center space-x-4 mb-3">
                        <Badge variant="outline" className={getDifficultyColor(material.difficulty)}>
                          {material.difficulty}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>{material.readTime} мин</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Star size={12} className="text-yellow-500" />
                          <span>{material.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Users size={12} />
                          <span>{material.reads}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {material.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4">
                      Читать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Materials */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Недавние материалы</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              Смотреть все
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materialsData.recentMaterials.map((material) => (
              <Card key={material.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-sm">{material.title}</h3>
                        {material.isNew && (
                          <Badge variant="secondary" className="text-xs">Новое</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {material.description}
                      </p>
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="outline" className={`text-xs ${getDifficultyColor(material.difficulty)}`}>
                          {material.difficulty}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock size={10} />
                          <span>{material.readTime} мин</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Star size={10} className="text-yellow-500" />
                          <span>{material.rating}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {material.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-2">
                      Читать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Статистика</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">547</div>
                <div className="text-sm text-muted-foreground">Всего материалов</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">23</div>
                <div className="text-sm text-muted-foreground">Прочитано</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">156</div>
                <div className="text-sm text-muted-foreground">В избранном</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">8.5ч</div>
                <div className="text-sm text-muted-foreground">Время чтения</div>
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
