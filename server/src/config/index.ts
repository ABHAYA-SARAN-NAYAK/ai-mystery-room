import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Run from either the workspace root or the server workspace while consistently
// loading the backend-only environment file. Existing process environment values
// (for example, hosting-provider secrets) retain precedence over this local file.
const workspaceServerEnv = path.resolve(process.cwd(), 'server', '.env');
const serverWorkingDirectoryEnv = path.resolve(process.cwd(), '.env');
const envPath = fs.existsSync(workspaceServerEnv) ? workspaceServerEnv : serverWorkingDirectoryEnv;
dotenv.config({ path: envPath });

function boundedPositiveInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-mystery-room',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  geminiMinIntervalMs: boundedPositiveInteger(process.env.GEMINI_MIN_INTERVAL_MS, 4500, 0, 60_000),
  geminiRequestTimeoutMs: boundedPositiveInteger(process.env.GEMINI_REQUEST_TIMEOUT_MS, 60_000, 10_000, 120_000),
  geminiMock: process.env.GEMINI_MOCK === 'true',
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  enableSolverPass: process.env.ENABLE_SOLVER_PASS === 'true',
  scoreWrongKeepsClueBonus: process.env.SCORE_WRONG_KEEPS_CLUE_BONUS !== 'false',
  rateLimitCreatePerHour: parseInt(process.env.RATE_LIMIT_CREATE_PER_HOUR || '5', 10),
  maxDailyGenerations: parseInt(process.env.MAX_DAILY_GENERATIONS || '50', 10),
  ipSalt: process.env.IP_SALT || 'ai-mystery-room-salt-key-2026',
};
