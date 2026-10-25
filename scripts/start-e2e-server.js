import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`[E2E] In-memory MongoDB started at ${uri}`);

  const server = spawn('node', ['server/dist/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '8080',
      MONGODB_URI: uri,
      NODE_ENV: 'development',
      GEMINI_MOCK: 'true',
      ENABLE_SOLVER_PASS: 'false',
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
  });

  const cleanup = async () => {
    console.log('[E2E] Shutting down E2E server and in-memory Mongo...');
    server.kill();
    await mongod.stop();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  server.on('exit', async (code) => {
    await mongod.stop();
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('[E2E] Failed to start E2E test server:', err);
  process.exit(1);
});
