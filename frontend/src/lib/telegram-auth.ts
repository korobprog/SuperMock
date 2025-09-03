// Типы для данных пользователя Telegram
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Проверка данных авторизации Telegram (базовая проверка в браузере)
// Полная проверка с хэшем должна выполняться на сервере
export function validateTelegramAuth(data: TelegramUser): boolean {
  // Проверяем наличие обязательных полей
  if (!data.id || !data.first_name || !data.auth_date || !data.hash) {
    return false;
  }

  // Проверяем актуальность данных (не старше 24 часов)
  return isTelegramAuthValid(data.auth_date);
}

// Получение полного имени пользователя
export function getTelegramUserDisplayName(user: TelegramUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.first_name || user.username || `User ${user.id}`;
}

// Проверка актуальности данных (не старше 24 часов)
export function isTelegramAuthValid(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 часа в секундах
  return now - authDate <= maxAge;
}

// Сохранение данных пользователя в localStorage
export function saveTelegramUser(user: TelegramUser): void {
  localStorage.setItem('telegram_user', JSON.stringify(user));
}

// Загрузка данных пользователя из localStorage
export function loadTelegramUser(): TelegramUser | null {
  try {
    const data = localStorage.getItem('telegram_user');
    if (!data) return null;

    const user = JSON.parse(data) as TelegramUser;

    // Проверяем актуальность данных
    if (!isTelegramAuthValid(user.auth_date)) {
      localStorage.removeItem('telegram_user');
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error loading telegram user:', error);
    localStorage.removeItem('telegram_user');
    return null;
  }
}

// Очистка данных пользователя
export function clearTelegramUser(): void {
  localStorage.removeItem('telegram_user');
}

// Принудительный выход из Telegram Mini Apps
export function forceLogoutFromTelegram(): void {
  // Очищаем localStorage
  localStorage.removeItem('telegram_user');
  localStorage.removeItem('userId');
  localStorage.removeItem('userSettings');

  // Устанавливаем флаг выхода с временной меткой (действует 1 час)
  const logoutTime = Date.now();
  sessionStorage.setItem('just_logged_out', logoutTime.toString());
  sessionStorage.setItem('logout_timestamp', logoutTime.toString());

  // Если мы в Telegram Mini Apps, закрываем приложение
  if (window.Telegram?.WebApp) {
    try {
      window.Telegram.WebApp.close();
    } catch (error) {
      console.log('Could not close Telegram WebApp, reloading page instead');
      window.location.reload();
    }
  } else {
    // Если не в Mini Apps, просто перезагружаем страницу
    window.location.reload();
  }
}

// Объявление глобальной функции для callback'а
declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}
