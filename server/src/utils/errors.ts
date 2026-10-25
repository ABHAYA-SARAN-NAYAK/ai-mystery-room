import { ErrorCode } from '@mystery/shared';

export const HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  SESSION_REQUIRED: 401,
  SESSION_INVALID: 403,
  CASE_NOT_FOUND: 404,
  CLUE_NOT_FOUND: 404,
  CASE_NOT_ACTIVE: 409,
  CASE_NOT_RESOLVED: 409,
  ALREADY_ACCUSED: 409,
  ACCUSATION_LOCKED: 409,
  NO_HINTS_LEFT: 409,
  HINT_LOCKED: 409,
  CLUE_LOCKED: 409,
  PREMISE_REJECTED: 422,
  RATE_LIMITED: 429,
  DAILY_LIMIT_REACHED: 429,
  INTERNAL_ERROR: 500,
  GENERATION_FAILED: 502,
  GENERATION_TIMEOUT: 504,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown[];

  constructor(code: ErrorCode, message: string, details?: unknown[], statusCodeOverride?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCodeOverride || HTTP_STATUS_MAP[code] || 500;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
