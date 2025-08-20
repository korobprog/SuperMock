const { spawn } = require('child_process');

console.log('Starting development servers...');

// Start the backend server
const serverProcess = spawn('pnpm', ['run', 'dev:server:local'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' },
});

// Wait a moment for server to start, then start client
setTimeout(() => {
  const clientProcess = spawn(
    'npx',
    ['vite', '--config', 'frontend/vite.config.ts'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_API_URL: 'http://localhost:3001',
        CONSOLE_NINJA_DISABLED: 'true',
      },
    }
  );

  clientProcess.on('error', (error) => {
    console.error('Client error:', error);
  });

  clientProcess.on('exit', (code) => {
    console.log(`Client exited with code ${code}`);
    if (code !== 0) {
      serverProcess.kill();
    }
  });
}, 2000);

serverProcess.on('error', (error) => {
  console.error('Server error:', error);
});

serverProcess.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  serverProcess.kill();
  process.exit(0);
});
