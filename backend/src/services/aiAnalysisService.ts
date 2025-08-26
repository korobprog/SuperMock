import { PrismaClient } from '@prisma/client';

// 🌍 ТИПЫ ДЛЯ AI АНАЛИЗА
export interface SkillLevel {
  skill: string;
  level: number; // 1-10
  confidence: number; // 0-1 - уверенность AI в оценке
}

export interface FeedbackAnalysis {
  weaknesses: string[]; // ["algorithms", "system_design", "communication"]
  strengths: string[]; // ["javascript", "react", "teamwork"]  
  skillLevels: SkillLevel[]; // [{"skill": "react", "level": 7, "confidence": 0.9}]
  communicationScore: number; // 1-10
  technicalScore: number; // 1-10
  overallReadiness: number; // 1-10 готовность к работе
  suggestions: string[]; // конкретные рекомендации
  uniquenessScore: number; // 0-1 насколько уникальны проблемы
  summary: string; // краткое резюме в 1-2 предложениях
}

export interface LearningRecommendation {
  type: 'material' | 'roadmap' | 'training' | 'schedule';
  priority: number; // 1-10
  title: string;
  description: string;
  estimatedHours?: number;
  dueDate?: string;
}

interface OpenRouterRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 🌍 МУЛЬТИЯЗЫЧНЫЕ ПРОМПТЫ ДЛЯ AI АНАЛИЗА
const ANALYSIS_PROMPTS = {
  ru: {
    system: `Ты эксперт-аналитик по техническим собеседованиям и карьерному развитию в IT.
Анализируй фидбек с собеседований и выдавай структурированный анализ в JSON формате.

ВАЖНО: Отвечай ТОЛЬКО валидным JSON без дополнительного текста!

Твоя задача:
1. Выделить слабые места (weaknesses) - области для развития
2. Выделить сильные стороны (strengths) - что хорошо получается  
3. Оценить навыки (skillLevels) по шкале 1-10 с уверенностью 0-1
4. Дать оценки: communicationScore, technicalScore, overallReadiness (1-10)
5. Предложить конкретные рекомендации (suggestions)
6. Оценить уникальность проблем (uniquenessScore 0-1)
7. Написать краткое резюме (summary)

Формат ответа:
{
  "weaknesses": ["алгоритмы", "системное проектирование"],
  "strengths": ["javascript", "коммуникация"], 
  "skillLevels": [{"skill": "react", "level": 7, "confidence": 0.9}],
  "communicationScore": 8,
  "technicalScore": 6,
  "overallReadiness": 7,
  "suggestions": ["Изучить алгоритмы сортировки", "Практика системного дизайна"],
  "uniquenessScore": 0.8,
  "summary": "Хорошие навыки фронтенда, нужно подтянуть алгоритмы"
}`,
    user: `Проанализируй фидбек с технического собеседования для позиции "{profession}":

"{comments}"

Верни анализ в JSON формате согласно инструкции.`
  },
  
  en: {
    system: `You are an expert analyst in technical interviews and career development in IT.
Analyze interview feedback and provide structured analysis in JSON format.

IMPORTANT: Respond with ONLY valid JSON without additional text!

Your task:
1. Identify weaknesses - areas for development
2. Identify strengths - what works well
3. Assess skills (skillLevels) on a 1-10 scale with confidence 0-1
4. Give scores: communicationScore, technicalScore, overallReadiness (1-10)
5. Suggest specific recommendations (suggestions)
6. Assess uniqueness of problems (uniquenessScore 0-1)
7. Write brief summary

Response format:
{
  "weaknesses": ["algorithms", "system design"],
  "strengths": ["javascript", "communication"], 
  "skillLevels": [{"skill": "react", "level": 7, "confidence": 0.9}],
  "communicationScore": 8,
  "technicalScore": 6,
  "overallReadiness": 7,
  "suggestions": ["Study sorting algorithms", "Practice system design"],
  "uniquenessScore": 0.8,
  "summary": "Good frontend skills, need to improve algorithms"
}`,
    user: `Analyze feedback from technical interview for "{profession}" position:

"{comments}"

Return analysis in JSON format according to instructions.`
  },

  es: {
    system: `Eres un analista experto en entrevistas técnicas y desarrollo profesional en IT.
Analiza comentarios de entrevistas y proporciona análisis estructurado en formato JSON.

IMPORTANTE: ¡Responde SOLO con JSON válido sin texto adicional!

Tu tarea:
1. Identificar debilidades - áreas para desarrollo
2. Identificar fortalezas - lo que funciona bien
3. Evaluar habilidades (skillLevels) en escala 1-10 con confianza 0-1
4. Dar puntuaciones: communicationScore, technicalScore, overallReadiness (1-10)
5. Sugerir recomendaciones específicas (suggestions)
6. Evaluar singularidad de problemas (uniquenessScore 0-1)
7. Escribir resumen breve

Formato de respuesta:
{
  "weaknesses": ["algoritmos", "diseño de sistemas"],
  "strengths": ["javascript", "comunicación"], 
  "skillLevels": [{"skill": "react", "level": 7, "confidence": 0.9}],
  "communicationScore": 8,
  "technicalScore": 6,
  "overallReadiness": 7,
  "suggestions": ["Estudiar algoritmos de ordenación", "Practicar diseño de sistemas"],
  "uniquenessScore": 0.8,
  "summary": "Buenas habilidades de frontend, necesita mejorar algoritmos"
}`,
    user: `Analiza comentarios de entrevista técnica para posición "{profession}":

"{comments}"

Devuelve análisis en formato JSON según instrucciones.`
  },

  de: {
    system: `Du bist ein Experte für technische Interviews und Karriereentwicklung in der IT.
Analysiere Interview-Feedback und liefere strukturierte Analyse im JSON-Format.

WICHTIG: Antworte NUR mit gültigem JSON ohne zusätzlichen Text!

Deine Aufgabe:
1. Schwächen identifizieren - Entwicklungsbereiche
2. Stärken identifizieren - was gut funktioniert
3. Fähigkeiten bewerten (skillLevels) auf Skala 1-10 mit Vertrauen 0-1
4. Bewertungen geben: communicationScore, technicalScore, overallReadiness (1-10)
5. Spezifische Empfehlungen vorschlagen (suggestions)
6. Einzigartigkeit der Probleme bewerten (uniquenessScore 0-1)
7. Kurze Zusammenfassung schreiben

Antwortformat:
{
  "weaknesses": ["algorithmen", "systemdesign"],
  "strengths": ["javascript", "kommunikation"], 
  "skillLevels": [{"skill": "react", "level": 7, "confidence": 0.9}],
  "communicationScore": 8,
  "technicalScore": 6,
  "overallReadiness": 7,
  "suggestions": ["Sortieralgorithmen studieren", "Systemdesign üben"],
  "uniquenessScore": 0.8,
  "summary": "Gute Frontend-Fähigkeiten, Algorithmen verbessern"
}`,
    user: `Analysiere Feedback aus technischem Interview für Position "{profession}":

"{comments}"

Gib Analyse im JSON-Format zurück gemäß Anweisungen.`
  },

  fr: {
    system: `Tu es un expert analyste en entretiens techniques et développement de carrière en IT.
Analyse les commentaires d'entretien et fournis une analyse structurée au format JSON.

IMPORTANT: Réponds SEULEMENT avec du JSON valide sans texte supplémentaire!

Ta tâche:
1. Identifier les faiblesses - domaines à développer
2. Identifier les forces - ce qui fonctionne bien
3. Évaluer les compétences (skillLevels) sur échelle 1-10 avec confiance 0-1
4. Donner des scores: communicationScore, technicalScore, overallReadiness (1-10)
5. Suggérer des recommandations spécifiques (suggestions)
6. Évaluer l'unicité des problèmes (uniquenessScore 0-1)
7. Écrire un résumé bref

Format de réponse:
{
  "weaknesses": ["algorithmes", "conception système"],
  "strengths": ["javascript", "communication"], 
  "skillLevels": [{"skill": "react", "level": 7, "confidence": 0.9}],
  "communicationScore": 8,
  "technicalScore": 6,
  "overallReadiness": 7,
  "suggestions": ["Étudier algorithmes de tri", "Pratiquer conception système"],
  "uniquenessScore": 0.8,
  "summary": "Bonnes compétences frontend, améliorer algorithmes"
}`,
    user: `Analyse les commentaires d'entretien technique pour poste "{profession}":

"{comments}"

Retourne l'analyse au format JSON selon les instructions.`
  },

  zh: {
    system: `你是技术面试和IT职业发展的专家分析师。
分析面试反馈并提供JSON格式的结构化分析。

重要：只回复有效的JSON，不要额外文本！

你的任务：
1. 识别弱点 - 需要发展的领域
2. 识别优势 - 做得好的方面
3. 评估技能 (skillLevels) 1-10分制，置信度0-1
4. 给出评分：communicationScore, technicalScore, overallReadiness (1-10)
5. 提出具体建议 (suggestions)
6. 评估问题独特性 (uniquenessScore 0-1)
7. 写简要总结

响应格式：
{
  "weaknesses": ["算法", "系统设计"],
  "strengths": ["javascript", "沟通"], 
  "skillLevels": [{"skill": "react", "level": 7, "confidence": 0.9}],
  "communicationScore": 8,
  "technicalScore": 6,
  "overallReadiness": 7,
  "suggestions": ["学习排序算法", "练习系统设计"],
  "uniquenessScore": 0.8,
  "summary": "前端技能不错，需要提高算法"
}`,
    user: `分析"{profession}"职位的技术面试反馈：

"{comments}"

按照指示返回JSON格式的分析。`
  }
};

