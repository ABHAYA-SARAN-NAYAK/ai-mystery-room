import { z } from 'zod';
import {
  SuspectSchema,
  ClueTypeSchema,
  ClueVisualKeySchema,
  DeductionStepSchema,
  TimelineItemSchema,
  VictimSchema,
  SceneKeySchema,
  ClueRoleSchema,
} from './case';
import { Difficulty } from '../constants/difficulty';

export const CaseStatusSchema = z.enum(['generating', 'active', 'accused', 'failed', 'abandoned']);
export type CaseStatus = z.infer<typeof CaseStatusSchema>;

export const GenerationStageSchema = z.enum(['scene', 'suspects', 'clues', 'hiding', 'validating']);
export type GenerationStage = z.infer<typeof GenerationStageSchema>;

export const ScoreBreakdownSchema = z.object({
  base: z.number().int(),
  clueBonus: z.number().int(),
  hintPenalty: z.number().int(),
  rawTotal: z.number().int(),
  floorApplied: z.boolean(),
  final: z.number().int().min(0),
});
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const CreateCaseRequestSchema = z.object({
  premise: z.string().trim().min(10, 'Premise must be at least 10 characters').max(300, 'Premise must not exceed 300 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard'] as [Difficulty, ...Difficulty[]]),
});
export type CreateCaseRequest = z.infer<typeof CreateCaseRequestSchema>;

export const CreateCaseResponseDataSchema = z.object({
  caseId: z.string(),
  sessionToken: z.string(),
  status: CaseStatusSchema,
  pollAfterMs: z.number(),
});
export type CreateCaseResponseData = z.infer<typeof CreateCaseResponseDataSchema>;

// Public clue representations: locked vs discovered
export const PublicLockedClueSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: ClueTypeSchema,
  location: z.string(),
  discovered: z.literal(false),
  locked: z.literal(true),
  requires: z.array(z.string()),
});

export const PublicDiscoveredClueSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: ClueTypeSchema,
  location: z.string(),
  discovered: z.literal(true),
  locked: z.literal(false),
  description: z.string(),
  visualKey: ClueVisualKeySchema,
  insight: z.string(),
  requires: z.array(z.string()),
  mentionsSuspectIds: z.array(z.string()),
});

export type PublicLockedClue = z.infer<typeof PublicLockedClueSchema>;
export type PublicDiscoveredClue = z.infer<typeof PublicDiscoveredClueSchema>;
export const PublicClueSchema = z.union([PublicLockedClueSchema, PublicDiscoveredClueSchema]);
export type PublicClue = z.infer<typeof PublicClueSchema>;

export const PublicHintSchema = z.object({
  level: z.number().int(),
  unlockAtClues: z.number().int(),
  locked: z.boolean(),
  used: z.boolean(),
  text: z.string().optional(), // ONLY present if used
  usedAt: z.string().optional(),
});
export type PublicHint = z.infer<typeof PublicHintSchema>;

export const CaseProgressSchema = z.object({
  cluesDiscovered: z.number().int(),
  cluesTotal: z.number().int(),
  hintsUsed: z.number().int(),
  hintsTotal: z.number().int(),
  minCluesToAccuse: z.number().int(),
  cluesNeededToAccuse: z.number().int(),
  canAccuse: z.boolean(),
  scorePreview: z.number().int(),
});
export type CaseProgress = z.infer<typeof CaseProgressSchema>;

export const PublicCaseDetailsSchema = z.object({
  caseId: z.string(),
  status: CaseStatusSchema,
  difficulty: z.enum(['easy', 'medium', 'hard'] as [Difficulty, ...Difficulty[]]),
  title: z.string(),
  briefing: z.string(),
  setting: z.string(),
  caseDate: z.string(),
  sceneKey: SceneKeySchema,
  victim: VictimSchema,
  suspects: z.array(SuspectSchema),
  clues: z.array(PublicClueSchema),
  hints: z.array(PublicHintSchema),
  progress: CaseProgressSchema,
});
export type PublicCaseDetails = z.infer<typeof PublicCaseDetailsSchema>;
export type PublicCase = PublicCaseDetails;
export type PublicSuspect = z.infer<typeof SuspectSchema>;


export const DiscoverClueResponseDataSchema = z.object({
  clue: PublicDiscoveredClueSchema,
  alreadyDiscovered: z.boolean(),
  progress: CaseProgressSchema,
});
export type DiscoverClueResponseData = z.infer<typeof DiscoverClueResponseDataSchema>;

export const UseHintResponseDataSchema = z.object({
  hint: z.object({
    level: z.number().int(),
    text: z.string(),
  }),
  hintsUsed: z.number().int(),
  hintsRemaining: z.number().int(),
  penaltyApplied: z.number().int(),
  scorePreview: z.number().int(),
});
export type UseHintResponseData = z.infer<typeof UseHintResponseDataSchema>;

export const AccuseRequestSchema = z.object({
  suspectId: z.string().min(1),
  reasoning: z.string().max(500).optional(),
});
export type AccuseRequest = z.infer<typeof AccuseRequestSchema>;

export const AccuseResponseDataSchema = z.object({
  correct: z.boolean(),
  score: ScoreBreakdownSchema,
  resultAvailable: z.boolean(),
});
export type AccuseResponseData = z.infer<typeof AccuseResponseDataSchema>;

export const CulpritRevealSchema = z.object({
  suspectId: z.string(),
  name: z.string(),
});

export const ResultClueSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: ClueTypeSchema,
  location: z.string(),
  description: z.string(),
  discovered: z.boolean(),
  role: ClueRoleSchema,
  visualKey: ClueVisualKeySchema,
  insight: z.string(),
  requires: z.array(z.string()),
  mentionsSuspectIds: z.array(z.string()),
});
export type ResultClue = z.infer<typeof ResultClueSchema>;

export const CaseResultDataSchema = z.object({
  correct: z.boolean(),
  accusedSuspectId: z.string(),
  culprit: CulpritRevealSchema,
  motive: z.string(),
  method: z.string(),
  opportunity: z.string(),
  score: ScoreBreakdownSchema,
  deduction: z.array(DeductionStepSchema),
  timeline: z.array(TimelineItemSchema),
  allClues: z.array(ResultClueSchema),
  stats: z.object({
    durationSeconds: z.number(),
  }),
});
export type CaseResultData = z.infer<typeof CaseResultDataSchema>;
export type CaseResult = CaseResultData;

export const CancelCaseResponseDataSchema = z.object({
  status: z.literal('abandoned'),
});
export type CancelCaseResponseData = z.infer<typeof CancelCaseResponseDataSchema>;

export const HealthResponseDataSchema = z.object({
  ok: z.literal(true),
  db: z.enum(['up', 'down']),
});
export type HealthResponseData = z.infer<typeof HealthResponseDataSchema>;

export interface ApiResponse<T> {
  data: T;
  requestId: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  requestId: string;
}
