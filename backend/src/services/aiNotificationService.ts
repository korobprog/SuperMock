import { PrismaClient } from '@prisma/client';
import { telegramService } from './telegramService';

// 🌍 Мультиязычные шаблоны для AI-уведомлений
const AI_NOTIFICATION_TEMPLATES = {
  ru: {
    learning_reminder: {
      title: (skill: string) => `💡 Время изучить ${skill}!`,
      message: (skill: string, profession: string) => `AI обнаружил пробел в навыке "${skill}" для ${profession}. Изучение займет ~30 минут и значительно улучшит ваши результаты.`,
      telegram: (skill: string, profession: string) => `🤖 *AI Ментор рекомендует:*

💡 Пора изучить *${skill}*!

На основе анализа ваших собеседований как *${profession}*, это ваша приоритетная область для развития.

⏱️ Время изучения: ~30 минут
📈 Ожидаемый прирост готовности: +15%`
    },
    progress_celebration: {
      title: (skill: string, improvement: number) => `🎉 Отличный прогресс в ${skill}!`,
      message: (skill: string, improvement: number, profession: string) => `Вы улучшили навык "${skill}" на ${improvement}%! Для ${profession} это критически важный прогресс. AI предлагает следующий уровень сложности.`,
      telegram: (skill: string, improvement: number, profession: string) => `🎉 *Отличная работа!*

🚀 Ваш навык *${skill}* вырос на *${improvement}%*

Для позиции *${profession}* это означает значительное улучшение конкурентоспособности. AI готов предложить следующий уровень!`
    },
    reinterview_suggestion: {
      title: (days: number) => `🎯 Пора проверить прогресс!`,
      message: (days: number, profession: string) => `Прошло ${days} дней с последнего собеседования. AI рекомендует контрольное интервью для ${profession} для измерения прогресса.`,
      telegram: (days: number, profession: string) => `🎯 *Время измерить прогресс!*

📅 Прошло *${days} дней* с последнего собеседования

AI рекомендует контрольное интервью по позиции *${profession}* для проверки улучшений и получения нового фидбека.`
    },
    study_reminder: {
      title: (materials: number) => `📚 У вас ${materials} новых материалов!`,
      message: (materials: number, profession: string) => `AI подготовил ${materials} персональных материалов для изучения. Специально подобраны для развития навыков ${profession}.`,
      telegram: (materials: number, profession: string) => `📚 *Новые материалы готовы!*

AI подготовил *${materials} персональных материалов* для вашего развития как *${profession}*.

🎯 Все материалы основаны на анализе ваших слабых мест и подобраны индивидуально.`
    }
  },
  en: {
    learning_reminder: {
      title: (skill: string) => `💡 Time to learn ${skill}!`,
      message: (skill: string, profession: string) => `AI detected a gap in "${skill}" for ${profession}. Studying will take ~30 minutes and significantly improve your results.`,
      telegram: (skill: string, profession: string) => `🤖 *AI Mentor recommends:*

💡 Time to study *${skill}*!

Based on analysis of your interviews as *${profession}*, this is your priority development area.

⏱️ Study time: ~30 minutes
📈 Expected readiness increase: +15%`
    },
    progress_celebration: {
      title: (skill: string, improvement: number) => `🎉 Great progress in ${skill}!`,
      message: (skill: string, improvement: number, profession: string) => `You improved "${skill}" by ${improvement}%! For ${profession} this is critically important progress. AI suggests next level of complexity.`,
      telegram: (skill: string, improvement: number, profession: string) => `🎉 *Excellent work!*

🚀 Your *${skill}* skill grew by *${improvement}%*

For *${profession}* position this means significant improvement in competitiveness. AI is ready to suggest next level!`
    },
    reinterview_suggestion: {
      title: (days: number) => `🎯 Time to check progress!`,
      message: (days: number, profession: string) => `${days} days have passed since last interview. AI recommends control interview for ${profession} to measure progress.`,
      telegram: (days: number, profession: string) => `🎯 *Time to measure progress!*

📅 *${days} days* have passed since last interview

AI recommends control interview for *${profession}* position to check improvements and get new feedback.`
    },
    study_reminder: {
      title: (materials: number) => `📚 You have ${materials} new materials!`,
      message: (materials: number, profession: string) => `AI prepared ${materials} personal materials for study. Specially selected for developing ${profession} skills.`,
      telegram: (materials: number, profession: string) => `📚 *New materials ready!*

AI prepared *${materials} personal materials* for your development as *${profession}*.

🎯 All materials based on analysis of your weak points and selected individually.`
    }
  },
  es: {
    learning_reminder: {
      title: (skill: string) => `💡 ¡Hora de aprender ${skill}!`,
      message: (skill: string, profession: string) => `IA detectó una brecha en "${skill}" para ${profession}. Estudiar tomará ~30 minutos y mejorará significativamente tus resultados.`,
      telegram: (skill: string, profession: string) => `🤖 *IA Mentor recomienda:*

💡 ¡Hora de estudiar *${skill}*!

Basado en el análisis de tus entrevistas como *${profession}*, esta es tu área prioritaria de desarrollo.

⏱️ Tiempo de estudio: ~30 minutos
📈 Aumento esperado de preparación: +15%`
    },
    progress_celebration: {
      title: (skill: string, improvement: number) => `🎉 ¡Excelente progreso en ${skill}!`,
      message: (skill: string, improvement: number, profession: string) => `¡Mejoraste "${skill}" en ${improvement}%! Para ${profession} este es un progreso críticamente importante. IA sugiere el siguiente nivel de complejidad.`,
      telegram: (skill: string, improvement: number, profession: string) => `🎉 *¡Excelente trabajo!*

🚀 Tu habilidad *${skill}* creció en *${improvement}%*

Para la posición *${profession}* esto significa una mejora significativa en competitividad. ¡IA está lista para sugerir el siguiente nivel!`
    },
    reinterview_suggestion: {
      title: (days: number) => `🎯 ¡Hora de verificar el progreso!`,
      message: (days: number, profession: string) => `Han pasado ${days} días desde la última entrevista. IA recomienda entrevista de control para ${profession} para medir el progreso.`,
      telegram: (days: number, profession: string) => `🎯 *¡Hora de medir el progreso!*

📅 Han pasado *${days} días* desde la última entrevista

IA recomienda entrevista de control para la posición *${profession}* para verificar mejoras y obtener nuevos comentarios.`
    },
    study_reminder: {
      title: (materials: number) => `📚 ¡Tienes ${materials} materiales nuevos!`,
      message: (materials: number, profession: string) => `IA preparó ${materials} materiales personales para estudiar. Especialmente seleccionados para desarrollar habilidades de ${profession}.`,
      telegram: (materials: number, profession: string) => `📚 *¡Nuevos materiales listos!*

IA preparó *${materials} materiales personales* para tu desarrollo como *${profession}*.

🎯 Todos los materiales basados en análisis de tus puntos débiles y seleccionados individualmente.`
    }
  },
  de: {
    learning_reminder: {
      title: (skill: string) => `💡 Zeit, ${skill} zu lernen!`,
      message: (skill: string, profession: string) => `KI entdeckte eine Lücke in "${skill}" für ${profession}. Das Studium dauert ~30 Minuten und verbessert Ihre Ergebnisse erheblich.`,
      telegram: (skill: string, profession: string) => `🤖 *KI-Mentor empfiehlt:*

💡 Zeit, *${skill}* zu studieren!

Basierend auf der Analyse Ihrer Interviews als *${profession}* ist dies Ihr prioritärer Entwicklungsbereich.

⏱️ Studienzeit: ~30 Minuten
📈 Erwartete Bereitschaftssteigerung: +15%`
    },
    progress_celebration: {
      title: (skill: string, improvement: number) => `🎉 Großartiger Fortschritt in ${skill}!`,
      message: (skill: string, improvement: number, profession: string) => `Sie haben "${skill}" um ${improvement}% verbessert! Für ${profession} ist dies ein kritisch wichtiger Fortschritt. KI schlägt die nächste Komplexitätsstufe vor.`,
      telegram: (skill: string, improvement: number, profession: string) => `🎉 *Ausgezeichnete Arbeit!*

🚀 Ihre *${skill}*-Fähigkeit ist um *${improvement}%* gewachsen

Für die Position *${profession}* bedeutet dies eine erhebliche Verbesserung der Wettbewerbsfähigkeit. KI ist bereit, die nächste Stufe vorzuschlagen!`
    },
    reinterview_suggestion: {
      title: (days: number) => `🎯 Zeit, den Fortschritt zu überprüfen!`,
      message: (days: number, profession: string) => `${days} Tage sind seit dem letzten Interview vergangen. KI empfiehlt Kontrollinterview für ${profession} zur Fortschrittsmessung.`,
      telegram: (days: number, profession: string) => `🎯 *Zeit, den Fortschritt zu messen!*

📅 *${days} Tage* sind seit dem letzten Interview vergangen

KI empfiehlt Kontrollinterview für die Position *${profession}* zur Überprüfung von Verbesserungen und neuem Feedback.`
    },
    study_reminder: {
      title: (materials: number) => `📚 Sie haben ${materials} neue Materialien!`,
      message: (materials: number, profession: string) => `KI hat ${materials} persönliche Materialien zum Studium vorbereitet. Speziell ausgewählt zur Entwicklung von ${profession}-Fähigkeiten.`,
      telegram: (materials: number, profession: string) => `📚 *Neue Materialien bereit!*

KI hat *${materials} persönliche Materialien* für Ihre Entwicklung als *${profession}* vorbereitet.

🎯 Alle Materialien basieren auf der Analyse Ihrer Schwachstellen und sind individuell ausgewählt.`
    }
  },
  fr: {
    learning_reminder: {
      title: (skill: string) => `💡 Il est temps d'apprendre ${skill}!`,
      message: (skill: string, profession: string) => `L'IA a détecté un écart dans "${skill}" pour ${profession}. L'étude prendra ~30 minutes et améliorera considérablement vos résultats.`,
      telegram: (skill: string, profession: string) => `🤖 *Le Mentor IA recommande:*

💡 Il est temps d'étudier *${skill}*!

Basé sur l'analyse de vos entretiens en tant que *${profession}*, c'est votre domaine de développement prioritaire.

⏱️ Temps d'étude: ~30 minutes
📈 Augmentation de préparation attendue: +15%`
    },
    progress_celebration: {
      title: (skill: string, improvement: number) => `🎉 Excellent progrès en ${skill}!`,
      message: (skill: string, improvement: number, profession: string) => `Vous avez amélioré "${skill}" de ${improvement}%! Pour ${profession} c'est un progrès critiquement important. L'IA suggère le niveau de complexité suivant.`,
      telegram: (skill: string, improvement: number, profession: string) => `🎉 *Excellent travail!*

🚀 Votre compétence *${skill}* a augmenté de *${improvement}%*

Pour le poste *${profession}* cela signifie une amélioration significative de la compétitivité. L'IA est prête à suggérer le niveau suivant!`
    },
    reinterview_suggestion: {
      title: (days: number) => `🎯 Il est temps de vérifier les progrès!`,
      message: (days: number, profession: string) => `${days} jours se sont écoulés depuis le dernier entretien. L'IA recommande un entretien de contrôle pour ${profession} pour mesurer les progrès.`,
      telegram: (days: number, profession: string) => `🎯 *Il est temps de mesurer les progrès!*

📅 *${days} jours* se sont écoulés depuis le dernier entretien

L'IA recommande un entretien de contrôle pour le poste *${profession}* pour vérifier les améliorations et obtenir de nouveaux commentaires.`
    },
    study_reminder: {
      title: (materials: number) => `📚 Vous avez ${materials} nouveaux matériaux!`,
      message: (materials: number, profession: string) => `L'IA a préparé ${materials} matériaux personnels à étudier. Spécialement sélectionnés pour développer les compétences de ${profession}.`,
      telegram: (materials: number, profession: string) => `📚 *Nouveaux matériaux prêts!*

L'IA a préparé *${materials} matériaux personnels* pour votre développement en tant que *${profession}*.

🎯 Tous les matériaux basés sur l'analyse de vos points faibles et sélectionnés individuellement.`
    }
  },
  zh: {
    learning_reminder: {
      title: (skill: string) => `💡 该学习${skill}了！`,
      message: (skill: string, profession: string) => `AI在${profession}的"${skill}"技能中发现了差距。学习大约需要30分钟，将显著改善您的结果。`,
      telegram: (skill: string, profession: string) => `🤖 *AI导师建议：*

💡 该学习*${skill}*了！

基于对您作为*${profession}*面试的分析，这是您的优先发展领域。

⏱️ 学习时间：约30分钟
📈 预期准备度提升：+15%`
    },
    progress_celebration: {
      title: (skill: string, improvement: number) => `🎉 ${skill}进步很大！`,
      message: (skill: string, improvement: number, profession: string) => `您的"${skill}"技能提升了${improvement}%！对于${profession}来说，这是一个关键的重要进步。AI建议下一个复杂度级别。`,
      telegram: (skill: string, improvement: number, profession: string) => `🎉 *出色的工作！*

🚀 您的*${skill}*技能提升了*${improvement}%*

对于*${profession}*职位，这意味着竞争力的显著提升。AI准备建议下一个级别！`
    },
    reinterview_suggestion: {
      title: (days: number) => `🎯 该检查进度了！`,
      message: (days: number, profession: string) => `距离上次面试已经过去了${days}天。AI建议进行${profession}的控制面试来衡量进度。`,
      telegram: (days: number, profession: string) => `🎯 *该衡量进度了！*

📅 距离上次面试已经过去了*${days}天*

AI建议进行*${profession}*职位的控制面试，以检查改进并获得新的反馈。`
    },
    study_reminder: {
      title: (materials: number) => `📚 您有${materials}个新材料！`,
      message: (materials: number, profession: string) => `AI准备了${materials}个个人学习材料。专门为开发${profession}技能而选择。`,
      telegram: (materials: number, profession: string) => `📚 *新材料准备好了！*

AI为您作为*${profession}*的发展准备了*${materials}个个人材料*。

🎯 所有材料都基于对您弱点的分析，并个别选择。`
    }
  }
};

