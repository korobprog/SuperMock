import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { InMemoryFeedback } from '../models/InMemoryFeedback';
import { InMemoryUser } from '../models/InMemoryUser';
import { InMemorySession } from '../models/InMemorySession';
import { notifyFeedbackUpdated } from '../websocket';
// 🤖 AI АНАЛИЗ И РАСПРЕДЕЛЕНИЕ
import { AIAnalysisService } from '../services/aiAnalysisService';
import { ApplicationDistributionService } from '../services/applicationDistributionService';

// Интерфейс для обновлений обратной связи
interface FeedbackUpdates {
  [key: string]: any;
}

const router = express.Router();

// Отправка обратной связи для сессии
// POST /api/sessions/:id/feedback
router.post(
  '/sessions/:id/feedback',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const sessionId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      const { ratings, comments, recommendations } = req.body;

      // Проверяем существование сессии
      const session = await InMemorySession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Сессия не найдена' });
      }

      // Проверяем, участвовал ли пользователь в сессии
      const isInterviewer = session.interviewerId === userId;
      const isInterviewee = session.intervieweeId === userId;
      const isObserver =
        session.observerIds && session.observerIds.includes(userId);

      if (!isInterviewer && !isInterviewee && !isObserver) {
        return res.status(403).json({
          message:
            'Вы не можете оставить обратную связь для сессии, в которой не участвовали',
        });
      }

      // Проверяем, не отправлял ли пользователь уже обратную связь для этой сессии
      const existingFeedback = await InMemoryFeedback.findByUserAndSession(
        userId,
        sessionId
      );
      if (existingFeedback) {
        return res.status(400).json({
          message: 'Вы уже отправили обратную связь для этой сессии',
        });
      }

      // Создаем новую обратную связь
      const feedback = new InMemoryFeedback({
        sessionId,
        userId,
        ratings: ratings || {},
        comments: comments || '',
        recommendations: recommendations || '',
      });

      await feedback.save();

      // Обновляем статус обратной связи пользователя
      const user = await InMemoryUser.findById(userId);
      if (user) {
        // Если пользователь был интервьюером или отвечающим, обновляем статус
        if (isInterviewer || isInterviewee) {
          user.feedbackStatus = 'completed';
          await user.save();
        }
      }

      // Получаем экземпляр Socket.IO из объекта запроса
      const io = req.app.get('io');

      // Отправляем уведомление о новой обратной связи
      notifyFeedbackUpdated(io, sessionId, feedback.id, {}, feedback);

      // 🤖 AI АНАЛИЗ ФИДБЕКА (асинхронно, не блокируем ответ)
      if (comments && comments.trim().length > 10) {
        try {
          console.log(`🤖 Starting AI analysis for feedback ${feedback.id}`);
          
          // Получаем информацию о пользователе и сессии для анализа
          const targetUserId = isInterviewer ? session.intervieweeId : session.interviewerId;
          const profession = (session as any).profession || 'Developer';
          const userLanguage = (user as any)?.language || 'ru';
          
          // Проверяем что targetUserId существует
          if (!targetUserId) {
            console.log('❌ No target user ID found for AI analysis');
            return;
          }
          
          // Запускаем AI анализ асинхронно (не ждем результата)
          const aiService = new AIAnalysisService();
          
          // Используем setImmediate чтобы не блокировать ответ пользователю
          setImmediate(async () => {
            try {
              // Анализируем фидбек
              const analysis = await aiService.analyzeFeedback(
                parseInt(feedback.id) || 0,
                comments,
                profession,
                userLanguage,
                targetUserId
              );
              
              console.log(`✅ AI analysis completed for feedback ${feedback.id}`);
              
              // Генерируем рекомендации на основе анализа
              const recommendations = await aiService.generateRecommendations(
                analysis,
                profession,
                userLanguage,
                targetUserId
              );
              
              console.log(`💡 Generated ${recommendations.length} recommendations for user ${targetUserId}`);
              
              // 🎯 АВТОМАТИЧЕСКОЕ РАСПРЕДЕЛЕНИЕ ПО ПРИЛОЖЕНИЯМ
              try {
                const distributionService = new ApplicationDistributionService();
                
                const distributedContent = await distributionService.distributeRecommendations(
                  analysis,
                  recommendations,
                  targetUserId,
                  profession,
                  userLanguage
                );
                
                console.log(`✅ Content distributed: ${distributedContent.materials.length} materials, ${distributedContent.roadmapStages.length} roadmap stages, ${distributedContent.calendarEvents.length} calendar events, ${distributedContent.trainingTasks.length} training tasks`);
                
                // TODO: Сохранить распределенный контент в соответствующие таблицы БД
                // TODO: Уведомить пользователя о новых материалах, этапах roadmap, событиях календаря и заданиях
                
                await distributionService.disconnect();
                
              } catch (distributionError) {
                console.error('❌ Distribution failed:', distributionError);
                // Продолжаем выполнение, не блокируя основной процесс
              }
              
              // TODO: Сохранить анализ и рекомендации в БД (после создания соответствующих таблиц в Prisma)
              // TODO: Отправить уведомление пользователю о готовности AI анализа
              
            } catch (aiError) {
              console.error('❌ AI analysis failed:', aiError);
              // Не блокируем основной процесс при ошибке AI
            } finally {
              await aiService.disconnect();
            }
          });
          
        } catch (aiSetupError) {
          console.error('❌ AI analysis setup failed:', aiSetupError);
          // Продолжаем выполнение без AI анализа
        }
      }

      // Проверяем, заполнили ли обе стороны обратную связь
      const allFeedbacks = await InMemoryFeedback.findBySessionId(sessionId);
      const interviewerFeedback = allFeedbacks.find(
        (f: InMemoryFeedback) => f.userId === session.interviewerId
      );
      const intervieweeFeedback = allFeedbacks.find(
        (f: InMemoryFeedback) => f.userId === session.intervieweeId
      );

      // Если обе стороны заполнили обратную связь, отправляем дополнительное уведомление
      if (interviewerFeedback && intervieweeFeedback) {
        notifyFeedbackUpdated(io, sessionId, 'both-submitted', {
          bothSidesSubmitted: true,
        });
      }

      res.status(201).json({
        message: 'Обратная связь успешно отправлена',
        feedback,
      });
    } catch (error) {
      console.error('Ошибка при отправке обратной связи:', error);
      res.status(500).json({
        message: 'Ошибка сервера при отправке обратной связи',
        details: (error as Error).message,
      });
    }
  }
);

