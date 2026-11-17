import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from './middleware/validate.ts';
import { requireAuth } from './middleware/require-auth.ts';
import { getKeyMaterial } from './keys.ts';
import { register, login, getUserById } from './users.ts';

const credentialsSchema = z.object({
  email: z.string().email('Email tidak valid').max(254, 'Email terlalu panjang'),
  // Batas atas mencegah DoS lewat hashing string sangat besar.
  password: z.string().min(8, 'Password minimal 8 karakter').max(200, 'Password terlalu panjang'),
});
type Credentials = z.infer<typeof credentialsSchema>;

export function buildRouter(): Router {
  const router = Router();

  // Health check — dipakai gateway (m3.3) & Docker healthcheck (m4.4).
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'auth-service' });
  });

  // Endpoint JWKS standar — service lain mem-fetch public key dari sini.
  router.get('/.well-known/jwks.json', (_req: Request, res: Response) => {
    const { jwk } = getKeyMaterial();
    res.json({ keys: [jwk] });
  });

  // Perhatikan: TIDAK ada try/catch — handler async yang throw/reject otomatis
  // diteruskan ke error handler oleh Express 5.
  router.post('/register', validate(credentialsSchema), async (req: Request, res: Response) => {
    const user = await register(req.validated as Credentials);
    res.status(201).json({ user });
  });

  router.post('/login', validate(credentialsSchema), async (req: Request, res: Response) => {
    const result = await login(req.validated as Credentials);
    res.json(result);
  });

  // Route terproteksi contoh — butuh token valid.
  router.get('/me', requireAuth, (req: Request, res: Response) => {
    const user = getUserById(String(req.user?.sub));
    res.json({ user });
  });

  return router;
}
