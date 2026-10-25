import { describe, it, expect } from 'vitest';
import {
  ERROR_CODES,
  DIFFICULTY_TIERS,
  SAMPLE_PREMISES,
  calculateScore,
  resolvePortrait,
  asset,
} from './index';

describe('Shared Package Exports', () => {
  it('exports ERROR_CODES', () => {
    expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ERROR_CODES.SESSION_REQUIRED).toBe('SESSION_REQUIRED');
  });

  it('exports DIFFICULTY_TIERS', () => {
    expect(DIFFICULTY_TIERS.easy.suspects).toBe(3);
    expect(DIFFICULTY_TIERS.medium.clues).toBe(7);
    expect(DIFFICULTY_TIERS.hard.hints).toBe(3);
  });

  it('exports SAMPLE_PREMISES', () => {
    expect(SAMPLE_PREMISES).toHaveLength(6);
  });

  it('exports asset and portrait helpers', () => {
    expect(asset('BG_HOME')).toContain('res.cloudinary.com');
    expect(resolvePortrait()).toContain('comman-charcter-all');
  });

  it('exports calculateScore', () => {
    expect(typeof calculateScore).toBe('function');
  });
});
