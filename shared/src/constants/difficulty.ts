export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  difficulty: Difficulty;
  label: string;
  suspects: number;
  clues: number;
  hints: number;
  incriminating: number;
  redHerrings: number;
  exonerating: number;
  cluesNeedCombining: number;
  clueStyle: string;
  correctAccusationPoints: number;
  minCluesToAccuse: number;
  maxScore: number;
  hintUnlockThresholds: readonly number[];
  maxChainDepth: number;
}

export const DIFFICULTY_TIERS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    difficulty: 'easy',
    label: 'Easy',
    suspects: 3,
    clues: 5,
    hints: 2,
    incriminating: 3,
    redHerrings: 1,
    exonerating: 1,
    cluesNeedCombining: 0,
    clueStyle: 'Direct',
    correctAccusationPoints: 100,
    minCluesToAccuse: 3,
    maxScore: 125,
    hintUnlockThresholds: [1, 3],
    maxChainDepth: 1,
  },
  medium: {
    difficulty: 'medium',
    label: 'Medium',
    suspects: 4,
    clues: 7,
    hints: 3,
    incriminating: 3,
    redHerrings: 2,
    exonerating: 2,
    cluesNeedCombining: 1,
    clueStyle: 'Mixed',
    correctAccusationPoints: 150,
    minCluesToAccuse: 4,
    maxScore: 185,
    hintUnlockThresholds: [1, 3, 5],
    maxChainDepth: 2,
  },
  hard: {
    difficulty: 'hard',
    label: 'Hard',
    suspects: 5,
    clues: 9,
    hints: 3,
    incriminating: 4,
    redHerrings: 3,
    exonerating: 2,
    cluesNeedCombining: 3,
    clueStyle: 'Indirect, needs deduction',
    correctAccusationPoints: 200,
    minCluesToAccuse: 6,
    maxScore: 245,
    hintUnlockThresholds: [2, 4, 6],
    maxChainDepth: 3,
  },
} as const;

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
