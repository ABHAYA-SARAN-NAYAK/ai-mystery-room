import { Router } from 'express';
import {
  CreateCaseRequestSchema,
  AccuseRequestSchema,
} from '@mystery/shared';
import { validateBody } from '../middleware/validate';
import { requireSessionAuth } from '../middleware/auth';
import {
  createCaseLimiter,
  discoverClueLimiter,
  hintsLimiter,
  accuseLimiter,
} from '../middleware/rateLimiter';
import {
  createCaseHandler,
  getCaseHandler,
  discoverClueHandler,
  useHintHandler,
  accuseHandler,
  getResultHandler,
  cancelCaseHandler,
} from '../controllers/caseController';

export const caseRouter = Router();

// 1. POST /api/cases - Generate case
caseRouter.post(
  '/',
  createCaseLimiter,
  validateBody(CreateCaseRequestSchema),
  createCaseHandler
);

// 2. GET /api/cases/:id - Sanitized case state
caseRouter.get('/:id', requireSessionAuth, getCaseHandler);

// 3. POST /api/cases/:id/clues/:clueId/discover - Discover clue
caseRouter.post(
  '/:id/clues/:clueId/discover',
  discoverClueLimiter,
  requireSessionAuth,
  discoverClueHandler
);

// 4. POST /api/cases/:id/hints - Use a hint
caseRouter.post('/:id/hints', hintsLimiter, requireSessionAuth, useHintHandler);

// 5. POST /api/cases/:id/accuse - Make final accusation
caseRouter.post(
  '/:id/accuse',
  accuseLimiter,
  requireSessionAuth,
  validateBody(AccuseRequestSchema),
  accuseHandler
);

// 6. GET /api/cases/:id/result - View case results
caseRouter.get('/:id/result', requireSessionAuth, getResultHandler);

// 7. POST /api/cases/:id/cancel - Cancel generation / abandon
caseRouter.post('/:id/cancel', requireSessionAuth, cancelCaseHandler);
