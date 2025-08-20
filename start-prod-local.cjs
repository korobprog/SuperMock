const { spawn, execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

console.log(
  '🚀 Starting Super Mock PRODUCTION LOCAL stack (Real DB + Auth, local server + client)...'
);

// Load production local environment variables
const envPath = path.join(process.cwd(), 'deploy', 'prod-local.env');
const envExamplePath = path.join(
  process.cwd(),
  'deploy',
  'prod-local.env.example'
);

try {
  if (require('fs').existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📁 Loaded configuration from deploy/prod-local.env');
    console.log(
      '🔧 VITE_TELEGRAM_BOT_NAME:',
      process.env.VITE_TELEGRAM_BOT_NAME
    );
    console.log('🔧 VITE_API_URL:', process.env.VITE_API_URL);

    // Создаем временный .env файл для Vite
    const viteEnvContent = `VITE_TELEGRAM_BOT_NAME=${
      process.env.VITE_TELEGRAM_BOT_NAME || 'SuperMockTest_bot'
    }
VITE_TELEGRAM_BOT_ID=${process.env.VITE_TELEGRAM_BOT_ID || '8213869730'}
VITE_API_URL=${process.env.VITE_API_URL || 'http://127.0.0.1:3001'}
VITE_JITSI_URL=${process.env.VITE_JITSI_URL || 'https://meet.jit.si'}
VITE_STUN_URLS=${
      process.env.VITE_STUN_URLS ||
      'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302'
    }`;

    require('fs').writeFileSync('.env.local', viteEnvContent);
    console.log('📝 Created .env.local for Vite');
  } else {
    dotenv.config({ path: envExamplePath });
    console.log(
      '📁 Loaded configuration from deploy/prod-local.env.example (example file)'
    );
  }
} catch (error) {
  console.log('⚠️  Warning: Could not load environment file, using defaults');
}

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function killPortSync(port) {
  try {
    if (process.platform === 'win32') {
      try {
        const pidsPs = execSync(
          `powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique"`,
          { stdio: ['ignore', 'pipe', 'ignore'] }
        )
          .toString()
          .trim()
          .split(/\r?\n/)
          .filter(Boolean);
        pidsPs.forEach((pid) => {
          try {
            execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
          } catch {}
        });
      } catch {}
      try {
        const out = execSync(`cmd.exe /c "netstat -ano | findstr :${port}"`, {
          stdio: ['ignore', 'pipe', 'ignore'],
        })
          .toString()
          .trim();
        const pids = Array.from(
          new Set(
            out
              .split(/\r?\n/)
              .map((l) => l.trim().split(/\s+/).pop())
              .filter(Boolean)
          )
        );
        pids.forEach((pid) => {
          try {
            execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
          } catch {}
        });
      } catch {}
    } else {
      try {
        execSync(`fuser -k -n tcp ${port}`, { stdio: 'ignore' });
      } catch {}
      try {
        execSync(`lsof -ti tcp:${port} | xargs kill -9`, {
          stdio: 'ignore',
          shell: true,
        });
      } catch {}
    }
  } catch {}
}

function startServer() {
  console.log('📡 Starting PRODUCTION backend server on :3001...');
  console.log('🔗 Connecting to REAL production database...');

  const server = spawn('node', ['backend/server/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3001',
      // Используем реальную базу данных с сервера
      DATABASE_URL:
        process.env.DATABASE_URL ||
        'postgresql://Super Mock:change_me@217.198.6.238:5432/Super Mock',
      DATABASE_URL_SECONDARY:
        process.env.DATABASE_URL_SECONDARY ||
        'postgresql://Super Mock2:change_me@217.198.6.238:5433/Super Mock_secondary',
      // Используем реальный Redis с сервера
      REDIS_URL: process.env.REDIS_URL || 'redis://217.198.6.238:6379',
      // Передаем ENABLE_DEMO_MODE для CORS настройки
      ENABLE_DEMO_MODE: process.env.ENABLE_DEMO_MODE || '1',
    },
  });

  server.on('error', (e) => console.error('❌ Server error:', e));
  server.on('exit', (code) =>
    console.log(`📡 Server exited with code ${code}`)
  );
  return server;
}

function startClient() {
  console.log('🎨 Starting Vite client on 127.0.0.1:5173...');

  // Suppress Console Ninja noise
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('Console Ninja') ||
      message.includes('node v22.17.0')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  const viteBin = path.join(
    process.cwd(),
    'node_modules',
    'vite',
    'bin',
    'vite.js'
  );

  // Запускаем Vite в том же терминале (убираем отдельное окно)
  const client = spawn(
    'node',
    [viteBin, '--config', 'frontend/vite.config.ts'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development', // Изменяем на development для Vite
        VITE_API_URL: process.env.VITE_API_URL || 'http://127.0.0.1:3001',
        VITE_TELEGRAM_BOT_NAME:
          process.env.VITE_TELEGRAM_BOT_NAME || 'SuperMock_bot',
        CONSOLE_NINJA_DISABLED: 'true',
      },
    }
  );

  client.on('error', (e) => console.error('❌ Client error:', e));
  client.on('exit', (code) =>
    console.log(`🎨 Client exited with code ${code}`)
  );
  return client;
}

// Free ports first
killPortSync(3001);
killPortSync(5173);

const serverProc = startServer();

setTimeout(() => {
  startClient();
}, 2000);

function shutdown() {
  console.log('\n🛑 Shutting down production local processes...');
  try {
    serverProc.kill();
  } catch {}

  // Удаляем временный .env.local файл
  try {
    if (require('fs').existsSync('.env.local')) {
      require('fs').unlinkSync('.env.local');
      console.log('🗑️  Removed temporary .env.local file');
    }
  } catch (error) {
    console.log('⚠️  Could not remove .env.local file:', error.message);
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
