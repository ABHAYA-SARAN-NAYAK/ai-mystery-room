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
  const maxAttempts = 3;
  let lastErrors: string[] = [];

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
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
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
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout per attempt (SPEC 10.3)

      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: attempt === 1 ? 0.9 : 0.4,
          topP: 0.95,
          maxOutputTokens: 9000,
        },
      });

      clearTimeout(timeoutId);

      const rawText = response.text || '';
      if (!rawText.trim()) {
        lastErrors = ['Gemini returned an empty response.'];
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch (jsonErr) {
        lastErrors = [`Failed to parse Gemini output as JSON: ${(jsonErr as Error).message}`];
        continue;
      }

      // Step 1: 15-step validation pipeline
      const validation = validateGeneratedMystery(parsed, difficulty);
      if (!validation.valid || !validation.mystery) {
        lastErrors = validation.errors;
        logger.warn(
          { attempt, errors: validation.errors, durationMs: Date.now() - attemptStart },
          'Gemini output failed validation pipeline'
        );
        continue;
      }

      // Step 2: Solver pass
      const solverResult = await runSolverPass(validation.mystery);
      if (!solverResult.agreed) {
        lastErrors = [
          `Solver pass disagreed: expected culprit ${validation.mystery.culpritId}, solver deduced ${solverResult.solverSuspectId}. Evidence may not be uniquely solvable.`,
        ];
        logger.warn(
          { attempt, solverResult, durationMs: Date.now() - attemptStart },
          'Solver pass disagreed'
        );
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
        solverAgreed: true,
        warnings: validation.warnings,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ attempt, err }, `Gemini API error during attempt ${attempt}: ${message}`);
      lastErrors = [`API call error: ${message}`];
    }
  }

  const totalDurationMs = Date.now() - startTime;
  logger.error(
    { attempts: maxAttempts, durationMs: totalDurationMs, lastErrors },
    'Case generation failed after maximum retries'
  );

  throw new AppError(
    'GENERATION_FAILED',
    `Mystery generation failed after ${maxAttempts} attempts: ${lastErrors.join('; ')}`,
    lastErrors,
    502
  );
}
