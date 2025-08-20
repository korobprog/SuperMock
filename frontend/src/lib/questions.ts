export interface Question {
  id: string;
  category: 'general' | 'technical' | 'behavioral' | 'coding';
  difficulty: 'junior' | 'middle' | 'senior';
  role: 'both' | 'interviewer' | 'candidate';
}

export interface QuestionsByProfession {
  [profession: string]: {
    general: string[];
    technical: string[];
    behavioral: string[];
    coding: string[];
  };
}

// Вопросы для интервью по профессиям (на русском языке)
export const questionsByProfession: QuestionsByProfession = {
  frontend: {
    general: [
      'questions.frontend.general.tellAboutYourself',
      'questions.frontend.general.experience',
      'questions.frontend.general.motivation',
      'questions.frontend.general.projects',
      'questions.frontend.general.challenges',
    ],
    technical: [
      'questions.frontend.technical.reactHooks',
      'questions.frontend.technical.virtualDOM',
      'questions.frontend.technical.stateManagement',
      'questions.frontend.technical.performance',
      'questions.frontend.technical.css',
      'questions.frontend.technical.webpack',
      'questions.frontend.technical.typescript',
      'questions.frontend.technical.testing',
      'questions.frontend.technical.accessibility',
      'questions.frontend.technical.ssr',
    ],
    behavioral: [
      'questions.frontend.behavioral.teamwork',
      'questions.frontend.behavioral.deadlines',
      'questions.frontend.behavioral.conflict',
      'questions.frontend.behavioral.feedback',
      'questions.frontend.behavioral.learning',
    ],
    coding: [
      'questions.frontend.coding.component',
      'questions.frontend.coding.algorithm',
      'questions.frontend.coding.promise',
      'questions.frontend.coding.closure',
      'questions.frontend.coding.optimization',
    ],
  },
  backend: {
    general: [
      'questions.backend.general.tellAboutYourself',
      'questions.backend.general.experience',
      'questions.backend.general.architecture',
      'questions.backend.general.projects',
      'questions.backend.general.challenges',
    ],
    technical: [
      'questions.backend.technical.api',
      'questions.backend.technical.database',
      'questions.backend.technical.caching',
      'questions.backend.technical.security',
      'questions.backend.technical.scaling',
      'questions.backend.technical.microservices',
      'questions.backend.technical.monitoring',
      'questions.backend.technical.authentication',
      'questions.backend.technical.testing',
      'questions.backend.technical.deployment',
    ],
    behavioral: [
      'questions.backend.behavioral.teamwork',
      'questions.backend.behavioral.deadlines',
      'questions.backend.behavioral.conflict',
      'questions.backend.behavioral.feedback',
      'questions.backend.behavioral.learning',
    ],
    coding: [
      'questions.backend.coding.algorithm',
      'questions.backend.coding.database',
      'questions.backend.coding.api',
      'questions.backend.coding.optimization',
      'questions.backend.coding.concurrency',
    ],
  },
  fullstack: {
    general: [
      'questions.fullstack.general.tellAboutYourself',
      'questions.fullstack.general.experience',
      'questions.fullstack.general.frontend',
      'questions.fullstack.general.backend',
      'questions.fullstack.general.challenges',
    ],
    technical: [
      'questions.fullstack.technical.architecture',
      'questions.fullstack.technical.communication',
      'questions.fullstack.technical.performance',
      'questions.fullstack.technical.security',
      'questions.fullstack.technical.testing',
      'questions.fullstack.technical.deployment',
      'questions.fullstack.technical.database',
      'questions.fullstack.technical.api',
      'questions.fullstack.technical.state',
      'questions.fullstack.technical.optimization',
    ],
    behavioral: [
      'questions.fullstack.behavioral.teamwork',
      'questions.fullstack.behavioral.deadlines',
      'questions.fullstack.behavioral.conflict',
      'questions.fullstack.behavioral.feedback',
      'questions.fullstack.behavioral.learning',
    ],
    coding: [
      'questions.fullstack.coding.fullapp',
      'questions.fullstack.coding.api',
      'questions.fullstack.coding.component',
      'questions.fullstack.coding.algorithm',
      'questions.fullstack.coding.database',
    ],
  },
  mobile: {
    general: [
      'questions.mobile.general.tellAboutYourself',
      'questions.mobile.general.experience',
      'questions.mobile.general.platforms',
      'questions.mobile.general.projects',
      'questions.mobile.general.challenges',
    ],
    technical: [
      'questions.mobile.technical.lifecycle',
      'questions.mobile.technical.performance',
      'questions.mobile.technical.memory',
      'questions.mobile.technical.navigation',
      'questions.mobile.technical.storage',
      'questions.mobile.technical.network',
      'questions.mobile.technical.testing',
      'questions.mobile.technical.deployment',
      'questions.mobile.technical.security',
      'questions.mobile.technical.offline',
    ],
    behavioral: [
      'questions.mobile.behavioral.teamwork',
      'questions.mobile.behavioral.deadlines',
      'questions.mobile.behavioral.conflict',
      'questions.mobile.behavioral.feedback',
      'questions.mobile.behavioral.learning',
    ],
    coding: [
      'questions.mobile.coding.component',
      'questions.mobile.coding.algorithm',
      'questions.mobile.coding.async',
      'questions.mobile.coding.optimization',
      'questions.mobile.coding.animation',
    ],
  },
  devops: {
    general: [
      'questions.devops.general.tellAboutYourself',
      'questions.devops.general.experience',
      'questions.devops.general.infrastructure',
      'questions.devops.general.projects',
      'questions.devops.general.challenges',
    ],
    technical: [
      'questions.devops.technical.cicd',
      'questions.devops.technical.containers',
      'questions.devops.technical.monitoring',
      'questions.devops.technical.cloud',
      'questions.devops.technical.security',
      'questions.devops.technical.automation',
      'questions.devops.technical.scaling',
      'questions.devops.technical.backup',
      'questions.devops.technical.networking',
      'questions.devops.technical.troubleshooting',
    ],
    behavioral: [
      'questions.devops.behavioral.teamwork',
      'questions.devops.behavioral.deadlines',
      'questions.devops.behavioral.conflict',
      'questions.devops.behavioral.feedback',
      'questions.devops.behavioral.learning',
    ],
    coding: [
      'questions.devops.coding.script',
      'questions.devops.coding.automation',
      'questions.devops.coding.monitoring',
      'questions.devops.coding.deployment',
      'questions.devops.coding.infrastructure',
    ],
  },
  qa: {
    general: [
      'questions.qa.general.tellAboutYourself',
      'questions.qa.general.experience',
      'questions.qa.general.testing',
      'questions.qa.general.projects',
      'questions.qa.general.challenges',
    ],
    technical: [
      'questions.qa.technical.types',
      'questions.qa.technical.automation',
      'questions.qa.technical.tools',
      'questions.qa.technical.bugs',
      'questions.qa.technical.planning',
      'questions.qa.technical.performance',
      'questions.qa.technical.security',
      'questions.qa.technical.api',
      'questions.qa.technical.regression',
      'questions.qa.technical.documentation',
    ],
    behavioral: [
      'questions.qa.behavioral.teamwork',
      'questions.qa.behavioral.deadlines',
      'questions.qa.behavioral.conflict',
      'questions.qa.behavioral.feedback',
      'questions.qa.behavioral.learning',
    ],
    coding: [
      'questions.qa.coding.automation',
      'questions.qa.coding.script',
      'questions.qa.coding.api',
      'questions.qa.coding.performance',
      'questions.qa.coding.data',
    ],
  },
  designer: {
    general: [
      'questions.designer.general.tellAboutYourself',
      'questions.designer.general.experience',
      'questions.designer.general.design',
      'questions.designer.general.projects',
      'questions.designer.general.challenges',
    ],
    technical: [
      'questions.designer.technical.process',
      'questions.designer.technical.tools',
      'questions.designer.technical.research',
      'questions.designer.technical.accessibility',
      'questions.designer.technical.responsive',
      'questions.designer.technical.prototyping',
      'questions.designer.technical.testing',
      'questions.designer.technical.systems',
      'questions.designer.technical.collaboration',
      'questions.designer.technical.trends',
    ],
    behavioral: [
      'questions.designer.behavioral.teamwork',
      'questions.designer.behavioral.deadlines',
      'questions.designer.behavioral.conflict',
      'questions.designer.behavioral.feedback',
      'questions.designer.behavioral.learning',
    ],
    coding: [
      'questions.designer.coding.html',
      'questions.designer.coding.css',
      'questions.designer.coding.prototype',
      'questions.designer.coding.animation',
      'questions.designer.coding.responsive',
    ],
  },
  analyst: {
    general: [
      'questions.analyst.general.tellAboutYourself',
      'questions.analyst.general.experience',
      'questions.analyst.general.data',
      'questions.analyst.general.projects',
      'questions.analyst.general.challenges',
    ],
    technical: [
      'questions.analyst.technical.sql',
      'questions.analyst.technical.visualization',
      'questions.analyst.technical.statistics',
      'questions.analyst.technical.tools',
      'questions.analyst.technical.cleaning',
      'questions.analyst.technical.modeling',
      'questions.analyst.technical.reporting',
      'questions.analyst.technical.kpi',
      'questions.analyst.technical.ab',
      'questions.analyst.technical.ethics',
    ],
    behavioral: [
      'questions.analyst.behavioral.teamwork',
      'questions.analyst.behavioral.deadlines',
      'questions.analyst.behavioral.conflict',
      'questions.analyst.behavioral.feedback',
      'questions.analyst.behavioral.learning',
    ],
    coding: [
      'questions.analyst.coding.sql',
      'questions.analyst.coding.python',
      'questions.analyst.coding.statistics',
      'questions.analyst.coding.visualization',
      'questions.analyst.coding.etl',
    ],
  },
  scientist: {
    general: [
      'questions.scientist.general.tellAboutYourself',
      'questions.scientist.general.experience',
      'questions.scientist.general.ml',
      'questions.scientist.general.projects',
      'questions.scientist.general.challenges',
    ],
    technical: [
      'questions.scientist.technical.algorithms',
      'questions.scientist.technical.modeling',
      'questions.scientist.technical.evaluation',
      'questions.scientist.technical.features',
      'questions.scientist.technical.overfitting',
      'questions.scientist.technical.deployment',
      'questions.scientist.technical.scaling',
      'questions.scientist.technical.monitoring',
      'questions.scientist.technical.ethics',
      'questions.scientist.technical.research',
    ],
    behavioral: [
      'questions.scientist.behavioral.teamwork',
      'questions.scientist.behavioral.deadlines',
      'questions.scientist.behavioral.conflict',
      'questions.scientist.behavioral.feedback',
      'questions.scientist.behavioral.learning',
    ],
    coding: [
      'questions.scientist.coding.algorithm',
      'questions.scientist.coding.model',
      'questions.scientist.coding.pipeline',
      'questions.scientist.coding.optimization',
      'questions.scientist.coding.evaluation',
    ],
  },
  pm: {
    general: [
      'questions.pm.general.tellAboutYourself',
      'questions.pm.general.experience',
      'questions.pm.general.product',
      'questions.pm.general.projects',
      'questions.pm.general.challenges',
    ],
    technical: [
      'questions.pm.technical.roadmap',
      'questions.pm.technical.prioritization',
      'questions.pm.technical.metrics',
      'questions.pm.technical.stakeholders',
      'questions.pm.technical.research',
      'questions.pm.technical.launch',
      'questions.pm.technical.feedback',
      'questions.pm.technical.growth',
      'questions.pm.technical.strategy',
      'questions.pm.technical.competitive',
    ],
    behavioral: [
      'questions.pm.behavioral.teamwork',
      'questions.pm.behavioral.deadlines',
      'questions.pm.behavioral.conflict',
      'questions.pm.behavioral.feedback',
      'questions.pm.behavioral.learning',
    ],
    coding: [
      'questions.pm.coding.sql',
      'questions.pm.coding.analysis',
      'questions.pm.coding.automation',
      'questions.pm.coding.reporting',
      'questions.pm.coding.prototype',
    ],
  },
};

export function getQuestionsForProfession(
  profession: string,
  role: string = 'both'
): string[] {
  const professionQuestions = questionsByProfession[profession];

  if (!professionQuestions) {
    // Fallback к общим вопросам если профессия не найдена
    return [
      'questions.general.tellAboutYourself',
      'questions.general.experience',
      'questions.general.motivation',
      'questions.general.challenges',
      'questions.general.teamwork',
    ];
  }

  // Комбинируем разные типы вопросов
  const allQuestions = [
    ...professionQuestions.general,
    ...professionQuestions.technical,
    ...professionQuestions.behavioral,
    ...professionQuestions.coding,
  ];

  // Перемешиваем и возвращаем первые 10 вопросов
  return shuffleArray(allQuestions).slice(0, 10);
}

// Функция для перемешивания массива
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
