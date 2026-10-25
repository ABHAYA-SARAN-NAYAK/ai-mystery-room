import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoose from 'mongoose';
import { config } from './config/index';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

export function createApp(): Express {
  const app = express();

  // Security & Reverse Proxy setup
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(hpp());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (config.clientOrigin.length === 0 || config.clientOrigin.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    })
  );

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Body parser with 10 KB limit
  app.use(express.json({ limit: '10kb' }));

  // General rate limiting
  app.use(generalLimiter);

  // Health check endpoint (SPEC 4.1 & 6.4)
  app.get('/healthz', (_req: Request, res: Response) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(200).json({
      ok: true,
      db: isDbConnected ? 'up' : 'down',
    });
  });

  // Base API health check
  app.get('/api/healthz', (_req: Request, res: Response) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(200).json({
      ok: true,
      db: isDbConnected ? 'up' : 'down',
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
