import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

console.log('🔧 Materials routes loaded');

// Маппинг профессий из frontend в базу данных
function mapProfessionToDatabase(profession: string): string {
  const professionMapping: { [key: string]: string } = {
    'frontend-developer': 'frontend',
    'backend-developer': 'backend',
    'fullstack-developer': 'fullstack',
    'mobile-developer': 'mobile',
    'devops-engineer': 'devops',
    'qa-engineer': 'qa',
    'ux-ui-designer': 'designer',
    'data-analyst': 'analyst',
    'data-scientist': 'scientist',
    'product-manager': 'pm'
  };
  
  return professionMapping[profession] || profession;
}

// GET /api/materials/categories - Получить категории материалов
router.get('/categories', async (req: Request, res: Response) => {
  try {
    console.log('📖 GET /materials/categories called with query:', req.query);
    
    const { profession, language = 'ru' } = req.query;

    const where: any = {};
    if (profession) {
      const mappedProfession = mapProfessionToDatabase(String(profession));
      where.profession = mappedProfession;
      console.log(`🔄 Mapped profession '${profession}' → '${mappedProfession}'`);
    }

    console.log('�� Searching categories with where conditions:', where);

    const categories = await prisma.material.groupBy({
      by: ['category'],
      where,
      _count: {
        category: true
      }
    });

    console.log(`📊 Found ${categories.length} categories`);

    const formattedCategories = categories.map((cat: any) => {
      return {
        id: cat._id || cat.id,
        name: cat.name,
        description: cat.description || '',
        icon: cat.icon || '📁',
        color: cat.color || '#3B82F6',
        materialsCount: cat.materialsCount || 0,
        createdAt: cat.createdAt || new Date(),
        updatedAt: cat.updatedAt || new Date(),
      };
    });

    res.json(formattedCategories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/materials/popular - Получить популярные материалы
router.get('/popular', async (req: Request, res: Response) => {
  try {
    console.log('📖 GET /materials/popular called with query:', req.query);
    
    const { profession, language = 'ru', limit = 10 } = req.query;

    const where: any = { isPopular: true };
    if (profession) {
      const mappedProfession = mapProfessionToDatabase(String(profession));
      where.profession = mappedProfession;
      console.log(`🔄 Mapped profession '${profession}' → '${mappedProfession}'`);
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        translations: {
          where: {
            language: String(language)
          }
        }
      },
      take: Number(limit),
      orderBy: [
        { rating: 'desc' },
        { reads: 'desc' }
      ]
    });

    const formattedMaterials = materials.map((material: any) => {
      return {
        id: material._id || material.id,
        title: material.title,
        description: material.description || '',
        content: material.content || '',
        categoryId: material.categoryId || material.category?.id || material.category?._id,
        categoryName: material.category?.name || 'Без категории',
        tags: material.tags || [],
        difficulty: material.difficulty || 'beginner',
        estimatedTime: material.estimatedTime || 30,
        createdAt: material.createdAt || new Date(),
        updatedAt: material.updatedAt || new Date(),
      };
    });

    res.json({ materials: formattedMaterials });
  } catch (error) {
    console.error('❌ Error fetching popular materials:', error);
    res.status(500).json({ error: 'Failed to fetch popular materials' });
  }
});

// GET /api/materials/new - Получить новые материалы
router.get('/new', async (req: Request, res: Response) => {
  try {
    console.log('📖 GET /materials/new called with query:', req.query);
    
    const { profession, language = 'ru', limit = 10 } = req.query;

    const where: any = { isNew: true };
    if (profession) {
      const mappedProfession = mapProfessionToDatabase(String(profession));
      where.profession = mappedProfession;
      console.log(`🔄 Mapped profession '${profession}' → '${mappedProfession}'`);
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        translations: {
          where: {
            language: String(language)
          }
        }
      },
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const formattedMaterials = materials.map((material: any) => {
      return {
        id: material._id || material.id,
        title: material.title,
        description: material.description || '',
        content: material.content || '',
        categoryId: material.categoryId || material.category?.id || material.category?._id,
        categoryName: material.category?.name || 'Без категории',
        tags: material.tags || [],
        difficulty: material.difficulty || 'beginner',
        estimatedTime: material.estimatedTime || 30,
        createdAt: material.createdAt || new Date(),
        updatedAt: material.updatedAt || new Date(),
      };
    });

    res.json({ materials: formattedMaterials });
  } catch (error) {
    console.error('❌ Error fetching new materials:', error);
    res.status(500).json({ error: 'Failed to fetch new materials' });
  }
});

// GET /api/materials - Получить материалы с фильтрацией
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📖 GET /materials called with query:', req.query);
    
    const {
      profession,
      language = 'ru',
      category,
      difficulty,
      isPopular,
      isNew,
      limit = 20,
      offset = 0
    } = req.query;

    // Строим условия фильтрации
    const where: any = {};
    
    if (profession) {
      const mappedProfession = mapProfessionToDatabase(String(profession));
      where.profession = mappedProfession;
      console.log(`🔄 Mapped profession '${profession}' → '${mappedProfession}'`);
    }
    if (category) where.category = String(category);
    if (difficulty) where.difficulty = String(difficulty);
    if (isPopular === 'true') where.isPopular = true;
    if (isNew === 'true') where.isNew = true;

    console.log('🔍 Searching with where conditions:', where);

    const materials = await prisma.material.findMany({
      where,
      include: {
        translations: {
          where: {
            language: String(language)
          }
        }
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: [
        { isPopular: 'desc' },
        { isNew: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`📊 Found ${materials.length} materials`);

    // Преобразуем данные для фронтенда
    const formattedMaterials = materials.map((material: any) => {
      return {
        id: material._id || material.id,
        title: material.title,
        description: material.description || '',
        content: material.content || '',
        categoryId: material.categoryId || material.category?.id || material.category?._id,
        categoryName: material.category?.name || 'Без категории',
        tags: material.tags || [],
        difficulty: material.difficulty || 'beginner',
        estimatedTime: material.estimatedTime || 30,
        createdAt: material.createdAt || new Date(),
        updatedAt: material.updatedAt || new Date(),
      };
    });

    res.json({ materials: formattedMaterials });
  } catch (error) {
    console.error('❌ Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// GET /api/materials/:id - Получить конкретный материал (ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ!)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { language = 'ru' } = req.query;

    console.log(`📖 GET /materials/${id} called`);

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid material ID' });
    }

    const material = await prisma.material.findUnique({
      where: { id: Number(id) },
      include: {
        translations: {
          where: {
            language: String(language)
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const translation = material.translations[0];
    const formattedMaterial = {
      id: material.id,
      title: translation?.title || `Material ${material.id}`,
      description: translation?.description || 'No description available',
      category: material.category,
      difficulty: material.difficulty,
      readTime: material.readTime,
      rating: material.rating,
      reads: material.reads,
      tags: material.tags,
      isNew: material.isNew,
      isPopular: material.isPopular,
      createdAt: material.createdAt.toISOString(),
      content: translation?.content || ''
    };

    res.json(formattedMaterial);
  } catch (error) {
    console.error('❌ Error fetching material:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// POST /api/materials/:id/read - Отметить материал как прочитанный
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
  const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid material ID' });
    }

    await prisma.material.update({
      where: { id: Number(id) },
      data: {
        reads: {
          increment: 1
        }
      }
    });

  res.json({ ok: true, id: Number(id) });
  } catch (error) {
    console.error('❌ Error marking material as read:', error);
    res.status(500).json({ error: 'Failed to mark material as read' });
  }
});

// Вспомогательные функции
function getCategoryDisplayName(category: string, language: string): string {
  const categoryNames: { [key: string]: { [key: string]: string } } = {
    'interview-questions': {
      'ru': 'Вопросы на собеседовании',
      'en': 'Interview Questions',
      'de': 'Vorstellungsgespräch Fragen',
      'es': 'Preguntas de Entrevista',
      'fr': 'Questions d\'Entretien',
      'zh': '面试问题'
    },
    'technical-tasks': {
      'ru': 'Технические задания',
      'en': 'Technical Tasks',
      'de': 'Technische Aufgaben',
      'es': 'Tareas Técnicas',
      'fr': 'Tâches Techniques',
      'zh': '技术任务'
    },
    'system-design': {
      'ru': 'Системный дизайн',
      'en': 'System Design',
      'de': 'Systemdesign',
      'es': 'Diseño de Sistemas',
      'fr': 'Conception de Systèmes',
      'zh': '系统设计'
    },
    'behavioral': {
      'ru': 'Поведенческие вопросы',
      'en': 'Behavioral Questions',
      'de': 'Verhaltensfragen',
      'es': 'Preguntas de Comportamiento',
      'fr': 'Questions Comportementales',
      'zh': '行为问题'
    },
    'algorithms': {
      'ru': 'Алгоритмы и структуры данных',
      'en': 'Algorithms and Data Structures',
      'de': 'Algorithmen und Datenstrukturen',
      'es': 'Algoritmos y Estructuras de Datos',
      'fr': 'Algorithmes et Structures de Données',
      'zh': '算法和数据结构'
    },
    'best-practices': {
      'ru': 'Лучшие практики',
      'en': 'Best Practices',
      'de': 'Beste Praktiken',
      'es': 'Mejores Prácticas',
      'fr': 'Meilleures Pratiques',
      'zh': '最佳实践'
    }
  };

  return categoryNames[category]?.[language] || category;
}

function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    'interview-questions': '💬',
    'technical-tasks': '⚡',
    'system-design': '🏗️',
    'behavioral': '🧠',
    'algorithms': '📊',
    'best-practices': '⭐'
  };
  return icons[category] || '📘';
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    'interview-questions': 'bg-blue-100 text-blue-800',
    'technical-tasks': 'bg-green-100 text-green-800',
    'system-design': 'bg-purple-100 text-purple-800',
    'behavioral': 'bg-orange-100 text-orange-800',
    'algorithms': 'bg-red-100 text-red-800',
    'best-practices': 'bg-yellow-100 text-yellow-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
}

export default router;
