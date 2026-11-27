// telemetryService.js — Lightweight live presence heartbeat & activity telemetry (Spark-safe)
// Calls ${VITE_API_BASE_URL}/api/telemetry/* when configured.
// Gracefully skips requests when VITE_API_BASE_URL is blank.
// Never records cursor frames or excessive writes: heartbeats run ~30s or on meaningful state changes.

import { getApiBaseUrl } from './notificationService.js';

export const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const TAB_SESSION_STORAGE_KEY = 'hlw_tab_session_id';

export function getOrCreateTabSessionId() {
  try {
    let existing = sessionStorage.getItem(TAB_SESSION_STORAGE_KEY);
    if (existing) return existing;
    existing = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(TAB_SESSION_STORAGE_KEY, existing);
    return existing;
  } catch {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function deriveLiveActivity(state, isWalking = false, nowMs = Date.now()) {
  if (!state) return { activity: 'idle', label: 'Idle' };

  const visual = state.activeVisualAction;
  if (isWalking || visual?.machineState === 'WALKING') {
    return { activity: 'walking', label: 'Walking between rooms' };
  }
  if (state.cookingItem || visual?.id === 'cook') {
    return { activity: 'cooking', label: 'Cooking' };
  }
  if (visual?.id === 'brush') {
    return { activity: 'brushing', label: 'Brushing teeth' };
  }
  if (visual?.id === 'bathe') {
    return { activity: 'bathing', label: 'Bathing' };
  }
  if (visual?.id === 'garden') {
    return { activity: 'gardening', label: 'Gardening' };
  }
  if (visual?.id === 'feed' || state.currentActivity === 'eating' || state.currentActivity === 'drinking') {
    return { activity: 'eating', label: 'Eating' };
  }
  if (visual?.id === 'study' || state.currentActivity === 'studying') {
    return { activity: 'studying', label: 'Studying' };
  }
  if (visual?.id === 'play' || visual?.id === 'draw' || visual?.id === 'music_dance' || state.currentActivity === 'playing' || state.currentActivity === 'celebrating') {
    return { activity: 'playing', label: 'Playing' };
  }
  if (state.isSleeping || state.currentActivity === 'sleeping' || state.currentActivity === 'resting') {
    return { activity: 'sleeping', label: 'Sleeping' };
  }
  if (state.lastOutfitChangeAt && nowMs - state.lastOutfitChangeAt < 10000) {
    return { activity: 'dressing', label: 'Dressing up' };
  }
  if (state.currentActivity === 'bathing') {
    if (state.lastCareId === 'brush') return { activity: 'brushing', label: 'Brushing teeth' };
    return { activity: 'bathing', label: 'Bathing' };
  }
  if (state.currentActivity === 'talking') {
    return { activity: 'talking', label: 'Talking' };
  }
  return { activity: 'idle', label: 'Idle' };
}

function getDeviceLabel() {
  try {
    const ua = navigator.userAgent || '';
    const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);
    const width = typeof window !== 'undefined' ? window.innerWidth : 0;
    return `${isMobile ? 'Mobile' : 'Desktop'}${width ? ` (${width}px)` : ''}`;
  } catch {
    return 'Web';
  }
}

export async function sendTelemetryHeartbeat({
  user,
  sessionId,
  startedAt,
  elapsedDeltaSec = 0,
  room = 'bedroom',
  activity = 'idle',
  activityLabel = 'Idle',
  state = {},
}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl || !user || !sessionId) {
    return { ok: false, skipped: true };
  }

  try {
    const idToken = await user.getIdToken();
    const res = await fetch(`${baseUrl}/api/telemetry/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        sessionId,
        startedAt,
        elapsedDeltaSec,
        room,
        activity,
        activityLabel,
        guardianLevel: state.guardianLevel ?? 1,
        guardianXP: state.guardianXP ?? 0,
        bondPoints: state.relationship?.bondPoints ?? 0,
        coins: state.coins ?? 0,
        deviceLabel: getDeviceLabel(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, idToken, ...data };
  } catch (err) {
    return { ok: false, error: err?.message ?? 'Network error' };
  }
}

export function sendTelemetrySessionEnd({ idToken, sessionId, elapsedDeltaSec = 0 }) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl || !idToken || !sessionId) return;

  try {
    fetch(`${baseUrl}/api/telemetry/session-end`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        sessionId,
        elapsedDeltaSec,
      }),
    }).catch(() => {});
  } catch {}
}

export async function recordActivityTelemetry({ user, event }) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl || !user || !event) {
    return { ok: false, skipped: true };
  }

  try {
    const idToken = await user.getIdToken();
    const res = await fetch(`${baseUrl}/api/telemetry/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(event),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
