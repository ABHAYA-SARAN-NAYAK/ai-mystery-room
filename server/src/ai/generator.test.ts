import { describe, it, expect, beforeEach } from 'vitest';
import { generateMysteryCase } from './generator';
import { config } from '../config/index';

describe('AI Generator in Mock Mode (GEMINI_MOCK=true)', () => {
  beforeEach(() => {
    config.geminiMock = true;
  });

  it('generates an Easy case and transitions through all 5 stages', async () => {
    const stagesSeen: string[] = [];
    const result = await generateMysteryCase({
      premise: 'A vintage sapphire necklace disappears from a locked suite.',
      difficulty: 'easy',
      onStageChange: async (stage) => {
        stagesSeen.push(stage);
      },
    });

    expect(stagesSeen).toEqual(['scene', 'suspects', 'clues', 'hiding', 'validating']);
    expect(result.mystery).toBeDefined();
    expect(result.mystery.suspects).toHaveLength(3);
    expect(result.mystery.clues).toHaveLength(5);
    expect(result.mystery.hints).toHaveLength(2);
    expect(result.solverAgreed).toBe(true);
  });

  it('generates a Medium case with 4 suspects and 7 clues', async () => {
    const result = await generateMysteryCase({
      premise: 'A jewel theft at a hill-station wedding during the dance.',
      difficulty: 'medium',
    });

    expect(result.mystery.suspects).toHaveLength(4);
    expect(result.mystery.clues).toHaveLength(7);
    expect(result.mystery.hints).toHaveLength(3);
  });

  it('generates a Hard case with 5 suspects and 9 clues', async () => {
    const result = await generateMysteryCase({
      premise: 'A top-secret breakthrough prototype is extracted from a biometric vault.',
      difficulty: 'hard',
    });

    expect(result.mystery.suspects).toHaveLength(5);
    expect(result.mystery.clues).toHaveLength(9);
    expect(result.mystery.hints).toHaveLength(3);
  });
});
