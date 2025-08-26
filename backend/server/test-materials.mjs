import express from 'express';

const router = express.Router();

// Простые тестовые данные
const testMaterials = [
  // Frontend материалы
  {
    id: 1,
    profession: "frontend",
    title: "Топ-50 вопросов по JavaScript",
    description: "Самые частые вопросы на собеседованиях по JavaScript с подробными ответами",
    category: "interview-questions",
    difficulty: "intermediate",
    readTime: 15,
    rating: 4.8,
    reads: 1247,
    tags: ["JavaScript", "Основы", "ES6+"],
    isNew: false,
    isPopular: true,
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    profession: "frontend",
    title: "React Hooks: полное руководство",
    description: "Изучите все хуки React и их правильное использование",
    category: "technical-tasks",
    difficulty: "intermediate",
    readTime: 20,
    rating: 4.9,
    reads: 892,
    tags: ["React", "Hooks", "Frontend"],
    isNew: true,
    isPopular: false,
    createdAt: "2024-01-15T00:00:00Z"
  },
  {
    id: 3,
    profession: "frontend",
    title: "TypeScript: продвинутые типы",
    description: "Углубленное изучение системы типов TypeScript",
    category: "best-practices",
    difficulty: "advanced",
    readTime: 25,
    rating: 4.7,
    reads: 567,
    tags: ["TypeScript", "Типы", "Продвинутый"],
    isNew: false,
    isPopular: true,
    createdAt: "2024-01-10T00:00:00Z"
  },
  {
    id: 4,
    profession: "frontend",
    title: "Основы CSS Grid",
    description: "Изучите CSS Grid Layout с нуля до продвинутого уровня",
    category: "interview-questions",
    difficulty: "beginner",
    readTime: 12,
    rating: 4.5,
    reads: 345,
    tags: ["CSS", "Grid", "Layout"],
    isNew: true,
    isPopular: false,
    createdAt: "2024-01-20T00:00:00Z"
  },
  {
    id: 5,
    profession: "frontend",
    title: "Лучшие практики React Performance",
    description: "Оптимизация производительности React приложений",
    category: "best-practices",
    difficulty: "advanced",
    readTime: 28,
    rating: 4.8,
    reads: 945,
    tags: ["React", "Performance", "Оптимизация"],
    isNew: false,
    isPopular: true,
    createdAt: "2024-01-08T00:00:00Z"
  },
  // Backend материалы
  {
    id: 6,
    profession: "backend",
    title: "Node.js: асинхронное программирование",
    description: "Изучите async/await, промисы и event loop в Node.js",
    category: "interview-questions",
    difficulty: "intermediate",
    readTime: 18,
    rating: 4.7,
    reads: 756,
    tags: ["Node.js", "Async", "JavaScript"],
    isNew: false,
    isPopular: true,
    createdAt: "2024-01-02T00:00:00Z"
  },
  {
    id: 7,
    profession: "backend",
    title: "PostgreSQL: оптимизация запросов",
    description: "Продвинутые техники оптимизации SQL запросов",
    category: "technical-tasks",
    difficulty: "advanced",
    readTime: 25,
    rating: 4.9,
    reads: 634,
    tags: ["PostgreSQL", "SQL", "Оптимизация"],
    isNew: true,
    isPopular: false,
    createdAt: "2024-01-16T00:00:00Z"
  },
  {
    id: 8,
    profession: "backend",
    title: "Микросервисная архитектура",
    description: "Принципы проектирования и реализации микросервисов",
    category: "system-design",
    difficulty: "advanced",
    readTime: 30,
    rating: 4.8,
    reads: 1234,
    tags: ["Архитектура", "Микросервисы", "Docker"],
    isNew: false,
    isPopular: true,
    createdAt: "2024-01-05T00:00:00Z"
  },
  {
    id: 9,
    profession: "backend",
    title: "REST API: лучшие практики",
    description: "Создание качественных REST API с правильной архитектурой",
    category: "best-practices",
    difficulty: "intermediate",
    readTime: 20,
    rating: 4.6,
    reads: 567,
    tags: ["API", "REST", "Backend"],
    isNew: true,
    isPopular: true,
    createdAt: "2024-01-12T00:00:00Z"
  },
  {
    id: 10,
    profession: "backend",
    title: "Алгоритмы и структуры данных",
    description: "Основные алгоритмы для backend разработки",
    category: "algorithms",
    difficulty: "intermediate",
    readTime: 22,
    rating: 4.7,
    reads: 789,
    tags: ["Алгоритмы", "Структуры данных", "Big O"],
    isNew: false,
    isPopular: false,
    createdAt: "2024-01-18T00:00:00Z"
  },
  {
    id: 11,
    profession: "backend",
    title: "Поведенческие вопросы для backend",
    description: "Как отвечать на вопросы о масштабировании и производительности",
    category: "behavioral",
    difficulty: "intermediate",
    readTime: 18,
    rating: 4.5,
    reads: 456,
    tags: ["Soft Skills", "Backend", "Масштабирование"],
    isNew: false,
    isPopular: false,
    createdAt: "2024-01-14T00:00:00Z"
  },
  {
    id: 12,
    profession: "backend",
    title: "Основы Docker и контейнеризации",
    description: "Изучите Docker с нуля до продвинутого уровня",
    category: "interview-questions",
    difficulty: "beginner",
    readTime: 15,
    rating: 4.4,
    reads: 345,
    tags: ["Docker", "Контейнеры", "DevOps"],
    isNew: true,
    isPopular: false,
    createdAt: "2024-01-22T00:00:00Z"
  }
];

