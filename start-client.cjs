const { spawn } = require('child_process');

// Override console.error to suppress Console Ninja messages
const originalError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('Console Ninja') || message.includes('node v22.17.0')) {
    return;
  }
  originalError.apply(console, args);
};

process.env.VITE_API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
process.env.CONSOLE_NINJA_DISABLED = 'true';

console.log('Starting Vite client...');

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const viteProcess = spawn(
  pnpmCmd,
  ['exec', 'vite', '--config', 'frontend/vite.config.ts'],
  {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  }
);

viteProcess.on('error', (error) => {
  console.error('Failed to start Vite:', error);
  process.exit(1);
});

viteProcess.on('exit', (code) => {
  console.log(`Vite exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\nShutting down Vite...');
  viteProcess.kill();
  process.exit(0);
});
