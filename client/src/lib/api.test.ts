import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiClientError } from './api';
import { useSessionStore } from '../store/sessionStore';

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.getState().clearActiveSession();
  });

  it('injects X-Session-Token header when session exists', async () => {
    useSessionStore.getState().setSession('case_123', 'test_token_header');

    let capturedHeaders: Headers | undefined;
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedHeaders = new Headers(init.headers);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { ok: true, db: 'up' } }),
      });
    });

    await api.getCase('case_123');

    expect(capturedHeaders?.get('X-Session-Token')).toBe('test_token_header');
  });

  it('throws ApiClientError with error code when server responds with 4xx/5xx', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          error: {
            code: 'CASE_NOT_ACTIVE',
            message: 'Case is not active',
          },
        }),
    });

    await expect(api.discoverClue('case_123', 'c1')).rejects.toThrowError(ApiClientError);
    try {
      await api.discoverClue('case_123', 'c1');
    } catch (err) {
      expect((err as ApiClientError).code).toBe('CASE_NOT_ACTIVE');
    }
  });
});
