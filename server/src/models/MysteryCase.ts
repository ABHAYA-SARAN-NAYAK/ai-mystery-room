import mongoose, { Schema, Document } from 'mongoose';
import { SCENE_KEYS, CLUE_VISUAL_KEYS } from '@mystery/shared';

export interface ISuspect {
  id: string;
  name: string;
  age: number;
  occupation: string;
  relationshipToVictim: string;
  publicStatement: string;
  gender: 'male' | 'female' | 'other';
  background: string;
  personality: string;
  alibiTimeline: Array<{ time: string; label: string }>;
  connections: Array<{ suspectId: string; label: string; note?: string }>;
}

export interface IClue {
  id: string;
  title: string;
  type: 'physical' | 'testimony' | 'document' | 'digital';
  location: string;
  description: string;
  role: 'incriminating' | 'exonerating' | 'red_herring' | 'context';
  pointsToSuspectIds: string[];
  visualKey: string;
  insight: string;
  requires: string[];
  mentionsSuspectIds: string[];
}

export interface IHint {
  level: number;
  text: string;
  unlockAtClues: number;
}

export interface ISecret {
  culpritId: string;
  motive: string;
  method: string;
  opportunity: string;
  clueMeta: Array<{ clueId: string; role: string; pointsToSuspectIds: string[] }>;
  deduction: Array<{ step: number; conclusion: string; clueIds: string[] }>;
  timeline: Array<{ time: string; event: string }>;
}

export interface IGenerationMeta {
  model?: string;
  attempts?: number;
  durationMs?: number;
  solverAgreed?: boolean;
  errorCode?: string;
  validationWarnings?: string[];
}

export interface IMysteryCase extends Document {
  publicId: string;
  premise: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'generating' | 'active' | 'accused' | 'failed' | 'abandoned';
  generationStage?: 'scene' | 'suspects' | 'clues' | 'hiding' | 'validating';
  title?: string;
  briefing?: string;
  setting?: string;
  caseDate?: string;
  sceneKey?: string;
  victim?: { name: string; summary: string };
  suspects: ISuspect[];
  clues: IClue[];
  hints: IHint[];
  secret?: ISecret;
  generationMeta?: IGenerationMeta;
  createdAt: Date;
  updatedAt: Date;
}

const SuspectSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, maxlength: 60 },
    age: { type: Number, min: 10, max: 100 },
    occupation: { type: String, maxlength: 60 },
    relationshipToVictim: { type: String, maxlength: 80 },
    publicStatement: { type: String, maxlength: 400 },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    background: { type: String, maxlength: 300, default: '' },
    personality: { type: String, maxlength: 200, default: '' },
    alibiTimeline: [
      {
        time: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],
    connections: [
      {
        suspectId: { type: String, required: true },
        label: { type: String, required: true },
        note: { type: String },
      },
    ],
  },
  { _id: false }
);

const ClueSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 80 },
    type: { type: String, enum: ['physical', 'testimony', 'document', 'digital'], required: true },
    location: { type: String, maxlength: 80 },
    description: { type: String, required: true, maxlength: 500 },
    role: {
      type: String,
      enum: ['incriminating', 'exonerating', 'red_herring', 'context'],
      required: true,
    },
    pointsToSuspectIds: [{ type: String }],
    visualKey: { type: String, enum: CLUE_VISUAL_KEYS, default: 'none' },
    insight: { type: String, maxlength: 200, default: '' },
    requires: [{ type: String }],
    mentionsSuspectIds: [{ type: String }],
  },
  { _id: false }
);

const MysteryCaseSchema = new Schema<IMysteryCase>(
  {
    publicId: { type: String, required: true, unique: true, index: true },
    premise: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    status: {
      type: String,
      enum: ['generating', 'active', 'accused', 'failed', 'abandoned'],
      default: 'generating',
      index: true,
    },
    generationStage: {
      type: String,
      enum: ['scene', 'suspects', 'clues', 'hiding', 'validating'],
      default: 'scene',
    },
    title: { type: String },
    briefing: { type: String },
    setting: { type: String },
    caseDate: { type: String },
    sceneKey: { type: String, enum: SCENE_KEYS },
    victim: {
      name: { type: String },
      summary: { type: String },
    },
    suspects: [SuspectSchema],
    clues: [ClueSchema],
    hints: [
      {
        level: { type: Number, required: true },
        text: { type: String, required: true },
        unlockAtClues: { type: Number, required: true, default: 0 },
      },
    ],
    secret: {
      type: new Schema(
        {
          culpritId: { type: String, required: true },
          motive: { type: String, required: true },
          method: { type: String, required: true },
          opportunity: { type: String, required: true },
          clueMeta: [
            {
              clueId: { type: String, required: true },
              role: { type: String, required: true },
              pointsToSuspectIds: [{ type: String }],
            },
          ],
          deduction: [
            {
              step: { type: Number, required: true },
              conclusion: { type: String, required: true },
              clueIds: [{ type: String }],
            },
          ],
          timeline: [
            {
              time: { type: String, required: true },
              event: { type: String, required: true },
            },
          ],
        },
        { _id: false }
      ),
      select: false, // NEVER select by default
    },
    generationMeta: {
      model: { type: String },
      attempts: { type: Number },
      durationMs: { type: Number },
      solverAgreed: { type: Boolean },
      errorCode: { type: String },
      validationWarnings: [{ type: String }],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// TTL index: delete cases in 'failed' state after 7 days
MysteryCaseSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60,
    partialFilterExpression: { status: 'failed' },
  }
);

export const MysteryCase = mongoose.model<IMysteryCase>('MysteryCase', MysteryCaseSchema);
