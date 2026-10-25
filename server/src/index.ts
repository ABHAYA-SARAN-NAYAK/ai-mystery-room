import mongoose from 'mongoose';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from './utils/logger';
import { startSweepJob, stopSweepJob } from './services/sweepService';

export const app = createApp();

let server: ReturnType<typeof app.listen> | null = null;

async function start() {
  try {
    logger.info(`Connecting to MongoDB at ${config.mongoUri.replace(/:([^:@]{1,})@/, ':****@')}...`);
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB.');

    // Start background sweep job (every 10 minutes)
    startSweepJob();

    server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`AI Mystery Room server listening on port ${config.port} [env=${config.env}]`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      stopSweepJob();
      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed.');
          await mongoose.disconnect();
          logger.info('MongoDB connection closed.');
          process.exit(0);
        });
      } else {
        await mongoose.disconnect();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Start only if run directly or explicit start
if (process.env.NODE_ENV !== 'test' || process.env.START_SERVER === 'true') {
  start();
}
