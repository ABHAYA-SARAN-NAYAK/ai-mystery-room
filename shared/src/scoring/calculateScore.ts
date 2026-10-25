import { Difficulty, DIFFICULTY_TIERS } from '../constants/difficulty';
import { ScoreBreakdown } from '../schemas/api';

export interface CalculateScoreParams {
  difficulty: Difficulty;
  correct: boolean;
  cluesDiscovered: number;
  hintsUsed: number;
  scoreWrongKeepsClueBonus?: boolean;
}

/**
 * Pure scoring calculation according to SPEC.md Section 5.2.
 *
 * base        = correct ? { easy: 100, medium: 150, hard: 200 } : 0
 * clueBonus   = (correct || scoreWrongKeepsClueBonus) ? 5 * cluesDiscovered : 0
 * hintPenalty = 10 * hintsUsed
 * rawTotal    = base + clueBonus - hintPenalty
 * final       = max(0, rawTotal)
 */
export function calculateScore({
  difficulty,
  correct,
  cluesDiscovered,
  hintsUsed,
  scoreWrongKeepsClueBonus = true,
}: CalculateScoreParams): ScoreBreakdown {
  const basePoints = correct ? DIFFICULTY_TIERS[difficulty].correctAccusationPoints : 0;
  const clueBonus = (correct || scoreWrongKeepsClueBonus) ? 5 * Math.max(0, cluesDiscovered) : 0;
  const hintPenalty = 10 * Math.max(0, hintsUsed);
  const rawTotal = basePoints + clueBonus - hintPenalty;
  const final = Math.max(0, rawTotal);
  const floorApplied = rawTotal < 0;

  return {
    base: basePoints,
    clueBonus,
    hintPenalty,
    rawTotal,
    floorApplied,
    final,
  };
}
