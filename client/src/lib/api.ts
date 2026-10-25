import {
  CreateCaseRequest,
  CreateCaseResponseData,
  PublicCaseDetails,
  DiscoverClueResponseData,
  UseHintResponseData,
  AccuseRequest,
  AccuseResponseData,
  CaseResultData,
  CancelCaseResponseData,
  HealthResponseData,
  ApiResponse,
  ApiErrorResponse,
} from '@mystery/shared';
import { useSessionStore } from '../store/sessionStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details?: unknown[];

  constructor(code: string, message: string, details?: unknown[]) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  caseIdForAuth?: string
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Auto-inject X-Session-Token if available
  const token = caseIdForAuth
    ? useSessionStore.getState().getTokenForCase(caseIdForAuth)
    : useSessionStore.getState().activeToken;

  if (token && !headers.has('X-Session-Token')) {
    headers.set('X-Session-Token', token);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiClientError(
      'NETWORK_ERROR',
      'Unable to connect to the server. Please check your internet connection.'
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorBody = json as ApiErrorResponse;
    const code = errorBody?.error?.code || `HTTP_${res.status}`;
    const message = errorBody?.error?.message || res.statusText || 'Request failed';
    throw new ApiClientError(code, message, errorBody?.error?.details);
  }

  const successBody = json as ApiResponse<T>;
  return successBody.data;
}

export const api = {
  createCase: (payload: CreateCaseRequest): Promise<CreateCaseResponseData> =>
    request<CreateCaseResponseData>('/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCase: (caseId: string): Promise<PublicCaseDetails | { caseId: string; status: string; stage?: string; errorCode?: string }> =>
    request<PublicCaseDetails | { caseId: string; status: string; stage?: string; errorCode?: string }>(`/cases/${caseId}`, {
      method: 'GET',
    }, caseId),

  discoverClue: (caseId: string, clueId: string): Promise<DiscoverClueResponseData> =>
    request<DiscoverClueResponseData>(`/cases/${caseId}/clues/${clueId}/discover`, {
      method: 'POST',
    }, caseId),

  useHint: (caseId: string): Promise<UseHintResponseData> =>
    request<UseHintResponseData>(`/cases/${caseId}/hints`, {
      method: 'POST',
    }, caseId),

  accuse: (caseId: string, payload: AccuseRequest): Promise<AccuseResponseData> =>
    request<AccuseResponseData>(`/cases/${caseId}/accuse`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, caseId),

  getResult: (caseId: string): Promise<CaseResultData> =>
    request<CaseResultData>(`/cases/${caseId}/result`, {
      method: 'GET',
    }, caseId),

  cancelCase: (caseId: string): Promise<CancelCaseResponseData> =>
    request<CancelCaseResponseData>(`/cases/${caseId}/cancel`, {
      method: 'POST',
    }, caseId),

  checkHealth: (): Promise<HealthResponseData> =>
    request<HealthResponseData>('/healthz', {
      method: 'GET',
    }),
};
