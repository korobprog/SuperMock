const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Простой тест эндпоинт
app.get('/test-materials', async (req, res) => {
  try {
    console.log('🧪 Testing materials API...');
    
    const materials = await prisma.material.findMany({
      where: { profession: 'frontend' },
      include: {
        translations: {
          where: { language: 'ru' }
        }
      },
      take: 5
    });
    
    console.log(`Found ${materials.length} materials`);
    
    const formattedMaterials = materials.map(material => {
      const translation = material.translations[0];
      return {
        id: material.id,
        title: translation?.title || `Material ${material.id}`,
        description: translation?.description || 'No description available',
        category: material.category,
        profession: material.profession
      };
    });
    
    res.json({ materials: formattedMaterials });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('🚀 Test server running on port 3001');
});