// Получение списка обратной связи для пользователя
// GET /api/users/:id/feedback
router.get(
  '/users/:id/feedback',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const targetUserId = req.params.id;
      const requestUserId = req.user?.id;

      if (!requestUserId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      // Проверяем права доступа (пользователь может получить только свою обратную связь)
      if (targetUserId !== requestUserId) {
        return res.status(403).json({
          message: 'Вы можете получить только свою обратную связь',
        });
      }

      // Получаем список обратной связи для пользователя
      const feedbacks = await InMemoryFeedback.findByUserId(targetUserId);

      res.json(feedbacks);
    } catch (error) {
      console.error('Ошибка при получении списка обратной связи:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении списка обратной связи',
        details: (error as Error).message,
      });
    }
  }
);

// Получение обратной связи для сессии
// GET /api/sessions/:id/feedback
router.get(
  '/sessions/:id/feedback',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const sessionId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      // Проверяем существование сессии
      const session = await InMemorySession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Сессия не найдена' });
      }

      // Проверяем, участвовал ли пользователь в сессии
      const isInterviewer = session.interviewerId === userId;
      const isInterviewee = session.intervieweeId === userId;
      const isObserver =
        session.observerIds && session.observerIds.includes(userId);

      if (!isInterviewer && !isInterviewee && !isObserver) {
        return res.status(403).json({
          message:
            'Вы не можете получить обратную связь для сессии, в которой не участвовали',
        });
      }

      // Получаем обратную связь для сессии
      const feedbacks = await InMemoryFeedback.findBySessionId(sessionId);

      // Проверяем, заполнили ли обе стороны (интервьюер и интервьюируемый) обратную связь
      const interviewerFeedback = feedbacks.find(
        (feedback: InMemoryFeedback) =>
          feedback.userId === session.interviewerId
      );
      const intervieweeFeedback = feedbacks.find(
        (feedback: InMemoryFeedback) =>
          feedback.userId === session.intervieweeId
      );

      // Добавляем информацию о заполнении обратной связи обеими сторонами
      const bothSidesSubmitted = !!(interviewerFeedback && intervieweeFeedback);

      res.json({
        feedbacks,
        bothSidesSubmitted,
        session,
      });
    } catch (error) {
      console.error('Ошибка при получении обратной связи для сессии:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении обратной связи для сессии',
        details: (error as Error).message,
      });
    }
  }
);

