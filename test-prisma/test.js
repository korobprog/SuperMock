const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.$connect()
    console.log('✅ Connected successfully!')
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Connection failed:', error)
  }
}

test()
