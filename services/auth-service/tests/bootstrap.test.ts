import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

/**
 * Tes m1.2 — fondasi auth-service: health, error handler terpusat, dan header
 * keamanan. `createApp()` mengembalikan app TANPA `listen()`, jadi supertest
 * bisa memanggilnya langsung tanpa membuka port.
 */
let app: Express;

beforeAll(async () => {
  process.env.LOG_LEVEL = 'silent';
  app = (await import('../src/app.ts')).createApp();
});

describe('auth-service bootstrap (m1.2)', () => {
  it('GET /health → 200 { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'auth-service' });
  });

  it('handler async yang throw → 500 JSON generik, tanpa stack trace', async () => {
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      error: { message: 'Terjadi kesalahan internal', code: 'INTERNAL' },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.ts/);
  });

  it('route yang tidak dikenal → 404 JSON dengan bentuk error yang sama', async () => {
    const res = await request(app).get('/tidak-ada');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Resource tidak ditemukan', code: 'NOT_FOUND' } });
  });

  it('security header dari helmet dan header rate-limit terpasang', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['ratelimit-limit'] ?? res.headers['ratelimit-policy']).toBeDefined();
  });
});