// 🤖 AI АНАЛИЗ API - Новые эндпоинты для получения AI анализа

// Получение AI анализа для конкретного фидбека
// GET /api/feedback/:id/analysis
router.get(
  '/:id/analysis',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const feedbackId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      if (isNaN(feedbackId)) {
        return res.status(400).json({ message: 'Неверный ID фидбека' });
      }

      // TODO: Получить анализ из БД когда будут готовы Prisma таблицы
      // const analysis = await prisma.feedbackAnalysis.findUnique({
      //   where: { feedbackId },
      //   include: { recommendations: true }
      // });

      // Пока возвращаем заглушку
      const mockAnalysis = {
        id: feedbackId,
        feedbackId,
        userId,
        weaknesses: ['algorithms', 'system_design'],
        strengths: ['javascript', 'communication'],
        skillLevels: [
          { skill: 'react', level: 7, confidence: 0.9 },
          { skill: 'node.js', level: 5, confidence: 0.7 }
        ],
        communicationScore: 8,
        technicalScore: 6,
        overallReadiness: 7,
        suggestions: ['Изучить алгоритмы сортировки', 'Практика системного дизайна'],
        uniquenessScore: 0.8,
        summary: 'Хорошие навыки фронтенда, нужно подтянуть алгоритмы',
        aiModel: 'meta-llama/llama-3.1-8b-instruct',
        createdAt: new Date().toISOString(),
        recommendations: [
          {
            id: 1,
            type: 'material',
            priority: 9,
            title: 'Изучить алгоритмы сортировки',
            description: 'Освоить основные алгоритмы: bubble, quick, merge sort',
            estimatedHours: 20,
            isCompleted: false
          }
        ]
      };

      res.json({
        analysis: mockAnalysis,
        message: 'AI анализ получен (пока используется заглушка)'
      });

    } catch (error) {
      console.error('Ошибка при получении AI анализа:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении AI анализа',
        details: (error as Error).message,
      });
    }
  }
);

// Получение общего анализа навыков пользователя
// GET /api/users/:id/skill-analysis
router.get(
  '/users/:id/skill-analysis',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const targetUserId = req.params.id;
      const requestUserId = req.user?.id;

      if (!requestUserId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      // Проверяем права доступа
      if (targetUserId !== requestUserId) {
        return res.status(403).json({
          message: 'Вы можете получить только свой анализ навыков',
        });
      }

      // TODO: Получить агрегированный анализ из БД
      // const skillProgress = await prisma.skillProgress.findMany({
      //   where: { userId: targetUserId },
      //   orderBy: { currentLevel: 'desc' }
      // });

      // const recentAnalyses = await prisma.feedbackAnalysis.findMany({
      //   where: { userId: targetUserId },
      //   orderBy: { createdAt: 'desc' },
      //   take: 5
      // });

      // Пока возвращаем заглушку
      const mockSkillAnalysis = {
        userId: targetUserId,
        overallProgress: {
          averageScore: 7.2,
          totalAnalyses: 15,
          improvementTrend: '+1.2', // улучшение за последний месяц
          lastUpdated: new Date().toISOString()
        },
        topSkills: [
          { skill: 'javascript', level: 8, confidence: 0.9, trend: '+0.5' },
          { skill: 'react', level: 7, confidence: 0.8, trend: '+0.3' },
          { skill: 'communication', level: 8, confidence: 0.7, trend: '+0.2' }
        ],
        weakestAreas: [
          { skill: 'algorithms', level: 4, confidence: 0.8, trend: '-0.1' },
          { skill: 'system_design', level: 5, confidence: 0.7, trend: '0.0' }
        ],
        recommendations: [
          {
            priority: 10,
            type: 'training',
            title: 'Алгоритмы и структуры данных',
            description: 'Критически важно для роста',
            estimatedHours: 40
          }
        ],
        readinessScore: 72, // готовность к работе в %
        nextMilestones: [
          'Изучить основные алгоритмы (+15% готовности)',
          'Практика системного дизайна (+10% готовности)'
        ]
      };

      res.json({
        skillAnalysis: mockSkillAnalysis,
        message: 'Анализ навыков получен (пока используется заглушка)'
      });

    } catch (error) {
      console.error('Ошибка при получении анализа навыков:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении анализа навыков',
        details: (error as Error).message,
      });
    }
  }
);

