import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { hashSessionToken } from '../utils/crypto';
import { PlayerSession, MysteryCase } from '../models/index';

export async function requireSessionAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawToken = req.header('X-Session-Token') || req.header('x-session-token');
    if (!rawToken || !rawToken.trim()) {
      return next(new AppError('SESSION_REQUIRED', 'Missing X-Session-Token header', undefined, 401));
    }

    const token = rawToken.trim();
    const tokenHash = hashSessionToken(token);
    const caseId = req.params.id;

    const session = await PlayerSession.findOne({ tokenHash });
    if (!session) {
      return next(new AppError('SESSION_INVALID', 'Invalid session token', undefined, 403));
    }

    if (caseId && session.caseId !== caseId) {
      return next(new AppError('SESSION_INVALID', 'Session does not match this case', undefined, 403));
    }

    const mysteryCase = await MysteryCase.findOne({ publicId: session.caseId });
    if (!mysteryCase) {
      return next(new AppError('CASE_NOT_FOUND', 'Case not found', undefined, 404));
    }

    req.session = session;
    req.mysteryCase = mysteryCase;

    // Asynchronously record last active timestamp
    PlayerSession.updateOne({ _id: session._id }, { $set: { lastActiveAt: new Date() } }).exec().catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
}
