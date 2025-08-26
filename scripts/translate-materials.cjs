const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Поддерживаемые языки
const SUPPORTED_LANGUAGES = ['ru', 'en', 'es', 'de', 'fr', 'zh'];

// Профессии
const PROFESSIONS = [
  'frontend-developer',
  'backend-developer',
  'fullstack-developer',
  'mobile-developer',
  'devops-engineer',
  'qa-engineer',
  'ux-ui-designer',
  'data-analyst',
  'data-scientist',
  'product-manager'
];

// Простая функция перевода (заглушка - можно заменить на реальный API)
async function translateText(text, targetLanguage, sourceLanguage = 'en') {
  // Здесь можно интегрировать с Google Translate API, DeepL, или другими сервисами
  // Пока возвращаем заглушку
  
  const translations = {
    'ru': {
      'JavaScript Interview Questions': 'Вопросы на собеседовании по JavaScript',
      'React Hooks Guide': 'Руководство по React Hooks',
      'TypeScript Advanced Types': 'Продвинутые типы TypeScript',
      'Node.js Fundamentals': 'Основы Node.js',
      'Database Design': 'Проектирование баз данных',
      'API Design': 'Проектирование API'
    },
    'es': {
      'JavaScript Interview Questions': 'Preguntas de entrevista de JavaScript',
      'React Hooks Guide': 'Guía de React Hooks',
      'TypeScript Advanced Types': 'Tipos avanzados de TypeScript',
      'Node.js Fundamentals': 'Fundamentos de Node.js',
      'Database Design': 'Diseño de bases de datos',
      'API Design': 'Diseño de API'
    },
    'de': {
      'JavaScript Interview Questions': 'JavaScript Interview Fragen',
      'React Hooks Guide': 'React Hooks Anleitung',
      'TypeScript Advanced Types': 'TypeScript Erweiterte Typen',
      'Node.js Fundamentals': 'Node.js Grundlagen',
      'Database Design': 'Datenbankdesign',
      'API Design': 'API Design'
    },
    'fr': {
      'JavaScript Interview Questions': 'Questions d\'entretien JavaScript',
      'React Hooks Guide': 'Guide des React Hooks',
      'TypeScript Advanced Types': 'Types avancés TypeScript',
      'Node.js Fundamentals': 'Fondamentaux Node.js',
      'Database Design': 'Conception de base de données',
      'API Design': 'Conception d\'API'
    },
    'zh': {
      'JavaScript Interview Questions': 'JavaScript 面试问题',
      'React Hooks Guide': 'React Hooks 指南',
      'TypeScript Advanced Types': 'TypeScript 高级类型',
      'Node.js Fundamentals': 'Node.js 基础',
      'Database Design': '数据库设计',
      'API Design': 'API 设计'
    }
  };

  // Простая логика перевода
  if (translations[targetLanguage] && translations[targetLanguage][text]) {
    return translations[targetLanguage][text];
  }

  // Если нет готового перевода, возвращаем оригинал с пометкой
  return `[${targetLanguage.toUpperCase()}] ${text}`;
}

