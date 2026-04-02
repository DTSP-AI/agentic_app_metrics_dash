import { getMWAccessToken } from './mw-supabase';
import { appConfig } from './config';

const API_URL = appConfig.apiUrl;

// ── Error Classification ──

class APIError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

function classifyNetworkError(err: unknown): APIError {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('CORS') || msg.includes('access control')) {
    return new APIError(
      'Cross-origin request blocked. The backend may not be configured to accept requests from this domain.',
      0,
      'CORS_BLOCKED'
    );
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_FAILED')) {
    return new APIError(
      'Unable to reach the server. Check your internet connection or try again.',
      0,
      'NETWORK_ERROR'
    );
  }
  return new APIError(msg || 'An unexpected error occurred.', 0, 'UNKNOWN');
}

// ── Token Cache with Coalesced Refresh ──

let _cachedToken: string | null = null;
let _tokenExpiry = 0;
let _refreshPromise: Promise<Record<string, string>> | null = null;
let _redirectingToLogin = false;

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (_cachedToken && Date.now() < _tokenExpiry) {
    return { Authorization: `Bearer ${_cachedToken}` };
  }
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = _doRefreshToken();
  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

async function _doRefreshToken(): Promise<Record<string, string>> {
  try {
    // Use MW Supabase JWT for backend API calls (MW backend validates against its own Supabase)
    const token = await getMWAccessToken();
    if (token) {
      _cachedToken = token;
      // Cache for 55 minutes (MW tokens last ~60min)
      _tokenExpiry = Date.now() + 55 * 60 * 1000;
      return { Authorization: `Bearer ${_cachedToken}` };
    }
  } catch {
    // MW Supabase not available
  }
  _cachedToken = null;
  _tokenExpiry = 0;
  return {};
}

// ── Backend Warmup ──

let _backendWarm = false;
let _warmupPromise: Promise<void> | null = null;

async function _doWarmup(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    await fetch(`${API_URL}/health`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    _backendWarm = true;
  } catch {
    _backendWarm = true; // non-fatal
  } finally {
    _warmupPromise = null;
  }
}

async function ensureBackendWarm(): Promise<void> {
  if (_backendWarm) return;
  if (_warmupPromise) { await _warmupPromise; return; }
  _warmupPromise = _doWarmup();
  await _warmupPromise;
}

// ── Core Fetch Wrapper ──

type FetchAPIOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

async function fetchAPI<T>(path: string, options: FetchAPIOptions = {}): Promise<T> {
  await ensureBackendWarm();

  const { timeoutMs = 25_000, retries, ...requestOptions } = options;
  const authHeaders = await getAuthHeaders();

  const method = (requestOptions.method || 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';
  const MAX_RETRIES = retries ?? (isIdempotent ? 1 : 0);
  const BACKOFF_MS = [1000, 2000, 4000];

  let res: Response;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await fetch(`${API_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...requestOptions.headers,
        },
        ...requestOptions,
        signal: requestOptions.signal ?? controller.signal,
      });
      clearTimeout(timeoutId);

      if ([502, 503, 504].includes(res.status) && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
        continue;
      }
      break;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
        continue;
      }
      throw classifyNetworkError(err);
    }
  }

  if (!res!) {
    throw classifyNetworkError(lastError);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    const detail = body.detail || '';

    if (res.status === 401) {
      _cachedToken = null;
      _tokenExpiry = 0;
      if (typeof window !== 'undefined' && !_redirectingToLogin) {
        _redirectingToLogin = true;
        window.location.href = '/login';
      }
      throw new APIError(detail || 'Session expired. Please sign in again.', 401, 'UNAUTHORIZED');
    }
    if (res.status === 404) {
      throw new APIError(detail || 'Not found.', 404, 'NOT_FOUND');
    }
    if (res.status === 422) {
      throw new APIError(detail || 'Invalid request data.', 422, 'VALIDATION');
    }
    if (res.status === 500) {
      throw new APIError(detail || 'Server error.', 500, 'SERVER_ERROR');
    }
    throw new APIError(detail || `Request failed (${res.status}).`, res.status, `HTTP_${res.status}`);
  }

  return res.json();
}

export { APIError };

// ── Admin API Endpoints ──

export async function checkAdminRole() {
  return fetchAPI<{ is_admin: boolean; email: string }>('/api/v1/admin/role-check');
}

export async function getUsageSummary() {
  return fetchAPI<{
    today_cost: number; week_cost: number; month_cost: number;
    today_calls: number; week_calls: number; month_calls: number;
    pricing: Record<string, { input: number; output: number }>;
  }>('/api/v1/admin/usage/summary');
}

export async function getUsageLogs(params?: {
  model?: string; service?: string; days?: number; limit?: number; offset?: number;
}) {
  const q = new URLSearchParams();
  if (params?.model) q.set('model', params.model);
  if (params?.service) q.set('service', params.service);
  if (params?.days) q.set('days', String(params.days));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  return fetchAPI<{ logs: UsageLog[]; total: number; limit: number; offset: number }>(
    `/api/v1/admin/usage/logs?${q.toString()}`
  );
}

export async function getUsageByModel(days: number = 30) {
  return fetchAPI<{ models: ModelUsage[]; days: number }>(`/api/v1/admin/usage/by-model?days=${days}`);
}

export async function getUsageByService(days: number = 30) {
  return fetchAPI<{ services: ServiceUsage[]; days: number }>(`/api/v1/admin/usage/by-service?days=${days}`);
}

export async function getUsageByMeeting(days: number = 30) {
  return fetchAPI<{
    meetings: RunCost[];
    total_meetings: number;
    avg_cost_per_meeting: number;
    days: number;
  }>(`/api/v1/admin/usage/by-meeting?days=${days}`);
}

export async function getUsageDaily(days: number = 30) {
  return fetchAPI<{ daily: DailyCost[]; days: number }>(`/api/v1/admin/usage/daily?days=${days}`);
}

export async function getUsageWarnings() {
  return fetchAPI<{
    warnings: UsageWarning[];
    daily_cost: number; daily_threshold: number;
    hourly_calls: number; hourly_threshold: number; hourly_cost: number;
    top_service_hourly: string | null;
  }>('/api/v1/admin/usage/warnings');
}

export async function getPricingSuggestion(
  avgCost: number, avgMeetings: number = 10, currentUsers: number = 1
) {
  return fetchAPI<{
    suggestion: string | null;
    monthly_llm_cost_per_user: number;
    model_pricing: Record<string, unknown>;
    error?: string;
  }>(
    `/api/v1/admin/pricing/suggest?avg_cost_per_meeting=${avgCost}&avg_meetings_per_user=${avgMeetings}&current_users=${currentUsers}`,
    { method: 'POST' }
  );
}

// ── Response Types ──

export interface UsageLog {
  id: string;
  created_at: string;
  model: string;
  service_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
}

export interface ModelUsage {
  model: string;
  cost: number;
  calls: number;
}

export interface ServiceUsage {
  service: string;
  cost: number;
  calls: number;
}

export interface RunCost {
  meeting_id: string;
  total_cost: number;
  call_count: number;
}

export interface DailyCost {
  date: string;
  total_cost: number;
  total_calls: number;
}

export interface UsageWarning {
  level: 'warning' | 'critical';
  message: string;
}