// Получение рекомендаций пользователя
// GET /api/users/:id/recommendations
router.get(
  '/users/:id/recommendations',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const targetUserId = req.params.id;
      const requestUserId = req.user?.id;

      if (!requestUserId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      // Проверяем права доступа
      if (targetUserId !== requestUserId) {
        return res.status(403).json({
          message: 'Вы можете получить только свои рекомендации',
        });
      }

      const { status, type, priority } = req.query;

      // TODO: Получить рекомендации из БД с фильтрацией
      // let whereClause: any = { userId: targetUserId };
      // if (status) whereClause.isCompleted = status === 'completed';
      // if (type) whereClause.type = type;
      
      // const recommendations = await prisma.learningRecommendation.findMany({
      //   where: whereClause,
      //   orderBy: [
      //     { priority: 'desc' },
      //     { createdAt: 'desc' }
      //   ]
      // });

      // Пока возвращаем заглушку
      const mockRecommendations = [
        {
          id: 1,
          type: 'material',
          priority: 10,
          title: 'Алгоритмы сортировки',
          description: 'Изучить bubble sort, quick sort, merge sort',
          estimatedHours: 15,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isCompleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          type: 'training',
          priority: 9,
          title: 'Практика кодирования',
          description: 'Решить 10 задач на LeetCode по алгоритмам',
          estimatedHours: 20,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          isCompleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          type: 'roadmap',
          priority: 8,
          title: 'Изучение системного дизайна',
          description: 'Пройти курс по проектированию распределенных систем',
          estimatedHours: 40,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isCompleted: false,
          createdAt: new Date().toISOString()
        }
      ];

      // Применяем фильтры к заглушке
      let filteredRecommendations = mockRecommendations;
      if (type) {
        filteredRecommendations = filteredRecommendations.filter(r => r.type === type);
      }
      if (status) {
        const isCompleted = status === 'completed';
        filteredRecommendations = filteredRecommendations.filter(r => r.isCompleted === isCompleted);
      }

      res.json({
        recommendations: filteredRecommendations,
        totalCount: filteredRecommendations.length,
        filters: { status, type, priority },
        message: 'Рекомендации получены (пока используется заглушка)'
      });

    } catch (error) {
      console.error('Ошибка при получении рекомендаций:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении рекомендаций',
        details: (error as Error).message,
      });
    }
  }
);

// 🎯 APPLICATION CONTENT API - Получение распределенного AI контента по приложениям

// Получение AI материалов для пользователя
// GET /api/users/:id/ai-materials
router.get(
  '/users/:id/ai-materials',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const targetUserId = req.params.id;
      const requestUserId = req.user?.id;

      if (!requestUserId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      if (targetUserId !== requestUserId) {
        return res.status(403).json({
          message: 'Вы можете получить только свои материалы',
        });
      }

      const { category, difficulty, skill } = req.query;

      // TODO: Получить AI материалы из БД
      // const materials = await prisma.applicationItem.findMany({
      //   where: {
      //     userId: targetUserId,
      //     type: 'material',
      //     ...(category && { 'metadata.category': category }),
      //     ...(difficulty && { 'metadata.difficulty': difficulty }),
      //     ...(skill && { relatedSkill: skill })
      //   },
      //   orderBy: [
      //     { priority: 'desc' },
      //     { createdAt: 'desc' }
      //   ]
      // });

      // Пока возвращаем заглушку
      const mockMaterials = [
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
        }
      ];

      // Применяем фильтры
      let filteredMaterials = mockMaterials;
      if (category) {
        filteredMaterials = filteredMaterials.filter(m => m.metadata.category === category);
      }
      if (difficulty) {
        filteredMaterials = filteredMaterials.filter(m => m.metadata.difficulty === difficulty);
      }
      if (skill) {
        filteredMaterials = filteredMaterials.filter(m => m.relatedSkill === skill);
      }

      res.json({
        materials: filteredMaterials,
        totalCount: filteredMaterials.length,
        filters: { category, difficulty, skill },
        message: 'AI материалы получены (пока используется заглушка)'
      });

    } catch (error) {
      console.error('Ошибка при получении AI материалов:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении AI материалов',
        details: (error as Error).message,
      });
    }
  }
);

