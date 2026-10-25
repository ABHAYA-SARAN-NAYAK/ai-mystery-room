import { create } from 'zustand';

export interface CaseHistoryItem {
  caseId: string;
  sessionToken: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'generating' | 'active' | 'accused' | 'failed' | 'abandoned';
  date: string;
  finalScore?: number;
}

interface SessionState {
  activeCaseId: string | null;
  activeToken: string | null;
  history: CaseHistoryItem[];
  globalError: { message: string; onRetry?: () => void } | null;
  setSession: (caseId: string, token: string, initialDetails?: Partial<CaseHistoryItem>) => void;
  updateCaseInHistory: (caseId: string, updates: Partial<CaseHistoryItem>) => void;
  clearActiveSession: () => void;
  setGlobalError: (error: { message: string; onRetry?: () => void } | null) => void;
  getTokenForCase: (caseId: string) => string | null;
}

const STORAGE_KEY_ACTIVE_CASE = 'mystery_active_case_id';
const STORAGE_KEY_TOKENS = 'mystery_session_tokens';
const STORAGE_KEY_HISTORY = 'mystery_case_history';

function loadStoredTokens(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadStoredHistory(): CaseHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useSessionStore = create<SessionState>((set, get) => {
  const initialActiveCaseId = localStorage.getItem(STORAGE_KEY_ACTIVE_CASE);
  const initialTokens = loadStoredTokens();
  const initialActiveToken = initialActiveCaseId ? initialTokens[initialActiveCaseId] || null : null;
  const initialHistory = loadStoredHistory();

  return {
    activeCaseId: initialActiveCaseId,
    activeToken: initialActiveToken,
    history: initialHistory,
    globalError: null,

    setSession: (caseId, token, initialDetails) => {
      const tokens = loadStoredTokens();
      tokens[caseId] = token;
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
      localStorage.setItem(STORAGE_KEY_ACTIVE_CASE, caseId);

      const history = loadStoredHistory();
      const existingIndex = history.findIndex((h) => h.caseId === caseId);

      const newItem: CaseHistoryItem = {
        caseId,
        sessionToken: token,
        title: initialDetails?.title || 'Untitled Mystery',
        difficulty: initialDetails?.difficulty || 'medium',
        status: initialDetails?.status || 'generating',
        date: initialDetails?.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        finalScore: initialDetails?.finalScore,
      };

      if (existingIndex >= 0) {
        history[existingIndex] = { ...history[existingIndex], ...newItem };
      } else {
        history.unshift(newItem);
      }
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));

      set({
        activeCaseId: caseId,
        activeToken: token,
        history,
      });
    },

    updateCaseInHistory: (caseId, updates) => {
      const history = loadStoredHistory();
      const index = history.findIndex((h) => h.caseId === caseId);
      if (index >= 0) {
        history[index] = { ...history[index], ...updates };
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
        set({ history });
      }
    },

    clearActiveSession: () => {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CASE);
      set({ activeCaseId: null, activeToken: null });
    },

    setGlobalError: (error) => {
      set({ globalError: error });
    },

    getTokenForCase: (caseId) => {
      const state = get();
      if (state.activeCaseId === caseId && state.activeToken) {
        return state.activeToken;
      }
      const tokens = loadStoredTokens();
      return tokens[caseId] || null;
    },
  };
});
