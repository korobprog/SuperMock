// Исправления для Telegram Mini Apps на десктопе

// Определяем, находимся ли мы в Telegram WebApp
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && 
         (window as any).Telegram?.WebApp !== undefined;
}

// Определяем, находимся ли мы в десктопной версии Telegram
export function isTelegramDesktop(): boolean {
  if (!isTelegramWebApp()) return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (window as any).Telegram?.WebApp?.platform;
  
  return platform === 'desktop' || 
         platform === 'macos' || 
         platform === 'windows' ||
         userAgent.includes('telegram') && 
         (userAgent.includes('desktop') || userAgent.includes('mac') || userAgent.includes('windows'));
}

// Применяем исправления для кликабельности
export function applyTelegramDesktopFixes(): void {
  if (!isTelegramDesktop()) return;

  console.log('Applying Telegram Desktop fixes...');

  // Функция для принудительного включения pointer events
  const enablePointerEvents = (element: HTMLElement) => {
    element.style.pointerEvents = 'auto';
    element.style.cursor = 'pointer';
    
    // Увеличиваем область клика
    const rect = element.getBoundingClientRect();
    if (rect.height < 44) {
      element.style.minHeight = '44px';
    }
    if (rect.width < 44) {
      element.style.minWidth = '44px';
    }
  };

  // Функция для обработки всех кнопок
  const fixButtons = () => {
    const buttons = document.querySelectorAll('button, [role="button"], .btn, .button');
    buttons.forEach((button) => {
      if (button instanceof HTMLElement) {
        enablePointerEvents(button);
        
        // Добавляем обработчик для принудительного включения pointer events
        button.addEventListener('mouseenter', () => {
          enablePointerEvents(button);
        });
        
        // Исправляем проблемы с touch events
        button.addEventListener('touchstart', (e) => {
          e.preventDefault();
          enablePointerEvents(button);
        }, { passive: false });
      }
    });
  };

  // Функция для обработки интерактивных элементов
  const fixInteractiveElements = () => {
    const interactiveElements = document.querySelectorAll('[onClick], [onclick], .clickable, .interactive');
    interactiveElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        enablePointerEvents(element);
      }
    });
  };

  // Функция для обработки карточек с кликами
  const fixClickableCards = () => {
    const cards = document.querySelectorAll('.card[onClick], .card[onclick], .card.clickable');
    cards.forEach((card) => {
      if (card instanceof HTMLElement) {
        enablePointerEvents(card);
      }
    });
  };

  // Функция для обработки навигации
  const fixNavigation = () => {
    const navElements = document.querySelectorAll('nav a, .nav-link, [data-navigate]');
    navElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        enablePointerEvents(element);
      }
    });
  };

  // Применяем исправления сразу
  fixButtons();
  fixInteractiveElements();
  fixClickableCards();
  fixNavigation();

  // Применяем исправления при изменениях в DOM
  const observer = new MutationObserver(() => {
    fixButtons();
    fixInteractiveElements();
    fixClickableCards();
    fixNavigation();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'onclick', 'onClick']
  });

  // Дополнительные исправления для React Router
  const fixReactRouterLinks = () => {
    const links = document.querySelectorAll('a[href], [data-navigate]');
    links.forEach((link) => {
      if (link instanceof HTMLElement) {
        enablePointerEvents(link);
      }
    });
  };

  // Применяем исправления для React Router
  fixReactRouterLinks();

  // Исправления для модальных окон
  const fixModals = () => {
    const modals = document.querySelectorAll('.modal, .dialog, .popup');
    modals.forEach((modal) => {
      if (modal instanceof HTMLElement) {
        modal.style.pointerEvents = 'auto';
        modal.style.zIndex = '1000';
      }
    });
  };

  // Применяем исправления для модальных окон
  fixModals();

  // Исправления для форм
  const fixForms = () => {
    const formElements = document.querySelectorAll('form input, form select, form textarea');
    formElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.pointerEvents = 'auto';
      }
    });
  };

  // Применяем исправления для форм
  fixForms();

  // Исправления для переключателей
  const fixSwitches = () => {
    const switches = document.querySelectorAll('.switch, .toggle');
    switches.forEach((switchElement) => {
      if (switchElement instanceof HTMLElement) {
        enablePointerEvents(switchElement);
      }
    });
  };

  // Применяем исправления для переключателей
  fixSwitches();

  // Исправления для селектов
  const fixSelects = () => {
    const selects = document.querySelectorAll('.select, .dropdown');
    selects.forEach((select) => {
      if (select instanceof HTMLElement) {
        select.style.pointerEvents = 'auto';
      }
    });
  };

  // Применяем исправления для селектов
  fixSelects();

  console.log('Telegram Desktop fixes applied');
}

// Функция для принудительного перезапуска исправлений
export function forceReapplyFixes(): void {
  if (!isTelegramDesktop()) return;

  // Удаляем все обработчики событий
  const buttons = document.querySelectorAll('button, [role="button"], .btn, .button');
  buttons.forEach((button) => {
    if (button instanceof HTMLElement) {
      button.replaceWith(button.cloneNode(true));
    }
  });

  // Применяем исправления заново
  setTimeout(() => {
    applyTelegramDesktopFixes();
  }, 100);
}

// Функция для проверки и исправления конкретного элемента
export function fixElement(element: HTMLElement): void {
  if (!isTelegramDesktop()) return;

  element.style.pointerEvents = 'auto';
  element.style.cursor = 'pointer';
  
  const rect = element.getBoundingClientRect();
  if (rect.height < 44) {
    element.style.minHeight = '44px';
  }
  if (rect.width < 44) {
    element.style.minWidth = '44px';
  }
}

// Экспортируем функцию для использования в компонентах
export default {
  isTelegramWebApp,
  isTelegramDesktop,
  applyTelegramDesktopFixes,
  forceReapplyFixes,
  fixElement
};
