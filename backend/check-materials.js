const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMaterials() {
  try {
    const materialCount = await prisma.material.count();
    const translationCount = await prisma.materialTranslation.count();
    
    console.log(`📊 Материалы в базе данных:`);
    console.log(`   - Материалов: ${materialCount}`);
    console.log(`   - Переводов: ${translationCount}`);
    
    if (materialCount > 0) {
      const sampleMaterial = await prisma.material.findFirst({
        include: {
          translations: true
        }
      });
      
      console.log(`\n📖 Пример материала:`);
      console.log(`   - ID: ${sampleMaterial.id}`);
      console.log(`   - Профессия: ${sampleMaterial.profession}`);
      console.log(`   - Категория: ${sampleMaterial.category}`);
      console.log(`   - Переводов: ${sampleMaterial.translations.length}`);
      
      if (sampleMaterial.translations.length > 0) {
        console.log(`   - Первый перевод: ${sampleMaterial.translations[0].title}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке материалов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMaterials();
