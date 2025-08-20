const { spawn, execSync } = require('child_process');
const path = require('path');

console.log(
  '🚀 Starting Super Mock dev stack (DB in Docker, local server + client)...'
);

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
  console.log('📡 Starting backend server on :3000...');
  const server = spawn('node', ['backend/server/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL:
        process.env.DATABASE_URL ||
        'postgresql://supermock:postgres@localhost:5432/supermock',
      DATABASE_URL_SECONDARY:
        process.env.DATABASE_URL_SECONDARY ||
        'postgresql://supermock2:postgres@localhost:5433/supermock_secondary',
    },
  });

  server.on('error', (e) => console.error('❌ Server error:', e));
  server.on('exit', (code) =>
    console.log(`📡 Server exited with code ${code}`)
  );
  return server;
}

function startClient() {
  console.log('🎨 Starting Vite client on :5173...');

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

  if (process.platform === 'win32') {
    // Open Vite in a separate Command Prompt to bypass Console Ninja in integrated terminal
    const envCmd = `set CONSOLE_NINJA_DISABLED=true && set VITE_API_URL=${
      process.env.VITE_API_URL || 'http://localhost:3000'
    } && node "${viteBin}" --config frontend/vite.config.ts`;
    spawn(
      'cmd.exe',
      ['/c', 'start', '"Vite Dev Server"', 'cmd', '/k', envCmd],
      {
        detached: true,
        stdio: 'ignore',
        windowsVerbatimArguments: true,
      }
    ).unref();
    console.log(
      '🪟 Opened external terminal for Vite. If the browser does not open, visit http://localhost:5173'
    );
    return null;
  }

  const client = spawn(
    'node',
    [viteBin, '--config', 'frontend/vite.config.ts'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3000',
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
killPortSync(3000);
killPortSync(5173);

const serverProc = startServer();

setTimeout(() => {
  startClient();
}, 2000);

function shutdown() {
  console.log('\n🛑 Shutting down dev processes...');
  try {
    serverProc.kill();
  } catch {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
