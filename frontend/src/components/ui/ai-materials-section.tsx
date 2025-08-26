import React, { useState, useEffect } from 'react';
import { Brain, BookOpen, Clock, Star, TrendingUp, Filter, Search, Sparkles, Target, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

// 📚 Типы для AI материалов
interface AIMaterial {
  id: string;
  type: 'material';
  title: string;
  description: string;
  priority: number;
  relatedSkill: string;
  metadata: {
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    readTime: number;
    tags: string[];
    source: string;
    rating?: number;
    reads?: number;
  };
  createdAt: string;
}

interface AIMaterialsSectionProps {
  className?: string;
  showHeader?: boolean;
  maxItems?: number;
  onMaterialClick?: (material: AIMaterial) => void;
}

// 🎨 Компонент отдельного AI материала
function AIMaterialCard({ 
  material, 
  onClick 
}: { 
  material: AIMaterial; 
  onClick?: (material: AIMaterial) => void;
}) {
  const { t } = useAppTranslation();

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 9) return <Target className="h-3 w-3 text-red-500" />;
    if (priority >= 7) return <TrendingUp className="h-3 w-3 text-yellow-500" />;
    return <BookOpen className="h-3 w-3 text-blue-500" />;
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-blue-500"
      onClick={() => onClick?.(material)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
              >
                AI Generated
              </Badge>
              {getPriorityIcon(material.priority)}
            </div>
            <CardTitle className="text-base group-hover:text-blue-600 transition-colors">
              {material.title}
            </CardTitle>
            <CardDescription className="text-sm mt-1 line-clamp-2">
              {material.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Метаданные */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{material.metadata.readTime} мин</span>
              </div>
              {material.metadata.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{material.metadata.rating}</span>
                </div>
              )}
              {material.metadata.reads && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{material.metadata.reads}</span>
                </div>
              )}
            </div>
          </div>

          {/* Теги и сложность */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              <Badge 
                variant="outline" 
                className={getDifficultyColor(material.metadata.difficulty)}
              >
                {material.metadata.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {material.relatedSkill}
              </Badge>
              {material.metadata.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 🧩 Основной компонент секции AI материалов
export function AIMaterialsSection({ 
  className = '', 
  showHeader = true,
  maxItems,
  onMaterialClick
}: AIMaterialsSectionProps) {
  const { t } = useAppTranslation();
  const userId = useAppStore((s) => (s as any).user?.id);
  
  const [materials, setMaterials] = useState<AIMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');

  // 📡 Загрузка AI материалов
  useEffect(() => {
    const fetchAIMaterials = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Формируем параметры запроса
        const params = new URLSearchParams();
        if (categoryFilter !== 'all') params.append('category', categoryFilter);
        if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
        if (skillFilter !== 'all') params.append('skill', skillFilter);
        
        const response = await fetch(
          `/api/users/${userId}/ai-materials?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          let materialsData = data.materials || [];
          
          // Применяем лимит элементов если указан
          if (maxItems) {
            materialsData = materialsData.slice(0, maxItems);
          }
          
          setMaterials(materialsData);
        } else {
          console.error('Failed to fetch AI materials:', response.statusText);
          // Fallback к mock данным для разработки
          setMaterials(mockAIMaterials.slice(0, maxItems || mockAIMaterials.length));
        }
      } catch (error) {
        console.error('Error fetching AI materials:', error);
        // Fallback к mock данным
        setMaterials(mockAIMaterials.slice(0, maxItems || mockAIMaterials.length));
      } finally {
        setLoading(false);
      }
    };

    fetchAIMaterials();
  }, [userId, categoryFilter, difficultyFilter, skillFilter, maxItems]);

  // 🔍 Фильтрация по поисковому запросу
  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.metadata.tags.some(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const uniqueSkills = [...new Set(materials.map(m => m.relatedSkill))];
  const uniqueCategories = [...new Set(materials.map(m => m.metadata.category))];

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
            <h3 className="text-lg font-semibold">
              {t('ai.materials.loading', 'Загружаем AI материалы...')}
            </h3>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">
              {t('ai.materials.title', 'AI Материалы')}
            </h3>
            <Badge variant="outline" className="ml-2">
              {filteredMaterials.length}
            </Badge>
          </div>
        </div>
      )}

      {/* Фильтры и поиск */}
      {!maxItems && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('ai.materials.search', 'Поиск материалов...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Сложность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
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

      {/* Список материалов */}
      {filteredMaterials.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {t('ai.materials.empty', 'Пока нет AI материалов. Пройдите собеседование, чтобы получить персонализированные рекомендации.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <AIMaterialCard
              key={material.id}
              material={material}
              onClick={onMaterialClick}
            />
          ))}
        </div>
      )}

      {/* Показать больше */}
      {maxItems && materials.length > maxItems && (
        <div className="text-center pt-4">
          <Button variant="outline">
            {t('ai.materials.show_more', 'Показать все материалы')} ({materials.length - maxItems} ещё)
          </Button>
        </div>
      )}
    </div>
  );
}

// 🎭 Mock данные для разработки
const mockAIMaterials: AIMaterial[] = [
  {
    id: 'ai_material_1',
    type: 'material',
    title: 'Алгоритмы сортировки для фронтенд разработчиков',
    description: 'Комплексное изучение алгоритмов сортировки: bubble sort, quick sort, merge sort с примерами на JavaScript.',
    priority: 10,
    relatedSkill: 'algorithms',
    metadata: {
      category: 'computer-science',
      difficulty: 'medium',
      readTime: 45,
      tags: ['algorithms', 'javascript', 'ai-generated', 'interview-prep'],
      source: 'ai_generated',
      rating: 4.8,
      reads: 234
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'ai_material_2',
    type: 'material',
    title: 'React - оптимизация производительности',
    description: 'Изучение техник оптимизации React приложений: мемоизация, виртуализация, ленивая загрузка.',
    priority: 8,
    relatedSkill: 'react',
    metadata: {
      category: 'frameworks',
      difficulty: 'medium',
      readTime: 35,
      tags: ['react', 'performance', 'optimization', 'ai-generated'],
      source: 'ai_generated',
      rating: 4.9,
      reads: 187
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'ai_material_3',
    type: 'material',
    title: 'Основы системного дизайна',
    description: 'Введение в проектирование масштабируемых систем: Load Balancing, Caching, Database Design.',
    priority: 9,
    relatedSkill: 'system_design',
    metadata: {
      category: 'architecture',
      difficulty: 'hard',
      readTime: 60,
      tags: ['system-design', 'architecture', 'scalability', 'ai-generated'],
      source: 'ai_generated',
      rating: 4.7,
      reads: 156
    },
    createdAt: new Date().toISOString()
  }
];

export type { AIMaterial, AIMaterialsSectionProps };
