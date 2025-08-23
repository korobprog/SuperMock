import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

async function debugSlotIssue() {
  try {
    console.log('🔍 Отладка проблемы со слотами...\n');

    // Проверяем все записи в очереди
    console.log('📋 Все записи в очереди:');
    const allEntries = await prisma.userQueue.findMany({
      include: { user: true },
      orderBy: { slotUtc: 'asc' }
    });

    allEntries.forEach(entry => {
      const name = entry.user.firstName + ' ' + entry.user.lastName;
      console.log(`   - ${name}: ${entry.slotUtc} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

    // Проверяем слот 04:00 UTC
    console.log('\n📊 Записи в слоте 04:00 UTC:');
    const slot04Entries = await prisma.userQueue.findMany({
      where: { slotUtc: '2025-08-22T04:00:00.000Z' },
      include: { user: true }
    });

    slot04Entries.forEach(entry => {
      const name = entry.user.firstName + ' ' + entry.user.lastName;
      console.log(`   - ${name} (${entry.role}) - ${entry.profession} - ${entry.language}`);
    });

    // Тестируем конвертацию времени
    console.log('\n🕐 Тестируем конвертацию времени:');
    const utcTime = '2025-08-22T04:00:00.000Z';
    const vladivostokTime = DateTime.fromISO(utcTime).setZone('Asia/Vladivostok');
    const moscowTime = DateTime.fromISO(utcTime).setZone('Europe/Moscow');
    
    console.log(`   UTC: ${utcTime}`);
    console.log(`   Asia/Vladivostok: ${vladivostokTime.toFormat('HH:mm')}`);
    console.log(`   Europe/Moscow: ${moscowTime.toFormat('HH:mm')}`);

    // Проверяем, есть ли записи для frontend/ru
    console.log('\n🔍 Записи для frontend/ru:');
    const frontendRuEntries = await prisma.userQueue.findMany({
      where: {
        profession: 'frontend',
        language: 'ru'
      },
      include: { user: true }
    });

    frontendRuEntries.forEach(entry => {
      const name = entry.user.firstName + ' ' + entry.user.lastName;
      console.log(`   - ${name}: ${entry.slotUtc} (${entry.role})`);
    });

    // Проверяем предпочтения
    console.log('\n📅 Предпочтения:');
    const preferences = await prisma.preference.findMany({
      include: { user: true }
    });

    preferences.forEach(pref => {
      const name = pref.user.firstName + ' ' + pref.user.lastName;
      console.log(`   - ${name}: ${pref.role} - ${pref.profession} - ${pref.language} - ${pref.slotsUtc}`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSlotIssue();
