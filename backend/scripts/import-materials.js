const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importMaterials() {
  try {
    console.log('🚀 Начинаем импорт материалов...');
    
    // Путь к папке с материалами
    const materialsDir = path.join(__dirname, '../../materials');
    
    // Читаем все файлы в папке
    const files = fs.readdirSync(materialsDir).filter(file => file.endsWith('.json'));
    
    console.log(`📁 Найдено ${files.length} файлов материалов`);
    
    // Сначала очистим существующие материалы
    console.log('🧹 Очищаем существующие материалы...');
    await prisma.materialTranslation.deleteMany();
    await prisma.material.deleteMany();
    console.log('✅ Существующие материалы удалены');
    
    for (const file of files) {
      console.log(`📖 Обрабатываем файл: ${file}`);
      
      const filePath = path.join(materialsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      const { profession, language, materials } = data;
      
      console.log(`📚 Импортируем ${materials.length} материалов для профессии: ${profession}, язык: ${language}`);
      
      for (const materialData of materials) {
        try {
          // Создаем материал с переводом
          const material = await prisma.material.create({
            data: {
              profession: profession,
              category: materialData.category,
              difficulty: materialData.difficulty,
              readTime: materialData.readTime,
              rating: materialData.rating,
              reads: materialData.reads,
              tags: materialData.tags,
              isNew: materialData.isNew,
              isPopular: materialData.isPopular,
              createdAt: new Date(materialData.createdAt),
              translations: {
                create: {
                  language: language,
                  title: materialData.title,
                  description: materialData.description,
                  content: materialData.content
                }
              }
            }
          });
          
          console.log(`✅ Создан материал: ${materialData.title} (ID: ${material.id})`);
          
        } catch (error) {
          console.error(`❌ Ошибка при создании материала ${materialData.title}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Импорт материалов завершен!');
    
  } catch (error) {
    console.error('❌ Ошибка при импорте материалов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем импорт
importMaterials();
