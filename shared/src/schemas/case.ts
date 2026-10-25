import { z } from 'zod';
import { SCENE_KEYS, CLUE_VISUAL_KEYS } from '../constants/assets';

export const SuspectGenderSchema = z.enum(['male', 'female', 'other']);

export const SuspectAlibiTimelineItemSchema = z.object({
  time: z.string(),
  label: z.string(),
});

export const SuspectConnectionSchema = z.object({
  suspectId: z.string(),
  label: z.string(),
  note: z.string().optional(),
});

export const SuspectSchema = z.object({
  id: z.string().regex(/^s\d+$/, 'Suspect ID must be s1, s2, etc.'),
  name: z.string().min(1).max(60),
  age: z.number().int().min(10).max(100),
  occupation: z.string().min(1).max(60),
  relationshipToVictim: z.string().min(1).max(80),
  publicStatement: z.string().min(1).max(400),
  gender: SuspectGenderSchema,
  background: z.string().max(300),
  personality: z.string().max(200),
  alibiTimeline: z.array(SuspectAlibiTimelineItemSchema).min(3).max(5),
  connections: z.array(SuspectConnectionSchema).max(3),
});

export const ClueTypeSchema = z.enum(['physical', 'testimony', 'document', 'digital']);
export const ClueRoleSchema = z.enum(['incriminating', 'exonerating', 'red_herring', 'context']);
export const ClueVisualKeySchema = z.enum(CLUE_VISUAL_KEYS as [string, ...string[]]);
export const SceneKeySchema = z.enum(SCENE_KEYS as [string, ...string[]]);

export const ClueSchema = z.object({
  id: z.string().regex(/^c\d+$/, 'Clue ID must be c1, c2, etc.'),
  title: z.string().min(1).max(80),
  type: ClueTypeSchema,
  location: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  role: ClueRoleSchema,
  pointsToSuspectIds: z.array(z.string()),
  visualKey: ClueVisualKeySchema,
  insight: z.string().max(200),
  requires: z.array(z.string()).default([]),
  mentionsSuspectIds: z.array(z.string()).default([]),
});

export const HintSchema = z.object({
  level: z.number().int().min(1),
  text: z.string().min(1),
  unlockAtClues: z.number().int().min(0),
});

export const DeductionStepSchema = z.object({
  step: z.number().int().min(1),
  conclusion: z.string().min(1),
  clueIds: z.array(z.string()).min(1),
  playerFoundAllClues: z.boolean().optional(),
});

export const TimelineItemSchema = z.object({
  time: z.string().min(1),
  event: z.string().min(1),
});

export const VictimSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
});

// Full AI generation output schema
export const GeneratedMysterySchema = z.object({
  title: z.string().min(1),
  briefing: z.string().min(1),
  setting: z.string().min(1),
  caseDate: z.string().min(1),
  sceneKey: SceneKeySchema,
  victim: VictimSchema,
  suspects: z.array(SuspectSchema),
  clues: z.array(ClueSchema),
  culpritId: z.string(),
  motive: z.string().min(1),
  method: z.string().min(1),
  opportunity: z.string().min(1),
  deduction: z.array(DeductionStepSchema).min(3),
  timeline: z.array(TimelineItemSchema).min(1),
  hints: z.array(HintSchema),
});

export type Suspect = z.infer<typeof SuspectSchema>;
export type Clue = z.infer<typeof ClueSchema>;
export type Hint = z.infer<typeof HintSchema>;
export type DeductionStep = z.infer<typeof DeductionStepSchema>;
export type TimelineItem = z.infer<typeof TimelineItemSchema>;
export type Victim = z.infer<typeof VictimSchema>;
export type GeneratedMystery = z.infer<typeof GeneratedMysterySchema>;
export type ClueType = z.infer<typeof ClueTypeSchema>;
export type ClueRole = z.infer<typeof ClueRoleSchema>;
