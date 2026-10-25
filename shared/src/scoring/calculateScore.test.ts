import { describe, it, expect } from 'vitest';
import { calculateScore } from './calculateScore';

describe('calculateScore pure function (SPEC.md Section 5.2)', () => {
  it('Row 1: Medium, correct, 7 clues, 1 hint', () => {
    const result = calculateScore({
      difficulty: 'medium',
      correct: true,
      cluesDiscovered: 7,
      hintsUsed: 1,
    });

    expect(result).toEqual({
      base: 150,
      clueBonus: 35,
      hintPenalty: 10,
      rawTotal: 175,
      floorApplied: false,
      final: 175,
    });
  });

  it('Row 2: Easy, correct, 3 clues, 2 hints', () => {
    const result = calculateScore({
      difficulty: 'easy',
      correct: true,
      cluesDiscovered: 3,
      hintsUsed: 2,
    });

    expect(result).toEqual({
      base: 100,
      clueBonus: 15,
      hintPenalty: 20,
      rawTotal: 95,
      floorApplied: false,
      final: 95,
    });
  });

  it('Row 3: Hard, wrong, 6 clues, 3 hints', () => {
    const result = calculateScore({
      difficulty: 'hard',
      correct: false,
      cluesDiscovered: 6,
      hintsUsed: 3,
    });

    expect(result).toEqual({
      base: 0,
      clueBonus: 30,
      hintPenalty: 30,
      rawTotal: 0,
      floorApplied: false,
      final: 0,
    });
  });

  it('Row 4: Easy, wrong, 3 clues, 2 hints', () => {
    const result = calculateScore({
      difficulty: 'easy',
      correct: false,
      cluesDiscovered: 3,
      hintsUsed: 2,
    });

    expect(result).toEqual({
      base: 0,
      clueBonus: 15,
      hintPenalty: 20,
      rawTotal: -5,
      floorApplied: true,
      final: 0,
    });
  });

  it('calculates maximum possible score for each tier (all clues, 0 hints)', () => {
    // Easy: base 100 + 5 * 5 = 125
    expect(calculateScore({
      difficulty: 'easy',
      correct: true,
      cluesDiscovered: 5,
      hintsUsed: 0,
    }).final).toBe(125);

    // Medium: base 150 + 5 * 7 = 185
    expect(calculateScore({
      difficulty: 'medium',
      correct: true,
      cluesDiscovered: 7,
      hintsUsed: 0,
    }).final).toBe(185);

    // Hard: base 200 + 5 * 9 = 245
    expect(calculateScore({
      difficulty: 'hard',
      correct: true,
      cluesDiscovered: 9,
      hintsUsed: 0,
    }).final).toBe(245);
  });

  it('respects scoreWrongKeepsClueBonus=false flag', () => {
    const result = calculateScore({
      difficulty: 'medium',
      correct: false,
      cluesDiscovered: 4,
      hintsUsed: 1,
      scoreWrongKeepsClueBonus: false,
    });

    expect(result).toEqual({
      base: 0,
      clueBonus: 0,
      hintPenalty: 10,
      rawTotal: -10,
      floorApplied: true,
      final: 0,
    });
  });

  it('handles zero clues and zero hints safely', () => {
    const result = calculateScore({
      difficulty: 'easy',
      correct: true,
      cluesDiscovered: 0,
      hintsUsed: 0,
    });

    expect(result).toEqual({
      base: 100,
      clueBonus: 0,
      hintPenalty: 0,
      rawTotal: 100,
      floorApplied: false,
      final: 100,
    });
  });
});
