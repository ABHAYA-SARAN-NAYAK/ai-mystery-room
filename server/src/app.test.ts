import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { setAiHealth } from './ai/health';

describe('App & Healthz API', () => {
  const app = createApp();

  it('GET /healthz returns ok: true, db status, and ai status', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(['up', 'down']).toContain(res.body.db);
    expect(['up', 'down']).toContain(res.body.ai);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /healthz reflects ai: "down" when AI check fails permanently', async () => {
    setAiHealth('down');
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.ai).toBe('down');
    setAiHealth('up');
  });

  it('preserves incoming X-Request-Id header', async () => {
    const customReqId = 'custom-request-id-1234';
    const res = await request(app)
      .get('/healthz')
      .set('X-Request-Id', customReqId);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(customReqId);
  });
});
