import mongoose, { Schema, Document } from 'mongoose';

export type AuditEvent =
  | 'case_requested'
  | 'generation_attempt'
  | 'generation_failed'
  | 'generation_succeeded'
  | 'clue_discovered'
  | 'hint_used'
  | 'accusation_submitted'
  | 'result_viewed'
  | 'auth_failed'
  | 'rate_limited'
  | 'leak_scan_blocked';

export interface IAuditLog extends Document {
  caseId?: string;
  event: AuditEvent;
  meta?: Record<string, unknown>;
  ipHash?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    caseId: { type: String, index: true },
    event: {
      type: String,
      enum: [
        'case_requested',
        'generation_attempt',
        'generation_failed',
        'generation_succeeded',
        'clue_discovered',
        'hint_used',
        'accusation_submitted',
        'result_viewed',
        'auth_failed',
        'rate_limited',
        'leak_scan_blocked',
      ],
      required: true,
      index: true,
    },
    meta: { type: Schema.Types.Mixed },
    ipHash: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 30 * 24 * 60 * 60, // TTL index: 30 days
    },
  },
  {
    timestamps: false,
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
