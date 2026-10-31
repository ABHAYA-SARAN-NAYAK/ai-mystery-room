import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleGenAI } from '@google/genai';
import { generateMysteryCase } from './generator';
import { config } from '../config/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const validEasyFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/valid_easy_1.json'), 'utf-8')
);

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('AI Generator Error & Retry Behavior (GEMINI_MOCK=false)', () => {
  const originalConfig = {
    geminiMock: config.geminiMock,
    geminiApiKey: config.geminiApiKey,
    geminiMinIntervalMs: config.geminiMinIntervalMs,
    geminiRequestTimeoutMs: config.geminiRequestTimeoutMs,
    enableSolverPass: config.enableSolverPass,
  };

  beforeEach(() => {
    config.geminiMock = false;
    config.geminiApiKey = 'test-api-key';
    config.geminiMinIntervalMs = 0;
    config.geminiRequestTimeoutMs = 10_000;
    config.enableSolverPass = false;
    mockGenerateContent.mockReset();
    (GoogleGenAI as unknown as { mockClear: () => void }).mockClear();
  });

  afterEach(() => {
    Object.assign(config, originalConfig);
  });

  it('fails fast on 404 (does NOT retry, throws GENERATION_FAILED on attempt 1)', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error('got status: 404 Not Found. {"error":{"code":404,"message":"models/gemini-old is not found"}}')
    );

    await expect(
      generateMysteryCase({
        premise: 'A jewel theft at a locked mansion room during the gala.',
        difficulty: 'easy',
      })
    ).rejects.toThrow(/Case generation failed due to an AI service configuration error/);

    // Verify it called generateContent EXACTLY once (0 retries!)
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('fails fast on a 429 rate limit without spending quota on retries', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error('got status: 429 Too Many Requests. {"error":{"code":429,"message":"RESOURCE_EXHAUSTED"}}')
    );

    await expect(
      generateMysteryCase({
        premise: 'A vintage sapphire necklace disappears from a locked suite.',
        difficulty: 'easy',
      })
    ).rejects.toMatchObject({ code: 'RATE_LIMITED', statusCode: 429, attempts: 1 });

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('recovers from a transient 503 with bounded backoff and a later valid response', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('got status: 503 Service Unavailable. This model is currently experiencing high demand.'))
      .mockResolvedValueOnce({ text: JSON.stringify(validEasyFixture) });

    const result = await generateMysteryCase({
      premise: 'A vintage sapphire necklace disappears from a locked suite.',
      difficulty: 'easy',
    });

    expect(result.attempts).toBe(2);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  }, 10000);

  it('returns a useful failure after the bounded 503 retry limit', async () => {
    mockGenerateContent.mockRejectedValue(
      new Error('got status: 503 Service Unavailable. This model is currently experiencing high demand.')
    );

    await expect(
      generateMysteryCase({
        premise: 'A jewel disappears from a locked hotel suite.',
        difficulty: 'easy',
      })
    ).rejects.toMatchObject({
      code: 'GENERATION_FAILED',
      statusCode: 502,
      message: 'Gemini is temporarily unavailable due to high demand. Please try again shortly.',
      attempts: 3,
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  }, 10000);

  it('retries on invalid JSON output and succeeds on next attempt', async () => {
    // Attempt 1: Malformed JSON
    mockGenerateContent.mockResolvedValueOnce({
      text: '{"title": "Truncated json...',
    });
    // Attempt 2: valid mystery JSON
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(validEasyFixture),
    });

    const result = await generateMysteryCase({
      premise: 'A vintage sapphire necklace disappears from a locked suite.',
      difficulty: 'easy',
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result.attempts).toBe(2);
    expect(result.mystery).toBeDefined();
    expect(result.solverAgreed).toBe(false);
  }, 10000);

  it('sends Easy chain validation feedback and regenerates a corrected mystery', async () => {
    const invalidDepthTwo = structuredClone(validEasyFixture);
    invalidDepthTwo.clues.find((clue: { id: string }) => clue.id === 'c5').requires = ['c4'];
    mockGenerateContent
      .mockResolvedValueOnce({ text: JSON.stringify(invalidDepthTwo) })
      .mockResolvedValueOnce({ text: JSON.stringify(validEasyFixture) });

    const result = await generateMysteryCase({
      premise: 'A manuscript vanishes from the university archives.',
      difficulty: 'easy',
    });

    expect(result.attempts).toBe(2);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    const correctionPrompt = mockGenerateContent.mock.calls[1][0].contents as string;
    expect(correctionPrompt).toContain('Clue chain depth of 2 exceeds maximum allowed depth of 1 for Easy');
    expect(correctionPrompt).toContain('Rebuild the affected clues and their requires graph from scratch');
  }, 10000);

  it('uses the SDK abortable timeout and returns a clear 504 after bounded timeout retries', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Gemini request timed out after 10000ms'));

    await expect(
      generateMysteryCase({
        premise: 'A jewel disappears from a locked hotel suite.',
        difficulty: 'easy',
      })
    ).rejects.toMatchObject({ code: 'GENERATION_TIMEOUT', statusCode: 504, attempts: 3 });

    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    expect(GoogleGenAI).toHaveBeenCalledWith(
      expect.objectContaining({ httpOptions: { timeout: 10_000 } })
    );
  }, 10000);
});
