import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import dns from 'node:dns';

// Set DNS resolution order to 'verbatim' to prevent Node.js from reordering
// resolved addresses for 'localhost', ensuring consistency with browser behavior.
dns.setDefaultResultOrder('verbatim');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения из корневого файла
  const env = loadEnv(mode, '../', '');
  
  // Определяем, нужно ли использовать 127.0.0.1
  const useLocalhost =
    process.env.NODE_ENV === 'production' || mode === 'production';

  console.log('🔧 Vite config debug:', {
    mode,
    NODE_ENV: process.env.NODE_ENV,
    useLocalhost,
    host: useLocalhost ? '127.0.0.1' : '0.0.0.0',
    envKeys: Object.keys(env).filter(key => key.startsWith('VITE_')),
  });

  return {
    root: __dirname,
    publicDir: path.resolve(__dirname, '../public'), // Указываем путь к папке public
    server: {
      host: useLocalhost ? '127.0.0.1' : '0.0.0.0', // Принудительно используем 127.0.0.1 для production
      port: 5173,
      strictPort: false, // Allow Vite to try next available port if 5173 is busy
      open: useLocalhost ? 'http://127.0.0.1:5173' : true, // Принудительно открываем на 127.0.0.1 для production
      cors: true, // Enable CORS
      // CSP headers removed for development to allow Telegram Widget iframe
      headers: {
        'Content-Security-Policy':
          mode === 'development'
            ? "frame-ancestors 'self' https://oauth.telegram.org https://telegram.org;"
            : undefined,
      },
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: process.env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      port: 3000,
      host: true, // Enable listening on all network interfaces for Docker
      proxy:
        mode === 'development'
          ? {
              '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
              },
              '/socket.io': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                ws: true,
              },
            }
          : undefined,
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Передаем переменные окружения в приложение
      'import.meta.env.VITE_TELEGRAM_BOT_NAME': JSON.stringify(env.VITE_TELEGRAM_BOT_NAME),
      'import.meta.env.VITE_TELEGRAM_BOT_ID': JSON.stringify(env.VITE_TELEGRAM_BOT_ID),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_JITSI_URL': JSON.stringify(env.VITE_JITSI_URL),
      'import.meta.env.VITE_STUN_URLS': JSON.stringify(env.VITE_STUN_URLS),
      'import.meta.env.VITE_TURN_URL': JSON.stringify(env.VITE_TURN_URL),
      'import.meta.env.VITE_TURN_USERNAME': JSON.stringify(env.VITE_TURN_USERNAME),
      'import.meta.env.VITE_TURN_PASSWORD': JSON.stringify(env.VITE_TURN_PASSWORD),
      'import.meta.env.VITE_ENABLE_DEV_TEST_ACCOUNTS': JSON.stringify(env.VITE_ENABLE_DEV_TEST_ACCOUNTS),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000, // Увеличиваем лимит предупреждений до 1MB
      rollupOptions: {
        output: {
          manualChunks: {
            // Выделяем React и основные библиотеки
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],

            // Выделяем UI библиотеки
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              'lucide-react',
              'class-variance-authority',
              'clsx',
              'tailwind-merge',
            ],

            // Выделяем утилиты и состояние
            utils: ['zustand', 'i18next', 'react-i18next'],

            // Выделяем WebRTC и медиа библиотеки
            media: ['@stackblitz/sdk', '@uiw/react-codemirror'],

            // Выделяем Socket.IO
            socket: ['socket.io-client'],

            // Выделяем формы и валидацию
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],

            // Выделяем графики и визуализацию
            charts: ['recharts'],
          },
        },
      },
    },
  };
});
