import {
  Difficulty,
  DIFFICULTY_TIERS,
  GeneratedMystery,
  GeneratedMysterySchema,
} from '@mystery/shared';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mystery?: GeneratedMystery;
}

const FORBIDDEN_LEAK_PHRASES = [
  /\bis\s+the\s+(killer|culprit|thief|murderer)\b/i,
  /\b(admitted|confessed)\s+to\s+the\s+crime\b/i,
  /\bdefinitely\s+(stole|murdered|killed)\b/i,
  /\b(did\s+it|is\s+the\s+perpetrator)\b/i,
  /(?<!one\s+of\s+them\s+)is\s+guilty\b/i,
];

export function validateGeneratedMystery(
  data: unknown,
  difficulty: Difficulty
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tier = DIFFICULTY_TIERS[difficulty];

  // Check 1: Schema parse with Zod
  const parseResult = GeneratedMysterySchema.safeParse(data);
  if (!parseResult.success) {
    const issueList = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return {
      valid: false,
      errors: [`Schema validation failed: ${issueList.join('; ')}`],
      warnings,
    };
  }

  const mystery = parseResult.data;

  // Check 2: Exact counts
  if (mystery.suspects.length !== tier.suspects) {
    errors.push(`Expected ${tier.suspects} suspects, found ${mystery.suspects.length}`);
  }
  if (mystery.clues.length !== tier.clues) {
    errors.push(`Expected ${tier.clues} clues, found ${mystery.clues.length}`);
  }
  if (mystery.hints.length !== tier.hints) {
    errors.push(`Expected ${tier.hints} hints, found ${mystery.hints.length}`);
  }

  // Check 3: Unique IDs & formats
  const suspectIds = new Set<string>();
  const suspectNames = new Set<string>();
  for (const s of mystery.suspects) {
    if (!/^s\d+$/.test(s.id)) {
      errors.push(`Invalid suspect ID format: "${s.id}" (must be s1, s2, ...)`);
    }
    if (suspectIds.has(s.id)) {
      errors.push(`Duplicate suspect ID: "${s.id}"`);
    }
    suspectIds.add(s.id);

    const normName = s.name.trim().toLowerCase();
    if (suspectNames.has(normName)) {
      errors.push(`Duplicate suspect name: "${s.name}"`);
    }
    suspectNames.add(normName);
  }

  const clueIds = new Set<string>();
  for (const c of mystery.clues) {
    if (!/^c\d+$/.test(c.id)) {
      errors.push(`Invalid clue ID format: "${c.id}" (must be c1, c2, ...)`);
    }
    if (clueIds.has(c.id)) {
      errors.push(`Duplicate clue ID: "${c.id}"`);
    }
    clueIds.add(c.id);

    // Validate referenced suspect IDs
    for (const refId of c.pointsToSuspectIds) {
      if (!suspectIds.has(refId)) {
        errors.push(`Clue ${c.id} pointsToSuspectIds references unknown suspect "${refId}"`);
      }
    }
    for (const refId of c.mentionsSuspectIds) {
      if (!suspectIds.has(refId)) {
        warnings.push(`Clue ${c.id} mentionsSuspectIds references unknown suspect "${refId}"`);
      }
    }
    for (const reqId of c.requires) {
      if (!clueIds.has(reqId) && !mystery.clues.some((other) => other.id === reqId)) {
        errors.push(`Clue ${c.id} requires non-existent clue "${reqId}"`);
      }
    }
  }

  // Check 4: Culprit existence
  if (!suspectIds.has(mystery.culpritId)) {
    errors.push(`Culprit ID "${mystery.culpritId}" is not among the suspects`);
  }
  const culprit = mystery.suspects.find((s) => s.id === mystery.culpritId);
  const culpritName = culprit ? culprit.name.toLowerCase() : '';

  // Check 5: Role counts
  const incriminatingClues = mystery.clues.filter((c) => c.role === 'incriminating');
  const redHerrings = mystery.clues.filter((c) => c.role === 'red_herring');
  const exoneratingClues = mystery.clues.filter((c) => c.role === 'exonerating');

  if (incriminatingClues.length !== tier.incriminating) {
    errors.push(`Expected ${tier.incriminating} incriminating clues, found ${incriminatingClues.length}`);
  }
  if (redHerrings.length !== tier.redHerrings) {
    errors.push(`Expected ${tier.redHerrings} red herring clues, found ${redHerrings.length}`);
  }
  if (exoneratingClues.length !== tier.exonerating) {
    errors.push(`Expected ${tier.exonerating} exonerating clues, found ${exoneratingClues.length}`);
  }

  // Check 6: Incriminating clues must point to culprit
  for (const c of incriminatingClues) {
    if (!c.pointsToSuspectIds.includes(mystery.culpritId)) {
      errors.push(`Incriminating clue ${c.id} does not include culprit "${mystery.culpritId}" in pointsToSuspectIds`);
    }
  }

  // Check 7: Red herrings must point ONLY to non-culprits
  for (const c of redHerrings) {
    if (c.pointsToSuspectIds.includes(mystery.culpritId)) {
      errors.push(`Red herring clue ${c.id} must point only to non-culprits, but points to culprit "${mystery.culpritId}"`);
    }
    if (c.pointsToSuspectIds.length === 0) {
      errors.push(`Red herring clue ${c.id} must point to at least one innocent suspect`);
    }
  }

  // Check 8: Suspect coverage
  for (const sId of suspectIds) {
    if (sId !== mystery.culpritId) {
      const referenced = mystery.clues.some(
        (c) =>
          c.pointsToSuspectIds.includes(sId) ||
          c.mentionsSuspectIds.includes(sId)
      );
      if (!referenced) {
        errors.push(`Innocent suspect ${sId} is not referenced by any clue (needs alibi or red herring coverage)`);
      }
    }
  }

  // Check 9: Deduction chain
  if (mystery.deduction.length < 3) {
    errors.push(`Deduction chain must have at least 3 steps, found ${mystery.deduction.length}`);
  }
  const deductionIncriminatingClues = new Set<string>();
  for (const step of mystery.deduction) {
    for (const cId of step.clueIds) {
      if (!clueIds.has(cId)) {
        errors.push(`Deduction step ${step.step} references invalid clue "${cId}"`);
      }
      if (incriminatingClues.some((c) => c.id === cId)) {
        deductionIncriminatingClues.add(cId);
      }
    }
  }
  const minRequiredIncriminating = Math.max(1, tier.incriminating - 1);
  if (deductionIncriminatingClues.size < minRequiredIncriminating) {
    errors.push(`Deduction chain uses ${deductionIncriminatingClues.size} incriminating clues, expected at least ${minRequiredIncriminating}`);
  }

  // Check 10: Clue solvency
  if (!mystery.motive || mystery.motive.trim().length < 5) {
    errors.push('Culprit motive description is missing or too short');
  }
  if (!mystery.method || mystery.method.trim().length < 5) {
    errors.push('Culprit method description is missing or too short');
  }
  if (!mystery.opportunity || mystery.opportunity.trim().length < 5) {
    errors.push('Culprit opportunity description is missing or too short');
  }

  // Check 11: Leak lint
  const textCorpus = [
    mystery.briefing,
    ...mystery.suspects.map((s) => s.publicStatement),
    ...mystery.clues.map((c) => `${c.title} ${c.description} ${c.insight}`),
    ...mystery.hints.map((h) => h.text),
  ];
  for (const text of textCorpus) {
    for (const pattern of FORBIDDEN_LEAK_PHRASES) {
      if (pattern.test(text)) {
        errors.push(`Text contains forbidden confession/verdict leak pattern: "${text.substring(0, 50)}..."`);
      }
    }
  }

  // Check 12: Hint safety (no hint contains culprit name or culprit ID)
  for (const hint of mystery.hints) {
    const hintText = hint.text.toLowerCase();
    if (culpritName && hintText.includes(culpritName)) {
      errors.push(`Hint level ${hint.level} reveals culprit name "${culprit?.name}"`);
    }
    if (hintText.includes(mystery.culpritId.toLowerCase())) {
      errors.push(`Hint level ${hint.level} directly contains culprit ID "${mystery.culpritId}"`);
    }
  }

  // Check 13: Narrative consistency & timeline ordering
  if (!mystery.timeline || mystery.timeline.length === 0) {
    errors.push('Case timeline is empty');
  }

  // Check 14: Clue unlock chain checks (SPEC 10.2 rule 5)
  // - At least 1 clue has requires: []
  const initialClues = mystery.clues.filter((c) => !c.requires || c.requires.length === 0);
  if (initialClues.length === 0) {
    errors.push('No initial clues unlocked: at least 1 clue must have requires: []');
  }

  // - Detect cycles and compute max depth using BFS/Topological sort
  const unlocked = new Set<string>(initialClues.map((c) => c.id));
  const depthMap = new Map<string, number>();
  for (const c of initialClues) {
    depthMap.set(c.id, 0);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const c of mystery.clues) {
      if (!unlocked.has(c.id)) {
        const canUnlock = c.requires.every((r) => unlocked.has(r));
        if (canUnlock) {
          unlocked.add(c.id);
          const maxParentDepth = Math.max(...c.requires.map((r) => depthMap.get(r) || 0));
          depthMap.set(c.id, maxParentDepth + 1);
          changed = true;
        }
      }
    }
  }

  if (unlocked.size < mystery.clues.length) {
    const lockedIds = mystery.clues.filter((c) => !unlocked.has(c.id)).map((c) => c.id);
    errors.push(`Unreachable clues or circular dependency detected in requires chain: [${lockedIds.join(', ')}]`);
  }

  const maxChainDepth = Math.max(...Array.from(depthMap.values()), 0);
  if (maxChainDepth > tier.maxChainDepth) {
    errors.push(`Clue chain depth of ${maxChainDepth} exceeds maximum allowed depth of ${tier.maxChainDepth} for ${tier.label}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    mystery: errors.length === 0 ? mystery : undefined,
  };
}
