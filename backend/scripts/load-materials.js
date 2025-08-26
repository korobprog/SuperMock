const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Маппинг профессий
const professionMapping = {
  'frontend-developer': 'frontend',
  'backend-developer': 'backend',
  'fullstack-developer': 'fullstack',
  'mobile-developer': 'mobile',
  'devops-engineer': 'devops',
  'qa-engineer': 'qa',
  'ux-ui-designer': 'designer',
  'data-analyst': 'analyst',
  'data-scientist': 'scientist',
  'product-manager': 'pm'
};

async function loadMaterials() {
  try {
    console.log('🚀 Начинаем загрузку материалов в базу данных...');
    
    const materialsDir = path.join(__dirname, '../../materials');
    const files = fs.readdirSync(materialsDir).filter(file => file.endsWith('.json'));
    
    console.log(`📁 Найдено ${files.length} файлов материалов`);
    
    let totalMaterials = 0;
    let totalTranslations = 0;
    
    // Группируем файлы по профессии
    const materialsByProfession = {};
    
    for (const file of files) {
      const filePath = path.join(materialsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      const { profession, language, materials } = data;
      const mappedProfession = professionMapping[profession] || profession;
      
      if (!materialsByProfession[mappedProfession]) {
        materialsByProfession[mappedProfession] = {};
      }
      
      materialsByProfession[mappedProfession][language] = materials;
    }
    
    // Обрабатываем каждую профессию
    for (const [profession, languages] of Object.entries(materialsByProfession)) {
      console.log(`📖 Обрабатываем профессию: ${profession}`);
      
      // Берем материалы из первого языка как основу
      const firstLanguage = Object.keys(languages)[0];
      const baseMaterials = languages[firstLanguage];
      
      for (const material of baseMaterials) {
        try {
          // Проверяем, существует ли уже материал с таким названием
          const existingMaterial = await prisma.material.findFirst({
            where: {
              profession: profession,
              category: material.category,
              translations: {
                some: {
                  title: material.title
                }
              }
            }
          });
          
          let createdMaterial;
          
          if (existingMaterial) {
            // Обновляем существующий материал
            createdMaterial = await prisma.material.update({
              where: { id: existingMaterial.id },
              data: {
                profession: profession,
                category: material.category,
                difficulty: material.difficulty,
                readTime: material.readTime,
                rating: material.rating,
                reads: material.reads,
                tags: material.tags,
                isNew: material.isNew,
                isPopular: material.isPopular,
                createdAt: new Date(material.createdAt)
              }
            });
          } else {
            // Создаем новый материал
            createdMaterial = await prisma.material.create({
              data: {
                profession: profession,
                category: material.category,
                difficulty: material.difficulty,
                readTime: material.readTime,
                rating: material.rating,
                reads: material.reads,
                tags: material.tags,
                isNew: material.isNew,
                isPopular: material.isPopular,
                createdAt: new Date(material.createdAt)
              }
            });
          }
          
          totalMaterials++;
          
          // Создаем переводы для всех языков
          for (const [lang, langMaterials] of Object.entries(languages)) {
            const langMaterial = langMaterials.find(m => m.id === material.id);
            if (langMaterial) {
              try {
                await prisma.materialTranslation.upsert({
                  where: {
                    materialId_language: {
                      materialId: createdMaterial.id,
                      language: lang
                    }
                  },
                  update: {
                    title: langMaterial.title,
                    description: langMaterial.description,
                    content: langMaterial.content
                  },
                  create: {
                    materialId: createdMaterial.id,
                    language: lang,
                    title: langMaterial.title,
                    description: langMaterial.description,
                    content: langMaterial.content
                  }
                });
                totalTranslations++;
              } catch (error) {
                console.error(`❌ Ошибка при загрузке перевода ${lang} для материала "${material.title}":`, error.message);
              }
            }
          }
          
        } catch (error) {
          console.error(`❌ Ошибка при загрузке материала "${material.title}":`, error.message);
        }
      }
    }
    
    console.log(`✅ Загрузка завершена!`);
    console.log(`📊 Статистика:`);
    console.log(`   - Загружено материалов: ${totalMaterials}`);
    console.log(`   - Загружено переводов: ${totalTranslations}`);
    console.log(`   - Обработано файлов: ${files.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка при загрузке материалов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем загрузку
loadMaterials();