// Получение AI этапов roadmap для пользователя
// GET /api/users/:id/ai-roadmap
router.get(
  '/users/:id/ai-roadmap',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const targetUserId = req.params.id;
      const requestUserId = req.user?.id;

      if (!requestUserId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      if (targetUserId !== requestUserId) {
        return res.status(403).json({
          message: 'Вы можете получить только свой roadmap',
        });
      }

      const { status, skill } = req.query;

      // TODO: Получить AI roadmap этапы из БД
      // const roadmapStages = await prisma.roadmapStage.findMany({
      //   where: {
      //     userId: targetUserId,
      //     ...(status && { status }),
      //     ...(skill && { skills: { has: skill } })
      //   },
      //   orderBy: [
      //     { priority: 'desc' },
      //     { createdAt: 'desc' }
      //   ]
      // });

      // Пока возвращаем заглушку
      const mockRoadmapStages = [
        {
          id: 'stage_algorithms_mastery',
          title: 'Освоение алгоритмов',
          description: 'Комплексное изучение алгоритмов для роли Frontend Developer. Включает теорию, практику и реальные проекты.',
          status: 'in-progress',
          priority: 10,
          estimatedHours: 50,
          skills: ['algorithms', 'problem-solving'],
          progress: 25,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: 'stage_react_optimization',
          title: 'Оптимизация React приложений',
          description: 'Изучение продвинутых техник оптимизации производительности React.',
          status: 'not-started',
          priority: 8,
          estimatedHours: 30,
          skills: ['react', 'performance'],
          progress: 0,
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        }
      ];

      // Применяем фильтры
      let filteredStages = mockRoadmapStages;
      if (status) {
        filteredStages = filteredStages.filter(s => s.status === status);
      }
      if (skill) {
        filteredStages = filteredStages.filter(s => s.skills.includes(skill as string));
      }

      res.json({
        roadmapStages: filteredStages,
        totalCount: filteredStages.length,
        overallProgress: 15, // общий прогресс в %
        estimatedCompletion: '2-3 месяца',
        filters: { status, skill },
        message: 'AI roadmap получен (пока используется заглушка)'
      });

    } catch (error) {
      console.error('Ошибка при получении AI roadmap:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении AI roadmap',
        details: (error as Error).message,
      });
    }
  }
);

// Получение AI событий календаря для пользователя
// GET /api/users/:id/ai-calendar
router.get(
  '/users/:id/ai-calendar',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const targetUserId = req.params.id;
      const requestUserId = req.user?.id;

      if (!requestUserId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      if (targetUserId !== requestUserId) {
        return res.status(403).json({
          message: 'Вы можете получить только свой календарь',
        });
      }

      const { type, skill, from, to } = req.query;

      // TODO: Получить AI календарные события из БД
      // let whereClause: any = { userId: targetUserId };
      // if (type) whereClause.type = type;
      // if (skill) whereClause.relatedSkill = skill;
      // if (from) whereClause.date = { gte: new Date(from as string) };
      // if (to) whereClause.date = { ...whereClause.date, lte: new Date(to as string) };

      // const calendarEvents = await prisma.calendarEvent.findMany({
      //   where: whereClause,
      //   orderBy: { date: 'asc' }
      // });

      // Пока возвращаем заглушку
      const now = new Date();
      const mockCalendarEvents = [
        {
          id: 'event_algorithms_study_1',
          title: 'Изучение algorithms - Сессия 1',
          description: 'Учебная сессия 1 по навыку algorithms. Теория и практические упражнения.',
          type: 'study',
          date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          relatedSkill: 'algorithms',
          priority: 10,
          status: 'scheduled'
        },
        {
          id: 'event_react_practice',
          title: 'Практика React оптимизации',
          description: 'Практическая сессия по оптимизации React компонентов.',
          type: 'practice',
          date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          relatedSkill: 'react',
          priority: 8,
          status: 'scheduled'
        },
        {
          id: 'follow_up_interview',
          title: 'Контрольное собеседование',
          description: 'Контрольное собеседование для проверки прогресса по ключевым навыкам: algorithms, react',
          type: 'interview',
          date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          relatedSkill: 'overall',
          priority: 9,
          status: 'scheduled'
        }
      ];

      // Применяем фильтры
      let filteredEvents = mockCalendarEvents;
      if (type) {
        filteredEvents = filteredEvents.filter(e => e.type === type);
      }
      if (skill) {
        filteredEvents = filteredEvents.filter(e => e.relatedSkill === skill);
      }

      res.json({
        calendarEvents: filteredEvents,
        totalCount: filteredEvents.length,
        upcomingEvents: filteredEvents.filter(e => new Date(e.date) > now).length,
        filters: { type, skill, from, to },
        message: 'AI календарь получен (пока используется заглушка)'
      });

    } catch (error) {
      console.error('Ошибка при получении AI календаря:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении AI календаря',
        details: (error as Error).message,
      });
    }
  }
);

