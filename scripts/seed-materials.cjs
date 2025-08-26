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

async function loadMaterialsFromFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

async function seedMaterials() {
  console.log('🌱 Starting materials seeding...');

  try {
    // Очищаем существующие материалы
    console.log('🧹 Cleaning existing materials...');
    await prisma.materialTranslation.deleteMany();
    await prisma.material.deleteMany();

    let totalMaterials = 0;
    let totalTranslations = 0;

    // Загружаем материалы для каждой профессии
    for (const profession of PROFESSIONS) {
      console.log(`\n📚 Processing ${profession}...`);

      for (const language of SUPPORTED_LANGUAGES) {
        const filePath = path.join(__dirname, '..', 'materials', `${profession}-${language}.json`);
        
        // Проверяем, существует ли файл
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  File not found: ${filePath}`);
          continue;
        }

        const materialsData = await loadMaterialsFromFile(filePath);
        if (!materialsData) continue;

        console.log(`  📖 Loading ${materialsData.materials?.length || 0} materials for ${language}`);

        // Создаем материалы
        for (const materialData of materialsData.materials || []) {
          try {
            // Создаем основной материал
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

            totalMaterials++;

            // Создаем перевод
            const translation = await prisma.materialTranslation.create({
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

            totalTranslations++;

            console.log(`    ✅ Created material: ${materialData.title} (${language})`);

          } catch (error) {
            console.error(`    ❌ Error creating material ${materialData.title}:`, error.message);
          }
        }
      }
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`📊 Total materials created: ${totalMaterials}`);
    console.log(`🌐 Total translations created: ${totalTranslations}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function validateMaterials() {
  console.log('🔍 Validating materials...');

  try {
    const materials = await prisma.material.findMany({
      include: {
        translations: true
      }
    });

    console.log(`📊 Found ${materials.length} materials`);

    // Проверяем, что у каждого материала есть переводы
    for (const material of materials) {
      if (material.translations.length === 0) {
        console.warn(`⚠️  Material ${material.id} has no translations`);
      } else {
        console.log(`✅ Material ${material.id} has ${material.translations.length} translations`);
      }
    }

    // Группируем по профессиям
    const byProfession = {};
    for (const material of materials) {
      if (!byProfession[material.profession]) {
        byProfession[material.profession] = 0;
      }
      byProfession[material.profession]++;
    }

    console.log('\n📈 Materials by profession:');
    for (const [profession, count] of Object.entries(byProfession)) {
      console.log(`  ${profession}: ${count} materials`);
    }

  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'seed':
    seedMaterials();
    break;
  case 'validate':
    validateMaterials();
    break;
  case 'reset':
    console.log('🔄 Resetting materials...');
    prisma.materialTranslation.deleteMany()
      .then(() => prisma.material.deleteMany())
      .then(() => {
        console.log('✅ Materials reset completed');
        return prisma.$disconnect();
      })
      .catch(console.error);
    break;
  default:
    console.log('Usage:');
    console.log('  node seed-materials.js seed     - Seed materials from JSON files');
    console.log('  node seed-materials.js validate - Validate existing materials');
    console.log('  node seed-materials.js reset    - Reset all materials');
    break;
}
