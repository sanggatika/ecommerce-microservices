import { Router, type Request, type Response } from 'express';

/**
 * Router m1.2 — baru fondasi: health + route yang sengaja melempar error untuk
 * membuktikan error handler terpusat & penanganan error async Express 5.
 * Register/login/JWKS ditambahkan di m1.3.
 */
export function buildRouter(): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'auth-service' });
  });

  // Handler async yang `throw` — TANPA try/catch. Express 5 meneruskannya
  // otomatis ke error handler terpusat (dikembalikan sebagai JSON, bukan HTML).
  router.get('/boom', async (_req: Request, _res: Response) => {
    throw new Error('contoh error yang tidak tertangani di handler');
  });

  return router;
}
