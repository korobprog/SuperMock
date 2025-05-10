import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
console.log('=== VITE КОНФИГУРАЦИЯ ===');
console.log('Текущая директория:', process.cwd());
console.log('Переменные окружения:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_PORT: process.env.FRONTEND_PORT,
});

export default defineConfig({
  plugins: [react()],
  server: {
    // Добавляем логирование при запуске
    hmr: {
      // Фиксируем порт для HMR WebSocket
      port: 5173,
      // Добавляем логирование
      overlay: true,
      // Фиксируем клиентский порт
      clientPort: 5173,
    },
    // Явно указываем хост и порт
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:9877', // Порт обновлен автоматически
        changeOrigin: true,
        secure: true, // Разрешаем безопасные (HTTPS) соединения
        rewrite: (path) => {
          console.log('Прокси запрос:', path);
          return path.replace(/^\/api/, '/api');
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