// 🎯 Профессиональные настройки для уведомлений
const PROFESSION_SETTINGS = {
  'frontend': {
    priority_skills: ['javascript', 'react', 'css', 'html', 'typescript'],
    study_frequency_days: 3, // как часто напоминать об учебе
    reinterview_interval_days: 7 // как часто предлагать повторные интервью
  },
  'backend': {
    priority_skills: ['nodejs', 'python', 'databases', 'apis', 'algorithms'],
    study_frequency_days: 4,
    reinterview_interval_days: 10
  },
  'fullstack': {
    priority_skills: ['javascript', 'react', 'nodejs', 'databases', 'system_design'],
    study_frequency_days: 2,
    reinterview_interval_days: 5
  },
  'mobile': {
    priority_skills: ['react_native', 'swift', 'kotlin', 'mobile_design', 'performance'],
    study_frequency_days: 4,
    reinterview_interval_days: 8
  },
  'devops': {
    priority_skills: ['docker', 'kubernetes', 'aws', 'ci_cd', 'monitoring'],
    study_frequency_days: 5,
    reinterview_interval_days: 12
  },
  'qa': {
    priority_skills: ['testing', 'automation', 'selenium', 'api_testing', 'bug_tracking'],
    study_frequency_days: 3,
    reinterview_interval_days: 7
  },
  'designer': {
    priority_skills: ['ui_ux', 'figma', 'prototyping', 'user_research', 'design_systems'],
    study_frequency_days: 4,
    reinterview_interval_days: 10
  },
  'analyst': {
    priority_skills: ['sql', 'python', 'analytics', 'visualization', 'statistics'],
    study_frequency_days: 3,
    reinterview_interval_days: 9
  },
  'scientist': {
    priority_skills: ['python', 'machine_learning', 'statistics', 'deep_learning', 'research'],
    study_frequency_days: 5,
    reinterview_interval_days: 14
  },
  'pm': {
    priority_skills: ['strategy', 'agile', 'analytics', 'communication', 'roadmap'],
    study_frequency_days: 4,
    reinterview_interval_days: 10
  }
};

