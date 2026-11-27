// adminApiService.js — Verified Owner Admin API client (strictly requires Firebase ID token)
import { getApiBaseUrl } from './notificationService.js';

async function adminRequest(user, path, { method = 'GET', body = null } = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured yet.');
  }
  if (!user || typeof user.getIdToken !== 'function') {
    throw new Error('Authenticated owner session required.');
  }

  const token = await user.getIdToken();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed with HTTP ${res.status}`);
  }
  return json;
}

export function fetchAdminOverview(user, range = '7d') {
  return adminRequest(user, `/api/admin/overview?range=${encodeURIComponent(range)}`);
}

export function fetchAdminLive(user) {
  return adminRequest(user, '/api/admin/live');
}

export function fetchAdminUsers(user, params = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.dateRange) qs.set('dateRange', params.dateRange);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortDir) qs.set('sortDir', params.sortDir);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return adminRequest(user, `/api/admin/users?${qs.toString()}`);
}

export function fetchAdminUserProfile(user, uid) {
  return adminRequest(user, `/api/admin/users/${encodeURIComponent(uid)}`);
}

export function fetchAdminActivities(user, params = {}) {
  const qs = new URLSearchParams();
  if (params.uid) qs.set('uid', params.uid);
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.dateRange) qs.set('dateRange', params.dateRange);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return adminRequest(user, `/api/admin/activities?${qs.toString()}`);
}

export function fetchAdminAnalytics(user, range = '30d') {
  return adminRequest(user, `/api/admin/analytics?range=${encodeURIComponent(range)}`);
}

export function triggerPresenceCleanup(user) {
  return adminRequest(user, '/api/admin/presence/cleanup', { method: 'POST', body: {} });
}

export async function fetchBackendHealth() {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;
  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
