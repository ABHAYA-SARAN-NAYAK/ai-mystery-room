import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app';

describe('App & Healthz API', () => {
  const app = createApp();

  it('GET /healthz returns ok: true and db status', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(['up', 'down']).toContain(res.body.db);
    expect(res.headers['x-request-id']).toBeDefined();
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
