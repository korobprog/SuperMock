const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMaterialsAPI() {
  try {
    console.log('🧪 Тестируем API материалов...');
    
    // Тест 1: Получить материалы для frontend
    console.log('\n1️⃣ Тест получения материалов для frontend:');
    const frontendMaterials = await prisma.material.findMany({
      where: { profession: 'frontend' },
      include: {
        translations: {
          where: { language: 'ru' }
        }
      },
      take: 5
    });
    
    console.log(`   Найдено материалов: ${frontendMaterials.length}`);
    
    if (frontendMaterials.length > 0) {
      const material = frontendMaterials[0];
      console.log(`   Пример: ${material.translations[0]?.title || 'Нет перевода'}`);
    }
    
    // Тест 2: Получить категории
    console.log('\n2️⃣ Тест получения категорий:');
    const categories = await prisma.material.groupBy({
      by: ['category'],
      where: { profession: 'frontend' },
      _count: { category: true }
    });
    
    console.log(`   Найдено категорий: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat._count.category} материалов`);
    });
    
    // Тест 3: Получить популярные материалы
    console.log('\n3️⃣ Тест получения популярных материалов:');
    const popularMaterials = await prisma.material.findMany({
      where: { 
        profession: 'frontend',
        isPopular: true 
      },
      include: {
        translations: {
          where: { language: 'ru' }
        }
      },
      take: 3
    });
    
    console.log(`   Найдено популярных материалов: ${popularMaterials.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMaterialsAPI();
