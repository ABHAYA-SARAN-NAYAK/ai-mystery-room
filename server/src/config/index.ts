import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-mystery-room',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  geminiMock: process.env.GEMINI_MOCK === 'true',
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  enableSolverPass: process.env.ENABLE_SOLVER_PASS !== 'false',
  scoreWrongKeepsClueBonus: process.env.SCORE_WRONG_KEEPS_CLUE_BONUS !== 'false',
  rateLimitCreatePerHour: parseInt(process.env.RATE_LIMIT_CREATE_PER_HOUR || '5', 10),
  maxDailyGenerations: parseInt(process.env.MAX_DAILY_GENERATIONS || '50', 10),
  ipSalt: process.env.IP_SALT || 'ai-mystery-room-salt-key-2026',
};
