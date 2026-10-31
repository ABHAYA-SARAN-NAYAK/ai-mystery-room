import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { classifyGeminiError } from './generator';

let aiHealthStatus: 'up' | 'down' = 'up';

export function getAiHealth(): 'up' | 'down' {
  if (config.geminiMock) {
    return 'up';
  }
  return aiHealthStatus;
}

export function setAiHealth(status: 'up' | 'down'): void {
  aiHealthStatus = status;
}

export async function checkAiHealthOnStartup(): Promise<'up' | 'down'> {
  if (config.geminiMock) {
    logger.info('Gemini is configured in mock mode (GEMINI_MOCK=true). AI health status: up');
    aiHealthStatus = 'up';
    return 'up';
  }

  if (!config.geminiApiKey) {
    logger.error(
      '================================================================================\n' +
      '[GEMINI CONFIG ERROR] GEMINI_API_KEY is missing or empty!\n' +
      'Exact fix: Set GEMINI_API_KEY=your_gemini_api_key in server/.env\n' +
      '================================================================================'
    );
    aiHealthStatus = 'down';
    return 'down';
  }

  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    await ai.models.generateContent({
      model: config.geminiModel,
      contents: 'Reply with OK',
    });
    logger.info(
      { model: config.geminiModel },
      'Gemini startup check succeeded. AI health status: up'
    );
    aiHealthStatus = 'up';
    return 'up';
  } catch (err: unknown) {
    const classification = classifyGeminiError(err);
    if (classification.isPermanent) {
      logger.error(
        '================================================================================\n' +
        `[GEMINI CONFIG ERROR] Startup check failed with permanent error (${classification.statusCode || 'config'})!\n` +
        `Reason: ${classification.reason}\n` +
        `Configured GEMINI_MODEL: "${config.geminiModel}"\n` +
        'Exact fix: Check server/.env. Ensure GEMINI_API_KEY is valid and GEMINI_MODEL is set to a supported model (e.g. gemini-3.1-flash-lite).\n' +
        'Run "npm run check:gemini" in server/ to verify available models.\n' +
        '================================================================================'
      );
      aiHealthStatus = 'down';
      return 'down';
    } else {
      logger.warn(
        { reason: classification.reason },
        'Gemini startup check encountered transient issue. AI health remains up.'
      );
      aiHealthStatus = 'up';
      return 'up';
    }
  }
}
