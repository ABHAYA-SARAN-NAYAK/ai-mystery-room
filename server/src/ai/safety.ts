import { AppError } from '../utils/errors';

const FORBIDDEN_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /system\s+prompt/i,
  /reveal\s+(the\s+)?(secret|culprit|answer|password)/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /override\s+(all\s+)?instructions/i,
  /disregard\s+(all\s+)?instructions/i,
  /dan\s+mode/i,
  /bypass\s+safety/i,
  /<script/i,
  /javascript:/i,
];

const URL_PATTERN = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;

const FORBIDDEN_CONTENT_PATTERNS = [
  /\b(suicide|self-harm|kill\s+myself)\b/i,
  /\b(nazi|hitler|genocide|terrorist\s+attack)\b/i,
  /\b(child\s+porn|csam|rape|sexual\s+assault)\b/i,
];

/**
 * Sanitizes and validates the user premise before it reaches Gemini.
 * SPEC Section 5.6
 */
export function sanitizePremise(rawPremise: string): string {
  if (typeof rawPremise !== 'string') {
    throw new AppError('PREMISE_REJECTED', 'Premise must be a string', undefined, 422);
  }

  // 1. Strip control characters and HTML tags
  const cleaned = rawPremise
    .replace(/<[^>]*>/g, '') // strip HTML
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // strip control chars
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();

  // 2. Length check (10–300 chars)
  if (cleaned.length < 10) {
    throw new AppError(
      'PREMISE_REJECTED',
      'Premise is too short. Please provide at least 10 characters describing the mystery.',
      undefined,
      422
    );
  }

  if (cleaned.length > 300) {
    throw new AppError(
      'PREMISE_REJECTED',
      'Premise exceeds 300 characters.',
      undefined,
      422
    );
  }

  // 3. Reject URLs
  if (URL_PATTERN.test(cleaned)) {
    throw new AppError('PREMISE_REJECTED', 'Premise must not contain URLs or web links.', undefined, 422);
  }

  // 4. Reject prompt injection attempts
  for (const pattern of FORBIDDEN_INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      throw new AppError(
        'PREMISE_REJECTED',
        'Premise contains unsupported or reserved instruction patterns.',
        undefined,
        422
      );
    }
  }

  // 5. Reject unsafe / abusive topics
  for (const pattern of FORBIDDEN_CONTENT_PATTERNS) {
    if (pattern.test(cleaned)) {
      throw new AppError(
        'PREMISE_REJECTED',
        'Premise contains unsafe or prohibited content.',
        undefined,
        422
      );
    }
  }

  return cleaned;
}
