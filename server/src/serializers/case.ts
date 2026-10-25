import {
  calculateScore,
  DIFFICULTY_TIERS,
  PublicCaseDetails,
  PublicClue,
  PublicHint,
  DiscoverClueResponseData,
  UseHintResponseData,
  AccuseResponseData,
  CaseResultData,
  ResultClue,
  ClueVisualKey,
  SceneKey,
} from '@mystery/shared';
import { IMysteryCase, IPlayerSession, IClue, IHint } from '../models/index';
import { config } from '../config/index';

/**
 * Serializes the case state into a public, sanitized format.
 * STRICT ALLOW-LIST ONLY. Never deletes or mutates raw DB objects.
 */
export function serializeCaseDetails(
  mysteryCase: IMysteryCase,
  session: IPlayerSession
): PublicCaseDetails {
  const tier = DIFFICULTY_TIERS[mysteryCase.difficulty];
  const discoveredCluesCount = session.discoveredClueIds.length;
  const cluesNeededToAccuse = Math.max(0, tier.minCluesToAccuse - discoveredCluesCount);
  const canAccuse = discoveredCluesCount >= tier.minCluesToAccuse;

  // Calculate score preview using pure calculateScore function
  const currentScorePreview = calculateScore({
    difficulty: mysteryCase.difficulty,
    correct: false,
    cluesDiscovered: discoveredCluesCount,
    hintsUsed: session.hintsUsed,
    scoreWrongKeepsClueBonus: config.scoreWrongKeepsClueBonus,
  }).final;

  // Clues: strictly separate discovered from locked
  const clues: PublicClue[] = (mysteryCase.clues || []).map((clue: IClue) => {
    const isDiscovered = session.discoveredClueIds.includes(clue.id);
    if (isDiscovered) {
      return {
        id: clue.id,
        title: clue.title,
        type: clue.type,
        location: clue.location,
        discovered: true,
        locked: false,
        description: clue.description,
        visualKey: (clue.visualKey || 'none') as ClueVisualKey,
        insight: clue.insight || '',
        requires: clue.requires || [],
        mentionsSuspectIds: clue.mentionsSuspectIds || [],
      };
    } else {
      return {
        id: clue.id,
        title: clue.title,
        type: clue.type,
        location: clue.location,
        discovered: false,
        locked: true,
        requires: clue.requires || [],
      };
    }
  });

  // Hints: hidden until used (SPEC 10.2 rule 1)
  const hints: PublicHint[] = (mysteryCase.hints || []).map((hint: IHint) => {
    const usedRecord = session.hintsGiven.find((h) => h.level === hint.level);
    const isUsed = !!usedRecord;
    const isLocked = discoveredCluesCount < hint.unlockAtClues;

    if (isUsed) {
      return {
        level: hint.level,
        unlockAtClues: hint.unlockAtClues,
        locked: false,
        used: true,
        text: hint.text,
        usedAt: usedRecord.usedAt ? usedRecord.usedAt.toISOString() : undefined,
      };
    }

    return {
      level: hint.level,
      unlockAtClues: hint.unlockAtClues,
      locked: isLocked,
      used: false,
    };
  });

  // Suspects: allow-listed fields
  const suspects = (mysteryCase.suspects || []).map((s) => ({
    id: s.id,
    name: s.name,
    age: s.age,
    occupation: s.occupation,
    relationshipToVictim: s.relationshipToVictim,
    publicStatement: s.publicStatement,
    gender: s.gender,
    background: s.background || '',
    personality: s.personality || '',
    alibiTimeline: (s.alibiTimeline || []).map((t) => ({ time: t.time, label: t.label })),
    connections: (s.connections || []).map((c) => ({
      suspectId: c.suspectId,
      label: c.label,
      note: c.note,
    })),
  }));

  return {
    caseId: mysteryCase.publicId,
    status: mysteryCase.status,
    difficulty: mysteryCase.difficulty,
    title: mysteryCase.title || '',
    briefing: mysteryCase.briefing || '',
    setting: mysteryCase.setting || '',
    caseDate: mysteryCase.caseDate || '',
    sceneKey: (mysteryCase.sceneKey || 'mansion_resort') as SceneKey,
    victim: {
      name: mysteryCase.victim?.name || '',
      summary: mysteryCase.victim?.summary || '',
    },
    suspects,
    clues,
    hints,
    progress: {
      cluesDiscovered: discoveredCluesCount,
      cluesTotal: (mysteryCase.clues || []).length,
      hintsUsed: session.hintsUsed,
      hintsTotal: (mysteryCase.hints || []).length,
      minCluesToAccuse: tier.minCluesToAccuse,
      cluesNeededToAccuse,
      canAccuse,
      scorePreview: currentScorePreview,
    },
  };
}

