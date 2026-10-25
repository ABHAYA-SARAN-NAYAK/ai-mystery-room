import { spawn, execSync } from 'child_process';

console.log('[Dev] 1/3 Building @mystery/shared...');
execSync('npm run build --workspace=@mystery/shared', { stdio: 'inherit' });

console.log('[Dev] 2/3 Starting server (http://localhost:8080)...');
const server = spawn('npm', ['run', 'dev', '--workspace=@mystery/server'], {
  stdio: 'inherit',
  shell: true,
});

console.log('[Dev] 3/3 Starting client (http://localhost:5173)...');
const client = spawn('npm', ['run', 'dev', '--workspace=@mystery/client'], {
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\n[Dev] Stopping dev servers...');
  server.kill();
  client.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
server.on('exit', (code) => {
  if (code && code !== 0) console.error(`[Dev] Server exited with code ${code}`);
});
client.on('exit', (code) => {
  if (code && code !== 0) console.error(`[Dev] Client exited with code ${code}`);
});
