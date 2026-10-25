import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  beforeEach(() => {
    config.geminiMock = false;
    config.geminiApiKey = 'test-api-key';
    mockGenerateContent.mockReset();
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

  it('retries on 429 rate limit error with exponential backoff and succeeds on next attempt', async () => {
    // Attempt 1: 429 rate limit
    mockGenerateContent.mockRejectedValueOnce(
      new Error('got status: 429 Too Many Requests. {"error":{"code":429,"message":"RESOURCE_EXHAUSTED"}}')
    );
    // Attempt 2: valid mystery JSON
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(validEasyFixture),
    });
    // Solver pass: agrees with culprit
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        suspectId: validEasyFixture.culpritId,
        reasoning: 'Evidence uniquely points to this suspect',
      }),
    });

    const result = await generateMysteryCase({
      premise: 'A vintage sapphire necklace disappears from a locked suite.',
      difficulty: 'easy',
    });

    // 2 generation attempts + 1 solver pass = 3 calls
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    expect(result.attempts).toBe(2);
    expect(result.mystery).toBeDefined();
    expect(result.mystery.culpritId).toBe(validEasyFixture.culpritId);
    expect(result.solverAgreed).toBe(true);
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
    // Solver pass: agrees with culprit
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        suspectId: validEasyFixture.culpritId,
        reasoning: 'Evidence uniquely points to this suspect',
      }),
    });

    const result = await generateMysteryCase({
      premise: 'A vintage sapphire necklace disappears from a locked suite.',
      difficulty: 'easy',
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    expect(result.attempts).toBe(2);
    expect(result.mystery).toBeDefined();
    expect(result.solverAgreed).toBe(true);
  }, 10000);
});
