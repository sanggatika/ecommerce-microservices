import type { JwtPayload } from 'jsonwebtoken';

// Augmentasi tipe Request Express dengan properti kustom yang dipasang
// middleware kita. `id` & `log` disediakan oleh augmentasi pino-http.
declare global {
   
  namespace Express {
    interface Request {
      validated?: unknown;
      user?: JwtPayload;
    }
  }
}

export {};
