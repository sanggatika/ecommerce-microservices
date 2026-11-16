import pino, { type Logger, type LoggerOptions } from 'pino';
import { pinoHttp, type HttpLogger } from 'pino-http';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export function createLogger(name: string): Logger {
  const options: LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    base: { service: name },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        '*.password',
        'req.body.password',
      ],
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };
  if (process.env.LOG_PRETTY === 'true') {
    options.transport = { target: 'pino-pretty', options: { colorize: true } };
  }
  return pino(options);
}

export function createHttpLogger(logger: Logger): HttpLogger {
  return pinoHttp({
    logger,
    genReqId(req: IncomingMessage, res: ServerResponse) {
      const existing = req.headers[CORRELATION_ID_HEADER];
      const id = (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
      res.setHeader(CORRELATION_ID_HEADER, id);
      return id;
    },
    customProps: (req) => ({ correlationId: req.id }),
    customLogLevel(_req, res, err) {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  });
}

export type { Logger };