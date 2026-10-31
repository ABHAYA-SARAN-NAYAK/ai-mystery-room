import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { Difficulty, GeneratedMystery } from '@mystery/shared';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { buildSystemPrompt } from './prompts/system';
import { buildUserPrompt } from './prompts/user';
import { validateGeneratedMystery } from './validator';
import { runSolverPass } from './solver';
import { waitForGeminiRequestSlot } from './requestThrottle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GenerateOptions {
  premise: string;
  difficulty: Difficulty;
  onStageChange?: (stage: 'scene' | 'suspects' | 'clues' | 'hiding' | 'validating') => Promise<void>;
}

export interface GenerateResult {
  mystery: GeneratedMystery;
  attempts: number;
  durationMs: number;
  solverAgreed: boolean;
  warnings: string[];
}

export interface ClassifiedGeminiError {
  isPermanent: boolean;
  statusCode?: number;
  reason: string;
}

export function classifyGeminiError(err: unknown): ClassifiedGeminiError {
  let statusCode: number | undefined;
  const message = err instanceof Error ? err.message : String(err);

  // 1. Check explicit status / statusCode / code properties if present on the error object
  if (err && typeof err === 'object') {
    const candidate =
      (err as Record<string, unknown>).status ??
      (err as Record<string, unknown>).statusCode ??
      (err as Record<string, unknown>).code;

    if (typeof candidate === 'number' && Number.isInteger(candidate)) {
      statusCode = candidate;
    } else if (typeof candidate === 'string') {
      const parsed = parseInt(candidate, 10);
      if (!isNaN(parsed) && parsed >= 100 && parsed < 600) {
        statusCode = parsed;
      }
    }
  }

  // 2. Extract HTTP status code from error message (e.g. "got status: 404 Not Found" or "code":404)
  if (!statusCode) {
    const statusMatch =
      message.match(/got status:\s*(\d{3})/i) ||
      message.match(/"code":\s*(\d{3})/) ||
      message.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
    if (statusMatch) {
      statusCode = parseInt(statusMatch[1], 10);
    }
  }

  // 3. Permanent errors: 404 (model not found), 400 (bad model / bad request), 401 (unauthorized), 403 (forbidden)
  if (statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 404) {
    return {
      isPermanent: true,
      statusCode,
      reason: 'Gemini config error: check GEMINI_MODEL and GEMINI_API_KEY',
    };
  }

  // Check for known permanent error strings in message if status code was missing
  if (
    /API_KEY_INVALID|API key not valid|NOT_FOUND|is not found for API version|PERMISSION_DENIED|is no longer available/i.test(
      message
    )
  ) {
    return {
      isPermanent: true,
      statusCode: statusCode || 400,
      reason: 'Gemini config error: check GEMINI_MODEL and GEMINI_API_KEY',
    };
  }

  // 4. Rate limit: 429
  if (statusCode === 429 || /RESOURCE_EXHAUSTED|rate limit/i.test(message)) {
    return {
      isPermanent: false,
      statusCode: 429,
      reason: 'Gemini rate limit exceeded (429)',
    };
  }

  // 5. 5xx server errors
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return {
      isPermanent: false,
      statusCode,
      reason: `Gemini service error (${statusCode})`,
    };
  }

  // 6. Network timeouts / Abort / connection issues
  if (
    /AbortError|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|FetchError|network timeout/i.test(
      message
    )
  ) {
    return {
      isPermanent: false,
      statusCode: undefined,
      reason: 'Network timeout or connection error to Gemini API',
    };
  }

  // Default fallback for other unexpected errors during the API call: treat as transient
  return {
    isPermanent: false,
    statusCode,
    reason: `Transient Gemini API error: ${message}`,
  };
}

function retryAfterMs(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;

  const candidate = err as {
    retryAfter?: unknown;
    retryAfterMs?: unknown;
    headers?: { get?: (name: string) => string | null } | Record<string, unknown>;
  };
  const explicit = candidate.retryAfterMs ?? candidate.retryAfter;
  if (typeof explicit === 'number' && Number.isFinite(explicit) && explicit >= 0) {
    return Math.floor(explicit);
  }

  const headers = candidate.headers as Record<string, unknown> | { get?: (name: string) => string | null } | undefined;
  let header: unknown;
  if (typeof headers?.get === 'function') {
    header = headers.get('retry-after');
  } else if (headers) {
    const headerRecord = headers as Record<string, unknown>;
    header = headerRecord['retry-after'] ?? headerRecord['Retry-After'];
  }
  if (typeof header !== 'string') return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds * 1000) : undefined;
}

function retryDelayMs(attempt: number, err?: unknown): number {
  const retryAfter = retryAfterMs(err);
  if (retryAfter !== undefined) return Math.min(retryAfter, 30_000);
  const exponentialDelay = Math.min(4_000, 500 * 2 ** (attempt - 1));
  return exponentialDelay + Math.floor(Math.random() * 250);
}

