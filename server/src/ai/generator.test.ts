import { describe, it, expect, beforeEach } from 'vitest';
import { generateMysteryCase, classifyGeminiError } from './generator';
import { config } from '../config/index';

describe('Gemini Error Classification (SPEC 5.7 & Section 10)', () => {
  it('classifies 404 as a permanent configuration error that must not retry', () => {
    const error404 = new Error(
      'got status: 404 Not Found. {"error":{"code":404,"message":"models/gemini-not-a-real-model is not found for API version v1beta"}}'
    );
    const result = classifyGeminiError(error404);
    expect(result.isPermanent).toBe(true);
    expect(result.statusCode).toBe(404);
    expect(result.reason).toContain('Gemini config error: check GEMINI_MODEL and GEMINI_API_KEY');
  });

  it('classifies 400 (bad request / invalid argument) as a permanent error', () => {
    const error400 = new Error(
      'got status: 400 Bad Request. {"error":{"code":400,"message":"API key not valid."}}'
    );
    const result = classifyGeminiError(error400);
    expect(result.isPermanent).toBe(true);
    expect(result.statusCode).toBe(400);
  });

  it('classifies 401 and 403 as permanent authentication errors', () => {
    const error401 = { status: 401, message: 'Unauthorized' };
    const error403 = { status: 403, message: 'Forbidden' };
    expect(classifyGeminiError(error401).isPermanent).toBe(true);
    expect(classifyGeminiError(error403).isPermanent).toBe(true);
  });

  it('classifies 429 as transient rate limit error eligible for retry', () => {
    const error429 = new Error(
      'got status: 429 Too Many Requests. {"error":{"code":429,"message":"RESOURCE_EXHAUSTED"}}'
    );
    const result = classifyGeminiError(error429);
    expect(result.isPermanent).toBe(false);
    expect(result.statusCode).toBe(429);
    expect(result.reason).toContain('429');
  });

  it('classifies 5xx service errors as transient errors eligible for retry', () => {
    const error500 = new Error('got status: 500 Internal Server Error');
    const error503 = new Error(
      'got status: 503 Service Unavailable. {"error":{"code":503,"message":"This model is currently experiencing high demand."}}'
    );
    expect(classifyGeminiError(error500).isPermanent).toBe(false);
    expect(classifyGeminiError(error503).isPermanent).toBe(false);
  });

  it('classifies network timeouts and connection resets as transient errors eligible for retry', () => {
    const timeoutErr = new Error('The operation was aborted: network timeout');
    const resetErr = new Error('connect ECONNRESET');
    expect(classifyGeminiError(timeoutErr).isPermanent).toBe(false);
    expect(classifyGeminiError(resetErr).isPermanent).toBe(false);
  });
});

describe('AI Generator in Mock Mode (GEMINI_MOCK=true)', () => {
  beforeEach(() => {
    config.geminiMock = true;
  });

  it('generates an Easy case and transitions through all 5 stages', async () => {
    const stagesSeen: string[] = [];
    const result = await generateMysteryCase({
      premise: 'A vintage sapphire necklace disappears from a locked suite.',
      difficulty: 'easy',
      onStageChange: async (stage) => {
        stagesSeen.push(stage);
      },
    });

    expect(stagesSeen).toEqual(['scene', 'suspects', 'clues', 'hiding', 'validating']);
    expect(result.mystery).toBeDefined();
    expect(result.mystery.suspects).toHaveLength(3);
    expect(result.mystery.clues).toHaveLength(5);
    expect(result.mystery.hints).toHaveLength(2);
    expect(result.solverAgreed).toBe(true);
  });

  it('generates a Medium case with 4 suspects and 7 clues', async () => {
    const result = await generateMysteryCase({
      premise: 'A jewel theft at a hill-station wedding during the dance.',
      difficulty: 'medium',
    });

    expect(result.mystery.suspects).toHaveLength(4);
    expect(result.mystery.clues).toHaveLength(7);
    expect(result.mystery.hints).toHaveLength(3);
  });

  it('generates a Hard case with 5 suspects and 9 clues', async () => {
    const result = await generateMysteryCase({
      premise: 'A top-secret breakthrough prototype is extracted from a biometric vault.',
      difficulty: 'hard',
    });

    expect(result.mystery.suspects).toHaveLength(5);
    expect(result.mystery.clues).toHaveLength(9);
    expect(result.mystery.hints).toHaveLength(3);
  });
});