// 🌍 МУЛЬТИЯЗЫЧНЫЕ ПРОМПТЫ ДЛЯ РЕКОМЕНДАЦИЙ
const RECOMMENDATIONS_PROMPTS = {
  ru: {
    system: `Ты эксперт по карьерному развитию в IT. 
На основе анализа фидбека создавай конкретные рекомендации для обучения.

ВАЖНО: Отвечай ТОЛЬКО валидным JSON массивом без дополнительного текста!

Типы рекомендаций:
- "material" - изучить материалы/статьи
- "roadmap" - этапы развития  
- "training" - практические задачи
- "schedule" - планирование времени`,
    user: `На основе анализа фидбека для позиции "{profession}" создай рекомендации:

Слабые места: {weaknesses}
Сильные стороны: {strengths}
Техническая оценка: {technicalScore}/10
Готовность: {overallReadiness}/10

Создай 3-5 конкретных рекомендаций в JSON формате.`
  },
  en: {
    system: `You are an expert in IT career development. 
Based on feedback analysis, create specific learning recommendations.

IMPORTANT: Respond with ONLY valid JSON array without additional text!

Recommendation types:
- "material" - study materials/articles
- "roadmap" - development stages  
- "training" - practical tasks
- "schedule" - time planning`,
    user: `Based on feedback analysis for "{profession}" position create recommendations:

Weaknesses: {weaknesses}
Strengths: {strengths}
Technical score: {technicalScore}/10
Readiness: {overallReadiness}/10

Create 3-5 specific recommendations in JSON format.`
  },
  es: {
    system: `Eres un experto en desarrollo profesional en IT. 
Basado en análisis de comentarios, crea recomendaciones específicas para aprender.

IMPORTANTE: ¡Responde SOLO con array JSON válido sin texto adicional!

Tipos de recomendaciones:
- "material" - estudiar materiales/artículos
- "roadmap" - etapas de desarrollo  
- "training" - tareas prácticas
- "schedule" - planificación de tiempo`,
    user: `Basado en análisis de comentarios para posición "{profession}" crea recomendaciones:

Debilidades: {weaknesses}
Fortalezas: {strengths}
Puntuación técnica: {technicalScore}/10
Preparación: {overallReadiness}/10

Crea 3-5 recomendaciones específicas en formato JSON.`
  },
  de: {
    system: `Du bist ein Experte für Karriereentwicklung in der IT. 
Basierend auf Feedback-Analyse erstelle spezifische Lernempfehlungen.

WICHTIG: Antworte NUR mit gültigem JSON-Array ohne zusätzlichen Text!

Empfehlungstypen:
- "material" - Materialien/Artikel studieren
- "roadmap" - Entwicklungsstufen  
- "training" - praktische Aufgaben
- "schedule" - Zeitplanung`,
    user: `Basierend auf Feedback-Analyse für Position "{profession}" erstelle Empfehlungen:

Schwächen: {weaknesses}
Stärken: {strengths}
Technische Bewertung: {technicalScore}/10
Bereitschaft: {overallReadiness}/10

Erstelle 3-5 spezifische Empfehlungen im JSON-Format.`
  },
  fr: {
    system: `Tu es un expert en développement de carrière en IT. 
Basé sur l'analyse des commentaires, crée des recommandations d'apprentissage spécifiques.

IMPORTANT: Réponds SEULEMENT avec un array JSON valide sans texte supplémentaire!

Types de recommandations:
- "material" - étudier matériaux/articles
- "roadmap" - étapes de développement  
- "training" - tâches pratiques
- "schedule" - planification du temps`,
    user: `Basé sur l'analyse des commentaires pour poste "{profession}" crée des recommandations:

Faiblesses: {weaknesses}
Forces: {strengths}
Score technique: {technicalScore}/10
Préparation: {overallReadiness}/10

Crée 3-5 recommandations spécifiques au format JSON.`
  },
  zh: {
    system: `你是IT职业发展专家。
基于反馈分析，创建具体的学习建议。

重要：只回复有效的JSON数组，不要额外文本！

建议类型：
- "material" - 学习材料/文章
- "roadmap" - 发展阶段  
- "training" - 实践任务
- "schedule" - 时间规划`,
    user: `基于"{profession}"职位的反馈分析创建建议：

弱点：{weaknesses}
优势：{strengths}
技术评分：{technicalScore}/10
准备度：{overallReadiness}/10

创建3-5个具体的JSON格式建议。`
  }
};

