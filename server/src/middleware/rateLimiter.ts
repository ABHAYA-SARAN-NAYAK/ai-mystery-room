import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index';

function createLimiter(windowMs: number, max: number, message: string) {
  if (config.env === 'test') {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message,
        },
        requestId: req.requestId,
      });
    },
  });
}

// 5 per hour by default
export const createCaseLimiter = createLimiter(
  60 * 60 * 1000,
  config.rateLimitCreatePerHour,
  'Too many mysteries created from this IP. Please wait before creating another.'
);

// 60 per minute
export const discoverClueLimiter = createLimiter(
  60 * 1000,
  60,
  'Too many clue discovery requests. Please slow down.'
);

// 10 per minute
export const hintsLimiter = createLimiter(
  60 * 1000,
  10,
  'Too many hint requests. Please slow down.'
);

// 5 per minute
export const accuseLimiter = createLimiter(
  60 * 1000,
  5,
  'Too many accusation attempts. Please wait.'
);

// 120 per minute for all other endpoints
export const generalLimiter = createLimiter(
  60 * 1000,
  120,
  'Too many requests. Please slow down.'
);
