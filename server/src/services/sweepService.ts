import { MysteryCase, PlayerSession, AuditLog } from '../models/index';
import { logger } from '../utils/logger';

export async function runStaleCasesSweep(): Promise<void> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // 1. Mark cases stuck in "generating" for more than 5 minutes as "failed"
    const stuckCases = await MysteryCase.find({
      status: 'generating',
      createdAt: { $lt: fiveMinutesAgo },
    });

    if (stuckCases.length > 0) {
      logger.warn({ count: stuckCases.length }, 'Sweep found stuck generating cases, marking as failed');
      for (const c of stuckCases) {
        c.status = 'failed';
        await c.save();
        await AuditLog.create({
          caseId: c.publicId,
          event: 'generation_failed',
          meta: { reason: 'Stuck in generating for over 5 minutes (timeout sweep)' },
        });
      }
    }

    // 2. Mark inactive cases (7 days without activity) as "abandoned"
    const abandonedSessions = await PlayerSession.find({
      lastActiveAt: { $lt: sevenDaysAgo },
    });

    if (abandonedSessions.length > 0) {
      const abandonedCaseIds = abandonedSessions.map((s) => s.caseId);
      const updateResult = await MysteryCase.updateMany(
        {
          publicId: { $in: abandonedCaseIds },
          status: 'active',
        },
        {
          $set: { status: 'abandoned' },
        }
      );

      if (updateResult.modifiedCount > 0) {
        logger.info(
          { count: updateResult.modifiedCount },
          'Sweep marked inactive cases as abandoned'
        );
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error running stale cases sweep');
  }
}

let sweepInterval: NodeJS.Timeout | null = null;

export function startSweepJob(): void {
  // Run on startup
  runStaleCasesSweep().catch(() => {});

  // Run every 10 minutes (SPEC Section 6.4 & User prompt)
  sweepInterval = setInterval(() => {
    runStaleCasesSweep().catch(() => {});
  }, 10 * 60 * 1000);
}

export function stopSweepJob(): void {
  if (sweepInterval) {
    clearInterval(sweepInterval);
    sweepInterval = null;
  }
}
