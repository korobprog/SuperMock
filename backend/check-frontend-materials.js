const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFrontendMaterials() {
  try {
    console.log('🔍 Проверяем материалы для frontend...');
    
    // Получаем все профессии
    const allProfessions = await prisma.material.groupBy({
      by: ['profession']
    });
    
    console.log('\n📊 Все профессии в базе данных:');
    allProfessions.forEach(p => console.log(`   - ${p.profession}`));
    
    // Ищем материалы для frontend
    const frontendMaterials = await prisma.material.findMany({
      where: { profession: 'frontend' },
      include: {
        translations: {
          where: { language: 'ru' }
        }
      }
    });
    
    console.log(`\n📖 Материалы для профессии "frontend": ${frontendMaterials.length}`);
    
    if (frontendMaterials.length > 0) {
      frontendMaterials.forEach((material, index) => {
        const translation = material.translations[0];
        console.log(`   ${index + 1}. ${translation?.title || 'Без названия'} (категория: ${material.category})`);
      });
    }
    
    // Проверяем материалы для "frontend-developer"
    const frontendDevMaterials = await prisma.material.findMany({
      where: { profession: 'frontend-developer' },
      include: {
        translations: {
          where: { language: 'ru' }
        }
      }
    });
    
    console.log(`\n📖 Материалы для профессии "frontend-developer": ${frontendDevMaterials.length}`);
    
    if (frontendDevMaterials.length > 0) {
      frontendDevMaterials.forEach((material, index) => {
        const translation = material.translations[0];
        console.log(`   ${index + 1}. ${translation?.title || 'Без названия'} (категория: ${material.category})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке материалов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFrontendMaterials();
