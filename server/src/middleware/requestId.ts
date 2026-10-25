import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header('x-request-id');
  const reqId = incomingId && incomingId.trim() ? incomingId.trim() : generateRequestId();
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
}
