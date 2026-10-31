import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateGeneratedMystery } from './validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

function readFixture(name: string) {
  const filePath = path.join(fixturesDir, name);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

describe('Backend Validation Pipeline & Fixture Suite (SPEC 5.7 & 6.2)', () => {
  describe('Valid Fixtures (Must all pass validation)', () => {
    it('validates 3 Easy fixtures successfully', () => {
      const easy1 = readFixture('valid_easy_1.json');
      const res1 = validateGeneratedMystery(easy1, 'easy');
      expect(res1.valid).toBe(true);
      expect(res1.errors).toHaveLength(0);

      const easy2 = readFixture('valid_easy_2.json');
      const res2 = validateGeneratedMystery(easy2, 'easy');
      expect(res2.valid).toBe(true);
      expect(res2.errors).toHaveLength(0);

      const easy3 = readFixture('valid_easy_3.json');
      const res3 = validateGeneratedMystery(easy3, 'easy');
      expect(res3.valid).toBe(true);
      expect(res3.errors).toHaveLength(0);
    });

    it('validates 3 Medium fixtures successfully', () => {
      const med1 = readFixture('valid_medium_1.json');
      const res1 = validateGeneratedMystery(med1, 'medium');
      expect(res1.valid).toBe(true);
      expect(res1.errors).toHaveLength(0);

      const med2 = readFixture('valid_medium_2.json');
      const res2 = validateGeneratedMystery(med2, 'medium');
      expect(res2.valid).toBe(true);
      expect(res2.errors).toHaveLength(0);

      const med3 = readFixture('valid_medium_3.json');
      const res3 = validateGeneratedMystery(med3, 'medium');
      expect(res3.valid).toBe(true);
      expect(res3.errors).toHaveLength(0);
    });

    it('validates 3 Hard fixtures successfully', () => {
      const hard1 = readFixture('valid_hard_1.json');
      const res1 = validateGeneratedMystery(hard1, 'hard');
      expect(res1.valid).toBe(true);
      expect(res1.errors).toHaveLength(0);

      const hard2 = readFixture('valid_hard_2.json');
      const res2 = validateGeneratedMystery(hard2, 'hard');
      expect(res2.valid).toBe(true);
      expect(res2.errors).toHaveLength(0);

      const hard3 = readFixture('valid_hard_3.json');
      const res3 = validateGeneratedMystery(hard3, 'hard');
      expect(res3.valid).toBe(true);
      expect(res3.errors).toHaveLength(0);
    });
  });

  it('accepts Easy clue dependencies with a maximum depth of one', () => {
    const mystery = readFixture('valid_easy_1.json');
    const result = validateGeneratedMystery(mystery, 'easy');

    expect(result.valid).toBe(true);
  });

  it('rejects an Easy dependency chain with depth two without weakening the rule', () => {
    const mystery = readFixture('valid_easy_1.json');
    mystery.clues.find((clue: { id: string }) => clue.id === 'c5').requires = ['c4'];

    const result = validateGeneratedMystery(mystery, 'easy');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Clue chain depth of 2 exceeds maximum allowed depth of 1 for Easy');
  });

  it('keeps the canonical red_herring role valid', () => {
    const result = validateGeneratedMystery(readFixture('valid_easy_1.json'), 'easy');

    expect(result.valid).toBe(true);
    expect(result.mystery?.clues.some((clue) => clue.role === 'red_herring')).toBe(true);
  });

  it('normalizes the known red herring alias before strict validation', () => {
    const mystery = readFixture('valid_easy_1.json');
    mystery.clues.find((clue: { id: string }) => clue.id === 'c3').role = 'red herring';

    const result = validateGeneratedMystery(mystery, 'easy');

    expect(result.valid).toBe(true);
    expect(result.mystery?.clues.find((clue) => clue.id === 'c3')?.role).toBe('red_herring');
  });

  it('rejects unknown clue role values instead of normalizing arbitrary strings', () => {
    const mystery = readFixture('valid_easy_1.json');
    mystery.clues.find((clue: { id: string }) => clue.id === 'c3').role = 'suspicious';

    const result = validateGeneratedMystery(mystery, 'easy');

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('clues.2.role');
  });

  it('allows innocent scene-setting text that does not disclose the solution', () => {
    const mystery = readFixture('valid_easy_1.json');
    mystery.briefing = 'Professor Halloway was found unconscious in the reading room after a storm.';

    const result = validateGeneratedMystery(mystery, 'easy');

    expect(result.valid).toBe(true);
  });

  it('rejects a player-visible culprit verdict leak', () => {
    const mystery = readFixture('valid_easy_1.json');
    mystery.briefing = 'David Miller is the thief, and the investigation is already over.';

    const result = validateGeneratedMystery(mystery, 'easy');

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('forbidden confession/verdict leak'))).toBe(true);
  });

  describe('Invalid Fixtures (Must each fail a specific validation rule)', () => {
    it('rejects invalid_1_schema (broken schema / missing fields)', () => {
      const data = readFixture('invalid_1_schema.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('Schema validation failed');
    });

    it('rejects invalid_2_counts (wrong suspect/clue counts for tier)', () => {
      const data = readFixture('invalid_2_counts.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Expected 3 suspects'))).toBe(true);
    });

    it('rejects invalid_3_ids (malformed suspect ID format)', () => {
      const data = readFixture('invalid_3_ids.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(
        res.errors.some((e) => e.includes('Invalid suspect ID') || e.includes('Suspect ID must be'))
      ).toBe(true);
    });

    it('rejects invalid_4_culprit (culpritId not in suspects)', () => {
      const data = readFixture('invalid_4_culprit.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Culprit ID "s99" is not among the suspects'))).toBe(true);
    });

    it('rejects invalid_5_role_counts (incriminating / red herring mismatch)', () => {
      const data = readFixture('invalid_5_role_counts.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('Expected 3 incriminating clues'))).toBe(true);
    });

    it('rejects invalid_6_incriminating_clue (incriminating clue does not point to culprit)', () => {
      const data = readFixture('invalid_6_incriminating_clue.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('does not include culprit'))).toBe(true);
    });

    it('rejects invalid_7_red_herring (red herring points to culprit)', () => {
      const data = readFixture('invalid_7_red_herring.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must point only to non-culprits'))).toBe(true);
    });

    it('rejects invalid_8_suspect_coverage (innocent suspect unreferenced)', () => {
      const data = readFixture('invalid_8_suspect_coverage.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('is not referenced by any clue'))).toBe(true);
    });

    it('rejects invalid_9_deduction_chain (fewer than 3 deduction steps)', () => {
      const data = readFixture('invalid_9_deduction_chain.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('at least 3'))).toBe(true);
    });

    it('rejects invalid_10_leak_lint (forbidden confession phrase in clue)', () => {
      const data = readFixture('invalid_10_leak_lint.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('forbidden confession/verdict leak'))).toBe(true);
    });

    it('rejects invalid_11_hint_safety (hint reveals culprit full name)', () => {
      const data = readFixture('invalid_11_hint_safety.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('reveals culprit name'))).toBe(true);
    });

    it('rejects invalid_12_unlock_chain_cycle (cycle or unreachable clues in requires)', () => {
      const data = readFixture('invalid_12_unlock_chain_cycle.json');
      const res = validateGeneratedMystery(data, 'easy');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('requires: []') || e.includes('Unreachable clues'))).toBe(true);
    });
  });
});
