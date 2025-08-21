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
  titleKey: string; // Ключ для перевода заголовка
  descriptionKey: string; // Ключ для перевода описания
  tools: Tool[];
  popularCombinations: string[][];
}

export const PROFESSIONS_DATA: Record<string, Profession> = {
  frontend: {
    id: 'frontend',
    titleKey: 'profession.frontend',
    descriptionKey: 'profession.frontendDesc',
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
    titleKey: 'profession.backend',
    descriptionKey: 'profession.backendDesc',
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
    titleKey: 'profession.fullstack',
    descriptionKey: 'profession.fullstackDesc',
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
      { id: 'csharp', name: 'C#', category: 'languages' },
      { id: 'dotnet', name: '.NET', category: 'frameworks' },

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
      ['nextjs', 'typescript', 'mongodb'],
    ],
  },

  mobile: {
    id: 'mobile',
    titleKey: 'profession.mobile',
    descriptionKey: 'profession.mobileDesc',
    tools: [
      // Platforms
      { id: 'ios', name: 'iOS', category: 'platforms' },
      { id: 'android', name: 'Android', category: 'platforms' },
      { id: 'flutter', name: 'Flutter', category: 'frameworks' },
      { id: 'reactnative', name: 'React Native', category: 'frameworks' },
      { id: 'xamarin', name: 'Xamarin', category: 'frameworks' },
      { id: 'kotlin', name: 'Kotlin', category: 'languages' },
      { id: 'swift', name: 'Swift', category: 'languages' },
      { id: 'dart', name: 'Dart', category: 'languages' },
      { id: 'javascript', name: 'JavaScript', category: 'languages' },
      { id: 'typescript', name: 'TypeScript', category: 'languages' },

      // Tools
      { id: 'androidstudio', name: 'Android Studio', category: 'tools' },
      { id: 'xcode', name: 'Xcode', category: 'tools' },
      { id: 'firebase', name: 'Firebase', category: 'platforms' },
      { id: 'git', name: 'Git', category: 'tools' },
      { id: 'figma', name: 'Figma', category: 'design' },
    ],
    popularCombinations: [
      ['flutter', 'dart', 'firebase'],
      ['reactnative', 'javascript', 'firebase'],
      ['ios', 'swift', 'xcode'],
      ['android', 'kotlin', 'androidstudio'],
    ],
  },

  devops: {
    id: 'devops',
    titleKey: 'profession.devops',
    descriptionKey: 'profession.devopsDesc',
    tools: [
      // Infrastructure
      { id: 'docker', name: 'Docker', category: 'tools' },
      { id: 'kubernetes', name: 'Kubernetes', category: 'tools' },
      { id: 'terraform', name: 'Terraform', category: 'tools' },
      { id: 'ansible', name: 'Ansible', category: 'tools' },
      { id: 'jenkins', name: 'Jenkins', category: 'tools' },
      { id: 'gitlab', name: 'GitLab CI', category: 'tools' },
      { id: 'github', name: 'GitHub Actions', category: 'tools' },

      // Cloud Platforms
      { id: 'aws', name: 'AWS', category: 'platforms' },
      { id: 'azure', name: 'Azure', category: 'platforms' },
      { id: 'gcp', name: 'Google Cloud', category: 'platforms' },

      // Monitoring
      { id: 'prometheus', name: 'Prometheus', category: 'tools' },
      { id: 'grafana', name: 'Grafana', category: 'tools' },
      { id: 'elk', name: 'ELK Stack', category: 'tools' },

      // Languages
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'bash', name: 'Bash', category: 'languages' },
      { id: 'yaml', name: 'YAML', category: 'languages' },
      { id: 'json', name: 'JSON', category: 'languages' },
    ],
    popularCombinations: [
      ['docker', 'kubernetes', 'aws'],
      ['terraform', 'ansible', 'azure'],
      ['jenkins', 'prometheus', 'grafana'],
      ['gitlab', 'docker', 'gcp'],
    ],
  },

  qa: {
    id: 'qa',
    titleKey: 'profession.qa',
    descriptionKey: 'profession.qaDesc',
    tools: [
      // Testing Frameworks
      { id: 'selenium', name: 'Selenium', category: 'testing' },
      { id: 'cypress', name: 'Cypress', category: 'testing' },
      { id: 'playwright', name: 'Playwright', category: 'testing' },
      { id: 'jest', name: 'Jest', category: 'testing' },
      { id: 'pytest', name: 'pytest', category: 'testing' },
      { id: 'junit', name: 'JUnit', category: 'testing' },
      { id: 'mocha', name: 'Mocha', category: 'testing' },

      // Languages
      { id: 'javascript', name: 'JavaScript', category: 'languages' },
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'java', name: 'Java', category: 'languages' },
      { id: 'typescript', name: 'TypeScript', category: 'languages' },

      // Tools
      { id: 'postman', name: 'Postman', category: 'tools' },
      { id: 'jmeter', name: 'Apache JMeter', category: 'tools' },
      { id: 'git', name: 'Git', category: 'tools' },
      { id: 'jenkins', name: 'Jenkins', category: 'tools' },
      { id: 'jira', name: 'Jira', category: 'tools' },
      { id: 'confluence', name: 'Confluence', category: 'tools' },
    ],
    popularCombinations: [
      ['selenium', 'python', 'pytest'],
      ['cypress', 'javascript', 'jenkins'],
      ['playwright', 'typescript', 'jira'],
      ['postman', 'javascript', 'git'],
    ],
  },

  designer: {
    id: 'designer',
    titleKey: 'profession.designer',
    descriptionKey: 'profession.designerDesc',
    tools: [
      // Design Tools
      { id: 'figma', name: 'Figma', category: 'design' },
      { id: 'sketch', name: 'Sketch', category: 'design' },
      { id: 'adobexd', name: 'Adobe XD', category: 'design' },
      { id: 'photoshop', name: 'Photoshop', category: 'design' },
      { id: 'illustrator', name: 'Illustrator', category: 'design' },
      { id: 'invision', name: 'InVision', category: 'design' },
      { id: 'principle', name: 'Principle', category: 'design' },

      // Prototyping
      { id: 'protopie', name: 'ProtoPie', category: 'design' },
      { id: 'framer', name: 'Framer', category: 'design' },

      // Research
      { id: 'maze', name: 'Maze', category: 'design' },
      { id: 'hotjar', name: 'Hotjar', category: 'design' },
      { id: 'googleanalytics', name: 'Google Analytics', category: 'tools' },

      // Collaboration
      { id: 'notion', name: 'Notion', category: 'tools' },
      { id: 'slack', name: 'Slack', category: 'tools' },
      { id: 'trello', name: 'Trello', category: 'tools' },
    ],
    popularCombinations: [
      ['figma', 'invision', 'maze'],
      ['sketch', 'principle', 'hotjar'],
      ['adobexd', 'framer', 'googleanalytics'],
      ['figma', 'notion', 'slack'],
    ],
  },

  analyst: {
    id: 'analyst',
    titleKey: 'profession.analyst',
    descriptionKey: 'profession.analystDesc',
    tools: [
      // Programming Languages
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'r', name: 'R', category: 'languages' },
      { id: 'sql', name: 'SQL', category: 'languages' },
      { id: 'javascript', name: 'JavaScript', category: 'languages' },

      // Data Analysis
      { id: 'pandas', name: 'Pandas', category: 'tools' },
      { id: 'numpy', name: 'NumPy', category: 'tools' },
      { id: 'matplotlib', name: 'Matplotlib', category: 'tools' },
      { id: 'seaborn', name: 'Seaborn', category: 'tools' },
      { id: 'plotly', name: 'Plotly', category: 'tools' },
      { id: 'tableau', name: 'Tableau', category: 'tools' },
      { id: 'powerbi', name: 'Power BI', category: 'tools' },

      // Databases
      { id: 'postgresql', name: 'PostgreSQL', category: 'databases' },
      { id: 'mysql', name: 'MySQL', category: 'databases' },
      { id: 'mongodb', name: 'MongoDB', category: 'databases' },
      { id: 'bigquery', name: 'BigQuery', category: 'databases' },

      // Tools
      { id: 'excel', name: 'Excel', category: 'tools' },
      { id: 'jupyter', name: 'Jupyter Notebook', category: 'tools' },
      { id: 'git', name: 'Git', category: 'tools' },
    ],
    popularCombinations: [
      ['python', 'pandas', 'postgresql'],
      ['r', 'tableau', 'excel'],
      ['sql', 'powerbi', 'bigquery'],
      ['python', 'jupyter', 'matplotlib'],
    ],
  },

  scientist: {
    id: 'scientist',
    titleKey: 'profession.scientist',
    descriptionKey: 'profession.scientistDesc',
    tools: [
      // Programming Languages
      { id: 'python', name: 'Python', category: 'languages' },
      { id: 'r', name: 'R', category: 'languages' },
      { id: 'julia', name: 'Julia', category: 'languages' },
      { id: 'scala', name: 'Scala', category: 'languages' },

      // Machine Learning
      { id: 'tensorflow', name: 'TensorFlow', category: 'tools' },
      { id: 'pytorch', name: 'PyTorch', category: 'tools' },
      { id: 'scikit', name: 'Scikit-learn', category: 'tools' },
      { id: 'keras', name: 'Keras', category: 'tools' },
      { id: 'xgboost', name: 'XGBoost', category: 'tools' },
      { id: 'lightgbm', name: 'LightGBM', category: 'tools' },

      // Data Processing
      { id: 'pandas', name: 'Pandas', category: 'tools' },
      { id: 'numpy', name: 'NumPy', category: 'tools' },
      { id: 'spark', name: 'Apache Spark', category: 'tools' },
      { id: 'hadoop', name: 'Hadoop', category: 'tools' },

      // Visualization
      { id: 'matplotlib', name: 'Matplotlib', category: 'tools' },
      { id: 'seaborn', name: 'Seaborn', category: 'tools' },
      { id: 'plotly', name: 'Plotly', category: 'tools' },
      { id: 'd3', name: 'D3.js', category: 'tools' },

      // Tools
      { id: 'jupyter', name: 'Jupyter Notebook', category: 'tools' },
      { id: 'git', name: 'Git', category: 'tools' },
      { id: 'docker', name: 'Docker', category: 'tools' },
    ],
    popularCombinations: [
      ['python', 'tensorflow', 'pandas'],
      ['python', 'pytorch', 'numpy'],
      ['r', 'spark', 'hadoop'],
      ['python', 'scikit', 'jupyter'],
    ],
  },

  pm: {
    id: 'pm',
    titleKey: 'profession.pm',
    descriptionKey: 'profession.pmDesc',
    tools: [
      // Project Management
      { id: 'jira', name: 'Jira', category: 'tools' },
      { id: 'confluence', name: 'Confluence', category: 'tools' },
      { id: 'trello', name: 'Trello', category: 'tools' },
      { id: 'asana', name: 'Asana', category: 'tools' },
      { id: 'notion', name: 'Notion', category: 'tools' },
      { id: 'monday', name: 'Monday.com', category: 'tools' },

      // Communication
      { id: 'slack', name: 'Slack', category: 'tools' },
      { id: 'teams', name: 'Microsoft Teams', category: 'tools' },
      { id: 'zoom', name: 'Zoom', category: 'tools' },
      { id: 'figma', name: 'Figma', category: 'design' },

      // Analytics
      { id: 'googleanalytics', name: 'Google Analytics', category: 'tools' },
      { id: 'mixpanel', name: 'Mixpanel', category: 'tools' },
      { id: 'amplitude', name: 'Amplitude', category: 'tools' },
      { id: 'hotjar', name: 'Hotjar', category: 'tools' },

      // Documentation
      { id: 'google', name: 'Google Docs', category: 'tools' },
      { id: 'excel', name: 'Excel', category: 'tools' },
      { id: 'powerpoint', name: 'PowerPoint', category: 'tools' },
      { id: 'miro', name: 'Miro', category: 'tools' },
    ],
    popularCombinations: [
      ['jira', 'confluence', 'slack'],
      ['trello', 'notion', 'zoom'],
      ['asana', 'figma', 'googleanalytics'],
      ['monday', 'teams', 'excel'],
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
