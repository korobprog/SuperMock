export const languages = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文'
};

export const defaultLang = 'ru';

export const ui = {
  ru: {
    'nav.home': 'Главная',
    'nav.features': 'Возможности',
    'nav.about': 'О проекте',
    'nav.contact': 'Контакты',
    'nav.login': 'Войти',
    'hero.title.line1': 'Подготовьтесь к',
    'hero.title.line2': 'собеседованию',
    'hero.title.line3': 'на',
    'hero.title.languages': '6 языках',
    'hero.description': 'Super Mock - AI-платформа для проведения интервью на 6 языках с уникальным подбором кандидатов и интервьюеров. 10+ профессий, поэтапные материалы для обучения и инновационные тренажеры.',
    'hero.buttons.telegram': '🚀 Начать обучение',
    'hero.buttons.app': '💻 Открыть приложение',
    'meta.title': 'Super Mock - AI платформа для интервью',
    'meta.description': 'Super Mock - AI-платформа для проведения интервью на 6 языках с уникальным подбором кандидатов и интервьюеров.'
  },
  en: {
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'hero.title.line1': 'Prepare for',
    'hero.title.line2': 'interviews',
    'hero.title.line3': 'in',
    'hero.title.languages': '6 languages',
    'hero.description': 'Super Mock - AI platform for conducting interviews in 6 languages with unique candidate and interviewer matching. 10+ professions, step-by-step learning materials and innovative simulators.',
    'hero.buttons.telegram': '🚀 Start Learning',
    'hero.buttons.app': '💻 Open App',
    'meta.title': 'Super Mock - AI Interview Platform',
    'meta.description': 'Super Mock - AI platform for conducting interviews in 6 languages with unique candidate and interviewer matching.'
  },
  es: {
    'nav.home': 'Inicio',
    'nav.features': 'Características',
    'nav.about': 'Acerca de',
    'nav.contact': 'Contacto',
    'nav.login': 'Iniciar sesión',
    'hero.title.line1': 'Prepárate para',
    'hero.title.line2': 'entrevistas',
    'hero.title.line3': 'en',
    'hero.title.languages': '6 idiomas',
    'hero.description': 'Super Mock - Plataforma AI para realizar entrevistas en 6 idiomas con emparejamiento único de candidatos e entrevistadores. 10+ profesiones, materiales de aprendizaje paso a paso y simuladores innovadores.',
    'hero.buttons.telegram': '🚀 Comenzar a aprender',
    'hero.buttons.app': '💻 Abrir aplicación',
    'meta.title': 'Super Mock - Plataforma de Entrevistas AI',
    'meta.description': 'Super Mock - Plataforma AI para realizar entrevistas en 6 idiomas con emparejamiento único de candidatos e entrevistadores.'
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.features': 'Fonctionnalités',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'hero.title.line1': 'Préparez-vous pour',
    'hero.title.line2': 'les entretiens',
    'hero.title.line3': 'en',
    'hero.title.languages': '6 langues',
    'hero.description': 'Super Mock - Plateforme IA pour mener des entretiens en 6 langues avec un appariement unique de candidats et d\'intervieweurs. 10+ professions, matériaux d\'apprentissage étape par étape et simulateurs innovants.',
    'hero.buttons.telegram': '🚀 Commencer à apprendre',
    'hero.buttons.app': '💻 Ouvrir l\'application',
    'meta.title': 'Super Mock - Plateforme d\'Entretiens IA',
    'meta.description': 'Super Mock - Plateforme IA pour mener des entretiens en 6 langues avec un appariement unique de candidats et d\'intervieweurs.'
  },
  de: {
    'nav.home': 'Startseite',
    'nav.features': 'Funktionen',
    'nav.about': 'Über uns',
    'nav.contact': 'Kontakt',
    'nav.login': 'Anmelden',
    'hero.title.line1': 'Bereiten Sie sich auf',
    'hero.title.line2': 'Vorstellungsgespräche',
    'hero.title.line3': 'in',
    'hero.title.languages': '6 Sprachen',
    'hero.description': 'Super Mock - KI-Plattform für die Durchführung von Vorstellungsgesprächen in 6 Sprachen mit einzigartiger Kandidaten- und Interviewer-Zuordnung. 10+ Berufe, schrittweise Lernmaterialien und innovative Simulatoren.',
    'hero.buttons.telegram': '🚀 Lernen beginnen',
    'hero.buttons.app': '💻 App öffnen',
    'meta.title': 'Super Mock - KI-Interview-Plattform',
    'meta.description': 'Super Mock - KI-Plattform für die Durchführung von Vorstellungsgesprächen in 6 Sprachen mit einzigartiger Kandidaten- und Interviewer-Zuordnung.'
  },
  zh: {
    'nav.home': '首页',
    'nav.features': '功能',
    'nav.about': '关于',
    'nav.contact': '联系',
    'nav.login': '登录',
    'hero.title.line1': '为面试',
    'hero.title.line2': '做准备',
    'hero.title.line3': '支持',
    'hero.title.languages': '6种语言',
    'hero.description': 'Super Mock - 支持6种语言的AI面试平台，具有独特的候选人和面试官匹配功能。10+职业，分步学习材料和创新模拟器。',
    'hero.buttons.telegram': '🚀 开始学习',
    'hero.buttons.app': '💻 打开应用',
    'meta.title': 'Super Mock - AI面试平台',
    'meta.description': 'Super Mock - 支持6种语言的AI面试平台，具有独特的候选人和面试官匹配功能。'
  }
} as const;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}
