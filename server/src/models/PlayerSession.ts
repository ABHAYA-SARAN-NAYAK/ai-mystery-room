import mongoose, { Schema, Document } from 'mongoose';
import { ScoreBreakdown } from '@mystery/shared';

export interface IPlayerSession extends Document {
  caseId: string;
  tokenHash: string;
  discoveredClueIds: string[];
  hintsUsed: number;
  hintsGiven: Array<{ level: number; usedAt: Date }>;
  accusation?: {
    suspectId: string;
    reasoning?: string;
    submittedAt: Date;
    correct: boolean;
  };
  score?: ScoreBreakdown;
  startedAt: Date;
  lastActiveAt: Date;
  ipHash?: string;
}

const PlayerSessionSchema = new Schema<IPlayerSession>(
  {
    caseId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    discoveredClueIds: { type: [String], default: [] },
    hintsUsed: { type: Number, default: 0 },
    hintsGiven: [
      {
        level: { type: Number, required: true },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    accusation: {
      type: new Schema(
        {
          suspectId: { type: String, required: true },
          reasoning: { type: String },
          submittedAt: { type: Date, default: Date.now },
          correct: { type: Boolean, required: true },
        },
        { _id: false }
      ),
      required: false,
    },
    score: {
      type: new Schema(
        {
          base: { type: Number, required: true },
          clueBonus: { type: Number, required: true },
          hintPenalty: { type: Number, required: true },
          rawTotal: { type: Number, required: true },
          floorApplied: { type: Boolean, required: true },
          final: { type: Number, required: true },
        },
        { _id: false }
      ),
      required: false,
    },
    startedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    ipHash: { type: String },
  },
  {
    timestamps: true,
  }
);

export const PlayerSession = mongoose.model<IPlayerSession>('PlayerSession', PlayerSessionSchema);