/**
 * 🤖 AI Analysis Service - Сервис для анализа фидбека с использованием OpenRouter
 * 
 * Возможности:
 * - Анализ фидбека на 6 языках (ru, en, es, de, fr, zh)
 * - Извлечение навыков и слабых мест
 * - Генерация персонализированных рекомендаций
 * - Использование пользовательских OpenRouter API ключей
 */
export class AIAnalysisService {
  private prisma: PrismaClient;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 🧠 Анализ фидбека с помощью AI
   */
  async analyzeFeedback(
    feedbackId: number,
    comments: string,
    profession: string,
    userLanguage: string = 'ru',
    userId: string
  ): Promise<FeedbackAnalysis> {
    try {
      console.log(`🧠 Starting AI analysis for feedback ${feedbackId}`);
      
      // Получаем настройки пользователя
      const userSettings = await this.getUserSettings(userId);
      if (!userSettings?.openrouterApiKey) {
        throw new Error('OpenRouter API ключ не найден в настройках пользователя');
      }

      // 🌍 Получаем мультиязычные промпты
      const langPrompts = ANALYSIS_PROMPTS[userLanguage as keyof typeof ANALYSIS_PROMPTS] || ANALYSIS_PROMPTS.ru;
      
      const systemPrompt = langPrompts.system;
      const userPrompt = langPrompts.user
        .replace('{profession}', profession)
        .replace('{comments}', comments);

      const response = await this.makeOpenRouterRequest({
        model: userSettings.preferredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.3, // низкая температура для более точного анализа
      }, userSettings.openrouterApiKey);

      const content = response.choices[0]?.message?.content || '';
      
      // Парсим JSON ответ
      try {
        const analysis = JSON.parse(content) as FeedbackAnalysis;
        console.log(`✅ AI analysis completed for feedback ${feedbackId}`);
        return analysis;
      } catch (parseError) {
        console.error('Failed to parse AI analysis:', parseError, content);
        // Fallback - базовый анализ
        return {
          weaknesses: ['Требует дополнительного анализа'],
          strengths: ['Участие в собеседовании'],
          skillLevels: [{ skill: profession.toLowerCase(), level: 5, confidence: 0.5 }],
          communicationScore: 5,
          technicalScore: 5,
          overallReadiness: 5,
          suggestions: ['Продолжить развитие навыков'],
          uniquenessScore: 0.5,
          summary: 'Требуется дополнительный анализ фидбека'
        };
      }
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      throw new Error('Не удалось проанализировать фидбек. Проверьте API ключ.');
    }
  }

