import { GeneratedMystery } from '@mystery/shared';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index';
import { logger } from '../utils/logger';

export interface SolverPassResult {
  agreed: boolean;
  solverSuspectId: string;
  reasoning: string;
}

export async function runSolverPass(mystery: GeneratedMystery): Promise<SolverPassResult> {
  // If solver pass disabled or mock mode, assume agreed
  if (!config.enableSolverPass || config.geminiMock) {
    return {
      agreed: true,
      solverSuspectId: mystery.culpritId,
      reasoning: 'Solver pass agreed or bypassed (mock mode/disabled)',
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
      solverSuspectId: parsed.suspectId || 'unknown',
      reasoning: parsed.reasoning || '',
    };
  } catch (err) {
    logger.warn({ err }, 'Solver pass execution encountered an error');
    // If solver API call fails due to quota or timeout, do not block generation completely
    return {
      agreed: true,
      solverSuspectId: mystery.culpritId,
      reasoning: 'Solver pass fallback due to API error',
    };
  }
}
