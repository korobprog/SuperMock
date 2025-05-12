const fs = require('fs');
const path = require('path');

console.log('=== Проверка структуры проекта ===');

// Проверяем наличие директорий
const dirs = ['src', 'src/config', 'src/src', 'src/src/config'];

dirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  const exists = fs.existsSync(fullPath);
  console.log(
    `Директория ${fullPath} ${exists ? 'существует' : 'не существует'}`
  );

  if (exists && dir.includes('config')) {
    // Проверяем наличие файла app.ts
    const appPath = path.join(fullPath, 'app.ts');
    const appExists = fs.existsSync(appPath);
    console.log(
      `Файл ${appPath} ${appExists ? 'существует' : 'не существует'}`
    );
  }
});

// Проверяем импорты в файлах src/src
if (fs.existsSync(path.join(__dirname, 'src/src'))) {
  const srcSrcFiles = [
    'src/src/routes/auth.ts',
    'src/src/server.ts',
    'src/src/services/webRTCService.ts',
    'src/src/websocket.ts',
  ];

  srcSrcFiles.forEach((file) => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importMatch = content.match(
        /import.*from\s+['"]\.\.\/config\/app['"]/
      );
      console.log(
        `Файл ${fullPath} ${
          importMatch
            ? 'импортирует из ../config/app'
            : 'не импортирует из ../config/app'
        }`
      );
    } else {
      console.log(`Файл ${fullPath} не существует`);
    }
  });
}

console.log('=== Проверка завершена ===');
