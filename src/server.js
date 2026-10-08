import { env } from './config/env.js';
import { closePool } from './config/database.js';
import { createApp } from './app.js';

const server = createApp().listen(env.port, () => {
  console.log(`[server] afrogo-api listening on port ${env.port} (${env.nodeEnv})`);
});

let shuttingDown = false;

/** Graceful shutdown: stop accepting connections, then close the DB pool. */
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received, shutting down`);
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  server.close(async () => {
    try {
      await closePool();
    } finally {
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error(`[server] Unhandled rejection: ${reason?.message ?? 'unknown'}`);
});
