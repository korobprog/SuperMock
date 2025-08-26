/**
 * Development utilities - only available in development mode
 */

/**
 * Check if the application is running in development mode
 */
export const isDevelopment = () => import.meta.env.DEV;

/**
 * Log debug information only in development mode
 */
export const devLog = (message: string, ...args: any[]) => {
  if (isDevelopment()) {
    console.log(`[DEV] ${message}`, ...args);
  }
};

/**
 * Log warnings only in development mode
 */
export const devWarn = (message: string, ...args: any[]) => {
  if (isDevelopment()) {
    console.warn(`[DEV WARNING] ${message}`, ...args);
  }
};

/**
 * Log errors only in development mode
 */
export const devError = (message: string, ...args: any[]) => {
  if (isDevelopment()) {
    console.error(`[DEV ERROR] ${message}`, ...args);
  }
};

/**
 * Execute a function only in development mode
 */
export const devOnly = <T>(fn: () => T): T | undefined => {
  if (isDevelopment()) {
    return fn();
  }
  return undefined;
};

/**
 * Get development environment information
 */
export const getDevInfo = () => {
  if (!isDevelopment()) {
    return null;
  }

  return {
    mode: import.meta.env.MODE,
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    apiUrl: import.meta.env.VITE_API_URL,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
};

/**
 * Development-only performance measurement
 */
export const devMeasure = (name: string, fn: () => any) => {
  if (!isDevelopment()) {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  devLog(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
  return result;
};

/**
 * Development-only async performance measurement
 */
export const devMeasureAsync = async (name: string, fn: () => Promise<any>) => {
  if (!isDevelopment()) {
    return await fn();
  }

  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  devLog(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
  return result;
};
