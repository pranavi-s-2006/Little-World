// notificationService.js — Optional owner notification client (safe on Firebase Spark free plan)
// Gracefully skips requests when VITE_NOTIFICATION_ENDPOINT is not configured.
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

export function isNotificationEndpointConfigured() {
  const endpoint = (import.meta.env?.VITE_NOTIFICATION_ENDPOINT ?? '').trim();
  return Boolean(endpoint && !endpoint.includes('your-project-id'));
}

export async function notifyOwnerAuthEvent({ user, eventType, provider, eventId }) {
  if (!user || !eventType) {
    return { ok: false, skipped: true, reason: 'missing_params' };
  }

  const endpoint = (import.meta.env?.VITE_NOTIFICATION_ENDPOINT ?? '').trim();
  if (!endpoint || endpoint.includes('your-project-id')) {
    return { ok: false, skipped: true, reason: 'endpoint_not_configured' };
  }

  const resolvedEventId = eventId || buildAuthEventId(user.uid, eventType);
  const sent = getSentSet();
  if (sent.has(resolvedEventId)) {
    return { ok: true, duplicate: true };
  }

  try {
    const idToken = await user.getIdToken();
    const res = await fetch(endpoint, {
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
