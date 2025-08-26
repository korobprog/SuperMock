const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

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

// Кэш для отслеживания изменений
const fileCache = new Map();
let isProcessing = false;

// Функция для получения хеша файла
function getFileHash(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return `${stats.mtime.getTime()}-${stats.size}`;
  } catch (error) {
    return null;
  }
}

// Функция для обновления одного файла
async function updateSingleFile(filePath) {
  console.log(`🔄 Updating file: ${path.basename(filePath)}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const materialsData = JSON.parse(content);
    
    let updatedCount = 0;
    let createdCount = 0;

    for (const materialData of materialsData.materials || []) {
      try {
        // Проверяем, существует ли материал
        const existingMaterial = await prisma.material.findFirst({
          where: {
            profession: materialsData.profession,
            category: materialData.category,
            difficulty: materialData.difficulty,
            translations: {
              some: {
                title: materialData.title,
                language: materialsData.language
              }
            }
          },
          include: {
            translations: true
          }
        });

        if (existingMaterial) {
          // Обновляем существующий материал
          await prisma.material.update({
            where: { id: existingMaterial.id },
            data: {
              readTime: materialData.readTime,
              rating: materialData.rating,
              reads: materialData.reads,
              tags: materialData.tags,
              isNew: materialData.isNew,
              isPopular: materialData.isPopular,
              updatedAt: new Date(),
            }
          });

          // Обновляем перевод
          const existingTranslation = existingMaterial.translations.find(
            t => t.language === materialsData.language
          );

          if (existingTranslation) {
            await prisma.materialTranslation.update({
              where: { id: existingTranslation.id },
              data: {
                title: materialData.title,
                description: materialData.description,
                content: materialData.content,
                updatedAt: new Date(),
              }
            });
          } else {
            await prisma.materialTranslation.create({
              data: {
                materialId: existingMaterial.id,
                language: materialsData.language,
                title: materialData.title,
                description: materialData.description,
                content: materialData.content,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            });
          }

          updatedCount++;
        } else {
          // Создаем новый материал
          const material = await prisma.material.create({
            data: {
              profession: materialsData.profession,
              category: materialData.category,
              difficulty: materialData.difficulty,
              readTime: materialData.readTime,
              rating: materialData.rating,
              reads: materialData.reads,
              tags: materialData.tags,
              isNew: materialData.isNew,
              isPopular: materialData.isPopular,
              createdAt: new Date(materialData.createdAt),
              updatedAt: new Date(),
            }
          });

          await prisma.materialTranslation.create({
            data: {
              materialId: material.id,
              language: materialsData.language,
              title: materialData.title,
              description: materialData.description,
              content: materialData.content,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });

          createdCount++;
        }

      } catch (error) {
        console.error(`    ❌ Error processing material:`, error.message);
      }
    }

    console.log(`    ✅ Updated: ${updatedCount}, Created: ${createdCount}`);

  } catch (error) {
    console.error(`❌ Error updating file ${filePath}:`, error.message);
  }
}

// Функция для обработки изменений файлов
async function handleFileChange(filePath) {
  if (isProcessing) {
    console.log('⏳ Another update in progress, skipping...');
    return;
  }

  const currentHash = getFileHash(filePath);
  const previousHash = fileCache.get(filePath);

  if (currentHash === previousHash) {
    return; // Файл не изменился
  }

  isProcessing = true;
  console.log(`\n📝 File changed: ${path.basename(filePath)}`);

  try {
    await updateSingleFile(filePath);
    fileCache.set(filePath, currentHash);
  } catch (error) {
    console.error('❌ Error handling file change:', error);
  } finally {
    isProcessing = false;
  }
}

// Функция для инициализации кэша
function initializeCache() {
  console.log('🔍 Initializing file cache...');
  
  const materialsDir = path.join(__dirname, '..', 'materials');
  
  for (const profession of PROFESSIONS) {
    for (const language of SUPPORTED_LANGUAGES) {
      const filePath = path.join(materialsDir, `${profession}-${language}.json`);
      
      if (fs.existsSync(filePath)) {
        const hash = getFileHash(filePath);
        fileCache.set(filePath, hash);
        console.log(`  ✅ Cached: ${path.basename(filePath)}`);
      }
    }
  }
  
  console.log(`📊 Cached ${fileCache.size} files`);
}

// Функция для запуска мониторинга
function startWatching() {
  console.log('👀 Starting file watcher...');
  
  const materialsDir = path.join(__dirname, '..', 'materials');
  
  // Создаем паттерн для отслеживания всех JSON файлов материалов
  const pattern = path.join(materialsDir, '*.json');
  
  const watcher = chokidar.watch(pattern, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', (filePath) => {
      console.log(`📄 New file detected: ${path.basename(filePath)}`);
      handleFileChange(filePath);
    })
    .on('change', (filePath) => {
      console.log(`📝 File modified: ${path.basename(filePath)}`);
      handleFileChange(filePath);
    })
    .on('unlink', (filePath) => {
      console.log(`🗑️  File deleted: ${path.basename(filePath)}`);
      fileCache.delete(filePath);
    })
    .on('error', (error) => {
      console.error('❌ Watcher error:', error);
    });

  console.log('✅ File watcher started successfully!');
  console.log('📁 Watching directory:', materialsDir);
  console.log('🔄 Any changes to JSON files will automatically update the database');
  console.log('⏹️  Press Ctrl+C to stop watching');

  return watcher;
}

// Функция для создания тестового файла
function createTestFile() {
  const testFilePath = path.join(__dirname, '..', 'materials', 'test-update.json');
  
  const testData = {
    profession: 'frontend-developer',
    language: 'en',
    categories: [
      {
        id: 'test-category',
        name: 'Test Category',
        count: 1,
        icon: '🧪',
        color: 'bg-green-100 text-green-800'
      }
    ],
    materials: [
      {
        id: Date.now(),
        title: `Test Material ${Date.now()}`,
        description: 'This is a test material for watching functionality',
        category: 'test-category',
        difficulty: 'beginner',
        readTime: 5,
        rating: 4.5,
        reads: 100,
        tags: ['test', 'automation'],
        content: 'Test content for automation testing',
        isNew: true,
        isPopular: false,
        createdAt: new Date().toISOString()
      }
    ]
  };

  fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2));
  console.log(`✅ Test file created: ${testFilePath}`);
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'watch':
    initializeCache();
    const watcher = startWatching();
    
    // Обработка завершения
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping file watcher...');
      await watcher.close();
      await prisma.$disconnect();
      process.exit(0);
    });
    break;
    
  case 'test':
    createTestFile();
    break;
    
  default:
    console.log('Usage:');
    console.log('  node watch-materials.js watch - Start watching for file changes');
    console.log('  node watch-materials.js test  - Create a test file');
    console.log('');
    console.log('Note: This script requires the chokidar package:');
    console.log('  npm install chokidar');
    break;
}
