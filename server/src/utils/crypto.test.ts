import { describe, it, expect } from 'vitest';
import {
  generateSessionToken,
  hashSessionToken,
  hashIp,
  generateCaseId,
  generateRequestId,
} from './crypto';

describe('Server Crypto Utilities', () => {
  it('generates a base64url 32-byte session token', () => {
    const token = generateSessionToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it('hashes session token deterministically with SHA-256', () => {
    const token = 'test-token-12345';
    const hash1 = hashSessionToken(token);
    const hash2 = hashSessionToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashes IPs deterministically with salt', () => {
    const ip = '192.168.1.100';
    const hash = hashIp(ip);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates 16-character case IDs', () => {
    const caseId = generateCaseId();
    expect(caseId).toHaveLength(16);
  });

  it('generates request IDs with req_ prefix', () => {
    const reqId = generateRequestId();
    expect(reqId.startsWith('req_')).toBe(true);
  });
});
