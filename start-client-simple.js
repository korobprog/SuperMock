const { spawn } = require('child_process');

console.log('🎨 Starting Vite client...');

// Set environment variables
process.env.VITE_API_URL = 'http://localhost:3001';

// Run vite directly
const viteProcess = spawn(
  'npx',
  ['vite', '--config', 'frontend/vite.config.ts', '--port', '5173', '--host'],
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
  console.log(`Vite exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down Vite...');
  viteProcess.kill();
  process.exit(0);
});
