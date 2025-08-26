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
import { AIMaterialsSection } from '@/components/ui/ai-materials-section';
import { useAppStore } from '@/lib/store';
import { useState, useEffect } from 'react';

interface Material {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  readTime: number;
  rating: number;
  reads: number;
  tags: string[];
  isNew: boolean;
  isPopular: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
  icon: string;
  color: string;
}

export function Materials() {
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const profession = useAppStore((s) => s.profession);
  const language = useAppStore((s) => s.language);

  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [popularMaterials, setPopularMaterials] = useState<Material[]>([]);
  const [newMaterials, setNewMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  // Получаем название профессии для отображения
  const getProfessionName = () => {
    if (!profession) return 'разработчика';
    return t(`profession.${profession}`).toLowerCase();
  };

  const handleBack = () => {
    navigate('/applications');
  };

  // Демо данные для материалов
  const getDemoMaterials = (): Material[] => {
    return [
      {
        id: 1,
        title: 'Основы React Hooks',
        description: 'Изучите useState, useEffect и другие хуки React',
        category: 'react',
        difficulty: 'beginner',
        readTime: 15,
        rating: 4.8,
        reads: 1250,
        tags: ['React', 'Hooks', 'JavaScript'],
        isNew: true,
        isPopular: true,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        title: 'TypeScript для начинающих',
        description: 'Практическое руководство по TypeScript',
        category: 'typescript',
        difficulty: 'intermediate',
        readTime: 25,
        rating: 4.6,
        reads: 890,
        tags: ['TypeScript', 'JavaScript'],
        isNew: false,
        isPopular: true,
        createdAt: '2024-01-10T14:30:00Z'
      },
      {
        id: 3,
        title: 'CSS Grid Layout',
        description: 'Современные техники верстки с CSS Grid',
        category: 'css',
        difficulty: 'intermediate',
        readTime: 20,
        rating: 4.7,
        reads: 1100,
        tags: ['CSS', 'Grid', 'Layout'],
        isNew: true,
        isPopular: false,
        createdAt: '2024-01-12T09:15:00Z'
      },
      {
        id: 4,
        title: 'Node.js и Express',
        description: 'Создание REST API с Node.js и Express',
        category: 'nodejs',
        difficulty: 'advanced',
        readTime: 35,
        rating: 4.5,
        reads: 750,
        tags: ['Node.js', 'Express', 'API'],
        isNew: false,
        isPopular: true,
        createdAt: '2024-01-08T16:45:00Z'
      },
      {
        id: 5,
        title: 'JavaScript ES6+',
        description: 'Современные возможности JavaScript',
        category: 'javascript',
        difficulty: 'beginner',
        readTime: 30,
        rating: 4.9,
        reads: 2100,
        tags: ['JavaScript', 'ES6', 'Modern JS'],
        isNew: false,
        isPopular: true,
        createdAt: '2024-01-05T12:00:00Z'
      },
      {
        id: 6,
        title: 'React Context API',
        description: 'Управление состоянием с Context API',
        category: 'react',
        difficulty: 'intermediate',
        readTime: 18,
        rating: 4.4,
        reads: 680,
        tags: ['React', 'Context', 'State Management'],
        isNew: true,
        isPopular: false,
        createdAt: '2024-01-14T15:30:00Z'
      },
      {
        id: 7,
        title: 'Продвинутый TypeScript',
        description: 'Продвинутые техники TypeScript',
        category: 'typescript',
        difficulty: 'advanced',
        readTime: 40,
        rating: 4.3,
        reads: 420,
        tags: ['TypeScript', 'Advanced', 'Generics'],
        isNew: false,
        isPopular: false,
        createdAt: '2024-01-03T09:45:00Z'
      },
      {
        id: 8,
        title: 'CSS Flexbox',
        description: 'Гибкая верстка с Flexbox',
        category: 'css',
        difficulty: 'beginner',
        readTime: 22,
        rating: 4.6,
        reads: 950,
        tags: ['CSS', 'Flexbox', 'Layout'],
        isNew: false,
        isPopular: true,
        createdAt: '2024-01-07T11:20:00Z'
      },
      {
        id: 9,
        title: 'Express.js Middleware',
        description: 'Создание и использование middleware',
        category: 'nodejs',
        difficulty: 'intermediate',
        readTime: 28,
        rating: 4.2,
        reads: 580,
        tags: ['Node.js', 'Express', 'Middleware'],
        isNew: true,
        isPopular: false,
        createdAt: '2024-01-13T14:15:00Z'
      },
      {
        id: 10,
        title: 'JavaScript Promises',
        description: 'Асинхронное программирование с Promises',
        category: 'javascript',
        difficulty: 'intermediate',
        readTime: 25,
        rating: 4.7,
        reads: 1200,
        tags: ['JavaScript', 'Promises', 'Async'],
        isNew: false,
        isPopular: true,
        createdAt: '2024-01-09T16:00:00Z'
      }
    ];
  };

  const getDemoCategories = (): Category[] => {
    return [
      { id: 'react', name: 'React', count: 15, icon: '⚛️', color: 'bg-blue-100 text-blue-800' },
      { id: 'typescript', name: 'TypeScript', count: 8, icon: '📘', color: 'bg-blue-100 text-blue-800' },
      { id: 'css', name: 'CSS', count: 12, icon: '🎨', color: 'bg-purple-100 text-purple-800' },
      { id: 'nodejs', name: 'Node.js', count: 10, icon: '🟢', color: 'bg-green-100 text-green-800' },
      { id: 'javascript', name: 'JavaScript', count: 20, icon: '🟡', color: 'bg-yellow-100 text-yellow-800' }
    ];
  };

  // Функция для фильтрации демо материалов
  const filterDemoMaterials = (materials: Material[]): Material[] => {
    let filtered = [...materials];

    // Фильтр по категории
    if (selectedCategory) {
      filtered = filtered.filter(material => material.category === selectedCategory);
      console.log('🔧 Dev mode: filtered by category', selectedCategory, 'result:', filtered.length);
    }

    // Фильтр по сложности
    if (selectedDifficulty) {
      filtered = filtered.filter(material => material.difficulty === selectedDifficulty);
      console.log('🔧 Dev mode: filtered by difficulty', selectedDifficulty, 'result:', filtered.length);
    }

    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(material => 
        material.title.toLowerCase().includes(query) ||
        material.description.toLowerCase().includes(query) ||
        material.tags.some(tag => tag.toLowerCase().includes(query))
      );
      console.log('🔧 Dev mode: filtered by search', searchQuery, 'result:', filtered.length);
    }

    return filtered;
  };

  // API функции
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
      console.log('📖 Fetching materials from database for profession:', profession);

      const params = new URLSearchParams({
        profession: profession || 'frontend-developer',
        language: language || 'ru',
        limit: '20'
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);

      console.log('🔍 Requesting materials with params:', params.toString());

      const response = await fetch(`/api/materials?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Received materials from API:', data);
      
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      
      // Fallback на демо данные при ошибке
      console.log('🔧 Using demo materials (fallback due to error)');
      const allDemoMaterials = getDemoMaterials();
      const filteredMaterials = filterDemoMaterials(allDemoMaterials);
      setMaterials(filteredMaterials);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularMaterials = async () => {
    try {
      console.log('📖 Fetching popular materials from database for profession:', profession);

      const params = new URLSearchParams({
        profession: profession || 'frontend-developer',
        language: language || 'ru',
        limit: '5'
      });

      const response = await fetch(`/api/materials/popular?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Received popular materials from API:', data);
      
      setPopularMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching popular materials:', error);
      
      // Fallback на демо данные при ошибке
      console.log('🔧 Using demo popular materials (fallback due to error)');
      const allMaterials = getDemoMaterials();
      const popular = allMaterials.filter(m => m.isPopular);
      setPopularMaterials(popular);
    }
  };

  const fetchNewMaterials = async () => {
    try {
      console.log('📖 Fetching new materials from database for profession:', profession);

      const params = new URLSearchParams({
        profession: profession || 'frontend-developer',
        language: language || 'ru',
        limit: '5'
      });

      const response = await fetch(`/api/materials/new?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Received new materials from API:', data);
      
      setNewMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching new materials:', error);
      
      // Fallback на демо данные при ошибке
      console.log('🔧 Using demo new materials (fallback due to error)');
      const allMaterials = getDemoMaterials();
      const newMaterials = allMaterials.filter(m => m.isNew);
      setNewMaterials(newMaterials);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('📖 Fetching categories from database for profession:', profession);

      const params = new URLSearchParams({
        profession: profession || 'frontend-developer',
        language: language || 'ru'
      });

      const response = await fetch(`/api/materials/categories?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Received categories from API:', data);
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      // Fallback на демо данные при ошибке
      console.log('🔧 Using demo categories (fallback due to error)');
      const demoCategories = getDemoCategories();
      setCategories(demoCategories);
    }
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchMaterials();
    fetchPopularMaterials();
    fetchNewMaterials();
    fetchCategories();
  }, [profession, language]);

  // Обновляем материалы при изменении фильтров
  useEffect(() => {
    fetchMaterials();
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyName = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Начальный';
      case 'intermediate':
        return 'Средний';
      case 'advanced':
        return 'Продвинутый';
      default:
        return difficulty;
    }
  };

  const handleMaterialClick = (material: Material) => {
    // Увеличиваем счетчик прочтений
    fetch(`/api/materials/${material.id}/read`, { method: 'POST' }).catch(console.error);
    
    // Переходим к материалу (можно открыть в модальном окне или новой странице)
    console.log('Opening material:', material.title);
  };

  const handleAIMaterialClick = (material: any) => {
    // Обработка AI материалов
    console.log('Opening AI material:', material.title);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4 pb-24 md:pb-4">
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 h-auto"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Материалы для {getProfessionName()}
              </h1>
              <p className="text-sm text-muted-foreground">
                Изучайте, практикуйтесь, развивайтесь
              </p>
            </div>
          </div>
          <Logo className="h-8" />
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск материалов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              Все категории
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedDifficulty === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('')}
            >
              Все уровни
            </Button>
            <Button
              variant={selectedDifficulty === 'beginner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('beginner')}
            >
              Начальный
            </Button>
            <Button
              variant={selectedDifficulty === 'intermediate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('intermediate')}
            >
              Средний
            </Button>
            <Button
              variant={selectedDifficulty === 'advanced' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('advanced')}
            >
              Продвинутый
            </Button>
          </div>
        </div>

        {/* AI Generated Materials */}
        <AIMaterialsSection 
          className="mb-8"
          maxItems={3}
          onMaterialClick={handleAIMaterialClick}
        />

        {/* Popular Materials */}
        {popularMaterials.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold">Популярные материалы</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularMaterials.map((material) => (
                <Card
                  key={material.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleMaterialClick(material)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">
                        {material.title}
                      </CardTitle>
                      {material.isPopular && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {material.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {material.readTime} мин
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {material.reads}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* New Materials */}
        {newMaterials.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Новые материалы</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {newMaterials.map((material) => (
                <Card
                  key={material.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleMaterialClick(material)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">
                        {material.title}
                      </CardTitle>
                      {material.isNew && (
                        <Badge variant="secondary" className="text-xs">
                          Новое
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {material.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {material.readTime} мин
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {material.reads}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Materials */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Все материалы</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Загрузка материалов...</p>
            </div>
          ) : materials.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <Card
                  key={material.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleMaterialClick(material)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">
                        {material.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {material.isNew && (
                          <Badge variant="secondary" className="text-xs">
                            Новое
                          </Badge>
                        )}
                        {material.isPopular && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {material.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getDifficultyColor(material.difficulty)}`}
                      >
                        {getDifficultyName(material.difficulty)}
                      </Badge>
                      {material.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {material.readTime} мин
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {material.rating}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {material.reads}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Материалы не найдены</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Menu */}
      <MobileBottomMenu />
    </div>
  );
}
