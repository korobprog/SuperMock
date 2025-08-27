import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Получить все материалы с фильтрацией
router.get('/materials', async (req, res) => {
  try {
    console.log('🔍 Запрос материалов:', req.query);
    
    const {
      profession,
      language = 'ru',
      category,
      difficulty,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Базовые фильтры
    const where = {};
    
    if (profession) {
      where.profession = profession;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Поиск по названию или описанию
    if (search) {
      where.OR = [
        {
          translations: {
            some: {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    // Пагинация
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Сортировка
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Получаем материалы с переводами
    console.log('🔍 Поиск материалов с фильтрами:', where);
    
    const materials = await prisma.material.findMany({
      where,
      include: {
        translations: {
          where: {
            language: language
          }
        }
      },
      orderBy,
      skip,
      take
    });
    
    console.log('📚 Найдено материалов:', materials.length);

    // Получаем общее количество для пагинации
    const total = await prisma.material.count({ where });

    // Форматируем ответ
    const formattedMaterials = materials.map(material => {
      const translation = material.translations[0];
      return {
        id: material.id,
        profession: material.profession,
        category: material.category,
        difficulty: material.difficulty,
        readTime: material.readTime,
        rating: material.rating,
        reads: material.reads,
        tags: material.tags,
        isNew: material.isNew,
        isPopular: material.isPopular,
        createdAt: material.createdAt,
        title: translation?.title || '',
        description: translation?.description || '',
        content: translation?.content || ''
      };
    });

    res.json({
      materials: formattedMaterials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить популярные материалы
router.get('/materials/popular', async (req, res) => {
  try {
    const { profession, language = 'ru', limit = 10 } = req.query;

    const where = {
      isPopular: true
    };
    
    if (profession) {
      where.profession = profession;
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        translations: {
          where: {
            language: language
          }
        }
      },
      orderBy: {
        reads: 'desc'
      },
      take: parseInt(limit)
    });

    const formattedMaterials = materials.map(material => {
      const translation = material.translations[0];
      return {
        id: material.id,
        profession: material.profession,
        category: material.category,
        difficulty: material.difficulty,
        readTime: material.readTime,
        rating: material.rating,
        reads: material.reads,
        tags: material.tags,
        isNew: material.isNew,
        isPopular: material.isPopular,
        createdAt: material.createdAt,
        title: translation?.title || '',
        description: translation?.description || '',
        content: translation?.content || ''
      };
    });

    res.json(formattedMaterials);

  } catch (error) {
    console.error('Error fetching popular materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить новые материалы
router.get('/materials/new', async (req, res) => {
  try {
    const { profession, language = 'ru', limit = 10 } = req.query;

    const where = {
      isNew: true
    };
    
    if (profession) {
      where.profession = profession;
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        translations: {
          where: {
            language: language
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    const formattedMaterials = materials.map(material => {
      const translation = material.translations[0];
      return {
        id: material.id,
        profession: material.profession,
        category: material.category,
        difficulty: material.difficulty,
        readTime: material.readTime,
        rating: material.rating,
        reads: material.reads,
        tags: material.tags,
        isNew: material.isNew,
        isPopular: material.isPopular,
        createdAt: material.createdAt,
        title: translation?.title || '',
        description: translation?.description || '',
        content: translation?.content || ''
      };
    });

    res.json(formattedMaterials);

  } catch (error) {
    console.error('Error fetching new materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить категории материалов
router.get('/materials/categories', async (req, res) => {
  try {
    const { profession, language = 'ru' } = req.query;

    const where = {};
    if (profession) {
      where.profession = profession;
    }

    // Получаем уникальные категории
    const categories = await prisma.material.groupBy({
      by: ['category'],
      where,
      _count: {
        category: true
      }
    });

    // Получаем переводы названий категорий
    const categoryNames = {
      'interview-questions': {
        ru: 'Вопросы на собеседовании',
        en: 'Interview Questions',
        es: 'Preguntas de Entrevista',
        de: 'Interview-Fragen',
        fr: 'Questions d\'Entretien',
        zh: '面试问题'
      },
      'technical-tasks': {
        ru: 'Технические задания',
        en: 'Technical Tasks',
        es: 'Tareas Técnicas',
        de: 'Technische Aufgaben',
        fr: 'Tâches Techniques',
        zh: '技术任务'
      },
      'system-design': {
        ru: 'Системный дизайн',
        en: 'System Design',
        es: 'Diseño de Sistemas',
        de: 'Systemdesign',
        fr: 'Conception de Systèmes',
        zh: '系统设计'
      },
      'behavioral': {
        ru: 'Поведенческие вопросы',
        en: 'Behavioral Questions',
        es: 'Preguntas de Comportamiento',
        de: 'Verhaltensfragen',
        fr: 'Questions Comportementales',
        zh: '行为问题'
      },
      'algorithms': {
        ru: 'Алгоритмы и структуры данных',
        en: 'Algorithms & Data Structures',
        es: 'Algoritmos y Estructuras de Datos',
        de: 'Algorithmen & Datenstrukturen',
        fr: 'Algorithmes et Structures de Données',
        zh: '算法和数据结构'
      },
      'best-practices': {
        ru: 'Лучшие практики',
        en: 'Best Practices',
        es: 'Mejores Prácticas',
        de: 'Best Practices',
        fr: 'Meilleures Pratiques',
        zh: '最佳实践'
      }
    };

    const icons = {
      'interview-questions': '💬',
      'technical-tasks': '⚡',
      'system-design': '🏗️',
      'behavioral': '🧠',
      'algorithms': '📊',
      'best-practices': '⭐'
    };

    const colors = {
      'interview-questions': 'bg-blue-100 text-blue-800',
      'technical-tasks': 'bg-green-100 text-green-800',
      'system-design': 'bg-purple-100 text-purple-800',
      'behavioral': 'bg-orange-100 text-orange-800',
      'algorithms': 'bg-red-100 text-red-800',
      'best-practices': 'bg-yellow-100 text-yellow-800'
    };

    const formattedCategories = categories.map(cat => ({
      id: cat.category,
      name: categoryNames[cat.category]?.[language] || cat.category,
      count: cat._count.category,
      icon: icons[cat.category] || '📄',
      color: colors[cat.category] || 'bg-gray-100 text-gray-800'
    }));

    res.json(formattedCategories);

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить конкретный материал по ID
router.get('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'ru' } = req.query;

    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: {
          where: {
            language: language
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const translation = material.translations[0];
    
    res.json({
      id: material.id,
      profession: material.profession,
      category: material.category,
      difficulty: material.difficulty,
      readTime: material.readTime,
      rating: material.rating,
      reads: material.reads,
      tags: material.tags,
      isNew: material.isNew,
      isPopular: material.isPopular,
      createdAt: material.createdAt,
      title: translation?.title || '',
      description: translation?.description || '',
      content: translation?.content || ''
    });

  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Увеличить счетчик прочтений
router.post('/materials/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.update({
      where: { id: parseInt(id) },
      data: {
        reads: {
          increment: 1
        }
      }
    });

    res.json({ success: true, reads: material.reads });

  } catch (error) {
    console.error('Error updating read count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
