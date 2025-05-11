import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
console.log('=== VITE КОНФИГУРАЦИЯ TS ===');
console.log('Используется файл vite.config.ts');
console.log('Текущая директория:', process.cwd());
console.log('Переменные окружения:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_PORT: process.env.FRONTEND_PORT,
  VITE_BACKEND_URL: process.env.VITE_BACKEND_URL,
});
// import.meta.env доступно только во время выполнения, не в конфигурации

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    // Добавляем логирование при запуске
    hmr: {
      // Фиксируем порт для HMR WebSocket
      port: 3000,
      // Добавляем логирование
      overlay: true,
      // Фиксируем клиентский порт
      clientPort: 3000,
    },
    // Явно указываем хост и порт
    host: 'localhost',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false, // Отключаем проверку HTTPS для локальной разработки
        rewrite: (path) => {
          console.log('Прокси запрос:', path);
          return path; // Не меняем путь
        },
        // Добавляем логирование для отладки
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('ПРОКСИ ОШИБКА:', err);
            console.error('Запрос:', req.method, req.url);
            console.error('Целевой сервер:', options.target);
            console.error('Заголовки запроса:', req.headers);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(
              'ПРОКСИ ЗАПРОС:',
              req.method,
              req.url,
              '→',
              options.target + proxyReq.path
            );
            console.log('Заголовки запроса:', req.headers);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('ПРОКСИ ОТВЕТ:', proxyRes.statusCode, req.url);
            console.log('Заголовки ответа:', proxyRes.headers);
          });
        },
      },
    },
  },
});
