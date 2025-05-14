#!/usr/bin/env node

/**
 * Скрипт для генерации безопасных секретов
 *
 * Использование:
 * node generate-secrets.js [длина] [количество]
 *
 * Параметры:
 * - длина: длина генерируемого секрета (по умолчанию 32)
 * - количество: количество секретов для генерации (по умолчанию 1)
 *
 * Пример:
 * node generate-secrets.js 64 3
 */

const crypto = require('crypto');

// Получаем параметры из командной строки
const length = parseInt(process.argv[2]) || 32;
const count = parseInt(process.argv[3]) || 1;

console.log(`Генерация ${count} секретов длиной ${length} символов:`);
console.log('='.repeat(50));

for (let i = 0; i < count; i++) {
  // Генерируем случайные байты и преобразуем их в base64
  const secret = crypto
    .randomBytes(Math.ceil(length * 0.75))
    .toString('base64')
    .slice(0, length);

  console.log(`Секрет #${i + 1}: ${secret}`);

  // Выводим пример использования в .env файле
  console.log(`Для JWT_SECRET в .env: JWT_SECRET=${secret}`);
  console.log('='.repeat(50));
}

console.log('\nРекомендации по использованию:');
console.log(
  '1. Используйте разные секреты для разных окружений (development, staging, production)'
);
console.log(
  '2. Храните секреты в безопасном месте, например, в менеджере секретов'
);
console.log('3. Не включайте секреты в систему контроля версий');
console.log('4. Регулярно обновляйте секреты для повышения безопасности');
