import { randomBytes, createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { config } from '../config/index';

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashIp(ip: string): string {
  return createHash('sha256')
    .update((ip || '127.0.0.1') + config.ipSalt)
    .digest('hex');
}

export function generateCaseId(): string {
  return nanoid(16);
}

export function generateRequestId(): string {
  return `req_${nanoid(12)}`;
}
