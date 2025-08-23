// Скрипт для принудительного обновления фронтенда
console.log('🔄 Принудительное обновление фронтенда...');

// Очищаем кэш
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
      console.log('🗑️ Удален кэш:', name);
    });
  });
}

// Очищаем localStorage
localStorage.clear();
console.log('🗑️ Очищен localStorage');

// Очищаем sessionStorage
sessionStorage.clear();
console.log('🗑️ Очищен sessionStorage');

// Принудительно перезагружаем страницу
console.log('🔄 Перезагрузка страницы...');
window.location.reload(true);