// Функция для создания недостающих переводов
async function createMissingTranslations() {
  console.log('🌐 Creating missing translations...');

  try {
    const materials = await prisma.material.findMany({
      include: {
        translations: true
      }
    });

    let createdCount = 0;

    for (const material of materials) {
      const existingLanguages = material.translations.map(t => t.language);
      const missingLanguages = SUPPORTED_LANGUAGES.filter(lang => !existingLanguages.includes(lang));

      if (missingLanguages.length > 0) {
        console.log(`📝 Material ${material.id} missing translations: ${missingLanguages.join(', ')}`);

        // Берем английский перевод как базовый (или первый доступный)
        const baseTranslation = material.translations.find(t => t.language === 'en') || material.translations[0];

        if (baseTranslation) {
          for (const targetLang of missingLanguages) {
            try {
              // Переводим заголовок и описание
              const translatedTitle = await translateText(baseTranslation.title, targetLang, baseTranslation.language);
              const translatedDescription = await translateText(baseTranslation.description, targetLang, baseTranslation.language);
              
              // Для контента можно использовать placeholder или перевести частично
              const translatedContent = `[${targetLang.toUpperCase()}] ${baseTranslation.content.substring(0, 100)}...`;

              // Создаем перевод
              await prisma.materialTranslation.create({
                data: {
                  materialId: material.id,
                  language: targetLang,
                  title: translatedTitle,
                  description: translatedDescription,
                  content: translatedContent,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              });

              createdCount++;
              console.log(`    ✅ Created ${targetLang} translation: ${translatedTitle}`);

            } catch (error) {
              console.error(`    ❌ Error creating ${targetLang} translation:`, error.message);
            }
          }
        }
      }
    }

    console.log(`\n🎉 Translation creation completed!`);
    console.log(`📊 Translations created: ${createdCount}`);

  } catch (error) {
    console.error('❌ Error during translation creation:', error);
  }
}

// Функция для генерации JSON файлов из базы данных
async function generateJsonFiles() {
  console.log('📄 Generating JSON files from database...');

  try {
    for (const profession of PROFESSIONS) {
      console.log(`\n📚 Processing ${profession}...`);

      const materials = await prisma.material.findMany({
        where: { profession },
        include: {
          translations: true
        }
      });

      if (materials.length === 0) {
        console.log(`  ⚠️  No materials found for ${profession}`);
        continue;
      }

      // Группируем материалы по языкам
      const materialsByLanguage = {};

      for (const material of materials) {
        for (const translation of material.translations) {
          const lang = translation.language;
          
          if (!materialsByLanguage[lang]) {
            materialsByLanguage[lang] = {
              profession: material.profession,
              language: lang,
              categories: [],
              materials: []
            };
          }

          // Добавляем категорию, если её нет
          const categoryExists = materialsByLanguage[lang].categories.find(c => c.id === material.category);
          if (!categoryExists) {
            materialsByLanguage[lang].categories.push({
              id: material.category,
              name: material.category, // Можно добавить локализованные названия
              count: 1,
              icon: "📚",
              color: "bg-blue-100 text-blue-800"
            });
          } else {
            categoryExists.count++;
          }

          // Добавляем материал
          materialsByLanguage[lang].materials.push({
            id: material.id,
            title: translation.title,
            description: translation.description,
            category: material.category,
            difficulty: material.difficulty,
            readTime: material.readTime,
            rating: material.rating,
            reads: material.reads,
            tags: material.tags,
            content: translation.content,
            isNew: material.isNew,
            isPopular: material.isPopular,
            createdAt: material.createdAt.toISOString()
          });
        }
      }

      // Сохраняем файлы для каждого языка
      for (const [lang, data] of Object.entries(materialsByLanguage)) {
        const filePath = path.join(__dirname, '..', 'materials', `${profession}-${lang}.json`);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`  ✅ Generated: ${filePath} (${data.materials.length} materials)`);
      }
    }

    console.log(`\n🎉 JSON generation completed!`);

  } catch (error) {
    console.error('❌ Error during JSON generation:', error);
  }
}

// Функция для проверки качества переводов
async function checkTranslationQuality() {
  console.log('🔍 Checking translation quality...');

  try {
    const materials = await prisma.material.findMany({
      include: {
        translations: true
      }
    });

    let issues = 0;

    for (const material of materials) {
      const translations = material.translations;
      
      // Проверяем, что все переводы имеют разумную длину
      for (const translation of translations) {
        if (translation.title.length < 5) {
          console.log(`⚠️  Short title in ${translation.language}: ${translation.title}`);
          issues++;
        }

        if (translation.description.length < 10) {
          console.log(`⚠️  Short description in ${translation.language}: ${translation.description}`);
          issues++;
        }

        // Проверяем на placeholder переводы
        if (translation.title.includes('[EN]') || translation.title.includes('[RU]') || 
            translation.title.includes('[ES]') || translation.title.includes('[DE]') ||
            translation.title.includes('[FR]') || translation.title.includes('[ZH]')) {
          console.log(`⚠️  Placeholder title in ${translation.language}: ${translation.title}`);
          issues++;
        }
      }

      // Проверяем, что у материала есть переводы на все языки
      const existingLanguages = translations.map(t => t.language);
      const missingLanguages = SUPPORTED_LANGUAGES.filter(lang => !existingLanguages.includes(lang));
      
      if (missingLanguages.length > 0) {
        console.log(`⚠️  Material ${material.id} missing translations: ${missingLanguages.join(', ')}`);
        issues++;
      }
    }

    console.log(`\n📊 Quality check completed!`);
    console.log(`⚠️  Issues found: ${issues}`);

  } catch (error) {
    console.error('❌ Error during quality check:', error);
  }
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    createMissingTranslations();
    break;
  case 'generate':
    generateJsonFiles();
    break;
  case 'check':
    checkTranslationQuality();
    break;
  default:
    console.log('Usage:');
    console.log('  node translate-materials.js create  - Create missing translations');
    console.log('  node translate-materials.js generate - Generate JSON files from DB');
    console.log('  node translate-materials.js check    - Check translation quality');
    break;
}

// Закрываем соединение с базой данных
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
