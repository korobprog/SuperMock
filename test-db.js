import { PrismaClient } from '@prisma/client';

async function testDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection OK:', result);
    
    const materialsCount = await prisma.material.count();
    console.log('Materials count:', materialsCount);
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
