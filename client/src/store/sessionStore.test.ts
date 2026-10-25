import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './sessionStore';

describe('Client Session Store', () => {
  beforeEach(() => {
    localStorage.clear();
    useSessionStore.getState().clearActiveSession();
  });

  it('stores active case session and persists to localStorage', () => {
    const store = useSessionStore.getState();
    store.setSession('case_123', 'token_abc', {
      title: 'A Murder at the Manor',
      difficulty: 'hard',
      status: 'active',
    });

    expect(useSessionStore.getState().activeCaseId).toBe('case_123');
    expect(useSessionStore.getState().activeToken).toBe('token_abc');
    expect(useSessionStore.getState().history).toHaveLength(1);
    expect(useSessionStore.getState().history[0].caseId).toBe('case_123');

    // Retrieve via getTokenForCase helper
    expect(useSessionStore.getState().getTokenForCase('case_123')).toBe('token_abc');
  });

  it('updates case history details', () => {
    const store = useSessionStore.getState();
    store.setSession('case_456', 'token_xyz', {
      title: 'The Stolen Gems',
      difficulty: 'medium',
      status: 'active',
    });

    store.updateCaseInHistory('case_456', {
      status: 'accused',
      finalScore: 175,
    });

    const item = useSessionStore.getState().history.find((h) => h.caseId === 'case_456');
    expect(item?.status).toBe('accused');
    expect(item?.finalScore).toBe(175);
  });
});
