import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
    constructor(_options: unknown) {}
  },
}));

import { config } from '../config/index';
import { generateMysteryCase } from './generator';

describe('Gemini rate-limit handling', () => {
  const originalConfig = {
    geminiMock: config.geminiMock,
    geminiApiKey: config.geminiApiKey,
    geminiMinIntervalMs: config.geminiMinIntervalMs,
  };

  beforeEach(() => {
    config.geminiMock = false;
    config.geminiApiKey = 'test-key';
    config.geminiMinIntervalMs = 0;
    generateContent.mockReset();
    generateContent.mockRejectedValue(
      Object.assign(new Error('429 RESOURCE_EXHAUSTED: rate limit exceeded'), { status: 429 })
    );
  });

  afterEach(() => {
    config.geminiMock = originalConfig.geminiMock;
    config.geminiApiKey = originalConfig.geminiApiKey;
    config.geminiMinIntervalMs = originalConfig.geminiMinIntervalMs;
  });

  it('stops after the first 429 instead of burning quota with immediate retries', async () => {
    await expect(
      generateMysteryCase({
        premise: 'A jewel disappears from a locked hotel suite.',
        difficulty: 'easy',
      })
    ).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      statusCode: 429,
      attempts: 1,
    });

    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});
