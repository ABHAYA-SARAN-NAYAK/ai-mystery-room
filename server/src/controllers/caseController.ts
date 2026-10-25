import { Request, Response, NextFunction } from 'express';
import {
  CreateCaseRequest,
  AccuseRequest,
  DIFFICULTY_TIERS,
  calculateScore,
} from '@mystery/shared';
import { sanitizePremise } from '../ai/safety';
import { createCaseJob } from '../services/generationService';
import {
  serializeCaseDetails,
  serializeClueDiscovery,
  serializeHintUse,
  serializeAccuseResponse,
  serializeCaseResult,
} from '../serializers/case';
import { MysteryCase, PlayerSession, AuditLog } from '../models/index';
import { AppError } from '../utils/errors';
import { config } from '../config/index';

export async function createCaseHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { premise: rawPremise, difficulty } = req.body as CreateCaseRequest;
    const sanitized = sanitizePremise(rawPremise);
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    const result = await createCaseJob(sanitized, difficulty, clientIp);

    res.status(202).json({
      data: result,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCaseHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = req.session!;
    const mysteryCase = req.mysteryCase!;

    // Polling while generating
    if (mysteryCase.status === 'generating') {
      res.status(200).json({
        data: {
          caseId: mysteryCase.publicId,
          status: 'generating',
          stage: mysteryCase.generationStage || 'scene',
        },
        requestId: req.requestId,
      });
      return;
    }

    // Generation failed
    if (mysteryCase.status === 'failed') {
      res.status(200).json({
        data: {
          caseId: mysteryCase.publicId,
          status: 'failed',
          errorCode: mysteryCase.generationMeta?.errorCode || 'GENERATION_FAILED',
        },
        requestId: req.requestId,
      });
      return;
    }

    // Abandoned
    if (mysteryCase.status === 'abandoned') {
      res.status(200).json({
        data: {
          caseId: mysteryCase.publicId,
          status: 'abandoned',
        },
        requestId: req.requestId,
      });
      return;
    }

    // Active or Accused: sanitized public details
    const serialized = serializeCaseDetails(mysteryCase, session);
    res.status(200).json({
      data: serialized,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

export async function discoverClueHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = req.session!;
    const mysteryCase = req.mysteryCase!;
    const clueId = req.params.clueId;

    if (mysteryCase.status !== 'active') {
      throw new AppError('CASE_NOT_ACTIVE', 'Case is not active for investigation', undefined, 409);
    }

    const clue = (mysteryCase.clues || []).find((c) => c.id === clueId);
    if (!clue) {
      throw new AppError('CLUE_NOT_FOUND', `Clue "${clueId}" not found in this case`, undefined, 404);
    }

    // Check unlock chain requirements (SPEC 10.2 rule 5)
    if (clue.requires && clue.requires.length > 0) {
      const missingRequirements = clue.requires.filter(
        (reqId) => !session.discoveredClueIds.includes(reqId)
      );
      if (missingRequirements.length > 0) {
        throw new AppError(
          'CLUE_LOCKED',
          `Clue is locked. Requires discovery of: ${missingRequirements.join(', ')}`,
          missingRequirements,
          409
        );
      }
    }

    const alreadyDiscovered = session.discoveredClueIds.includes(clue.id);

    let updatedSession = session;
    if (!alreadyDiscovered) {
      // Atomic update using $addToSet to prevent double count under race conditions
      const updateDoc = await PlayerSession.findOneAndUpdate(
        { _id: session._id },
        {
          $addToSet: { discoveredClueIds: clue.id },
          $set: { lastActiveAt: new Date() },
        },
        { new: true }
      );
      if (updateDoc) updatedSession = updateDoc;

      await AuditLog.create({
        caseId: mysteryCase.publicId,
        event: 'clue_discovered',
        ipHash: session.ipHash,
        meta: { clueId: clue.id },
      });
    }

    const serialized = serializeClueDiscovery(
      clue,
      updatedSession,
      mysteryCase,
      alreadyDiscovered
    );

    res.status(200).json({
      data: serialized,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

export async function useHintHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = req.session!;
    const mysteryCase = req.mysteryCase!;
    const tier = DIFFICULTY_TIERS[mysteryCase.difficulty];

    if (mysteryCase.status !== 'active') {
      throw new AppError('CASE_NOT_ACTIVE', 'Case is not active for investigation', undefined, 409);
    }

    const nextLevel = session.hintsUsed + 1;
    if (nextLevel > tier.hints) {
      throw new AppError('NO_HINTS_LEFT', 'No remaining hints available for this case', undefined, 409);
    }

    const hint = (mysteryCase.hints || []).find((h) => h.level === nextLevel);
    if (!hint) {
      throw new AppError('NO_HINTS_LEFT', 'No remaining hints available for this case', undefined, 409);
    }

    // Check unlock threshold (SPEC 10.2 rule 2)
    if (session.discoveredClueIds.length < hint.unlockAtClues) {
      throw new AppError(
        'HINT_LOCKED',
        `Hint ${hint.level} unlocks after discovering at least ${hint.unlockAtClues} clues`,
        undefined,
        409
      );
    }

    // Atomic update on PlayerSession to prevent race conditions
    const now = new Date();
    const updatedSession = await PlayerSession.findOneAndUpdate(
      { _id: session._id, hintsUsed: session.hintsUsed },
      {
        $inc: { hintsUsed: 1 },
        $push: { hintsGiven: { level: nextLevel, usedAt: now } },
        $set: { lastActiveAt: now },
      },
      { new: true }
    );

    if (!updatedSession) {
      // Race condition occurred; another concurrent request consumed the hint
      throw new AppError('NO_HINTS_LEFT', 'Hint already consumed or unavailable', undefined, 409);
    }

    await AuditLog.create({
      caseId: mysteryCase.publicId,
      event: 'hint_used',
      ipHash: session.ipHash,
      meta: { level: nextLevel },
    });

    const serialized = serializeHintUse(hint, updatedSession, mysteryCase, 10);

    res.status(200).json({
      data: serialized,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

export async function accuseHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = req.session!;
    const mysteryCase = req.mysteryCase!;
    const { suspectId, reasoning } = req.body as AccuseRequest;
    const tier = DIFFICULTY_TIERS[mysteryCase.difficulty];

    // Check already accused
    if (session.accusation || mysteryCase.status === 'accused') {
      throw new AppError('ALREADY_ACCUSED', 'An accusation has already been submitted for this case', undefined, 409);
    }

    if (mysteryCase.status !== 'active') {
      throw new AppError('CASE_NOT_ACTIVE', 'Case is not in active state', undefined, 409);
    }

    // Check minimum clues discovered
    if (session.discoveredClueIds.length < tier.minCluesToAccuse) {
      throw new AppError(
        'ACCUSATION_LOCKED',
        `You must discover at least ${tier.minCluesToAccuse} clues before making an accusation`,
        undefined,
        409
      );
    }

    // Validate suspectId exists in this case
    const suspectExists = (mysteryCase.suspects || []).some((s) => s.id === suspectId);
    if (!suspectExists) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Suspect ID "${suspectId}" is not part of this mystery`,
        undefined,
        400
      );
    }

    // Atomic update to mark case as accused so only ONE parallel request can succeed (concurrency safety)
    const lockedCase = await MysteryCase.findOneAndUpdate(
      { _id: mysteryCase._id, status: 'active' },
      { $set: { status: 'accused' } },
      { new: true }
    ).select('+secret');

    if (!lockedCase || !lockedCase.secret) {
      throw new AppError('ALREADY_ACCUSED', 'An accusation has already been resolved for this case', undefined, 409);
    }

    // Check correctness against secret
    const isCorrect = suspectId === lockedCase.secret.culpritId;

    // Calculate score using calculateScore pure function
    const score = calculateScore({
      difficulty: mysteryCase.difficulty,
      correct: isCorrect,
      cluesDiscovered: session.discoveredClueIds.length,
      hintsUsed: session.hintsUsed,
      scoreWrongKeepsClueBonus: config.scoreWrongKeepsClueBonus,
    });

    // Save accusation on PlayerSession
    session.accusation = {
      suspectId,
      reasoning: reasoning ? reasoning.trim() : undefined,
      submittedAt: new Date(),
      correct: isCorrect,
    };
    session.score = score;
    session.lastActiveAt = new Date();
    await session.save();

    await AuditLog.create({
      caseId: mysteryCase.publicId,
      event: 'accusation_submitted',
      ipHash: session.ipHash,
      meta: { correct: isCorrect },
    });

    const serialized = serializeAccuseResponse(session);

    res.status(200).json({
      data: serialized,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

export async function getResultHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = req.session!;
    const mysteryCase = req.mysteryCase!;

    if (mysteryCase.status !== 'accused' || !session.accusation) {
      throw new AppError(
        'CASE_NOT_RESOLVED',
        'Cannot view results before an accusation has been submitted',
        undefined,
        409
      );
    }

    // Explicitly load secret for results
    const loadedCase = await MysteryCase.findById(mysteryCase._id).select('+secret');
    if (!loadedCase || !loadedCase.secret) {
      throw new AppError('INTERNAL_ERROR', 'Case secret data is unavailable', undefined, 500);
    }

    await AuditLog.create({
      caseId: mysteryCase.publicId,
      event: 'result_viewed',
      ipHash: session.ipHash,
    });

    const serialized = serializeCaseResult(loadedCase, session);

    res.status(200).json({
      data: serialized,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelCaseHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const mysteryCase = req.mysteryCase!;

    if (mysteryCase.status === 'generating' || mysteryCase.status === 'active') {
      mysteryCase.status = 'abandoned';
      await mysteryCase.save();
    }

    res.status(200).json({
      data: { status: 'abandoned' },
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
}
