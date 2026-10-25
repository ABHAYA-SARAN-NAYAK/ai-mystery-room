import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { MysteryCase, PlayerSession } from '../models/index';
import { generateSessionToken, hashSessionToken } from '../utils/crypto';
import { config } from '../config/index';

describe('Concurrency & Race Condition Tests (SPEC Section 6.2 & Non-negotiable Rule 5)', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    config.geminiMock = true;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await MysteryCase.deleteMany({});
    await PlayerSession.deleteMany({});
  });

  it('10 parallel accuse calls result in EXACTLY 1 success and 9 rejections with 409 ALREADY_ACCUSED', async () => {
    const caseId = 'concurrency_accuse_10';
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);

    await MysteryCase.create({
      publicId: caseId,
      premise: 'Testing concurrent accusation races',
      difficulty: 'easy',
      status: 'active',
      suspects: [
        { id: 's1', name: 'Suspect One' },
        { id: 's2', name: 'Suspect Two' },
        { id: 's3', name: 'Suspect Three' },
      ],
      clues: [
        { id: 'c1', title: 'C1', type: 'physical', location: 'L1', description: 'D1', role: 'incriminating', pointsToSuspectIds: ['s1'], visualKey: 'physical_thread', insight: 'I1', requires: [] },
        { id: 'c2', title: 'C2', type: 'physical', location: 'L2', description: 'D2', role: 'incriminating', pointsToSuspectIds: ['s1'], visualKey: 'physical_key', insight: 'I2', requires: [] },
        { id: 'c3', title: 'C3', type: 'physical', location: 'L3', description: 'D3', role: 'incriminating', pointsToSuspectIds: ['s1'], visualKey: 'physical_glass', insight: 'I3', requires: [] },
      ],
      hints: [],
      secret: {
        culpritId: 's1',
        motive: 'Greed',
        method: 'Poison',
        opportunity: 'Night',
        clueMeta: [],
        deduction: [{ step: 1, conclusion: 'Guilty', clueIds: ['c1'] }],
        timeline: [],
      },
    });

    await PlayerSession.create({
      caseId,
      tokenHash,
      discoveredClueIds: ['c1', 'c2', 'c3'], // Meets minimum of 3
      hintsUsed: 0,
      hintsGiven: [],
    });

    // Launch 10 parallel accuse requests simultaneously
    const requests = Array.from({ length: 10 }).map((_, index) =>
      request(app)
        .post(`/api/cases/${caseId}/accuse`)
        .set('X-Session-Token', token)
        .send({ suspectId: index % 2 === 0 ? 's1' : 's2', reasoning: `Concurrent attempt #${index}` })
    );

    const responses = await Promise.all(requests);

    const successResponses = responses.filter((r) => r.status === 200);
    const conflictResponses = responses.filter(
      (r) => r.status === 409 && r.body.error?.code === 'ALREADY_ACCUSED'
    );

    expect(successResponses).toHaveLength(1);
    expect(conflictResponses).toHaveLength(9);

    // Verify DB state
    const finalCase = await MysteryCase.findOne({ publicId: caseId });
    expect(finalCase?.status).toBe('accused');
  });

  it('5 parallel clue discovery calls on the same clue result in exactly 1 addition with no duplicates', async () => {
    const caseId = 'concurrency_discover_5';
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);

    await MysteryCase.create({
      publicId: caseId,
      premise: 'Testing parallel double click discovery',
      difficulty: 'easy',
      status: 'active',
      clues: [
        {
          id: 'c1',
          title: 'Footprints',
          type: 'physical',
          location: 'Garden',
          description: 'Muddy boots',
          role: 'incriminating',
          pointsToSuspectIds: ['s1'],
          visualKey: 'physical_footprints',
          insight: 'Boot size 10',
          requires: [],
          mentionsSuspectIds: ['s1'],
        },
      ],
      hints: [],
    });

    await PlayerSession.create({
      caseId,
      tokenHash,
      discoveredClueIds: [],
    });

    // 5 concurrent requests on clue c1
    const discoverRequests = Array.from({ length: 5 }).map(() =>
      request(app)
        .post(`/api/cases/${caseId}/clues/c1/discover`)
        .set('X-Session-Token', token)
    );

    const responses = await Promise.all(discoverRequests);

    // All should return 200
    for (const res of responses) {
      expect(res.status).toBe(200);
    }

    // In session DB document, c1 appears EXACTLY once
    const sessionDoc = await PlayerSession.findOne({ caseId });
    expect(sessionDoc?.discoveredClueIds).toEqual(['c1']);
  });
});