  /**
   * 💡 Генерация рекомендаций на основе анализа
   */
  async generateRecommendations(
    analysis: FeedbackAnalysis,
    profession: string,
    userLanguage: string = 'ru',
    userId: string
  ): Promise<LearningRecommendation[]> {
    try {
      console.log(`💡 Generating recommendations for user ${userId}`);
      
      // Получаем настройки пользователя
      const userSettings = await this.getUserSettings(userId);
      if (!userSettings?.openrouterApiKey) {
        throw new Error('OpenRouter API ключ не найден');
      }

      // 🌍 Получаем мультиязычные промпты для рекомендаций
      const langPrompts = RECOMMENDATIONS_PROMPTS[userLanguage as keyof typeof RECOMMENDATIONS_PROMPTS] || RECOMMENDATIONS_PROMPTS.ru;
      
      const systemPrompt = langPrompts.system;
      const userPrompt = langPrompts.user
        .replace('{profession}', profession)
        .replace('{weaknesses}', analysis.weaknesses.join(', '))
        .replace('{strengths}', analysis.strengths.join(', '))
        .replace('{technicalScore}', analysis.technicalScore.toString())
        .replace('{overallReadiness}', analysis.overallReadiness.toString());

      const response = await this.makeOpenRouterRequest({
        model: userSettings.preferredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      }, userSettings.openrouterApiKey);

      const content = response.choices[0]?.message?.content || '';
      
      try {
        const recommendations = JSON.parse(content) as LearningRecommendation[];
        console.log(`✅ Generated ${recommendations.length} recommendations`);
        return recommendations;
      } catch (parseError) {
        console.error('Failed to parse recommendations:', parseError);
        // Fallback рекомендации
        return [
          {
            type: 'material',
            priority: 8,
            title: 'Развитие профессиональных навыков',
            description: `Изучить дополнительные материалы по ${profession}`,
            estimatedHours: 10
          }
        ];
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Не удалось сгенерировать рекомендации.');
    }
  }

  /**
   * 🔍 Анализ уникальности проблем пользователя
   */
  async checkUniqueness(
    analysis: FeedbackAnalysis,
    userId: string
  ): Promise<number> {
    try {
      console.log(`🔍 Checking uniqueness for user ${userId}`);
      
      // Получаем предыдущие анализы пользователя
      // TODO: Когда будет создана таблица FeedbackAnalysis
      // const previousAnalyses = await this.prisma.feedbackAnalysis.findMany({
      //   where: { userId },
      //   orderBy: { createdAt: 'desc' },
      //   take: 5 // последние 5 анализов
      // });

      // Пока возвращаем базовое значение
      // В будущем здесь будет сравнение с историей
      return 0.8; // средняя уникальность

    } catch (error) {
      console.error('Error checking uniqueness:', error);
      return 0.5; // средняя уникальность при ошибке
    }
  }

  /**
   * 🛠️ Получение настроек пользователя
   */
  private async getUserSettings(userId: string) {
    try {
      const settings = await this.prisma.userSettings.findUnique({
        where: { userId },
        select: {
          openrouterApiKey: true,
          preferredModel: true,
        },
      });
      return settings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  /**
   * 🌐 Выполнение запроса к OpenRouter API
   */
  private async makeOpenRouterRequest(
    request: OpenRouterRequest,
    apiKey: string
  ): Promise<OpenRouterResponse> {
    console.log('Making OpenRouter API request:', {
      url: `${this.baseUrl}/chat/completions`,
      model: request.model,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://supermock.ru',
        'X-Title': 'Super Mock AI Analysis',
      },
      body: JSON.stringify(request),
    });

    console.log('OpenRouter API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenRouter API error details:', errorData);

      const errorMessage =
        errorData?.error?.message ||
        `HTTP ${response.status}: ${response.statusText}`;

      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error(
          'Неверный API ключ OpenRouter. Проверьте ключ в настройках профиля.'
        );
      } else if (response.status === 403) {
        throw new Error('Доступ запрещен. Проверьте настройки API ключа.');
      } else if (response.status === 429) {
        throw new Error('Превышен лимит запросов. Попробуйте позже.');
      } else if (response.status >= 500) {
        throw new Error('Ошибка сервера OpenRouter. Попробуйте позже.');
      } else {
        throw new Error(errorMessage);
      }
    }

    return response.json();
  }

  /**
   * 🧹 Очистка ресурсов
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export default AIAnalysisService;
