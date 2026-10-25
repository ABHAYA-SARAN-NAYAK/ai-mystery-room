import { Difficulty } from '@mystery/shared';
import { MysteryCase, PlayerSession, AuditLog } from '../models/index';
import { generateCaseId, generateSessionToken, hashSessionToken, hashIp } from '../utils/crypto';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/index';
import { generateMysteryCase } from '../ai/generator';

export interface CreateCaseResult {
  caseId: string;
  sessionToken: string;
  status: 'generating';
  pollAfterMs: number;
}

export async function createCaseJob(
  premise: string,
  difficulty: Difficulty,
  clientIp: string
): Promise<CreateCaseResult> {
  // 1. Check daily generation limit (SPEC 6.4 & 4.2)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayCount = await MysteryCase.countDocuments({
    createdAt: { $gte: startOfDay },
  });

  if (todayCount >= config.maxDailyGenerations) {
    throw new AppError(
      'DAILY_LIMIT_REACHED',
      'Daily generation quota reached. Please come back tomorrow.',
      undefined,
      429
    );
  }

  // 2. Generate IDs & tokens
  const caseId = generateCaseId();
  const sessionToken = generateSessionToken();
  const tokenHash = hashSessionToken(sessionToken);
  const ipHash = hashIp(clientIp);

  // 3. Persist initial Case and Session documents
  await MysteryCase.create({
    publicId: caseId,
    premise,
    difficulty,
    status: 'generating',
    generationStage: 'scene',
    suspects: [],
    clues: [],
    hints: [],
  });

  await PlayerSession.create({
    caseId,
    tokenHash,
    discoveredClueIds: [],
    hintsUsed: 0,
    hintsGiven: [],
    ipHash,
    startedAt: new Date(),
    lastActiveAt: new Date(),
  });

  await AuditLog.create({
    caseId,
    event: 'case_requested',
    ipHash,
    meta: { difficulty },
  });

  // 4. Fire-and-forget background generation
  runBackgroundGeneration(caseId, premise, difficulty, ipHash).catch((err) => {
    logger.error({ err, caseId }, 'Unhandled error in background generation worker');
  });

  return {
    caseId,
    sessionToken,
    status: 'generating',
    pollAfterMs: 2000,
  };
}

async function runBackgroundGeneration(
  caseId: string,
  premise: string,
  difficulty: Difficulty,
  ipHash: string
): Promise<void> {
  logger.info({ caseId, difficulty }, 'Background generation job started');

  try {
    const onStageChange = async (
      stage: 'scene' | 'suspects' | 'clues' | 'hiding' | 'validating'
    ) => {
      await MysteryCase.updateOne({ publicId: caseId }, { $set: { generationStage: stage } });
    };

    const result = await generateMysteryCase({
      premise,
      difficulty,
      onStageChange,
    });

    const m = result.mystery;

    // Save full case with secret (which has select: false on schema)
    await MysteryCase.updateOne(
      { publicId: caseId },
      {
        $set: {
          status: 'active',
          generationStage: 'validating',
          title: m.title,
          briefing: m.briefing,
          setting: m.setting,
          caseDate: m.caseDate,
          sceneKey: m.sceneKey,
          victim: m.victim,
          suspects: m.suspects,
          clues: m.clues,
          hints: m.hints,
          secret: {
            culpritId: m.culpritId,
            motive: m.motive,
            method: m.method,
            opportunity: m.opportunity,
            clueMeta: m.clues.map((c) => ({
              clueId: c.id,
              role: c.role,
              pointsToSuspectIds: c.pointsToSuspectIds,
            })),
            deduction: m.deduction,
            timeline: m.timeline,
          },
          generationMeta: {
            model: config.geminiModel,
            attempts: result.attempts,
            durationMs: result.durationMs,
            solverAgreed: result.solverAgreed,
            validationWarnings: result.warnings,
          },
        },
      }
    );

    await AuditLog.create({
      caseId,
      event: 'generation_succeeded',
      ipHash,
      meta: {
        attempts: result.attempts,
        durationMs: result.durationMs,
      },
    });

    logger.info({ caseId, durationMs: result.durationMs }, 'Case generated and activated successfully');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const errorCode = err instanceof AppError ? err.code : 'GENERATION_FAILED';
    logger.error({ err, caseId }, `Background case generation failed: ${message}`);

    await MysteryCase.updateOne(
      { publicId: caseId },
      {
        $set: {
          status: 'failed',
          generationMeta: {
            attempts: Number((err as Error & { attempts?: number }).attempts ?? 3),
            errorCode,
            validationWarnings: [message],
          },
        },
      }
    );

    await AuditLog.create({
      caseId,
      event: 'generation_failed',
      ipHash,
      meta: { error: message },
    });
  }
}
