import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { MysteryCase, PlayerSession } from '../models/index';
import { generateSessionToken, hashSessionToken } from '../utils/crypto';
import { config } from '../config/index';

const FORBIDDEN_SECRET_KEYS = [
  'culpritId',
  'pointsToSuspectIds',
  'isRedHerring',
  'motive',
  'method',
  'opportunity',
  'timeline',
  'deduction',
];

const VERDICT_WORDS = ['killer', 'culprit', 'murderer', 'thief', 'guilty', 'confessed', 'perpetrator'];

function deepScanForForbiddenKeys(obj: unknown, path = ''): string[] {
  const leaks: string[] = [];
  if (!obj || typeof obj !== 'object') return leaks;

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      leaks.push(...deepScanForForbiddenKeys(item, `${path}[${index}]`));
    });
    return leaks;
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_SECRET_KEYS.includes(key)) {
      leaks.push(`Forbidden key found: "${currentPath}"`);
    }

    // Check for combination of culprit name + verdict words in string values
    const val = record[key];
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower.includes('karthik rao')) {
        for (const verdict of VERDICT_WORDS) {
          if (lower.includes(verdict)) {
            leaks.push(
              `Culprit name coupled with verdict word "${verdict}" in "${currentPath}": "${val}"`
            );
          }
        }
      }
    }

    leaks.push(...deepScanForForbiddenKeys(val, currentPath));
  }

  return leaks;
}

describe('Automated Secrecy Leak Test (SPEC Section 5.8 & Non-negotiable Rule 1)', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  const caseId = 'leak_test_case_1';
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    config.geminiMock = true;

    await MysteryCase.create({
      publicId: caseId,
      premise: 'A jewel theft at a hill-station wedding during the dance.',
      difficulty: 'easy',
      status: 'active',
      title: 'The Missing Emerald Necklace',
      briefing: 'At the Rao wedding in Ooty, the family necklace vanished. One of them is guilty.',
      setting: 'Hillview Resort, Ooty',
      caseDate: '14 June 2026',
      sceneKey: 'mansion_resort',
      victim: { name: 'Mrs. Lakshmi Rao', summary: "Bride's grandmother" },
      suspects: [
        {
          id: 's1',
          name: 'Karthik Rao',
          age: 34,
          occupation: 'Event planner',
          relationshipToVictim: 'Nephew',
          publicStatement: 'I was at the stage checking lights all evening.',
          gender: 'male',
          background: 'Event manager',
          personality: 'Nervous',
          alibiTimeline: [
            { time: '9:00 PM', label: 'Stage' },
            { time: '9:30 PM', label: 'Audio' },
            { time: '10:00 PM', label: 'Exit' },
          ],
          connections: [],
        },
        {
          id: 's2',
          name: 'Meera Iyer',
          age: 29,
          occupation: 'Sommelier',
          relationshipToVictim: 'Granddaughter',
          publicStatement: 'I was on the veranda.',
          gender: 'female',
          background: 'Sommelier',
          personality: 'Poised',
          alibiTimeline: [
            { time: '9:00 PM', label: 'Veranda' },
            { time: '9:30 PM', label: 'Wine' },
            { time: '10:00 PM', label: 'Dining' },
          ],
          connections: [],
        },
        {
          id: 's3',
          name: 'Vikram Sethi',
          age: 45,
          occupation: 'Catering Director',
          relationshipToVictim: 'Contractor',
          publicStatement: 'Pantry prep.',
          gender: 'male',
          background: 'Catering',
          personality: 'Busy',
          alibiTimeline: [
            { time: '9:00 PM', label: 'Pantry' },
            { time: '9:30 PM', label: 'Service' },
            { time: '10:00 PM', label: 'Cleanup' },
          ],
          connections: [],
        },
      ],
      clues: [
        {
          id: 'c1',
          title: 'Torn silk thread',
          type: 'physical',
          location: 'Jewelry room',
          description: 'A green silk thread caught on the latch.',
          role: 'incriminating',
          pointsToSuspectIds: ['s1'],
          visualKey: 'physical_thread',
          insight: 'Matches sherwani.',
          requires: [],
          mentionsSuspectIds: ['s1'],
        },
        {
          id: 'c2',
          title: 'Hotel key log',
          type: 'document',
          location: 'Front desk',
          description: 'Room 204 keycard used at 9:47 PM.',
          role: 'incriminating',
          pointsToSuspectIds: ['s1'],
          visualKey: 'document_ledger',
          insight: 'Contradicts alibi.',
          requires: ['c1'],
          mentionsSuspectIds: ['s1'],
        },
      ],
      hints: [
        { level: 1, text: 'Compare who claimed to be where at 9:45 PM.', unlockAtClues: 1 },
      ],
      secret: {
        culpritId: 's1',
        motive: 'Gambling debts he hid from the family.',
        method: 'Used duplicate keycard during the dance.',
        opportunity: 'Stage check gave cover.',
        clueMeta: [{ clueId: 'c1', role: 'incriminating', pointsToSuspectIds: ['s1'] }],
        deduction: [{ step: 1, conclusion: 'Alibi false', clueIds: ['c1'] }],
        timeline: [{ time: '9:47 PM', event: 'Entered suite' }],
      },
    });

    await PlayerSession.create({
      caseId,
      tokenHash,
      discoveredClueIds: [],
      hintsUsed: 0,
      hintsGiven: [],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('scans GET /api/cases/:id response for zero secret data leaks', async () => {
    const res = await request(app)
      .get(`/api/cases/${caseId}`)
      .set('X-Session-Token', token);

    expect(res.status).toBe(200);
    const leaks = deepScanForForbiddenKeys(res.body);
    expect(leaks).toHaveLength(0);

    // Verify locked clue fields
    const lockedClue = (res.body.data.clues as Array<Record<string, unknown>>).find((c) => c.id === 'c1');
    expect(lockedClue).toBeDefined();
    expect(lockedClue?.description).toBeUndefined();
    expect(lockedClue?.visualKey).toBeUndefined();
    expect(lockedClue?.insight).toBeUndefined();
    expect(lockedClue?.role).toBeUndefined();
  });

  it('scans POST /clues/:clueId/discover response for zero secret data leaks', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/clues/c1/discover`)
      .set('X-Session-Token', token);

    expect(res.status).toBe(200);
    const leaks = deepScanForForbiddenKeys(res.body);
    expect(leaks).toHaveLength(0);

    // Even discovered clue must NEVER leak role or pointsToSuspectIds
    expect(res.body.data.clue.role).toBeUndefined();
    expect(res.body.data.clue.pointsToSuspectIds).toBeUndefined();
  });

  it('scans POST /hints response for zero secret data leaks', async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/hints`)
      .set('X-Session-Token', token);

    expect(res.status).toBe(200);
    const leaks = deepScanForForbiddenKeys(res.body);
    expect(leaks).toHaveLength(0);
  });

  it('scans POST /accuse response for zero secret data leaks', async () => {
    // Add c2 so minimum clues met
    await PlayerSession.updateOne(
      { caseId },
      { $addToSet: { discoveredClueIds: ['c2', 'c3'] } }
    );

    const res = await request(app)
      .post(`/api/cases/${caseId}/accuse`)
      .set('X-Session-Token', token)
      .send({ suspectId: 's1' });

    expect(res.status).toBe(200);
    const leaks = deepScanForForbiddenKeys(res.body);
    expect(leaks).toHaveLength(0);

    // Accuse response must NEVER return culprit
    expect(res.body.data.culprit).toBeUndefined();
    expect(res.body.data.culpritId).toBeUndefined();
  });
});