// Тестовый эндпоинт для материалов
router.get('/test-materials', async (req, res) => {
  try {
    const { profession, language, limit = 10, isPopular, isNew, category, difficulty, search } = req.query;
    
    console.log('🔍 Тестовый запрос материалов:', { profession, language, limit, isPopular, isNew, category, difficulty, search });
    
    // Фильтруем материалы
    let materials = testMaterials;
    
    if (profession) {
      materials = materials.filter(m => m.profession === profession);
    }
    
    if (category) {
      materials = materials.filter(m => m.category === category);
    }
    
    if (difficulty) {
      materials = materials.filter(m => m.difficulty === difficulty);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      materials = materials.filter(m => 
        m.title.toLowerCase().includes(searchLower) || 
        m.description.toLowerCase().includes(searchLower) ||
        m.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    if (isPopular === 'true') {
      materials = materials.filter(m => m.isPopular);
    }
    
    if (isNew === 'true') {
      materials = materials.filter(m => m.isNew);
    }
    
    // Ограничиваем количество
    const limitedMaterials = materials.slice(0, parseInt(limit));
    
    res.json({
      materials: limitedMaterials,
      pagination: {
        page: 1,
        limit: parseInt(limit),
        total: materials.length,
        pages: 1
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка в тестовом API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Тестовый эндпоинт для категорий
router.get('/test-materials/categories', async (req, res) => {
  try {
    const { profession } = req.query;
    
    // Фильтруем материалы по профессии
    let filteredMaterials = testMaterials;
    if (profession) {
      filteredMaterials = testMaterials.filter(m => m.profession === profession);
    }
    
    // Подсчитываем количество материалов в каждой категории
    const categoryCounts = {};
    filteredMaterials.forEach(material => {
      categoryCounts[material.category] = (categoryCounts[material.category] || 0) + 1;
    });
    
    const categories = [
      {
        id: "interview-questions",
        name: "Вопросы на собеседовании",
        count: categoryCounts["interview-questions"] || 0,
        icon: "💬",
        color: "bg-blue-100 text-blue-800"
      },
      {
        id: "technical-tasks",
        name: "Технические задания",
        count: categoryCounts["technical-tasks"] || 0,
        icon: "⚡",
        color: "bg-green-100 text-green-800"
      },
      {
        id: "best-practices",
        name: "Лучшие практики",
        count: categoryCounts["best-practices"] || 0,
        icon: "⭐",
        color: "bg-yellow-100 text-yellow-800"
      },
      {
        id: "system-design",
        name: "Системный дизайн",
        count: categoryCounts["system-design"] || 0,
        icon: "🏗️",
        color: "bg-purple-100 text-purple-800"
      },
      {
        id: "behavioral",
        name: "Поведенческие вопросы",
        count: categoryCounts["behavioral"] || 0,
        icon: "🧠",
        color: "bg-orange-100 text-orange-800"
      },
      {
        id: "algorithms",
        name: "Алгоритмы и структуры данных",
        count: categoryCounts["algorithms"] || 0,
        icon: "📊",
        color: "bg-red-100 text-red-800"
      }
    ];
    
    res.json(categories);
    
  } catch (error) {
    console.error('❌ Ошибка в тестовом API категорий:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Увеличить счетчик прочтений
router.post('/test-materials/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const materialId = parseInt(id);
    
    const material = testMaterials.find(m => m.id === materialId);
    
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    // Увеличиваем счетчик чтений
    material.reads += 1;
    
    res.json({ success: true, reads: material.reads });

  } catch (error) {
    console.error('Error updating read count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
