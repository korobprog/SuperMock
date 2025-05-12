const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Очистка дублирующейся структуры директорий ===');

// Путь к дублирующейся директории
const duplicatePath = path.join(__dirname, 'src/src');

// Проверяем существование директории
if (fs.existsSync(duplicatePath)) {
  console.log(`Найдена дублирующаяся директория: ${duplicatePath}`);

  try {
    // В Windows используем команду rmdir /s /q для рекурсивного удаления
    if (process.platform === 'win32') {
      console.log('Удаление директории с помощью команды rmdir...');
      execSync(`rmdir /s /q "${duplicatePath}"`);
    } else {
      // В Unix-подобных системах используем rm -rf
      console.log('Удаление директории с помощью команды rm...');
      execSync(`rm -rf "${duplicatePath}"`);
    }

    console.log('Директория успешно удалена');
  } catch (error) {
    console.error('Ошибка при удалении директории:', error);
    process.exit(1);
  }
} else {
  console.log(`Директория ${duplicatePath} не существует`);
}

console.log('=== Очистка завершена ===');
console.log('Теперь вы можете запустить сборку проекта командой:');
console.log('npm run build');
