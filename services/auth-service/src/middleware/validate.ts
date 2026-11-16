import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Middleware validasi berbasis zod (reusable). Pakai:
 *   router.post('/register', validate(registerSchema), handler)
 *
 * Kalau body tidak valid, `schema.parse` melempar ZodError yang otomatis
 * sampai ke error handler terpusat dan dipetakan jadi response 400 (BUKAN
 * 500). Data yang sudah ter-parse & ter-sanitasi ditaruh di `req.validated`.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.validated = schema.parse(req[source]);
    next();
  };
}
