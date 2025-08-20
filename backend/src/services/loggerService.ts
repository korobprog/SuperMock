/**
 * Сервис для централизованного логирования
 */

// Уровни логирования
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Настройки логирования
interface LoggerConfig {
  // Минимальный уровень для вывода логов
  minLevel: LogLevel;
  // Включить/выключить отображение временных меток
  showTimestamp: boolean;
  // Включить/выключить отображение уровня лога
  showLevel: boolean;
  // Включить/выключить отладочные логи
  debugMode: boolean;
}

// Конфигурация по умолчанию
const defaultConfig: LoggerConfig = {
  minLevel:
    process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  showTimestamp: true,
  showLevel: true,
  debugMode: process.env.NODE_ENV !== 'production',
};

// Текущая конфигурация
let config: LoggerConfig = { ...defaultConfig };

/**
 * Форматирует сообщение лога
 */
function formatMessage(level: LogLevel, message: string): string {
  const parts: string[] = [];

  if (config.showTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  if (config.showLevel) {
    parts.push(`[${level}]`);
  }

  parts.push(message);

  return parts.join(' ');
}

/**
 * Проверяет, нужно ли выводить лог данного уровня
 */
function shouldLog(level: LogLevel): boolean {
  const levels = Object.values(LogLevel);
  const configLevelIndex = levels.indexOf(config.minLevel);
  const messageLevelIndex = levels.indexOf(level);

  return messageLevelIndex >= configLevelIndex;
}

/**
 * Настройка логгера
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Отладочный лог (только для разработки)
 */
export function debug(message: string, data?: any): void {
  if (!config.debugMode) return;

  if (shouldLog(LogLevel.DEBUG)) {
    const formattedMessage = formatMessage(LogLevel.DEBUG, message);
    console.log(formattedMessage);
    if (data !== undefined) {
      console.log(data);
    }
  }
}

/**
 * Информационный лог
 */
export function info(message: string, data?: any): void {
  if (shouldLog(LogLevel.INFO)) {
    const formattedMessage = formatMessage(LogLevel.INFO, message);
    console.log(formattedMessage);
    if (data !== undefined) {
      console.log(data);
    }
  }
}

/**
 * Предупреждение
 */
export function warn(message: string, data?: any): void {
  if (shouldLog(LogLevel.WARN)) {
    const formattedMessage = formatMessage(LogLevel.WARN, message);
    console.warn(formattedMessage);
    if (data !== undefined) {
      console.warn(data);
    }
  }
}

/**
 * Ошибка
 */
export function error(message: string, err?: any): void {
  if (shouldLog(LogLevel.ERROR)) {
    const formattedMessage = formatMessage(LogLevel.ERROR, message);
    console.error(formattedMessage);

    if (err) {
      if (err instanceof Error) {
        console.error({
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
      } else {
        console.error(err);
      }
    }
  }
}

/**
 * Логирование запросов HTTP
 */
export function logRequest(req: any): void {
  if (!config.debugMode) return;

  debug(`${req.method} ${req.url}`, {
    headers: req.headers,
    protocol: req.protocol,
    secure: req.secure,
    origin: req.get('Origin'),
    referer: req.get('Referer'),
  });
}

export default {
  debug,
  info,
  warn,
  error,
  logRequest,
  configureLogger,
};
