import { describe, it, expect } from 'vitest';
import {
  serializeCaseDetails,
} from './case';
import { PublicDiscoveredClue } from '@mystery/shared';
import { IMysteryCase, IPlayerSession } from '../models/index';

describe('Case Allow-list Serializers (Non-negotiable secrecy checks)', () => {
  const mockCase: Partial<IMysteryCase> = {
    publicId: 'testCase12345678',
    difficulty: 'medium',
    status: 'active',
    title: 'The Stolen Emerald',
    briefing: 'A priceless emerald was stolen from the vault.',
    setting: 'Mansion Resort',
    caseDate: '14 June 2026',
    sceneKey: 'mansion_resort',
    victim: { name: 'Lord Harrington', summary: 'Estate owner' },
    suspects: [
      {
        id: 's1',
        name: 'Karthik Rao',
        age: 34,
        occupation: 'Event planner',
        relationshipToVictim: 'Nephew',
        publicStatement: 'I was checking lights on the stage.',
        gender: 'male',
        background: 'Longtime event coordinator.',
        personality: 'Nervous and meticulous.',
        alibiTimeline: [
          { time: '9:00 PM', label: 'Arrived at ballroom' },
          { time: '9:30 PM', label: 'Checked lighting rig' },
          { time: '10:00 PM', label: 'Spoke with caterers' },
        ],
        connections: [{ suspectId: 's2', label: 'Cousin', note: 'Owes money' }],
      },
      {
        id: 's2',
        name: 'Meera Iyer',
        age: 29,
        occupation: 'Sommelier',
        relationshipToVictim: 'Stepdaughter',
        publicStatement: 'I was in the wine cellar cataloging vintages.',
        gender: 'female',
        background: 'Certified sommelier.',
        personality: 'Composed and observant.',
        alibiTimeline: [
          { time: '9:00 PM', label: 'Cellar inventory' },
          { time: '9:30 PM', label: 'Tasting note entry' },
          { time: '10:00 PM', label: 'Locked wine vault' },
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
        insight: 'Points to someone wearing green embroidery.',
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
        insight: 'Disproves the alibi.',
        requires: ['c1'],
        mentionsSuspectIds: ['s1'],
      },
    ],
    hints: [
      { level: 1, text: 'Look closely at who was near the latch.', unlockAtClues: 1 },
      { level: 2, text: 'Check the keycard logs against alibis.', unlockAtClues: 3 },
    ],
    secret: {
      culpritId: 's1',
      motive: 'Cover massive gambling debt.',
      method: 'Used duplicate keycard.',
      opportunity: 'Stage check provided cover.',
      clueMeta: [
        { clueId: 'c1', role: 'incriminating', pointsToSuspectIds: ['s1'] },
        { clueId: 'c2', role: 'incriminating', pointsToSuspectIds: ['s1'] },
      ],
      deduction: [{ step: 1, conclusion: 'Alibi false', clueIds: ['c2'] }],
      timeline: [{ time: '9:47 PM', event: 'Entered room' }],
    },
  };

  const mockSession: Partial<IPlayerSession> = {
    caseId: 'testCase12345678',
    tokenHash: 'abc',
    discoveredClueIds: ['c1'],
    hintsUsed: 1,
    hintsGiven: [{ level: 1, usedAt: new Date() }],
    startedAt: new Date(Date.now() - 60000),
  };

  it('serializeCaseDetails NEVER leaks culpritId, motive, method, or secret fields', () => {
    const serialized = serializeCaseDetails(mockCase as IMysteryCase, mockSession as IPlayerSession);

    const json = JSON.stringify(serialized);
    expect(json).not.toContain('culpritId');
    expect(json).not.toContain('Cover massive gambling debt');
    expect(json).not.toContain('Used duplicate keycard');
    expect(json).not.toContain('Stage check provided cover');
    expect(json).not.toContain('pointsToSuspectIds');
  });

  it('locked clues do NOT expose description, visualKey, or insight', () => {
    const serialized = serializeCaseDetails(mockCase as IMysteryCase, mockSession as IPlayerSession);

    const lockedClue = serialized.clues.find((c) => c.id === 'c2');
    expect(lockedClue).toBeDefined();
    expect(lockedClue?.discovered).toBe(false);
    expect(lockedClue?.locked).toBe(true);

    const lockedJson = JSON.stringify(lockedClue);
    expect(lockedJson).not.toContain('Room 204 keycard used');
    expect(lockedJson).not.toContain('document_ledger');
    expect(lockedJson).not.toContain('Disproves the alibi');
    expect(lockedJson).not.toContain('role');
    expect(lockedJson).not.toContain('incriminating');
  });

  it('discovered clues expose description, visualKey, and insight', () => {
    const serialized = serializeCaseDetails(mockCase as IMysteryCase, mockSession as IPlayerSession);

    const discoveredClue = serialized.clues.find((c) => c.id === 'c1') as PublicDiscoveredClue;
    expect(discoveredClue).toBeDefined();
    expect(discoveredClue?.discovered).toBe(true);
    expect(discoveredClue?.locked).toBe(false);
    expect(discoveredClue.description).toBe('A green silk thread caught on the latch.');
    expect(discoveredClue.visualKey).toBe('physical_thread');
    expect(discoveredClue.insight).toBe('Points to someone wearing green embroidery.');
  });

  it('unused hints do NOT expose hint text', () => {
    const serialized = serializeCaseDetails(mockCase as IMysteryCase, mockSession as IPlayerSession);

    const unusedHint = serialized.hints.find((h) => h.level === 2);
    expect(unusedHint).toBeDefined();
    expect(unusedHint?.used).toBe(false);
    expect(unusedHint?.text).toBeUndefined();

    const usedHint = serialized.hints.find((h) => h.level === 1);
    expect(usedHint).toBeDefined();
    expect(usedHint?.used).toBe(true);
    expect(usedHint?.text).toBe('Look closely at who was near the latch.');
  });

  it('calculates cluesNeededToAccuse correctly', () => {
    const serialized = serializeCaseDetails(mockCase as IMysteryCase, mockSession as IPlayerSession);
    // Medium requires 4 clues. Discovered = 1. Needed = 3.
    expect(serialized.progress.minCluesToAccuse).toBe(4);
    expect(serialized.progress.cluesDiscovered).toBe(1);
    expect(serialized.progress.cluesNeededToAccuse).toBe(3);
    expect(serialized.progress.canAccuse).toBe(false);
  });
});
