// notificationService.js — Optional Render Express backend notification client (Spark-safe)
// Calls ${VITE_API_BASE_URL}/api/auth/register-event or /api/auth/login-event when configured.
// Gracefully skips requests when VITE_API_BASE_URL is missing.
// Never sends notifications on browser refresh or automatic session restoration.

const SENT_EVENTS_STORAGE_KEY = 'hlw_sent_auth_events';

function getSentSet() {
  try {
    const raw = sessionStorage.getItem(SENT_EVENTS_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markSent(eventId) {
  try {
    const set = getSentSet();
    set.add(eventId);
    sessionStorage.setItem(SENT_EVENTS_STORAGE_KEY, JSON.stringify([...set].slice(-30)));
  } catch {}
}

export function buildAuthEventId(uid, eventType, salt = Date.now()) {
  return `${uid}_${eventType}_${salt}`;
}

export function getApiBaseUrl() {
  const raw = (import.meta.env?.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
  if (!raw || raw.includes('your-render') || raw.includes('your-project-id')) return '';
  return raw;
}

export function isNotificationEndpointConfigured() {
  return Boolean(getApiBaseUrl());
}

export async function notifyOwnerAuthEvent({ user, eventType, provider, eventId }) {
  if (!user || !eventType) {
    return { ok: false, skipped: true, reason: 'missing_params' };
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return { ok: false, skipped: true, reason: 'endpoint_not_configured' };
  }

  const resolvedEventId = eventId || buildAuthEventId(user.uid, eventType);
  const sent = getSentSet();
  if (sent.has(resolvedEventId)) {
    return { ok: true, duplicate: true };
  }

  const path = eventType === 'NEW_REGISTRATION'
    ? '/api/auth/register-event'
    : '/api/auth/login-event';

  try {
    const idToken = await user.getIdToken();
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        eventType,
        eventId: resolvedEventId,
        provider,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      markSent(resolvedEventId);
    }
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    return { ok: false, skipped: false, error: err?.message ?? 'Network error' };
  }
}
