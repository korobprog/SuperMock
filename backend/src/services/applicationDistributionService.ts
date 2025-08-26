import { PrismaClient } from '@prisma/client';
import { FeedbackAnalysis, LearningRecommendation } from './aiAnalysisService';

/**
 * 🎯 Application Distribution Service
 * 
 * Автоматически распределяет AI рекомендации по 4 приложениям:
 * 1. Materials - создает персонализированные материалы
 * 2. Roadmap - обновляет план развития  
 * 3. Calendar - планирует учебные сессии
 * 4. Trainer - создает практические задания
 */

interface ApplicationItem {
  id: string;
  type: 'material' | 'roadmap' | 'calendar' | 'trainer';
  title: string;
  description: string;
  priority: number;
  relatedSkill: string;
  metadata: any;
  createdAt: Date;
}

interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  priority: number;
  estimatedHours: number;
  skills: string[];
  dueDate?: Date;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: 'study' | 'practice' | 'interview' | 'review';
  date: Date;
  duration: number; // в минутах
  relatedSkill: string;
  priority: number;
}

interface TrainingTask {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'coding' | 'theory' | 'practice';
  skill: string;
  estimatedTime: number;
  examples?: string[];
  hints?: string[];
}

export class ApplicationDistributionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 🎯 Главный метод - распределение рекомендаций по приложениям
   */
  async distributeRecommendations(
    analysis: FeedbackAnalysis,
    recommendations: LearningRecommendation[],
    userId: string,
    profession: string,
    userLanguage: string = 'ru'
  ): Promise<{
    materials: ApplicationItem[];
    roadmapStages: RoadmapStage[];
    calendarEvents: CalendarEvent[];
    trainingTasks: TrainingTask[];
  }> {
    console.log(`🎯 Distributing ${recommendations.length} recommendations for user ${userId}`);

    try {
      // Создаем элементы для каждого приложения параллельно
      const [materials, roadmapStages, calendarEvents, trainingTasks] = await Promise.all([
        this.createMaterials(analysis, recommendations, profession, userLanguage),
        this.createRoadmapStages(analysis, recommendations, profession, userLanguage),
        this.createCalendarEvents(analysis, recommendations, userId, userLanguage),
        this.createTrainingTasks(analysis, recommendations, profession, userLanguage)
      ]);

      console.log(`✅ Distribution completed: ${materials.length} materials, ${roadmapStages.length} stages, ${calendarEvents.length} events, ${trainingTasks.length} tasks`);

      return {
        materials,
        roadmapStages,
        calendarEvents,
        trainingTasks
      };

    } catch (error) {
      console.error('❌ Distribution failed:', error);
      throw new Error('Не удалось распределить рекомендации по приложениям');
    }
  }

  /**
   * 📚 Создание персонализированных материалов для Materials.tsx
   */
  private async createMaterials(
    analysis: FeedbackAnalysis,
    recommendations: LearningRecommendation[],
    profession: string,
    userLanguage: string
  ): Promise<ApplicationItem[]> {
    const materials: ApplicationItem[] = [];

    // Создаем материалы для каждой слабости
    for (const weakness of analysis.weaknesses) {
      const material: ApplicationItem = {
        id: `material_${weakness}_${Date.now()}`,
        type: 'material',
        title: this.getMaterialTitle(weakness, userLanguage),
        description: this.getMaterialDescription(weakness, profession, userLanguage),
        priority: this.calculatePriority(weakness, analysis),
        relatedSkill: weakness,
        metadata: {
          category: this.getSkillCategory(weakness),
          difficulty: this.getDifficultyForSkill(weakness, analysis),
          readTime: this.getEstimatedReadTime(weakness),
          tags: this.generateMaterialTags(weakness, profession),
          source: 'ai_generated',
          analysisId: analysis.id || null
        },
        createdAt: new Date()
      };

      materials.push(material);
    }

    // Создаем дополнительные материалы на основе рекомендаций типа "material"
    const materialRecommendations = recommendations.filter(r => r.type === 'material');
    
    for (const rec of materialRecommendations) {
      const material: ApplicationItem = {
        id: `rec_material_${rec.title.replace(/\s+/g, '_')}_${Date.now()}`,
        type: 'material',
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        relatedSkill: this.extractSkillFromRecommendation(rec),
        metadata: {
          category: 'recommended',
          difficulty: 'medium',
          readTime: rec.estimatedHours ? rec.estimatedHours * 60 : 30,
          tags: this.generateTagsFromRecommendation(rec),
          source: 'ai_recommendation',
          estimatedHours: rec.estimatedHours,
          dueDate: rec.dueDate
        },
        createdAt: new Date()
      };

      materials.push(material);
    }

    return materials.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 🗺️ Создание этапов для Roadmap.tsx
   */
  private async createRoadmapStages(
    analysis: FeedbackAnalysis,
    recommendations: LearningRecommendation[],
    profession: string,
    userLanguage: string
  ): Promise<RoadmapStage[]> {
    const stages: RoadmapStage[] = [];

    // Создаем этапы для roadmap рекомендаций
    const roadmapRecommendations = recommendations.filter(r => r.type === 'roadmap');
    
    for (const rec of roadmapRecommendations) {
      const stage: RoadmapStage = {
        id: `stage_${rec.title.replace(/\s+/g, '_')}_${Date.now()}`,
        title: rec.title,
        description: rec.description,
        status: 'not-started',
        priority: rec.priority,
        estimatedHours: rec.estimatedHours || this.getDefaultHoursForRoadmapStage(rec.title),
        skills: this.extractSkillsFromRecommendation(rec),
        dueDate: rec.dueDate ? new Date(rec.dueDate) : undefined
      };

      stages.push(stage);
    }

    // Создаем этапы на основе слабых мест из анализа
    const criticalWeaknesses = analysis.weaknesses
      .filter(weakness => this.isCriticalSkill(weakness, profession))
      .slice(0, 3); // топ-3 критических навыка

    for (const weakness of criticalWeaknesses) {
      const stage: RoadmapStage = {
        id: `weakness_stage_${weakness}_${Date.now()}`,
        title: this.getRoadmapStageTitle(weakness, userLanguage),
        description: this.getRoadmapStageDescription(weakness, profession, userLanguage),
        status: 'not-started',
        priority: this.calculatePriority(weakness, analysis),
        estimatedHours: this.getEstimatedHoursForSkill(weakness),
        skills: [weakness],
        dueDate: this.calculateDueDate(weakness, analysis)
      };

      stages.push(stage);
    }

    return stages.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 📅 Создание событий для Calendar.tsx
   */
  private async createCalendarEvents(
    analysis: FeedbackAnalysis,
    recommendations: LearningRecommendation[],
    userId: string,
    userLanguage: string
  ): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];
    const now = new Date();

    // Создаем события для schedule рекомендаций
    const scheduleRecommendations = recommendations.filter(r => r.type === 'schedule');
    
    for (const rec of scheduleRecommendations) {
      const eventDate = rec.dueDate ? new Date(rec.dueDate) : this.getNextAvailableSlot(now);
      
      const event: CalendarEvent = {
        id: `event_${rec.title.replace(/\s+/g, '_')}_${Date.now()}`,
        title: rec.title,
        description: rec.description,
        type: 'study',
        date: eventDate,
        duration: rec.estimatedHours ? rec.estimatedHours * 60 : 120, // по умолчанию 2 часа
        relatedSkill: this.extractSkillFromRecommendation(rec),
        priority: rec.priority
      };

      events.push(event);
    }

    // Создаем регулярные учебные сессии для слабых мест
    const topWeaknesses = analysis.weaknesses.slice(0, 2); // топ-2 слабости
    
    for (let i = 0; i < topWeaknesses.length; i++) {
      const weakness = topWeaknesses[i];
      
      // Создаем несколько сессий для каждой слабости
      for (let session = 1; session <= 3; session++) {
        const sessionDate = new Date(now);
        sessionDate.setDate(now.getDate() + (i * 7) + (session * 2)); // раз в 2 дня

        const event: CalendarEvent = {
          id: `study_${weakness}_session_${session}_${Date.now()}`,
          title: this.getStudySessionTitle(weakness, session, userLanguage),
          description: this.getStudySessionDescription(weakness, session, userLanguage),
          type: 'study',
          date: sessionDate,
          duration: 90, // 1.5 часа
          relatedSkill: weakness,
          priority: this.calculatePriority(weakness, analysis)
        };

        events.push(event);
      }
    }

    // Планируем контрольные интервью
    if (analysis.overallReadiness < 7) {
      const followUpDate = new Date(now);
      followUpDate.setDate(now.getDate() + 14); // через 2 недели

      const followUpEvent: CalendarEvent = {
        id: `follow_up_interview_${Date.now()}`,
        title: this.getFollowUpInterviewTitle(userLanguage),
        description: this.getFollowUpInterviewDescription(analysis, userLanguage),
        type: 'interview',
        date: followUpDate,
        duration: 60,
        relatedSkill: 'overall',
        priority: 8
      };

      events.push(followUpEvent);
    }

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * 🏋️ Создание заданий для Trainer.tsx
   */
  private async createTrainingTasks(
    analysis: FeedbackAnalysis,
    recommendations: LearningRecommendation[],
    profession: string,
    userLanguage: string
  ): Promise<TrainingTask[]> {
    const tasks: TrainingTask[] = [];

    // Создаем задания для training рекомендаций
    const trainingRecommendations = recommendations.filter(r => r.type === 'training');
    
    for (const rec of trainingRecommendations) {
      const task: TrainingTask = {
        id: `task_${rec.title.replace(/\s+/g, '_')}_${Date.now()}`,
        title: rec.title,
        description: rec.description,
        difficulty: this.getDifficultyFromRecommendation(rec),
        type: this.getTaskTypeFromRecommendation(rec),
        skill: this.extractSkillFromRecommendation(rec),
        estimatedTime: rec.estimatedHours ? rec.estimatedHours * 60 : 60,
        examples: this.generateTaskExamples(rec, userLanguage),
        hints: this.generateTaskHints(rec, userLanguage)
      };

      tasks.push(task);
    }

    // Создаем практические задания для каждой слабости
    for (const weakness of analysis.weaknesses) {
      const taskCount = this.getTaskCountForSkill(weakness);
      
      for (let i = 1; i <= taskCount; i++) {
        const task: TrainingTask = {
          id: `practice_${weakness}_${i}_${Date.now()}`,
          title: this.getTaskTitle(weakness, i, userLanguage),
          description: this.getTaskDescription(weakness, profession, i, userLanguage),
          difficulty: this.getTaskDifficulty(weakness, analysis, i),
          type: this.getTaskTypeForSkill(weakness),
          skill: weakness,
          estimatedTime: this.getTaskDuration(weakness, i),
          examples: this.generateSkillTaskExamples(weakness, i, userLanguage),
          hints: this.generateSkillTaskHints(weakness, i, userLanguage)
        };

        tasks.push(task);
      }
    }

    return tasks.sort((a, b) => {
      // Сортируем по приоритету навыка и сложности
      const priorityA = this.getSkillPriority(a.skill, analysis);
      const priorityB = this.getSkillPriority(b.skill, analysis);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // При равном приоритете - сначала простые задания
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  }

  // =================
  // UTILITY МЕТОДЫ
  // =================

  private calculatePriority(skill: string, analysis: FeedbackAnalysis): number {
    // Приоритет основан на том, насколько критичен навык
    const criticalSkills = ['algorithms', 'system_design', 'data_structures'];
    const baseSkills = ['javascript', 'react', 'nodejs'];
    
    if (criticalSkills.includes(skill)) return 10;
    if (baseSkills.includes(skill)) return 8;
    
    // Учитываем общую оценку готовности
    return Math.max(1, 10 - analysis.overallReadiness);
  }

  private getMaterialTitle(skill: string, language: string): string {
    const titles = {
      ru: {
        algorithms: 'Алгоритмы и структуры данных',
        system_design: 'Проектирование систем',
        javascript: 'Продвинутый JavaScript',
        react: 'React - лучшие практики',
        nodejs: 'Node.js разработка',
        default: `Изучение ${skill}`
      },
      en: {
        algorithms: 'Algorithms and Data Structures',
        system_design: 'System Design Fundamentals',
        javascript: 'Advanced JavaScript',
        react: 'React Best Practices',
        nodejs: 'Node.js Development',
        default: `Learning ${skill}`
      }
    };
    
    const langTitles = titles[language as keyof typeof titles] || titles.ru;
    return langTitles[skill as keyof typeof langTitles] || langTitles.default;
  }

  private getMaterialDescription(skill: string, profession: string, language: string): string {
    const descriptions = {
      ru: {
        algorithms: `Комплексное изучение алгоритмов для ${profession}. Сортировки, поиск, динамическое программирование.`,
        system_design: `Принципы проектирования масштабируемых систем. Архитектурные паттерны для ${profession}.`,
        default: `Детальное изучение ${skill} с практическими примерами для ${profession}.`
      },
      en: {
        algorithms: `Comprehensive study of algorithms for ${profession}. Sorting, searching, dynamic programming.`,
        system_design: `Principles of scalable system design. Architectural patterns for ${profession}.`,
        default: `Detailed study of ${skill} with practical examples for ${profession}.`
      }
    };
    
    const langDescs = descriptions[language as keyof typeof descriptions] || descriptions.ru;
    return langDescs[skill as keyof typeof langDescs] || langDescs.default;
  }

  private getSkillCategory(skill: string): string {
    const categories: { [key: string]: string } = {
      algorithms: 'computer-science',
      system_design: 'architecture',
      javascript: 'programming',
      react: 'frameworks',
      nodejs: 'backend',
      communication: 'soft-skills'
    };
    
    return categories[skill] || 'general';
  }

  private getDifficultyForSkill(skill: string, analysis: FeedbackAnalysis): string {
    // Определяем сложность на основе текущего уровня пользователя
    const skillLevel = analysis.skillLevels.find(s => s.skill === skill);
    
    if (!skillLevel || skillLevel.level < 4) return 'easy';
    if (skillLevel.level < 7) return 'medium';
    return 'hard';
  }

  private getEstimatedReadTime(skill: string): number {
    // Время чтения в минутах
    const readTimes: { [key: string]: number } = {
      algorithms: 45,
      system_design: 60,
      javascript: 30,
      react: 25,
      nodejs: 35
    };
    
    return readTimes[skill] || 30;
  }

  private generateMaterialTags(skill: string, profession: string): string[] {
    const baseTags = [skill, profession, 'ai-generated', 'personalized'];
    
    const skillTags: { [key: string]: string[] } = {
      algorithms: ['computer-science', 'problem-solving', 'interview-prep'],
      system_design: ['architecture', 'scalability', 'distributed-systems'],
      javascript: ['programming', 'web-development', 'frontend'],
      react: ['frontend', 'components', 'state-management'],
      nodejs: ['backend', 'server-side', 'api-development']
    };
    
    return [...baseTags, ...(skillTags[skill] || [])];
  }

  private extractSkillFromRecommendation(rec: LearningRecommendation): string {
    // Извлекаем навык из заголовка или описания рекомендации
    const text = `${rec.title} ${rec.description}`.toLowerCase();
    
    const skills = ['algorithms', 'system_design', 'javascript', 'react', 'nodejs', 'python', 'java'];
    
    for (const skill of skills) {
      if (text.includes(skill.replace('_', ' ')) || text.includes(skill)) {
        return skill;
      }
    }
    
    return 'general';
  }

  private generateTagsFromRecommendation(rec: LearningRecommendation): string[] {
    const baseTag = rec.type;
    const skill = this.extractSkillFromRecommendation(rec);
    
    return [baseTag, skill, 'ai-recommendation', `priority-${rec.priority}`];
  }

  private isCriticalSkill(skill: string, profession: string): boolean {
    const criticalSkills: { [key: string]: string[] } = {
      frontend: ['javascript', 'react', 'css', 'algorithms'],
      backend: ['nodejs', 'databases', 'apis', 'system_design'],
      fullstack: ['javascript', 'react', 'nodejs', 'databases'],
      mobile: ['react_native', 'swift', 'kotlin', 'mobile_architecture']
    };
    
    const professionSkills = criticalSkills[profession] || criticalSkills.frontend;
    return professionSkills.includes(skill);
  }

  private getDefaultHoursForRoadmapStage(title: string): number {
    if (title.toLowerCase().includes('algorithm')) return 40;
    if (title.toLowerCase().includes('system')) return 60;
    if (title.toLowerCase().includes('project')) return 80;
    return 20;
  }

  private extractSkillsFromRecommendation(rec: LearningRecommendation): string[] {
    const skill = this.extractSkillFromRecommendation(rec);
    return [skill];
  }

  private getRoadmapStageTitle(weakness: string, language: string): string {
    const titles = {
      ru: {
        algorithms: 'Освоение алгоритмов',
        system_design: 'Изучение системного дизайна',
        javascript: 'Углубленное изучение JavaScript',
        default: `Развитие навыков ${weakness}`
      },
      en: {
        algorithms: 'Mastering Algorithms',
        system_design: 'Learning System Design',
        javascript: 'Advanced JavaScript Study',
        default: `Developing ${weakness} skills`
      }
    };
    
    const langTitles = titles[language as keyof typeof titles] || titles.ru;
    return langTitles[weakness as keyof typeof langTitles] || langTitles.default;
  }

  private getRoadmapStageDescription(weakness: string, profession: string, language: string): string {
    return `Комплексное изучение ${weakness} для роли ${profession}. Включает теорию, практику и реальные проекты.`;
  }

  private getEstimatedHoursForSkill(skill: string): number {
    const hours: { [key: string]: number } = {
      algorithms: 50,
      system_design: 40,
      javascript: 30,
      react: 25,
      nodejs: 35
    };
    
    return hours[skill] || 20;
  }

  private calculateDueDate(skill: string, analysis: FeedbackAnalysis): Date {
    const now = new Date();
    const urgencyDays = this.getUrgencyDays(skill, analysis);
    
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + urgencyDays);
    
    return dueDate;
  }

  private getUrgencyDays(skill: string, analysis: FeedbackAnalysis): number {
    if (analysis.overallReadiness < 5) return 7; // критично - неделя
    if (analysis.overallReadiness < 7) return 14; // важно - 2 недели
    return 30; // обычно - месяц
  }

  private getNextAvailableSlot(from: Date): Date {
    const slot = new Date(from);
    slot.setDate(from.getDate() + 1);
    slot.setHours(10, 0, 0, 0); // 10:00 утра
    return slot;
  }

  private getStudySessionTitle(weakness: string, session: number, language: string): string {
    return `Изучение ${weakness} - Сессия ${session}`;
  }

  private getStudySessionDescription(weakness: string, session: number, language: string): string {
    return `Учебная сессия ${session} по навыку ${weakness}. Теория и практические упражнения.`;
  }

  private getFollowUpInterviewTitle(language: string): string {
    return language === 'en' ? 'Follow-up Interview' : 'Контрольное собеседование';
  }

  private getFollowUpInterviewDescription(analysis: FeedbackAnalysis, language: string): string {
    return `Контрольное собеседование для проверки прогресса по ключевым навыкам: ${analysis.weaknesses.join(', ')}`;
  }

  private getDifficultyFromRecommendation(rec: LearningRecommendation): 'easy' | 'medium' | 'hard' {
    if (rec.priority >= 9) return 'hard';
    if (rec.priority >= 6) return 'medium';
    return 'easy';
  }

  private getTaskTypeFromRecommendation(rec: LearningRecommendation): 'coding' | 'theory' | 'practice' {
    const text = rec.description.toLowerCase();
    
    if (text.includes('код') || text.includes('programming') || text.includes('implement')) return 'coding';
    if (text.includes('практик') || text.includes('practice') || text.includes('exercise')) return 'practice';
    return 'theory';
  }

  private generateTaskExamples(rec: LearningRecommendation, language: string): string[] {
    // Генерируем примеры на основе рекомендации
    return [
      `Пример 1: ${rec.title}`,
      `Пример 2: Практическое применение ${rec.description.substring(0, 50)}...`
    ];
  }

  private generateTaskHints(rec: LearningRecommendation, language: string): string[] {
    return [
      'Начните с изучения основ',
      'Практикуйтесь регулярно',
      'Используйте реальные примеры'
    ];
  }

  private getTaskCountForSkill(skill: string): number {
    const counts: { [key: string]: number } = {
      algorithms: 3,
      system_design: 2,
      javascript: 2,
      react: 2,
      nodejs: 2
    };
    
    return counts[skill] || 1;
  }

  private getTaskTitle(skill: string, index: number, language: string): string {
    return `${skill} - Задание ${index}`;
  }

  private getTaskDescription(skill: string, profession: string, index: number, language: string): string {
    return `Практическое задание ${index} по навыку ${skill} для ${profession}`;
  }

  private getTaskDifficulty(skill: string, analysis: FeedbackAnalysis, index: number): 'easy' | 'medium' | 'hard' {
    // Постепенное увеличение сложности
    if (index === 1) return 'easy';
    if (index === 2) return 'medium';
    return 'hard';
  }

  private getTaskTypeForSkill(skill: string): 'coding' | 'theory' | 'practice' {
    const codingSkills = ['algorithms', 'javascript', 'react', 'nodejs', 'python'];
    
    if (codingSkills.includes(skill)) return 'coding';
    if (skill === 'system_design') return 'theory';
    return 'practice';
  }

  private getTaskDuration(skill: string, index: number): number {
    // Время в минутах
    const baseDuration = 60;
    const skillMultiplier: { [key: string]: number } = {
      algorithms: 1.5,
      system_design: 1.2,
      javascript: 1.0,
      react: 0.8,
      nodejs: 1.0
    };
    
    const multiplier = skillMultiplier[skill] || 1.0;
    return Math.round(baseDuration * multiplier * index);
  }

  private generateSkillTaskExamples(skill: string, index: number, language: string): string[] {
    const examples: { [key: string]: string[] } = {
      algorithms: [
        'Реализуйте алгоритм быстрой сортировки',
        'Найдите максимальный элемент в массиве',
        'Реализуйте поиск в глубину'
      ],
      javascript: [
        'Создайте функцию debounce',
        'Реализуйте Promise.all',
        'Создайте простой event emitter'
      ]
    };
    
    return examples[skill]?.slice(0, index) || [`Пример задания для ${skill}`];
  }

  private generateSkillTaskHints(skill: string, index: number, language: string): string[] {
    return [
      'Подумайте о крайних случаях',
      'Оптимизируйте по времени и памяти',
      'Протестируйте на различных входных данных'
    ];
  }

  private getSkillPriority(skill: string, analysis: FeedbackAnalysis): number {
    const foundSkill = analysis.skillLevels.find(s => s.skill === skill);
    if (!foundSkill) return 5;
    
    // Чем ниже уровень, тем выше приоритет
    return 10 - foundSkill.level;
  }

  /**
   * 🧹 Очистка ресурсов
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export default ApplicationDistributionService;