// Получение AI заданий тренажера для пользователя
// GET /api/users/:id/ai-training-tasks
router.get(
  '/users/:id/ai-training-tasks',
  auth,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const targetUserId = req.params.id;
      const requestUserId = req.user?.id;

      if (!requestUserId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      if (targetUserId !== requestUserId) {
        return res.status(403).json({
          message: 'Вы можете получить только свои задания',
        });
      }

      const { difficulty, type, skill, completed } = req.query;

      // TODO: Получить AI задания из БД
      // let whereClause: any = { userId: targetUserId };
      // if (difficulty) whereClause.difficulty = difficulty;
      // if (type) whereClause.type = type;
      // if (skill) whereClause.skill = skill;
      // if (completed !== undefined) whereClause.isCompleted = completed === 'true';

      // const trainingTasks = await prisma.trainingTask.findMany({
      //   where: whereClause,
      //   orderBy: [
      //     { priority: 'desc' },
      //     { difficulty: 'asc' },
      //     { createdAt: 'desc' }
      //   ]
      // });

      // Пока возвращаем заглушку
      const mockTrainingTasks = [
        {
          id: 'task_algorithms_1',
          title: 'algorithms - Задание 1',
          description: 'Практическое задание 1 по навыку algorithms для Frontend Developer',
          difficulty: 'easy',
          type: 'coding',
          skill: 'algorithms',
          estimatedTime: 90,
          examples: [
            'Реализуйте алгоритм быстрой сортировки'
          ],
          hints: [
            'Подумайте о крайних случаях',
            'Оптимизируйте по времени и памяти'
          ],
          isCompleted: false,
          progress: 0,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_react_optimization',
          title: 'Оптимизация React компонентов',
          description: 'Практическое задание по оптимизации производительности React приложения',
          difficulty: 'medium',
          type: 'practice',
          skill: 'react',
          estimatedTime: 120,
          examples: [
            'Оптимизируйте рендеринг списка из 1000 элементов',
            'Реализуйте виртуализацию'
          ],
          hints: [
            'Используйте React.memo',
            'Рассмотрите использование useMemo и useCallback'
          ],
          isCompleted: false,
          progress: 0,
          createdAt: new Date().toISOString()
        }
      ];

      // Применяем фильтры
      let filteredTasks = mockTrainingTasks;
      if (difficulty) {
        filteredTasks = filteredTasks.filter(t => t.difficulty === difficulty);
      }
      if (type) {
        filteredTasks = filteredTasks.filter(t => t.type === type);
      }
      if (skill) {
        filteredTasks = filteredTasks.filter(t => t.skill === skill);
      }
      if (completed !== undefined) {
        const isCompleted = completed === 'true';
        filteredTasks = filteredTasks.filter(t => t.isCompleted === isCompleted);
      }

      res.json({
        trainingTasks: filteredTasks,
        totalCount: filteredTasks.length,
        completedCount: filteredTasks.filter(t => t.isCompleted).length,
        filters: { difficulty, type, skill, completed },
        message: 'AI задания получены (пока используется заглушка)'
      });

    } catch (error) {
      console.error('Ошибка при получении AI заданий:', error);
      res.status(500).json({
        message: 'Ошибка сервера при получении AI заданий',
        details: (error as Error).message,
      });
    }
  }
);

export default router;