/**
 * 🤖 AI Notification Service - Умные уведомления с учетом языка и профессии
 * 
 * Возможности:
 * - Мультиязычные уведомления (6 языков)
 * - Профессиональная персонализация
 * - Умные напоминания на основе AI анализа
 * - Интеграция с Telegram и Web уведомлениями
 */
export class AINotificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 💡 Отправка персонализированного напоминания об изучении
   */
  async sendLearningReminder(
    userId: string, 
    skill: string, 
    userLanguage: string = 'ru', 
    profession: string = 'frontend'
  ): Promise<void> {
    try {
      console.log(`🤖 Sending learning reminder to ${userId} for skill: ${skill}`);
      
      const templates = AI_NOTIFICATION_TEMPLATES[userLanguage as keyof typeof AI_NOTIFICATION_TEMPLATES] 
        || AI_NOTIFICATION_TEMPLATES.ru;
      
      const professionName = this.getProfessionName(profession, userLanguage);
      
      // Создаем уведомление в БД
      await this.createNotification({
        userId,
        type: 'ai_learning_reminder',
        title: templates.learning_reminder.title(skill),
        message: templates.learning_reminder.message(skill, professionName),
        actionData: JSON.stringify({ 
          skill, 
          profession, 
          action: 'study',
          url: `/materials?skill=${skill}`
        }),
        priority: 2
      });

      // Отправляем Telegram уведомление
      await telegramService.sendMessage(
        userId,
        templates.learning_reminder.telegram(skill, professionName),
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{
              text: this.getActionButtonText('study', userLanguage),
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/materials?skill=${skill}`
            }]]
          }
        }
      );

      console.log(`✅ Learning reminder sent successfully to ${userId}`);
    } catch (error) {
      console.error('Error sending learning reminder:', error);
    }
  }

  /**
   * 🎉 Отправка уведомления о прогрессе
   */
  async sendProgressCelebration(
    userId: string,
    skill: string,
    improvement: number,
    userLanguage: string = 'ru',
    profession: string = 'frontend'
  ): Promise<void> {
    try {
      console.log(`🎉 Sending progress celebration to ${userId}: ${skill} +${improvement}%`);
      
      const templates = AI_NOTIFICATION_TEMPLATES[userLanguage as keyof typeof AI_NOTIFICATION_TEMPLATES] 
        || AI_NOTIFICATION_TEMPLATES.ru;
      
      const professionName = this.getProfessionName(profession, userLanguage);
      const improvementPercent = Math.round(improvement);
      
      await this.createNotification({
        userId,
        type: 'ai_progress_celebration',
        title: templates.progress_celebration.title(skill, improvementPercent),
        message: templates.progress_celebration.message(skill, improvementPercent, professionName),
        actionData: JSON.stringify({ 
          skill, 
          improvement: improvementPercent, 
          profession,
          action: 'continue_learning',
          url: `/roadmap?skill=${skill}`
        }),
        priority: 1
      });

      await telegramService.sendMessage(
        userId,
        templates.progress_celebration.telegram(skill, improvementPercent, professionName),
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{
              text: this.getActionButtonText('continue', userLanguage),
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/roadmap?skill=${skill}`
            }]]
          }
        }
      );

      console.log(`✅ Progress celebration sent successfully to ${userId}`);
    } catch (error) {
      console.error('Error sending progress celebration:', error);
    }
  }

  /**
   * 🎯 Отправка предложения о повторном интервью
   */
  async sendReinterviewSuggestion(
    userId: string,
    daysSinceLastInterview: number,
    userLanguage: string = 'ru',
    profession: string = 'frontend'
  ): Promise<void> {
    try {
      const professionSettings = PROFESSION_SETTINGS[profession as keyof typeof PROFESSION_SETTINGS] 
        || PROFESSION_SETTINGS.frontend;
      
      // Проверяем, нужно ли отправлять напоминание
      if (daysSinceLastInterview < professionSettings.reinterview_interval_days) {
        return;
      }

      console.log(`🎯 Sending reinterview suggestion to ${userId}: ${daysSinceLastInterview} days`);
      
      const templates = AI_NOTIFICATION_TEMPLATES[userLanguage as keyof typeof AI_NOTIFICATION_TEMPLATES] 
        || AI_NOTIFICATION_TEMPLATES.ru;
      
      const professionName = this.getProfessionName(profession, userLanguage);
      
      await this.createNotification({
        userId,
        type: 'ai_reinterview_suggestion',
        title: templates.reinterview_suggestion.title(daysSinceLastInterview),
        message: templates.reinterview_suggestion.message(daysSinceLastInterview, professionName),
        actionData: JSON.stringify({ 
          days: daysSinceLastInterview,
          profession,
          action: 'book_interview',
          url: '/time'
        }),
        priority: 1
      });

      await telegramService.sendMessage(
        userId,
        templates.reinterview_suggestion.telegram(daysSinceLastInterview, professionName),
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{
              text: this.getActionButtonText('book_interview', userLanguage),
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/time`
            }]]
          }
        }
      );

      console.log(`✅ Reinterview suggestion sent successfully to ${userId}`);
    } catch (error) {
      console.error('Error sending reinterview suggestion:', error);
    }
  }

  /**
   * 📚 Отправка напоминания о новых материалах
   */
  async sendStudyReminder(
    userId: string,
    materialsCount: number,
    userLanguage: string = 'ru',
    profession: string = 'frontend'
  ): Promise<void> {
    try {
      console.log(`📚 Sending study reminder to ${userId}: ${materialsCount} materials`);
      
      const templates = AI_NOTIFICATION_TEMPLATES[userLanguage as keyof typeof AI_NOTIFICATION_TEMPLATES] 
        || AI_NOTIFICATION_TEMPLATES.ru;
      
      const professionName = this.getProfessionName(profession, userLanguage);
      
      await this.createNotification({
        userId,
        type: 'ai_study_reminder',
        title: templates.study_reminder.title(materialsCount),
        message: templates.study_reminder.message(materialsCount, professionName),
        actionData: JSON.stringify({ 
          materials: materialsCount,
          profession,
          action: 'view_materials',
          url: '/materials'
        }),
        priority: 1
      });

      await telegramService.sendMessage(
        userId,
        templates.study_reminder.telegram(materialsCount, professionName),
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{
              text: this.getActionButtonText('view_materials', userLanguage),
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/materials`
            }]]
          }
        }
      );

      console.log(`✅ Study reminder sent successfully to ${userId}`);
    } catch (error) {
      console.error('Error sending study reminder:', error);
    }
  }

  /**
   * 📊 Автоматическая отправка уведомлений на основе AI анализа
   */
  async processAIAnalysisNotifications(
    userId: string,
    analysis: any,
    userLanguage: string = 'ru',
    profession: string = 'frontend'
  ): Promise<void> {
    try {
      console.log(`🤖 Processing AI analysis notifications for ${userId}`);

      // 1. Уведомления о слабых местах (с задержкой 2 часа)
      if (analysis.weaknesses && analysis.weaknesses.length > 0) {
        const primaryWeakness = analysis.weaknesses[0];
        
        setTimeout(async () => {
          await this.sendLearningReminder(userId, primaryWeakness, userLanguage, profession);
        }, 2 * 60 * 60 * 1000); // 2 часа задержка
      }

      // 2. Уведомления о прогрессе (если есть улучшения)
      if (analysis.skillLevels && analysis.skillLevels.length > 0) {
        for (const skillLevel of analysis.skillLevels) {
          if (skillLevel.level >= 7) { // Хороший уровень навыка
            setTimeout(async () => {
              await this.sendProgressCelebration(
                userId, 
                skillLevel.skill, 
                15, // Примерное улучшение
                userLanguage, 
                profession
              );
            }, 4 * 60 * 60 * 1000); // 4 часа задержка
          }
        }
      }

      // 3. Уведомления о новых материалах (через день)
      setTimeout(async () => {
        await this.sendStudyReminder(userId, 3, userLanguage, profession);
      }, 24 * 60 * 60 * 1000); // 1 день задержка

      console.log(`✅ AI analysis notifications scheduled for ${userId}`);
    } catch (error) {
      console.error('Error processing AI analysis notifications:', error);
    }
  }

  /**
   * 🛠️ Создание уведомления в БД
   */
  private async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    actionData?: string;
    priority: number;
  }) {
    try {
      await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          status: 'active',
          priority: data.priority,
          actionData: data.actionData || null
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * 🌍 Получение названия профессии на нужном языке
   */
  private getProfessionName(profession: string, userLanguage: string): string {
    const professionNames = {
      ru: {
        frontend: 'Frontend разработчика',
        backend: 'Backend разработчика', 
        fullstack: 'Fullstack разработчика',
        mobile: 'Mobile разработчика',
        devops: 'DevOps инженера',
        qa: 'QA инженера',
        designer: 'UI/UX дизайнера',
        analyst: 'Аналитика данных',
        scientist: 'Data Scientist',
        pm: 'Product Manager'
      },
      en: {
        frontend: 'Frontend Developer',
        backend: 'Backend Developer',
        fullstack: 'Fullstack Developer', 
        mobile: 'Mobile Developer',
        devops: 'DevOps Engineer',
        qa: 'QA Engineer',
        designer: 'UI/UX Designer',
        analyst: 'Data Analyst',
        scientist: 'Data Scientist',
        pm: 'Product Manager'
      },
      es: {
        frontend: 'Desarrollador Frontend',
        backend: 'Desarrollador Backend',
        fullstack: 'Desarrollador Fullstack',
        mobile: 'Desarrollador Mobile',
        devops: 'Ingeniero DevOps',
        qa: 'Ingeniero QA',
        designer: 'Diseñador UI/UX',
        analyst: 'Analista de Datos',
        scientist: 'Científico de Datos',
        pm: 'Product Manager'
      },
      de: {
        frontend: 'Frontend-Entwickler',
        backend: 'Backend-Entwickler',
        fullstack: 'Fullstack-Entwickler',
        mobile: 'Mobile-Entwickler',
        devops: 'DevOps-Ingenieur',
        qa: 'QA-Ingenieur',
        designer: 'UI/UX-Designer',
        analyst: 'Datenanalyst',
        scientist: 'Data Scientist',
        pm: 'Product Manager'
      },
      fr: {
        frontend: 'Développeur Frontend',
        backend: 'Développeur Backend',
        fullstack: 'Développeur Fullstack',
        mobile: 'Développeur Mobile',
        devops: 'Ingénieur DevOps',
        qa: 'Ingénieur QA',
        designer: 'Designer UI/UX',
        analyst: 'Analyste de Données',
        scientist: 'Data Scientist',
        pm: 'Product Manager'
      },
      zh: {
        frontend: '前端开发工程师',
        backend: '后端开发工程师',
        fullstack: '全栈开发工程师',
        mobile: '移动开发工程师',
        devops: 'DevOps工程师',
        qa: 'QA工程师',
        designer: 'UI/UX设计师',
        analyst: '数据分析师',
        scientist: '数据科学家',
        pm: '产品经理'
      }
    };

    const langNames = professionNames[userLanguage as keyof typeof professionNames] || professionNames.ru;
    return langNames[profession as keyof typeof langNames] || profession;
  }

  /**
   * 🔘 Получение текста для кнопок действий
   */
  private getActionButtonText(action: string, userLanguage: string): string {
    const buttonTexts = {
      ru: {
        study: '📖 Изучить сейчас',
        continue: '🚀 Продолжить развитие',
        book_interview: '🎯 Записаться на интервью',
        view_materials: '📚 Посмотреть материалы'
      },
      en: {
        study: '📖 Study now',
        continue: '🚀 Continue development',
        book_interview: '🎯 Book interview',
        view_materials: '📚 View materials'
      },
      es: {
        study: '📖 Estudiar ahora',
        continue: '🚀 Continuar desarrollo',
        book_interview: '🎯 Reservar entrevista',
        view_materials: '📚 Ver materiales'
      },
      de: {
        study: '📖 Jetzt studieren',
        continue: '🚀 Entwicklung fortsetzen',
        book_interview: '🎯 Interview buchen',
        view_materials: '📚 Materialien ansehen'
      },
      fr: {
        study: '📖 Étudier maintenant',
        continue: '🚀 Continuer le développement',
        book_interview: '🎯 Réserver entretien',
        view_materials: '📚 Voir matériaux'
      },
      zh: {
        study: '📖 立即学习',
        continue: '🚀 继续发展',
        book_interview: '🎯 预约面试',
        view_materials: '📚 查看材料'
      }
    };

    const langTexts = buttonTexts[userLanguage as keyof typeof buttonTexts] || buttonTexts.ru;
    return langTexts[action as keyof typeof langTexts] || langTexts.study;
  }

  /**
   * 🔌 Закрытие соединения с БД
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Singleton instance
export const aiNotificationService = new AINotificationService();
