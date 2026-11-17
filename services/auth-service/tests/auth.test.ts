import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPublicKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// Set KEYS_DIR ke folder sementara SEBELUM modul di-import (config membacanya).
const keysDir = mkdtempSync(join(tmpdir(), 'auth-keys-'));
process.env.KEYS_DIR = keysDir;
process.env.LOG_LEVEL = 'silent';

let app: import('express').Express;
let keys: typeof import('../src/keys.ts');

beforeAll(async () => {
  app = (await import('../src/app.ts')).createApp();
  keys = await import('../src/keys.ts');
});

afterAll(() => {
  rmSync(keysDir, { recursive: true, force: true });
});

describe('auth-service end-to-end', () => {
  const creds = { email: 'user@test.local', password: 'password123' };

  it('register → 201 dan mengembalikan user tanpa password', async () => {
    const res = await request(app).post('/register').send(creds);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(creds.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('register email yang sama → 409', async () => {
    const res = await request(app).post('/register').send(creds);
    expect(res.status).toBe(409);
  });

  it('body tidak valid → 400 dengan detail field (bukan 500)', async () => {
    const res = await request(app).post('/register').send({ email: 'bukan-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('login → token, lalu akses route terproteksi berhasil', async () => {
    const login = await request(app).post('/login').send(creds);
    expect(login.status).toBe(200);
    const { token } = login.body;
    expect(token).toBeTruthy();

    const me = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(creds.email);
  });

  it('token invalid ditolak (401)', async () => {
    const res = await request(app).get('/me').set('Authorization', 'Bearer token.palsu.xxx');
    expect(res.status).toBe(401);
  });

  it('JWKS mengembalikan JWK ber-kid yang benar-benar bisa memverifikasi token', async () => {
    const login = await request(app).post('/login').send(creds);
    const { token } = login.body;

    const jwks = await request(app).get('/.well-known/jwks.json');
    expect(jwks.status).toBe(200);
    const jwk = jwks.body.keys[0];
    expect(jwk).toMatchObject({ kty: 'RSA', use: 'sig', alg: 'RS256' });
    expect(jwk.kid).toBeTruthy();

    // kid di header token HARUS cocok dengan kid di JWKS.
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    expect(header.kid).toBe(jwk.kid);

    // Bangun public key dari JWK endpoint, verifikasi token → membuktikan
    // service lain bisa memakainya (bukan cuma cek endpoint 200).
    const pubKey = createPublicKey({ key: jwk, format: 'jwk' });
    const decoded = jwt.verify(token, pubKey, {
      algorithms: ['RS256'],
      issuer: 'auth-service',
    }) as jwt.JwtPayload;
    expect(decoded.email).toBe(creds.email);
  });

  it('load keypair yang sudah ada TIDAK generate ulang (kid stabil lintas restart)', async () => {
    const { kid: kid1 } = keys.getKeyMaterial();
    keys._resetKeyCache(); // simulasikan restart proses
    const { kid: kid2 } = keys.getKeyMaterial();
    expect(kid2).toBe(kid1);
    expect(existsSync(join(keysDir, 'private.pem'))).toBe(true);
    expect(existsSync(join(keysDir, 'public.pem'))).toBe(true);
  });
});
