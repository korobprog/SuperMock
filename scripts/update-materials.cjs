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

// Функция для создания резервной копии
async function createBackup() {
  console.log('💾 Creating backup...');
  
  try {
    const materials = await prisma.material.findMany({
      include: {
        translations: true
      }
    });

    const backupData = {
      timestamp: new Date().toISOString(),
      materials: materials
    };

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `materials-backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    return null;
  }
}

// Функция для валидации JSON файлов
async function validateJsonFiles() {
  console.log('🔍 Validating JSON files...');
  
  const errors = [];
  const validFiles = [];

  for (const profession of PROFESSIONS) {
    for (const language of SUPPORTED_LANGUAGES) {
      const filePath = path.join(__dirname, '..', 'materials', `${profession}-${language}.json`);
      
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          
          // Проверяем структуру
          if (!data.profession || !data.language || !Array.isArray(data.materials)) {
            errors.push(`${filePath}: Invalid structure`);
          } else {
            validFiles.push(filePath);
            console.log(`✅ ${filePath}`);
          }
        } catch (error) {
          errors.push(`${filePath}: ${error.message}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.log('\n❌ Validation errors:');
    errors.forEach(error => console.log(`  ${error}`));
    return false;
  }

  console.log(`\n✅ Validation completed: ${validFiles.length} valid files`);
  return true;
}

// Функция для частичного обновления материалов
async function updateMaterials(profession = null, language = null) {
  console.log('🔄 Starting materials update...');

  try {
    // Создаем резервную копию
    await createBackup();

    let updatedCount = 0;
    let createdCount = 0;

    const professionsToUpdate = profession ? [profession] : PROFESSIONS;
    const languagesToUpdate = language ? [language] : SUPPORTED_LANGUAGES;

    for (const prof of professionsToUpdate) {
      console.log(`\n📚 Processing ${prof}...`);

      for (const lang of languagesToUpdate) {
        const filePath = path.join(__dirname, '..', 'materials', `${prof}-${lang}.json`);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  File not found: ${filePath}`);
          continue;
        }

        const materialsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`  📖 Processing ${materialsData.materials?.length || 0} materials for ${lang}`);

        for (const materialData of materialsData.materials || []) {
          try {
            // Проверяем, существует ли материал
            const existingMaterial = await prisma.material.findFirst({
              where: {
                profession: materialsData.profession,
                category: materialData.category,
                difficulty: materialData.difficulty,
                // Используем title для идентификации
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
                // Создаем новый перевод
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
              console.log(`    🔄 Updated: ${materialData.title} (${lang})`);

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

              // Создаем перевод
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
              console.log(`    ✅ Created: ${materialData.title} (${lang})`);
            }

          } catch (error) {
            console.error(`    ❌ Error processing ${materialData.title}:`, error.message);
          }
        }
      }
    }

    console.log(`\n🎉 Update completed!`);
    console.log(`📊 Materials updated: ${updatedCount}`);
    console.log(`📊 Materials created: ${createdCount}`);

  } catch (error) {
    console.error('❌ Error during update:', error);
    throw error;
  }
}

// Функция для синхронизации переводов
async function syncTranslations() {
  console.log('🌐 Syncing translations...');

  try {
    const materials = await prisma.material.findMany({
      include: {
        translations: true
      }
    });

    let syncedCount = 0;

    for (const material of materials) {
      const existingLanguages = material.translations.map(t => t.language);
      const missingLanguages = SUPPORTED_LANGUAGES.filter(lang => !existingLanguages.includes(lang));

      if (missingLanguages.length > 0) {
        console.log(`📝 Material ${material.id} missing translations: ${missingLanguages.join(', ')}`);
        
        // Здесь можно добавить логику для автоматического перевода
        // или создания placeholder переводов
        syncedCount++;
      }
    }

    console.log(`✅ Translation sync completed. ${syncedCount} materials need attention.`);

  } catch (error) {
    console.error('❌ Error during translation sync:', error);
  }
}

// Функция для экспорта материалов в JSON
async function exportMaterials(profession = null, language = null) {
  console.log('📤 Exporting materials...');

  try {
    const where = {};
    if (profession) where.profession = profession;
    if (language) {
      where.translations = {
        some: {
          language: language
        }
      };
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        translations: true
      }
    });

    const exportDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportFile = path.join(exportDir, `materials-export-${Date.now()}.json`);
    fs.writeFileSync(exportFile, JSON.stringify(materials, null, 2));

    console.log(`✅ Export completed: ${exportFile}`);
    console.log(`📊 Exported ${materials.length} materials`);

  } catch (error) {
    console.error('❌ Error during export:', error);
  }
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const command = args[0];
const profession = args[1];
const language = args[2];

switch (command) {
  case 'update':
    updateMaterials(profession, language);
    break;
  case 'validate':
    validateJsonFiles();
    break;
  case 'sync':
    syncTranslations();
    break;
  case 'export':
    exportMaterials(profession, language);
    break;
  case 'backup':
    createBackup();
    break;
  default:
    console.log('Usage:');
    console.log('  node update-materials.js update [profession] [language] - Update materials');
    console.log('  node update-materials.js validate                      - Validate JSON files');
    console.log('  node update-materials.js sync                         - Sync translations');
    console.log('  node update-materials.js export [profession] [language] - Export materials');
    console.log('  node update-materials.js backup                       - Create backup');
    console.log('');
    console.log('Examples:');
    console.log('  node update-materials.js update                        - Update all materials');
    console.log('  node update-materials.js update frontend-developer     - Update specific profession');
    console.log('  node update-materials.js update frontend-developer en  - Update specific profession and language');
    break;
}

// Закрываем соединение с базой данных
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
