import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Функция для проверки доступности ссылки
async function testUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // Для обхода CORS
    });
    return true;
  } catch (error) {
    console.warn('Не удалось проверить доступность ссылки:', error);
    return false; // Предполагаем, что ссылка доступна
  }
}

// Функция для безопасного перехода на внешние ссылки
export function navigateToExternal(url: string) {
  console.log('Попытка перехода на:', url);
  
  try {
    // Пробуем открыть в новой вкладке
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Если блокировщик рекламы заблокировал открытие, пробуем другой способ
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
      console.log('Блокировщик рекламы заблокировал window.open, пробуем альтернативный способ');
      
      // Создаем временную ссылку и кликаем по ней
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Альтернативный способ выполнен');
    } else {
      console.log('Успешно открыто новое окно');
    }
  } catch (error) {
    console.error('Ошибка при переходе на внешнюю ссылку:', error);
    
    // Fallback - просто меняем location
    console.log('Используем fallback - переход в текущем окне');
    window.location.href = url;
  }
}

// Функция для обработки кликов с визуальной обратной связью
export function handleExternalClick(url: string, event?: React.MouseEvent) {
  console.log('🔗 Попытка перехода на:', url);
  
  // Добавляем визуальную обратную связь
  if (event?.currentTarget) {
    const button = event.currentTarget as HTMLElement;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = '';
    }, 150);
  }
  
  // Небольшая задержка для визуального эффекта
  setTimeout(() => {
    // Пробуем несколько способов открытия ссылки
    try {
      // Способ 1: Прямое открытие в новой вкладке
      console.log('📱 Способ 1: Прямое открытие в новой вкладке');
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (newWindow && !newWindow.closed) {
        console.log('✅ Успешно открыто новое окно');
        return;
      }
      
      // Способ 2: Создание временной ссылки
      console.log('🔗 Способ 2: Создание временной ссылки');
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Временная ссылка создана и активирована');
      
      // Способ 3: Если ничего не работает, переходим в текущем окне
      setTimeout(() => {
        console.log('🔄 Способ 3: Fallback - переход в текущем окне');
        window.location.href = url;
      }, 2000);
      
    } catch (error) {
      console.error('❌ Ошибка при переходе:', error);
      // Fallback - переход в текущем окне
      console.log('🔄 Используем fallback - переход в текущем окне');
      window.location.href = url;
    }
  }, 100);
}
