import { GeneratedMystery } from '@mystery/shared';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { waitForGeminiRequestSlot } from './requestThrottle';

export interface SolverPassResult {
  agreed: boolean;
  performed: boolean;
  solverSuspectId: string;
  reasoning: string;
}

export async function runSolverPass(mystery: GeneratedMystery): Promise<SolverPassResult> {
  // Mock fixtures are pre-validated. Disabled free-tier verification is marked as not performed.
  if (!config.enableSolverPass || config.geminiMock) {
    const performed = config.geminiMock;
    return {
      agreed: true,
      performed,
      solverSuspectId: mystery.culpritId,
      reasoning: performed
        ? 'Solver pass bypassed for mock fixtures'
        : 'Independent solver verification disabled by configuration',
    };
  }

  // Construct sanitized puzzle payload with NO secret data
  const puzzle = {
    title: mystery.title,
    briefing: mystery.briefing,
    setting: mystery.setting,
    victim: mystery.victim,
    suspects: mystery.suspects.map((s) => ({
      id: s.id,
      name: s.name,
      age: s.age,
      occupation: s.occupation,
      relationshipToVictim: s.relationshipToVictim,
      publicStatement: s.publicStatement,
      alibiTimeline: s.alibiTimeline,
    })),
    clues: mystery.clues.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      location: c.location,
      description: c.description,
    })),
  };

  const solverPrompt = `You are an elite detective solving a fair-play mystery.
Analyze this crime scene, the suspects, and the clues below.
Identify the ONE guilty suspect based ONLY on the evidence provided.

${JSON.stringify(puzzle, null, 2)}

Respond with JSON matching this structure:
{
  "suspectId": "s1",
  "reasoning": "Brief explanation"
}`;

  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    await waitForGeminiRequestSlot();
    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: solverPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    const agreed = parsed.suspectId === mystery.culpritId;

    return {
      agreed,
      performed: true,
      solverSuspectId: parsed.suspectId || 'unknown',
      reasoning: parsed.reasoning || '',
    };
  } catch (err) {
    logger.warn({ err }, 'Solver pass execution encountered an error');
    const detail = err as {
      status?: number;
      statusCode?: number;
      code?: number | string;
      message?: string;
      error?: { code?: number; status?: string; message?: string };
    };
    const status = Number(detail?.status ?? detail?.statusCode ?? detail?.error?.code ?? 0);
    const message = err instanceof Error ? err.message : String(err);
    const quotaExceeded =
      status === 429 ||
      String(detail?.code ?? '').toLowerCase() === 'resource_exhausted' ||
      /rate.?limit|resource.?exhausted|quota.?exceeded|too many requests/i.test(message) ||
      /RESOURCE_EXHAUSTED/i.test(String(detail?.error?.status ?? ''));

    // Do not silently mark the puzzle as verified when the solver request was rate-limited.
    if (quotaExceeded) {
      throw new AppError(
        'RATE_LIMITED',
        'Gemini quota/rate limit reached during solver verification.',
        ['Solver verification could not complete because Gemini quota is exhausted.'],
        429
      );
    }

    // When enabled, solver verification is a gate: an error must not count as agreement.
    throw err;
  }
}
