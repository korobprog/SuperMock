const { spawn } = require('child_process');
const path = require('path');

// Set environment variables to disable Console Ninja
process.env.CONSOLE_NINJA_DISABLED = 'true';
process.env.VITE_API_URL = 'http://localhost:3001';

// Run vite directly
const viteProcess = spawn(
  'npx',
  ['vite', '--config', 'frontend/vite.config.ts'],
  {
    stdio: 'inherit',
    cwd: process.cwd(),
  }
);

viteProcess.on('error', (error) => {
  console.error('Failed to start Vite:', error);
  process.exit(1);
});

viteProcess.on('exit', (code) => {
  process.exit(code);
});
