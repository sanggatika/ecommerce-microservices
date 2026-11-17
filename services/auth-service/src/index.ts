import { createLogger } from '@ecommerce/logger';
import { config } from './config.ts';
import { createApp } from './app.ts';
import { getKeyMaterial } from './keys.ts';
import { seedAdmin } from './users.ts';

const logger = createLogger(config.serviceName);

// Pastikan keypair siap (load-or-generate) sebelum menerima request.
const { kid } = getKeyMaterial();
logger.info({ kid }, 'keypair RS256 siap');

await seedAdmin(logger);

const app = createApp({ logger });
const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, `${config.serviceName} listening`);
});

// Graceful shutdown supaya container berhenti rapi.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    logger.info({ signal }, 'shutting down');
    server.close(() => process.exit(0));
  });
}