export function serializeClueDiscovery(
  clue: IClue,
  session: IPlayerSession,
  mysteryCase: IMysteryCase,
  alreadyDiscovered: boolean
): DiscoverClueResponseData {
  const tier = DIFFICULTY_TIERS[mysteryCase.difficulty];
  const discoveredCluesCount = session.discoveredClueIds.length;
  const cluesNeededToAccuse = Math.max(0, tier.minCluesToAccuse - discoveredCluesCount);
  const canAccuse = discoveredCluesCount >= tier.minCluesToAccuse;

  const currentScorePreview = calculateScore({
    difficulty: mysteryCase.difficulty,
    correct: false,
    cluesDiscovered: discoveredCluesCount,
    hintsUsed: session.hintsUsed,
    scoreWrongKeepsClueBonus: config.scoreWrongKeepsClueBonus,
  }).final;

  return {
    clue: {
      id: clue.id,
      title: clue.title,
      type: clue.type,
      location: clue.location,
      discovered: true,
      locked: false,
      description: clue.description,
      visualKey: (clue.visualKey || 'none') as ClueVisualKey,
      insight: clue.insight || '',
      requires: clue.requires || [],
      mentionsSuspectIds: clue.mentionsSuspectIds || [],
    },
    alreadyDiscovered,
    progress: {
      cluesDiscovered: discoveredCluesCount,
      cluesTotal: (mysteryCase.clues || []).length,
      hintsUsed: session.hintsUsed,
      hintsTotal: (mysteryCase.hints || []).length,
      minCluesToAccuse: tier.minCluesToAccuse,
      cluesNeededToAccuse,
      canAccuse,
      scorePreview: currentScorePreview,
    },
  };
}

export function serializeHintUse(
  hint: IHint,
  session: IPlayerSession,
  mysteryCase: IMysteryCase,
  penaltyApplied = 10
): UseHintResponseData {
  const tier = DIFFICULTY_TIERS[mysteryCase.difficulty];
  const hintsRemaining = Math.max(0, tier.hints - session.hintsUsed);

  const scorePreview = calculateScore({
    difficulty: mysteryCase.difficulty,
    correct: false,
    cluesDiscovered: session.discoveredClueIds.length,
    hintsUsed: session.hintsUsed,
    scoreWrongKeepsClueBonus: config.scoreWrongKeepsClueBonus,
  }).final;

  return {
    hint: {
      level: hint.level,
      text: hint.text,
    },
    hintsUsed: session.hintsUsed,
    hintsRemaining,
    penaltyApplied,
    scorePreview,
  };
}

export function serializeAccuseResponse(session: IPlayerSession): AccuseResponseData {
  if (!session.accusation || !session.score) {
    throw new Error('Session has no accusation record');
  }

  return {
    correct: session.accusation.correct,
    score: {
      base: session.score.base,
      clueBonus: session.score.clueBonus,
      hintPenalty: session.score.hintPenalty,
      rawTotal: session.score.rawTotal,
      floorApplied: session.score.floorApplied,
      final: session.score.final,
    },
    resultAvailable: true,
  };
}

export function serializeCaseResult(
  mysteryCase: IMysteryCase,
  session: IPlayerSession
): CaseResultData {
  if (!session.accusation || !session.score) {
    throw new Error('Case is not resolved yet');
  }

  const secret = mysteryCase.secret;
  if (!secret) {
    throw new Error('Case secret is missing');
  }

  const culpritSuspect = (mysteryCase.suspects || []).find((s) => s.id === secret.culpritId);
  const culpritName = culpritSuspect ? culpritSuspect.name : 'Unknown Culprit';

  const durationSeconds = Math.max(
    0,
    Math.round(
      ((session.accusation.submittedAt ? session.accusation.submittedAt.getTime() : Date.now()) -
        session.startedAt.getTime()) /
        1000
    )
  );

  const allClues: ResultClue[] = (mysteryCase.clues || []).map((clue: IClue) => {
    const discovered = session.discoveredClueIds.includes(clue.id);
    return {
      id: clue.id,
      title: clue.title,
      type: clue.type,
      location: clue.location,
      description: clue.description,
      discovered,
      role: clue.role,
      visualKey: (clue.visualKey || 'none') as ClueVisualKey,
      insight: clue.insight || '',
      requires: clue.requires || [],
      mentionsSuspectIds: clue.mentionsSuspectIds || [],
    };
  });

  const deduction = (secret.deduction || []).map((d) => {
    const playerFoundAllClues = (d.clueIds || []).every((id) =>
      session.discoveredClueIds.includes(id)
    );
    return {
      step: d.step,
      conclusion: d.conclusion,
      clueIds: d.clueIds || [],
      playerFoundAllClues,
    };
  });

  const timeline = (secret.timeline || []).map((t) => ({
    time: t.time,
    event: t.event,
  }));

  return {
    correct: session.accusation.correct,
    accusedSuspectId: session.accusation.suspectId,
    culprit: {
      suspectId: secret.culpritId,
      name: culpritName,
    },
    motive: secret.motive,
    method: secret.method,
    opportunity: secret.opportunity,
    score: {
      base: session.score.base,
      clueBonus: session.score.clueBonus,
      hintPenalty: session.score.hintPenalty,
      rawTotal: session.score.rawTotal,
      floorApplied: session.score.floorApplied,
      final: session.score.final,
    },
    deduction,
    timeline,
    allClues,
    stats: {
      durationSeconds,
    },
  };
}
