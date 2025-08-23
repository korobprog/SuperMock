#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки системы синхронизации времени
 * Демонстрирует работу конвертации между разными часовыми поясами
 */

import { DateTime } from 'luxon';

// Тестовые часовые пояса
const timezones = [
  { name: 'Москва', zone: 'Europe/Moscow', offset: 'UTC+3' },
  { name: 'Владивосток', zone: 'Asia/Vladivostok', offset: 'UTC+10' },
  { name: 'Екатеринбург', zone: 'Asia/Yekaterinburg', offset: 'UTC+5' },
  { name: 'Лондон', zone: 'Europe/London', offset: 'UTC+0' },
  { name: 'Нью-Йорк', zone: 'America/New_York', offset: 'UTC-5' },
  { name: 'Лос-Анджелес', zone: 'America/Los_Angeles', offset: 'UTC-8' },
  { name: 'Токио', zone: 'Asia/Tokyo', offset: 'UTC+9' },
  { name: 'Дубай', zone: 'Asia/Dubai', offset: 'UTC+4' },
];

// Функция конвертации локального времени в UTC
function convertLocalToUTC(localTime, timezone) {
  const [hours, minutes] = localTime.split(':').map(Number);
  const localDate = DateTime.now().setZone(timezone);
  const slotDate = localDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  const utcDate = slotDate.toUTC();
  return utcDate.toFormat('HH:mm');
}

// Функция конвертации UTC времени в локальное
function convertUTCToLocal(utcTime, timezone) {
  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcDate = DateTime.utc().set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  const localDate = utcDate.setZone(timezone);
  return localDate.toFormat('HH:mm');
}

// Функция создания UTC слота из локального времени
function createUTCSlotFromLocal(localTime, timezone) {
  const [hours, minutes] = localTime.split(':').map(Number);
  const localDate = DateTime.now().setZone(timezone);
  const slotDate = localDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  const utcDate = slotDate.toUTC();
  return utcDate.toISO();
}

// Тестовые временные слоты
const testSlots = ['09:00', '12:00', '15:00', '18:00', '21:00'];

console.log('🌍 Тест системы синхронизации времени\n');

// Тест 1: Конвертация из Москвы в другие часовые пояса
console.log('📋 Тест 1: Пользователь в Москве выбирает слоты\n');

const moscowZone = 'Europe/Moscow';
testSlots.forEach(slot => {
  const utcTime = convertLocalToUTC(slot, moscowZone);
  const utcSlot = createUTCSlotFromLocal(slot, moscowZone);
  
  console.log(`Москва: ${slot} → UTC: ${utcTime} (${utcSlot})`);
  
  timezones.forEach(tz => {
    if (tz.zone !== moscowZone) {
      const localTime = convertUTCToLocal(utcTime, tz.zone);
      console.log(`  ${tz.name} (${tz.offset}): ${localTime}`);
    }
  });
  console.log('');
});

// Тест 2: Обратная конвертация
console.log('📋 Тест 2: Обратная конвертация (проверка точности)\n');

testSlots.forEach(slot => {
  const utcTime = convertLocalToUTC(slot, moscowZone);
  const backToMoscow = convertUTCToLocal(utcTime, moscowZone);
  
  console.log(`Москва: ${slot} → UTC: ${utcTime} → Москва: ${backToMoscow} ${slot === backToMoscow ? '✅' : '❌'}`);
});

// Тест 3: Популярные сценарии
console.log('\n📋 Тест 3: Популярные сценарии матчинга\n');

const scenarios = [
  {
    name: 'Утреннее интервью',
    moscowTime: '10:00',
    description: 'Кандидат в Москве выбирает утреннее время'
  },
  {
    name: 'Дневное интервью',
    moscowTime: '14:00',
    description: 'Кандидат в Москве выбирает дневное время'
  },
  {
    name: 'Вечернее интервью',
    moscowTime: '19:00',
    description: 'Кандидат в Москве выбирает вечернее время'
  }
];

scenarios.forEach(scenario => {
  console.log(`\n🎯 ${scenario.name}: ${scenario.description}`);
  console.log(`Москва: ${scenario.moscowTime}`);
  
  const utcTime = convertLocalToUTC(scenario.moscowTime, moscowZone);
  console.log(`UTC: ${utcTime}`);
  
  // Показываем время в ключевых городах
  const keyCities = ['Asia/Vladivostok', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
  keyCities.forEach(zone => {
    const localTime = convertUTCToLocal(utcTime, zone);
    const cityName = timezones.find(tz => tz.zone === zone)?.name || zone;
    console.log(`${cityName}: ${localTime}`);
  });
});

// Тест 4: Граничные случаи
console.log('\n📋 Тест 4: Граничные случаи\n');

const edgeCases = [
  { time: '00:00', description: 'Полночь' },
  { time: '23:59', description: 'Почти полночь' },
  { time: '12:00', description: 'Полдень' }
];

edgeCases.forEach(case_ => {
  console.log(`\n⏰ ${case_.description}: ${case_.time}`);
  
  timezones.slice(0, 4).forEach(tz => {
    const utcTime = convertLocalToUTC(case_.time, tz.zone);
    console.log(`${tz.name}: ${case_.time} → UTC: ${utcTime}`);
  });
});

// Тест 5: Текущее время
console.log('\n📋 Тест 5: Текущее время в разных часовых поясах\n');

const now = DateTime.now();
timezones.forEach(tz => {
  const localTime = now.setZone(tz.zone);
  console.log(`${tz.name} (${tz.offset}): ${localTime.toFormat('HH:mm')} - ${localTime.toFormat('EEEE, dd MMMM yyyy')}`);
});

console.log('\n✅ Тестирование завершено!');
console.log('\n💡 Рекомендации:');
console.log('• Все временные слоты должны корректно конвертироваться');
console.log('• Обратная конвертация должна возвращать исходное время');
console.log('• Система должна корректно обрабатывать границы дней');
console.log('• Пользователи из разных часовых поясов должны видеть корректное время');
