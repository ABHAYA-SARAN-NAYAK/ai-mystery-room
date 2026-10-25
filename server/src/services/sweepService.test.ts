import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MysteryCase, PlayerSession } from '../models/index';
import { runStaleCasesSweep } from './sweepService';

describe('Sweep Job Service', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await MysteryCase.deleteMany({});
    await PlayerSession.deleteMany({});
  });

  it('marks cases stuck in generating for >5 minutes as failed', async () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);

    const stuckCase = await MysteryCase.create({
      publicId: 'stuckCase12345678',
      premise: 'Testing stuck case sweep',
      difficulty: 'easy',
      status: 'generating',
      createdAt: sixMinutesAgo,
    });

    const recentCase = await MysteryCase.create({
      publicId: 'recentCase123456',
      premise: 'Testing recent case',
      difficulty: 'easy',
      status: 'generating',
      createdAt: new Date(),
    });

    await runStaleCasesSweep();

    const updatedStuck = await MysteryCase.findOne({ publicId: stuckCase.publicId });
    expect(updatedStuck?.status).toBe('failed');

    const updatedRecent = await MysteryCase.findOne({ publicId: recentCase.publicId });
    expect(updatedRecent?.status).toBe('generating');
  });

  it('marks active cases with no session activity for >7 days as abandoned', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    const abandonedCase = await MysteryCase.create({
      publicId: 'abandonCase12345',
      premise: 'Testing inactive case sweep',
      difficulty: 'medium',
      status: 'active',
      createdAt: eightDaysAgo,
    });

    await PlayerSession.create({
      caseId: abandonedCase.publicId,
      tokenHash: 'dummyHash',
      startedAt: eightDaysAgo,
      lastActiveAt: eightDaysAgo,
    });

    await runStaleCasesSweep();

    const updated = await MysteryCase.findOne({ publicId: abandonedCase.publicId });
    expect(updated?.status).toBe('abandoned');
  });
});
