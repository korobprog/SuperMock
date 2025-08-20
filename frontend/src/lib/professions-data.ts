export interface Tool {
  id: string;
  name: string;
  category:
    | 'frameworks'
    | 'languages'
    | 'databases'
    | 'tools'
    | 'platforms'
    | 'design'
    | 'testing'
    | 'devops';
  icon?: string;
}

export interface Profession {
  id: string;
  title: string;
  description: string;
  tools: Tool[];
  popularCombinations: string[][];
}

export const PROFESSIONS_DATA: Record<string, Profession> = {
  frontend: {
    id: 'frontend',
    title: 'Frontend Developer',
    description:
      'Разработка пользовательских интерфейсов и клиентской части веб-приложений',
    tools: [
      // Frameworks
      { id: 'react', name: 'React', category: 'frameworks' },
      { id: 'vue', name: 'Vue.js', category: 'frameworks' },
      { id: 'angular', name: 'Angular', category: 'frameworks' },
      { id: 'svelte', name: 'Svelte', category: 'frameworks' },
      { id: 'nextjs', name: 'Next.js', category: 'frameworks' },
      { id: 'nuxt', name: 'Nuxt.js', category: 'frameworks' },

      // Languages
      { id: 'javascript', name: 'JavaScript', category: 'languages' },
      { id: 'typescript', name: 'TypeScript', category: 'languages' },
      { id: 'html', name: 'HTML', category: 'languages' },
      { id: 'css', name: 'CSS', category: 'languages' },

      // Tools
      { id: 'webpack', name: 'Webpack', category: 'tools' },
      { id: 'vite', name: 'Vite', category: 'tools' },
      { id: 'eslint', name: 'ESLint', category: 'tools' },
      { id: 'prettier', name: 'Prettier', category: 'tools' },
      { id: 'tailwind', name: 'Tailwind CSS', category: 'tools' },
      { id: 'bootstrap', name: 'Bootstrap', category: 'tools' },
      { id: 'sass', name: 'Sass/SCSS', category: 'tools' },
    ],
    popularCombinations: [
      ['react', 'typescript', 'tailwind'],
      ['vue', 'javascript', 'bootstrap'],
      ['angular', 'typescript', 'sass'],
      ['nextjs', 'typescript', 'tailwind'],
    ],
  },

  backend: {
    id: 'backend',
    title: 'Backend Developer',
    description: 'Разработка серверной части приложений и API',
    tools: [
      // Languages
      { id: 'javascript', name: 'JavaScript', category: 'languages' },
      { id: 'typescript', name: 'TypeScript', category: 'languages' },
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'java', name: 'Java', category: 'languages' },
      { id: 'csharp', name: 'C#', category: 'languages' },
      { id: 'go', name: 'Go', category: 'languages' },
      { id: 'php', name: 'PHP', category: 'languages' },
      { id: 'ruby', name: 'Ruby', category: 'languages' },

      // Frameworks
      { id: 'nodejs', name: 'Node.js', category: 'frameworks' },
      { id: 'express', name: 'Express.js', category: 'frameworks' },
      { id: 'django', name: 'Django', category: 'frameworks' },
      { id: 'flask', name: 'Flask', category: 'frameworks' },
      { id: 'spring', name: 'Spring Boot', category: 'frameworks' },
      { id: 'dotnet', name: '.NET', category: 'frameworks' },
      { id: 'laravel', name: 'Laravel', category: 'frameworks' },
      { id: 'rails', name: 'Ruby on Rails', category: 'frameworks' },

      // Databases
      { id: 'postgresql', name: 'PostgreSQL', category: 'databases' },
      { id: 'mysql', name: 'MySQL', category: 'databases' },
      { id: 'mongodb', name: 'MongoDB', category: 'databases' },
      { id: 'redis', name: 'Redis', category: 'databases' },
      { id: 'sqlite', name: 'SQLite', category: 'databases' },

      // Tools
      { id: 'docker', name: 'Docker', category: 'tools' },
      { id: 'git', name: 'Git', category: 'tools' },
      { id: 'postman', name: 'Postman', category: 'tools' },
      { id: 'swagger', name: 'Swagger/OpenAPI', category: 'tools' },
    ],
    popularCombinations: [
      ['nodejs', 'express', 'postgresql'],
      ['python', 'django', 'postgresql'],
      ['java', 'spring', 'mysql'],
      ['csharp', 'dotnet', 'sqlserver'],
    ],
  },

  fullstack: {
    id: 'fullstack',
    title: 'Full Stack Developer',
    description: 'Разработка как клиентской, так и серверной части приложений',
    tools: [
      // Frontend
      { id: 'react', name: 'React', category: 'frameworks' },
      { id: 'vue', name: 'Vue.js', category: 'frameworks' },
      { id: 'angular', name: 'Angular', category: 'frameworks' },
      { id: 'javascript', name: 'JavaScript', category: 'languages' },
      { id: 'typescript', name: 'TypeScript', category: 'languages' },
      { id: 'html', name: 'HTML', category: 'languages' },
      { id: 'css', name: 'CSS', category: 'languages' },

      // Backend
      { id: 'nodejs', name: 'Node.js', category: 'frameworks' },
      { id: 'express', name: 'Express.js', category: 'frameworks' },
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'django', name: 'Django', category: 'frameworks' },
      { id: 'flask', name: 'Flask', category: 'frameworks' },
      { id: 'java', name: 'Java', category: 'languages' },
      { id: 'spring', name: 'Spring Boot', category: 'frameworks' },

      // Databases
      { id: 'postgresql', name: 'PostgreSQL', category: 'databases' },
      { id: 'mysql', name: 'MySQL', category: 'databases' },
      { id: 'mongodb', name: 'MongoDB', category: 'databases' },
      { id: 'redis', name: 'Redis', category: 'databases' },

      // Tools
      { id: 'docker', name: 'Docker', category: 'tools' },
      { id: 'git', name: 'Git', category: 'tools' },
      { id: 'webpack', name: 'Webpack', category: 'tools' },
      { id: 'vite', name: 'Vite', category: 'tools' },
    ],
    popularCombinations: [
      ['react', 'nodejs', 'postgresql'],
      ['vue', 'python', 'django'],
      ['angular', 'java', 'spring'],
      ['typescript', 'nodejs', 'mongodb'],
    ],
  },

  mobile: {
    id: 'mobile',
    title: 'Mobile Developer',
    description: 'Разработка мобильных приложений для iOS и Android',
    tools: [
      // Platforms
      { id: 'ios', name: 'iOS', category: 'platforms' },
      { id: 'android', name: 'Android', category: 'platforms' },

      // Languages
      { id: 'swift', name: 'Swift', category: 'languages' },
      { id: 'kotlin', name: 'Kotlin', category: 'languages' },
      { id: 'javascript', name: 'JavaScript', category: 'languages' },
      { id: 'typescript', name: 'TypeScript', category: 'languages' },
      { id: 'dart', name: 'Dart', category: 'languages' },

      // Frameworks
      { id: 'react-native', name: 'React Native', category: 'frameworks' },
      { id: 'flutter', name: 'Flutter', category: 'frameworks' },
      { id: 'xamarin', name: 'Xamarin', category: 'frameworks' },
      { id: 'ionic', name: 'Ionic', category: 'frameworks' },

      // Tools
      { id: 'xcode', name: 'Xcode', category: 'tools' },
      { id: 'android-studio', name: 'Android Studio', category: 'tools' },
      { id: 'firebase', name: 'Firebase', category: 'tools' },
      { id: 'git', name: 'Git', category: 'tools' },
    ],
    popularCombinations: [
      ['ios', 'swift', 'xcode'],
      ['android', 'kotlin', 'android-studio'],
      ['react-native', 'javascript', 'firebase'],
      ['flutter', 'dart', 'firebase'],
    ],
  },

  devops: {
    id: 'devops',
    title: 'DevOps Engineer',
    description: 'Автоматизация процессов разработки и развертывания',
    tools: [
      // Platforms
      { id: 'aws', name: 'AWS', category: 'platforms' },
      { id: 'azure', name: 'Azure', category: 'platforms' },
      { id: 'gcp', name: 'Google Cloud', category: 'platforms' },
      { id: 'digitalocean', name: 'DigitalOcean', category: 'platforms' },

      // Tools
      { id: 'docker', name: 'Docker', category: 'tools' },
      { id: 'kubernetes', name: 'Kubernetes', category: 'tools' },
      { id: 'jenkins', name: 'Jenkins', category: 'tools' },
      { id: 'gitlab-ci', name: 'GitLab CI', category: 'tools' },
      { id: 'github-actions', name: 'GitHub Actions', category: 'tools' },
      { id: 'terraform', name: 'Terraform', category: 'tools' },
      { id: 'ansible', name: 'Ansible', category: 'tools' },
      { id: 'prometheus', name: 'Prometheus', category: 'tools' },
      { id: 'grafana', name: 'Grafana', category: 'tools' },
      { id: 'nginx', name: 'Nginx', category: 'tools' },
      { id: 'linux', name: 'Linux', category: 'tools' },

      // Languages
      { id: 'bash', name: 'Bash', category: 'languages' },
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'go', name: 'Go', category: 'languages' },
    ],
    popularCombinations: [
      ['docker', 'kubernetes', 'aws'],
      ['jenkins', 'terraform', 'azure'],
      ['gitlab-ci', 'docker', 'gcp'],
      ['ansible', 'prometheus', 'linux'],
    ],
  },

  qa: {
    id: 'qa',
    title: 'QA Engineer',
    description: 'Тестирование и обеспечение качества программного обеспечения',
    tools: [
      // Testing
      { id: 'selenium', name: 'Selenium', category: 'testing' },
      { id: 'cypress', name: 'Cypress', category: 'testing' },
      { id: 'playwright', name: 'Playwright', category: 'testing' },
      { id: 'jest', name: 'Jest', category: 'testing' },
      { id: 'pytest', name: 'PyTest', category: 'testing' },
      { id: 'junit', name: 'JUnit', category: 'testing' },
      { id: 'postman', name: 'Postman', category: 'testing' },
      { id: 'jmeter', name: 'JMeter', category: 'testing' },

      // Languages
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'javascript', name: 'JavaScript', category: 'languages' },
      { id: 'java', name: 'Java', category: 'languages' },
      { id: 'sql', name: 'SQL', category: 'languages' },

      // Tools
      { id: 'jira', name: 'Jira', category: 'tools' },
      { id: 'testrail', name: 'TestRail', category: 'tools' },
      { id: 'git', name: 'Git', category: 'tools' },
      { id: 'docker', name: 'Docker', category: 'tools' },
    ],
    popularCombinations: [
      ['selenium', 'python', 'pytest'],
      ['cypress', 'javascript', 'jest'],
      ['playwright', 'typescript', 'jira'],
      ['postman', 'sql', 'testrail'],
    ],
  },

  designer: {
    id: 'designer',
    title: 'UI/UX Designer',
    description:
      'Создание пользовательских интерфейсов и пользовательского опыта',
    tools: [
      // Design
      { id: 'figma', name: 'Figma', category: 'design' },
      { id: 'sketch', name: 'Sketch', category: 'design' },
      { id: 'adobe-xd', name: 'Adobe XD', category: 'design' },
      { id: 'photoshop', name: 'Photoshop', category: 'design' },
      { id: 'illustrator', name: 'Illustrator', category: 'design' },
      { id: 'invision', name: 'InVision', category: 'design' },
      { id: 'principle', name: 'Principle', category: 'design' },
      { id: 'framer', name: 'Framer', category: 'design' },

      // Tools
      { id: 'miro', name: 'Miro', category: 'tools' },
      { id: 'notion', name: 'Notion', category: 'tools' },
      { id: 'slack', name: 'Slack', category: 'tools' },
      { id: 'zeplin', name: 'Zeplin', category: 'tools' },
    ],
    popularCombinations: [
      ['figma', 'invision', 'miro'],
      ['sketch', 'principle', 'zeplin'],
      ['adobe-xd', 'photoshop', 'illustrator'],
      ['framer', 'notion', 'slack'],
    ],
  },

  analyst: {
    id: 'analyst',
    title: 'Data Analyst',
    description: 'Анализ данных и создание отчетов',
    tools: [
      // Languages
      { id: 'sql', name: 'SQL', category: 'languages' },
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'r', name: 'R', category: 'languages' },

      // Tools
      { id: 'excel', name: 'Excel', category: 'tools' },
      { id: 'tableau', name: 'Tableau', category: 'tools' },
      { id: 'powerbi', name: 'Power BI', category: 'tools' },
      { id: 'jupyter', name: 'Jupyter Notebook', category: 'tools' },
      { id: 'pandas', name: 'Pandas', category: 'tools' },
      { id: 'numpy', name: 'NumPy', category: 'tools' },
      { id: 'matplotlib', name: 'Matplotlib', category: 'tools' },
      { id: 'seaborn', name: 'Seaborn', category: 'tools' },
      { id: 'google-analytics', name: 'Google Analytics', category: 'tools' },
      { id: 'mixpanel', name: 'Mixpanel', category: 'tools' },
    ],
    popularCombinations: [
      ['sql', 'excel', 'tableau'],
      ['python', 'pandas', 'jupyter'],
      ['r', 'powerbi', 'matplotlib'],
      ['sql', 'google-analytics', 'excel'],
    ],
  },

  scientist: {
    id: 'scientist',
    title: 'Data Scientist',
    description: 'Создание моделей машинного обучения и анализ данных',
    tools: [
      // Languages
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'r', name: 'R', category: 'languages' },
      { id: 'sql', name: 'SQL', category: 'languages' },

      // ML/AI
      { id: 'tensorflow', name: 'TensorFlow', category: 'testing' },
      { id: 'pytorch', name: 'PyTorch', category: 'testing' },
      { id: 'scikit-learn', name: 'Scikit-learn', category: 'testing' },
      { id: 'keras', name: 'Keras', category: 'testing' },
      { id: 'opencv', name: 'OpenCV', category: 'testing' },
      { id: 'nltk', name: 'NLTK', category: 'testing' },
      { id: 'spacy', name: 'spaCy', category: 'testing' },

      // Tools
      { id: 'jupyter', name: 'Jupyter Notebook', category: 'tools' },
      { id: 'colab', name: 'Google Colab', category: 'tools' },
      { id: 'pandas', name: 'Pandas', category: 'tools' },
      { id: 'numpy', name: 'NumPy', category: 'tools' },
      { id: 'matplotlib', name: 'Matplotlib', category: 'tools' },
      { id: 'seaborn', name: 'Seaborn', category: 'tools' },
      { id: 'plotly', name: 'Plotly', category: 'tools' },
      { id: 'mlflow', name: 'MLflow', category: 'tools' },
    ],
    popularCombinations: [
      ['python', 'tensorflow', 'jupyter'],
      ['python', 'pytorch', 'pandas'],
      ['r', 'scikit-learn', 'matplotlib'],
      ['python', 'opencv', 'numpy'],
    ],
  },

  pm: {
    id: 'pm',
    title: 'Product Manager',
    description: 'Управление продуктом и координация команды разработки',
    tools: [
      // Tools
      { id: 'jira', name: 'Jira', category: 'tools' },
      { id: 'confluence', name: 'Confluence', category: 'tools' },
      { id: 'notion', name: 'Notion', category: 'tools' },
      { id: 'slack', name: 'Slack', category: 'tools' },
      { id: 'figma', name: 'Figma', category: 'tools' },
      { id: 'miro', name: 'Miro', category: 'tools' },
      { id: 'trello', name: 'Trello', category: 'tools' },
      { id: 'asana', name: 'Asana', category: 'tools' },
      { id: 'google-analytics', name: 'Google Analytics', category: 'tools' },
      { id: 'mixpanel', name: 'Mixpanel', category: 'tools' },
      { id: 'amplitude', name: 'Amplitude', category: 'tools' },
      { id: 'hotjar', name: 'Hotjar', category: 'tools' },
    ],
    popularCombinations: [
      ['jira', 'confluence', 'slack'],
      ['notion', 'figma', 'miro'],
      ['trello', 'google-analytics', 'hotjar'],
      ['asana', 'mixpanel', 'amplitude'],
    ],
  },
};

export const TOOL_CATEGORIES = {
  frameworks: 'Фреймворки',
  languages: 'Языки программирования',
  databases: 'Базы данных',
  tools: 'Инструменты',
  platforms: 'Платформы',
  design: 'Дизайн',
  testing: 'Тестирование',
  devops: 'DevOps',
};

export function getProfessionTools(professionId: string): Tool[] {
  return PROFESSIONS_DATA[professionId]?.tools || [];
}

export function getPopularCombinations(professionId: string): string[][] {
  return PROFESSIONS_DATA[professionId]?.popularCombinations || [];
}

export function getToolById(toolId: string): Tool | undefined {
  for (const profession of Object.values(PROFESSIONS_DATA)) {
    const tool = profession.tools.find((t) => t.id === toolId);
    if (tool) return tool;
  }
  return undefined;
}