async function pauseBeforeRetry(attempt: number, err?: unknown): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, retryDelayMs(attempt, err)));
}

async function pauseBeforeCorrection(): Promise<void> {
  // Invalid content uses a changed correction prompt, not transport retry backoff.
  await new Promise<void>((resolve) => setTimeout(resolve, 250));
}

function isTimeoutError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /timed out|timeout|AbortError|aborted/i.test(message);
}

function getFixturesDir(): string {
  const candidates = [
    path.join(__dirname, 'fixtures'),
    path.join(__dirname, 'ai/fixtures'),
    path.join(__dirname, '../src/ai/fixtures'),
    path.join(process.cwd(), 'server/src/ai/fixtures'),
    path.join(process.cwd(), 'src/ai/fixtures'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(__dirname, 'fixtures');
}

function loadMockFixture(difficulty: Difficulty, premise: string): GeneratedMystery {
  const fixturesDir = getFixturesDir();

  // Match keyword or pick 1..3 deterministically based on premise hash
  let fixtureIndex = 1;
  const lower = premise.toLowerCase();
  if (lower.includes('wedding') || lower.includes('emerald') || lower.includes('necklace')) {
    fixtureIndex = 1;
  } else if (lower.includes('resort') || lower.includes('lake') || lower.includes('death')) {
    fixtureIndex = 2;
  } else if (lower.includes('train') || lower.includes('blackout') || lower.includes('study')) {
    fixtureIndex = 2;
  } else {
    // Hash premise to pick 1, 2, or 3
    const sum = premise.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    fixtureIndex = (sum % 3) + 1;
  }

  const filename = `valid_${difficulty}_${fixtureIndex}.json`;
  const filePath = path.join(fixturesDir, filename);

  if (!fs.existsSync(filePath)) {
    // Fallback to valid_${difficulty}_1.json
    const fallbackPath = path.join(fixturesDir, `valid_${difficulty}_1.json`);
    const content = fs.readFileSync(fallbackPath, 'utf-8');
    return JSON.parse(content);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function generateMysteryCase({
  premise,
  difficulty,
  onStageChange,
}: GenerateOptions): Promise<GenerateResult> {
  const startTime = Date.now();
  // Retry transient failures, but fail fast on quota/rate-limit responses.
  const maxAttempts = 3;
  let lastErrors: string[] = [];
  let lastFailureWasServiceUnavailable = false;

  // Stage 1: scene
  if (onStageChange) await onStageChange('scene');

  // If in mock mode, simulate brief stage progression and return validated fixture
  if (config.geminiMock) {
    logger.info({ difficulty }, 'Generating case using mock fixtures (GEMINI_MOCK=true)');

    if (onStageChange) {
      await onStageChange('suspects');
      await onStageChange('clues');
      await onStageChange('hiding');
      await onStageChange('validating');
    }

    const mockMystery = loadMockFixture(difficulty, premise);
    const validation = validateGeneratedMystery(mockMystery, difficulty);
    if (!validation.valid || !validation.mystery) {
      throw new AppError(
        'GENERATION_FAILED',
        `Mock fixture failed validation: ${validation.errors.join('; ')}`,
        undefined,
        502
      );
    }

    const durationMs = Date.now() - startTime;
    return {
      mystery: validation.mystery,
      attempts: 1,
      durationMs,
      solverAgreed: true,
      warnings: validation.warnings,
    };
  }

  // Real Gemini generation loop
  const ai = new GoogleGenAI({
    apiKey: config.geminiApiKey,
    // @google/genai implements this timeout with AbortController, cancelling
    // the underlying fetch instead of merely abandoning a Promise race.
    httpOptions: { timeout: config.geminiRequestTimeoutMs },
  });
  const systemPrompt = buildSystemPrompt(difficulty);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptStart = Date.now();
    logger.info({ attempt, maxAttempts, difficulty }, 'Starting Gemini case generation attempt');

    // Estimated stages for UX feedback (SPEC 10.3)
    if (onStageChange) {
      await onStageChange('suspects');
      await onStageChange('clues');
      await onStageChange('hiding');
      await onStageChange('validating');
    }

    const userPrompt = buildUserPrompt({
      premise,
      difficulty,
      retryErrors: attempt > 1 ? lastErrors : undefined,
      regenerationAttempt: attempt,
    });

    let rawText = '';
    let requestError: unknown;
    try {
      await waitForGeminiRequestSlot();
      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: attempt === 1 ? 0.9 : 0.4,
          topP: 0.95,
          maxOutputTokens: 6000,
          thinkingConfig: { includeThoughts: false },
        },
      });

      rawText = response.text || '';
    } catch (err: unknown) {
      const classification = classifyGeminiError(err);
      requestError = err;

      if (classification.statusCode === 429) {
        const retryAfter = retryAfterMs(err);
        const details = [
          'Gemini quota or rate limit is exhausted. Immediate retries are disabled to preserve quota.',
          ...(retryAfter !== undefined ? [`Retry after approximately ${Math.ceil(retryAfter / 1000)} seconds.`] : []),
        ];
        const quotaError = new AppError(
          'RATE_LIMITED',
          'Gemini quota/rate limit reached. Wait for the quota window to reset before generating another case.',
          details,
          429
        );
        Object.assign(quotaError, { attempts: attempt });
        throw quotaError;
      }

      if (classification.isPermanent) {
        logger.error(
          { attempt, statusCode: classification.statusCode, err },
          'Gemini config error: check GEMINI_MODEL and GEMINI_API_KEY'
        );
        throw new AppError(
          'GENERATION_FAILED',
          'Case generation failed due to an AI service configuration error.',
          undefined,
          502
        );
      }

      logger.warn(
        { attempt, reason: classification.reason, statusCode: classification.statusCode, err },
        `Transient Gemini API error during attempt ${attempt}`
      );
      lastErrors = [
        isTimeoutError(err)
          ? `Gemini request timed out after ${config.geminiRequestTimeoutMs}ms.`
          : classification.reason,
      ];
      lastFailureWasServiceUnavailable = classification.statusCode === 503;
    }

    if (requestError) {
      if (attempt < maxAttempts) await pauseBeforeRetry(attempt, requestError);
      continue;
    }

    if (!rawText.trim()) {
      lastErrors = ['Gemini returned an empty response.'];
      lastFailureWasServiceUnavailable = false;
      logger.warn({ attempt }, 'Gemini returned empty text response');
      if (attempt < maxAttempts) {
        await pauseBeforeCorrection();
      }
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch (jsonErr) {
      lastErrors = [`Failed to parse Gemini output as JSON: ${(jsonErr as Error).message}`];
      lastFailureWasServiceUnavailable = false;
      logger.warn(
        { attempt, durationMs: Date.now() - attemptStart },
        'Failed to parse Gemini output as JSON'
      );
      if (attempt < maxAttempts) {
        await pauseBeforeCorrection();
      }
      continue;
    }

    // Step 1: 15-step validation pipeline
    const validation = validateGeneratedMystery(parsed, difficulty);
    if (!validation.valid || !validation.mystery) {
      lastErrors = validation.errors;
      lastFailureWasServiceUnavailable = false;
      logger.warn(
        { attempt, errors: validation.errors, durationMs: Date.now() - attemptStart },
        'Gemini output failed validation pipeline'
      );
      if (attempt < maxAttempts) {
        await pauseBeforeCorrection();
      }
      continue;
    }

    // Step 2: Solver pass
    const solverResult = await runSolverPass(validation.mystery);
    if (solverResult.performed && !solverResult.agreed) {
      lastErrors = [
        `Solver pass disagreed: expected culprit ${validation.mystery.culpritId}, solver deduced ${solverResult.solverSuspectId}. Evidence may not be uniquely solvable.`,
      ];
      lastFailureWasServiceUnavailable = false;
      logger.warn(
        { attempt, solverResult, durationMs: Date.now() - attemptStart },
        'Solver pass disagreed'
      );
      if (attempt < maxAttempts) {
        await pauseBeforeCorrection();
      }
      continue;
    }

    // Both validation and solver passed!
    const totalDurationMs = Date.now() - startTime;
    logger.info(
      { attempt, durationMs: totalDurationMs },
      'Successfully generated and validated mystery case'
    );

    return {
      mystery: validation.mystery,
      attempts: attempt,
      durationMs: totalDurationMs,
      solverAgreed: solverResult.performed && solverResult.agreed,
      warnings: solverResult.performed
        ? validation.warnings
        : [...validation.warnings, 'Independent solver verification was skipped to conserve Gemini quota.'],
    };
  }

  const totalDurationMs = Date.now() - startTime;
  logger.error(
    { attempts: maxAttempts, durationMs: totalDurationMs, lastErrors },
    'Case generation failed after maximum retries'
  );

  const timedOut = lastErrors.some((error) => error.includes('timed out'));
  const generationError = new AppError(
    timedOut ? 'GENERATION_TIMEOUT' : 'GENERATION_FAILED',
    timedOut
      ? 'Gemini did not respond before the request timeout. Please try again.'
      : lastFailureWasServiceUnavailable
        ? 'Gemini is temporarily unavailable due to high demand. Please try again shortly.'
      : 'Mystery generation failed after maximum retries. Please try again.',
    lastErrors,
    timedOut ? 504 : 502
  );
  Object.assign(generationError, { attempts: maxAttempts });
  throw generationError;
}
