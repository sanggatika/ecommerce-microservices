import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Konfigurasi service dari environment variable, dengan default aman untuk
 * pengembangan lokal. Port listen dibaca dari `PORT` (di-set Docker Compose)
 * atau `AUTH_SERVICE_PORT`, default 3001.
 */
export const config = {
  serviceName: 'auth-service',
  port: Number(process.env.PORT || process.env.AUTH_SERVICE_PORT || 3001),
  // Folder penyimpanan keypair RSA — di-mount sebagai Docker volume di m4.4.
  keysDir: process.env.KEYS_DIR || resolve(__dirname, '..', 'keys'),
  jwt: {
    issuer: process.env.JWT_ISSUER || 'auth-service',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  // Kredensial admin demo (HANYA untuk training — lihat DECISIONS.md).
  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@inixindo.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  },
  // Origin frontend yang diizinkan CORS saat service diakses langsung.
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;
