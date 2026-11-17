import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateKeyPairSync, createPublicKey, createHash, type JsonWebKey } from 'node:crypto';
import { config } from './config.ts';

/**
 * Load-or-generate keypair RS256 (m1.3).
 *
 * WAJIB cek file dulu: kalau `keys/private.pem` + `keys/public.pem` sudah ada,
 * LOAD; kalau belum, generate SEKALI lalu persist. Kalau selalu generate ulang,
 * restart service akan menginvalidasi semua token yang beredar — dan test
 * "restart tidak menginvalidasi token" (m4.4) tidak akan lulus.
 *
 * `kid` (key ID) dihitung dari RFC 7638 JWK thumbprint → deterministik untuk
 * key yang sama, jadi konsisten lintas restart. `kid` disematkan di JWK
 * endpoint DAN di header setiap JWT (lihat sign di users.ts), supaya jwks-rsa
 * di service lain bisa memilih key yang benar.
 */
function computeThumbprint(publicKeyPem: string): string {
  const jwk = createPublicKey(publicKeyPem).export({ format: 'jwk' }) as JsonWebKey;
  // Field WAJIB & urutan leksikografis sesuai RFC 7638: e, kty, n.
  const canonical = JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n });
  return createHash('sha256').update(canonical).digest('base64url');
}

export interface KeyMaterial {
  privateKeyPem: string;
  publicKeyPem: string;
  kid: string;
  jwk: JsonWebKey & { kid: string; use: string; alg: string };
}

let cached: KeyMaterial | null = null;

export function getKeyMaterial(): KeyMaterial {
  if (cached) return cached;

  const privatePath = join(config.keysDir, 'private.pem');
  const publicPath = join(config.keysDir, 'public.pem');

  let privateKeyPem: string;
  let publicKeyPem: string;

  if (existsSync(privatePath) && existsSync(publicPath)) {
    // --- LOAD dari file (restart) ---
    privateKeyPem = readFileSync(privatePath, 'utf8');
    publicKeyPem = readFileSync(publicPath, 'utf8');
  } else {
    // --- GENERATE sekali lalu persist ---
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    privateKeyPem = privateKey;
    publicKeyPem = publicKey;
    mkdirSync(config.keysDir, { recursive: true });
    writeFileSync(privatePath, privateKeyPem, { mode: 0o600 });
    writeFileSync(publicPath, publicKeyPem, { mode: 0o644 });
  }

  const kid = computeThumbprint(publicKeyPem);
  const jwk = {
    ...(createPublicKey(publicKeyPem).export({ format: 'jwk' }) as JsonWebKey),
    kid,
    use: 'sig',
    alg: 'RS256',
  };

  cached = { privateKeyPem, publicKeyPem, kid, jwk };
  return cached;
}

/** Reset cache — hanya untuk keperluan test. */
export function _resetKeyCache(): void {
  cached = null;
}
