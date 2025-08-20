// Haptic Feedback утилиты для тактильной обратной связи

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

class HapticFeedback {
  private isSupported: boolean;
  private hasUserInteracted: boolean = false;

  constructor() {
    // Проверяем поддержку haptic feedback
    this.isSupported = 'vibrate' in navigator || 'haptic' in navigator;

    // Отслеживаем взаимодействие пользователя
    this.setupUserInteractionTracking();
  }

  /**
   * Отслеживает взаимодействие пользователя со страницей
   */
  private setupUserInteractionTracking() {
    const markAsInteracted = () => {
      this.hasUserInteracted = true;
      // Удаляем слушатели после первого взаимодействия
      document.removeEventListener('click', markAsInteracted);
      document.removeEventListener('touchstart', markAsInteracted);
      document.removeEventListener('keydown', markAsInteracted);
    };

    // Добавляем слушатели для отслеживания взаимодействия
    document.addEventListener('click', markAsInteracted, { once: true });
    document.addEventListener('touchstart', markAsInteracted, { once: true });
    document.addEventListener('keydown', markAsInteracted, { once: true });
  }

  /**
   * Безопасный вызов vibrate с проверкой взаимодействия пользователя
   */
  private safeVibrate(pattern: number | number[]) {
    if (!this.isSupported || !this.hasUserInteracted) return;

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Игнорируем ошибки vibrate
        console.debug('Vibrate failed:', error);
      }
    }
  }

  /**
   * Легкая вибрация для обычных взаимодействий
   */
  light() {
    if (!this.isSupported) return;

    if ('vibrate' in navigator) {
      this.safeVibrate(10);
    } else if ('haptic' in navigator) {
      // @ts-ignore - для iOS Safari
      navigator.haptic?.impactOccurred('light');
    }
  }

  /**
   * Средняя вибрация для важных действий
   */
  medium() {
    if (!this.isSupported) return;

    if ('vibrate' in navigator) {
      this.safeVibrate(20);
    } else if ('haptic' in navigator) {
      // @ts-ignore - для iOS Safari
      navigator.haptic?.impactOccurred('medium');
    }
  }

  /**
   * Сильная вибрация для критических действий
   */
  heavy() {
    if (!this.isSupported) return;

    if ('vibrate' in navigator) {
      this.safeVibrate(30);
    } else if ('haptic' in navigator) {
      // @ts-ignore - для iOS Safari
      navigator.haptic?.impactOccurred('heavy');
    }
  }

  /**
   * Вибрация успеха - приятный паттерн
   */
  success() {
    if (!this.isSupported) return;

    if ('vibrate' in navigator) {
      // Паттерн: короткая пауза, затем две короткие вибрации
      this.safeVibrate([0, 10, 50, 10, 50, 10]);
    } else if ('haptic' in navigator) {
      // @ts-ignore - для iOS Safari
      navigator.haptic?.notificationOccurred('success');
    }
  }

  /**
   * Вибрация предупреждения
   */
  warning() {
    if (!this.isSupported) return;

    if ('vibrate' in navigator) {
      // Паттерн: две средние вибрации
      this.safeVibrate([0, 20, 100, 20]);
    } else if ('haptic' in navigator) {
      // @ts-ignore - для iOS Safari
      navigator.haptic?.notificationOccurred('warning');
    }
  }

  /**
   * Вибрация ошибки
   */
  error() {
    if (!this.isSupported) return;

    if ('vibrate' in navigator) {
      // Паттерн: три короткие вибрации
      this.safeVibrate([0, 15, 50, 15, 50, 15]);
    } else if ('haptic' in navigator) {
      // @ts-ignore - для iOS Safari
      navigator.haptic?.notificationOccurred('error');
    }
  }

  /**
   * Универсальный метод для всех типов
   */
  trigger(type: HapticType) {
    switch (type) {
      case 'light':
        this.light();
        break;
      case 'medium':
        this.medium();
        break;
      case 'heavy':
        this.heavy();
        break;
      case 'success':
        this.success();
        break;
      case 'warning':
        this.warning();
        break;
      case 'error':
        this.error();
        break;
    }
  }

  /**
   * Проверка поддержки haptic feedback
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Проверка, взаимодействовал ли пользователь со страницей
   */
  hasInteracted(): boolean {
    return this.hasUserInteracted;
  }
}

// Создаем единственный экземпляр
export const hapticFeedback = new HapticFeedback();

// Хук для использования в React компонентах
export const useHapticFeedback = () => {
  return {
    light: () => hapticFeedback.light(),
    medium: () => hapticFeedback.medium(),
    heavy: () => hapticFeedback.heavy(),
    success: () => hapticFeedback.success(),
    warning: () => hapticFeedback.warning(),
    error: () => hapticFeedback.error(),
    trigger: (type: HapticType) => hapticFeedback.trigger(type),
    isAvailable: () => hapticFeedback.isAvailable(),
    hasInteracted: () => hapticFeedback.hasInteracted(),
  };
};
