import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: './server/.env' });

import { generateMysteryCase } from './generator';
import { config } from '../config/index';

async function runGenerations() {
  console.log('--- Real Gemini Mystery Generation Test ---');
  console.log('Configured model:', config.geminiModel);
  config.geminiMock = false;

  const testCases: Array<{ difficulty: 'easy' | 'medium' | 'hard'; premise: string }> = [
    {
      difficulty: 'easy',
      premise: 'A diamond brooch disappears from a locked dressing room during a fashion show.',
    },
    {
      difficulty: 'medium',
      premise: 'A vintage wine bottle is poisoned at a vineyard anniversary dinner.',
    },
    {
      difficulty: 'hard',
      premise: 'A quantum encryption key card is stolen from a high-security subterranean lab.',
    },
  ];

  const results: Array<{
    difficulty: string;
    attempts: number;
    durationMs: number;
    solverAgreed: boolean;
    title: string;
    culpritId: string;
    warnings: string[];
  }> = [];

  for (const { difficulty, premise } of testCases) {
    console.log(`\n======================================================`);
    console.log(`Starting real generation: [${difficulty.toUpperCase()}]`);
    console.log(`Premise: "${premise}"`);
    console.log(`======================================================`);

    const t0 = Date.now();
    try {
      const res = await generateMysteryCase({
        premise,
        difficulty,
        onStageChange: async (stage) => {
          console.log(`  [Stage Update] -> ${stage}`);
        },
      });

      const elapsed = Date.now() - t0;
      console.log(`✓ Succeeded in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
      console.log(`  Title: "${res.mystery.title}"`);
      console.log(`  Culprit: ${res.mystery.culpritId}`);
      console.log(`  Suspects: ${res.mystery.suspects.length}`);
      console.log(`  Clues: ${res.mystery.clues.length}`);
      console.log(`  Solver Agreed: ${res.solverAgreed}`);
      console.log(`  Attempts: ${res.attempts}`);

      results.push({
        difficulty,
        attempts: res.attempts,
        durationMs: res.durationMs,
        solverAgreed: res.solverAgreed,
        title: res.mystery.title,
        culpritId: res.mystery.culpritId,
        warnings: res.warnings,
      });
    } catch (err: unknown) {
      console.error(`✗ Generation failed for [${difficulty}]:`, (err as Error).message);
    }
  }

  console.log('\n======================================================');
  console.log('Summary of Real Generations:');
  console.table(results);
}

runGenerations();
