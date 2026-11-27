import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { Resend } from 'resend';
import { pathToFileURL } from 'node:url';
import {
  HEARTBEAT_TIMEOUT_MS,
  normalizeActivityLabel,
  getDateKey,
  evaluatePresence,
  sanitizeUserSummary,
  buildOverviewPayload,
  buildPlayerProgressPayload,
  toMs,
  resolveDateBounds,
} from './adminAnalytics.js';

export const OWNER_NOTIFICATION_EMAIL = (
  process.env.OWNER_NOTIFICATION_EMAIL || 'prans0309@gmail.com'
).trim();

const ALLOWED_EVENT_TYPES = new Set(['NEW_REGISTRATION', 'SUCCESSFUL_LOGIN']);

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return { ready: true, db: admin.firestore(), auth: admin.auth() };
  }

  let credential = null;
  const rawJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '').trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      credential = admin.credential.cert(parsed);
    } catch (err) {
      console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    }
  } else {
    const projectId = (process.env.FIREBASE_PROJECT_ID ?? '').trim();
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL ?? '').trim();
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n').trim();
    if (projectId && clientEmail && privateKey && !privateKey.includes('YOUR_PRIVATE_KEY')) {
      credential = admin.credential.cert({ projectId, clientEmail, privateKey });
    }
  }

  if (!credential) {
    return { ready: false, db: null, auth: null };
  }

  admin.initializeApp({ credential });
  return { ready: true, db: admin.firestore(), auth: admin.auth() };
}

function buildAllowedOrigins() {
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];
  const envOrigins = [
    process.env.FRONTEND_URL ?? '',
    ...(process.env.ALLOWED_ORIGINS ?? '').split(','),
  ]
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(s => s && !s.includes('your-vercel-app'));

  return new Set([...defaults, ...envOrigins]);
}

export function createApp({
  authClient = null,
  dbClient = null,
  resendClient = null,
  ownerEmail = OWNER_NOTIFICATION_EMAIL,
} = {}) {
  const fb = authClient && dbClient ? { ready: true, auth: authClient, db: dbClient } : initFirebaseAdmin();
  const resendApiKey = (process.env.RESEND_API_KEY ?? '').trim();
  const resend = resendClient ?? (resendApiKey && !resendApiKey.includes('your_resend') ? new Resend(resendApiKey) : null);

  const allowedOrigins = buildAllowedOrigins();
  const memorySeenEvents = new Map();
  const memoryRates = new Map();

  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.use(
    cors({
      origin(origin, callback) {
        // Allow server-to-server / curl requests (no Origin) or explicitly allowed origins
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/+$/, '');
        if (allowedOrigins.has(normalized) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Public root & health check routes (registered before API routes & error handlers)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      ok: true,
      service: 'HER LITTLE WORLD backend',
      firebaseAdminReady: fb.ready,
      resendConfigured: Boolean(resend),
      ownerEmail,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'HER LITTLE WORLD backend',
      healthEndpoint: '/health',
    });
  });

  // Firebase ID token verification middleware
  async function requireFirebaseAuth(req, res, next) {
    if (!fb.ready || !fb.auth) {
      return res.status(503).json({
        error: 'Firebase Admin SDK is not configured on the server.',
      });
    }
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization Bearer token' });
    }
    const idToken = header.slice(7).trim();
    if (!idToken) {
      return res.status(401).json({ error: 'Empty Authorization Bearer token' });
    }
    try {
      req.firebaseUser = await fb.auth.verifyIdToken(idToken);
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
    }
  }

  async function checkAndRecordRateLimit(uid) {
    const nowMs = Date.now();
    const windowMs = 10 * 60 * 1000;
    if (fb.db) {
      const rateRef = fb.db.collection('rateLimits').doc(uid);
      const snap = await rateRef.get();
      const data = snap.exists ? snap.data() : null;
      const withinWindow = data && nowMs - (data.windowStart || 0) < windowMs;
      if (withinWindow && (data.count || 0) >= 12) {
        return false;
      }
      await rateRef.set({
        windowStart: withinWindow ? data.windowStart : nowMs,
        count: withinWindow ? (data.count || 0) + 1 : 1,
      });
      return true;
    }
    const entry = memoryRates.get(uid);
    if (entry && nowMs - entry.windowStart < windowMs && entry.count >= 12) return false;
    memoryRates.set(uid, {
      windowStart: entry && nowMs - entry.windowStart < windowMs ? entry.windowStart : nowMs,
      count: entry && nowMs - entry.windowStart < windowMs ? entry.count + 1 : 1,
    });
    return true;
  }

  async function handleAuthNotification(req, res, forcedEventType = null) {
    const eventType = forcedEventType ?? req.body?.eventType;
    const { eventId, provider } = req.body || {};

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType' });
    }
    if (!eventId || typeof eventId !== 'string' || eventId.length > 160) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }

    const decoded = req.firebaseUser;
    const uid = decoded.uid;
    const email = decoded.email || 'unknown';
    const displayName = decoded.name || email.split('@')[0] || 'Little Guardian';
    const authProvider = provider || decoded.firebase?.sign_in_provider || 'unknown';
    const timestampIso = new Date().toISOString();

    const allowedByRate = await checkAndRecordRateLimit(uid);
    if (!allowedByRate) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Idempotency lock (Firestore transaction if available, else memory)
    let logRef = null;
    if (fb.db) {
      logRef = fb.db.collection('notificationLogs').doc(eventId);
      const alreadyExists = await fb.db.runTransaction(async (tx) => {
        const snap = await tx.get(logRef);
        if (snap.exists) return true;
        tx.set(logRef, {
          eventId,
          uid,
          email,
          displayName,
          provider: authProvider,
          eventType,
          recipient: ownerEmail,
          status: 'pending',
          createdAt: timestampIso,
        });
        return false;
      });
      if (alreadyExists) {
        return res.status(200).json({ ok: true, duplicate: true });
      }

      await fb.db.collection('authEvents').doc(eventId).set({
        eventId,
        uid,
        email,
        displayName,
        provider: authProvider,
        eventType,
        timestamp: timestampIso,
      });
    } else {
      if (memorySeenEvents.has(eventId)) {
        return res.status(200).json({ ok: true, duplicate: true });
      }
      memorySeenEvents.set(eventId, timestampIso);
    }

    const isReg = eventType === 'NEW_REGISTRATION';
    const subject = isReg
      ? 'New user registered on HER LITTLE WORLD 🎀'
      : 'New login on HER LITTLE WORLD 🎀';

    const text = [
      `Event type: ${isReg ? 'NEW REGISTRATION' : 'SUCCESSFUL LOGIN'}`,
      `Display name: ${displayName}`,
      `Email address: ${email}`,
      `Firebase UID: ${uid}`,
      `Authentication provider: ${authProvider}`,
      `${isReg ? 'Registration' : 'Login'} timestamp: ${timestampIso}`,
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;background:#fff5fa;padding:20px;border-radius:14px;border:1px solid #ffd1e3;max-width:520px;">
        <h2 style="color:#7c4dbc;margin-top:0;">${subject}</h2>
        <p><strong>Event type:</strong> ${isReg ? 'NEW REGISTRATION' : 'SUCCESSFUL LOGIN'}</p>
        <p><strong>Display name:</strong> ${displayName}</p>
        <p><strong>Email address:</strong> ${email}</p>
        <p><strong>Firebase UID:</strong> <code>${uid}</code></p>
        <p><strong>Authentication provider:</strong> ${authProvider}</p>
        <p><strong>${isReg ? 'Registration' : 'Login'} timestamp:</strong> ${timestampIso}</p>
      </div>
    `;

    if (!resend) {
      if (logRef) {
        await logRef.update({ status: 'unconfigured', error: 'RESEND_API_KEY not configured' });
      }
      return res.status(503).json({
        ok: false,
        error: 'Email delivery service (RESEND_API_KEY) is not configured yet.',
      });
    }

    try {
      const from = (process.env.MAIL_FROM || 'HER LITTLE WORLD <onboarding@resend.dev>').trim();
      const { data, error } = await resend.emails.send({
        from,
        to: [ownerEmail], // Restricted strictly to configured owner email
        subject,
        html,
        text,
      });

      if (error) {
        if (logRef) await logRef.update({ status: 'failed', error: error.message });
        return res.status(502).json({ ok: false, error: error.message });
      }

      if (logRef) {
        await logRef.update({
          status: 'sent',
          providerId: data?.id ?? null,
          sentAt: new Date().toISOString(),
        });
      }
      return res.status(200).json({ ok: true, sent: true, id: data?.id ?? null });
    } catch (err) {
      if (logRef) await logRef.update({ status: 'failed', error: err.message });
      return res.status(502).json({ ok: false, error: err.message });
    }
  }

  // Authenticated Registration Event endpoint
  app.post('/api/auth/register-event', requireFirebaseAuth, (req, res) =>
    handleAuthNotification(req, res, 'NEW_REGISTRATION')
  );

  // Authenticated Successful Login Event endpoint
  app.post('/api/auth/login-event', requireFirebaseAuth, (req, res) =>
    handleAuthNotification(req, res, 'SUCCESSFUL_LOGIN')
  );

  // Verified Owner Authorization Middleware (server-side independent check)
  function requireVerifiedOwner(req, res, next) {
    const decoded = req.firebaseUser;
    const decodedEmail = (decoded?.email || '').trim().toLowerCase();
    const expectedOwner = (ownerEmail || '').trim().toLowerCase();
    if (!decoded || !expectedOwner || decodedEmail !== expectedOwner || decoded.email_verified !== true) {
      return res.status(403).json({ error: 'Forbidden: Verified owner access only' });
    }
    return next();
  }

  // Safely read collection ordered & bounded across both Admin SDK and tests
  async function readCollectionDocs(colRef, orderField = null, dir = 'desc', maxDocs = 200) {
    if (!colRef) return [];
    let q = colRef;
    if (orderField && typeof colRef.orderBy === 'function') {
      q = colRef.orderBy(orderField, dir);
    }
    if (typeof q.limit === 'function') {
      q = q.limit(maxDocs);
    }
    const snap = await q.get();
    return (snap?.docs ?? []).map(d => d.data());
  }

  async function updateDailyAnalyticsDoc(dateKey, { uid = null, deltaPlaytimeSec = 0, newSession = false, completedActivityLabel = null }) {
    if (!fb.db || !dateKey) return;
    const ref = fb.db.collection('dailyAnalytics').doc(dateKey);
    const snap = await ref.get();
    const prev = snap.exists ? (snap.data() || {}) : {};
    const activeUids = new Set(Array.isArray(prev.activeUids) ? prev.activeUids : []);
    if (uid) activeUids.add(uid);
    const breakdown = { ...(prev.activityBreakdown || {}) };
    if (completedActivityLabel && completedActivityLabel !== 'Idle') {
      breakdown[completedActivityLabel] = Number(breakdown[completedActivityLabel] || 0) + 1;
    }
    await ref.set({
      date: dateKey,
      activeUids: [...activeUids].slice(0, 1000),
      activeUsersCount: activeUids.size,
      sessionsCount: Number(prev.sessionsCount || 0) + (newSession ? 1 : 0),
      totalPlaytimeSec: Number(prev.totalPlaytimeSec || 0) + deltaPlaytimeSec,
      totalActivitiesCompleted: Number(prev.totalActivitiesCompleted || 0) + (completedActivityLabel ? 1 : 0),
      activityBreakdown: breakdown,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  // Unified Auth Notification endpoint
  app.post('/api/auth/notify', requireFirebaseAuth, (req, res) =>
    handleAuthNotification(req, res, null)
  );

  // ── TELEMETRY & PRESENCE ENDPOINTS (UID strictly from verified Firebase ID token) ──

  app.post('/api/telemetry/heartbeat', requireFirebaseAuth, async (req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    const {
      sessionId,
      startedAt,
      elapsedDeltaSec = 0,
      room = 'bedroom',
      activity = 'idle',
      activityLabel,
      guardianLevel = 1,
      guardianXP = 0,
      bondPoints = 0,
      coins = 0,
      deviceLabel = '',
    } = req.body || {};

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 120) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    const decoded = req.firebaseUser;
    const uid = decoded.uid;
    const email = decoded.email || '';
    const displayName = decoded.name || email.split('@')[0] || 'Little Guardian';
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const dateKey = getDateKey(nowMs);
    const clampedDelta = Math.max(0, Math.min(120, Math.round(Number(elapsedDeltaSec) || 0)));
    const safeRoom = String(room || 'bedroom').slice(0, 40);
    const safeActivity = String(activity || 'idle').slice(0, 40);
    const resolvedLabel = activityLabel
      ? String(activityLabel).slice(0, 60)
      : normalizeActivityLabel(safeActivity);

    try {
      const userRef = fb.db.collection('users').doc(uid);
      const presenceRef = fb.db.collection('playerPresence').doc(uid);
      const sessionRef = userRef.collection('sessions').doc(sessionId);
      const adminSessionRef = fb.db.collection('adminSessions').doc(`${uid}_${sessionId}`);

      const [userSnap, presenceSnap, sessionSnap] = await Promise.all([
        userRef.get(),
        presenceRef.get(),
        sessionRef.get(),
      ]);

      const userPrev = userSnap.exists ? (userSnap.data() || {}) : {};
      const sessPrev = sessionSnap.exists ? (sessionSnap.data() || {}) : {};
      const isNewSession = !sessionSnap.exists;
      const safeStartIso = sessPrev.startedAt || (startedAt && toMs(startedAt) ? new Date(toMs(startedAt)).toISOString() : nowIso);
      const nextDurationSec = Math.max(
        Number(sessPrev.durationSec || 0) + clampedDelta,
        Math.max(0, Math.round((nowMs - toMs(safeStartIso)) / 1000))
      );

      // Update activeTabs map & prune expired tabs (> 90s)
      const prevTabs = presenceSnap.exists && presenceSnap.data()?.activeTabs
        ? { ...presenceSnap.data().activeTabs }
        : {};
      for (const [tid, tab] of Object.entries(prevTabs)) {
        if (!tab || tab.endedAt || (nowMs - toMs(tab.lastHeartbeatAt)) > HEARTBEAT_TIMEOUT_MS) {
          delete prevTabs[tid];
        }
      }
      prevTabs[sessionId] = {
        sessionId,
        room: safeRoom,
        activity: safeActivity,
        activityLabel: resolvedLabel,
        startedAt: safeStartIso,
        lastHeartbeatAt: nowIso,
        deviceLabel: String(deviceLabel || '').slice(0, 80),
      };

      const presenceDoc = {
        uid,
        playerName: userPrev.displayName || displayName,
        playerEmail: userPrev.email || email,
        online: true,
        currentRoom: safeRoom,
        currentActivity: safeActivity,
        currentActivityLabel: resolvedLabel,
        guardianLevel: Math.max(1, Number(guardianLevel || userPrev.guardianLevel || 1)),
        guardianXP: Math.max(0, Number(guardianXP ?? userPrev.guardianXP ?? 0)),
        bondPoints: Math.max(0, Number(bondPoints ?? userPrev.bondPoints ?? 0)),
        lastActiveAt: nowIso,
        lastHeartbeatAt: nowIso,
        activeSessionId: sessionId,
        activeTabs: prevTabs,
        activeTabsCount: Object.keys(prevTabs).length,
        updatedAt: nowIso,
      };

      const sessionDoc = {
        sessionId,
        uid,
        playerName: userPrev.displayName || displayName,
        playerEmail: userPrev.email || email,
        startedAt: safeStartIso,
        lastHeartbeatAt: nowIso,
        endedAt: null,
        durationSec: nextDurationSec,
        isActive: true,
        room: safeRoom,
        lastActivity: resolvedLabel,
        deviceLabel: String(deviceLabel || '').slice(0, 80),
      };

      // Strictly preserve existing user role/isOwner while keeping game progress summary fresh
      const userPatch = {
        uid,
        displayName: userPrev.displayName || displayName,
        email: userPrev.email || email,
        role: userPrev.role || 'user',
        isOwner: Boolean(userPrev.isOwner),
        createdAt: userPrev.createdAt || nowIso,
        lastActiveAt: nowIso,
        currentRoom: safeRoom,
        currentActivity: resolvedLabel,
        guardianLevel: Math.max(1, Number(guardianLevel || userPrev.guardianLevel || 1)),
        guardianXP: Math.max(0, Number(guardianXP ?? userPrev.guardianXP ?? 0)),
        bondPoints: Math.max(0, Number(bondPoints ?? userPrev.bondPoints ?? 0)),
        coins: Math.max(0, Number(coins ?? userPrev.coins ?? 0)),
        totalPlaytimeSec: Number(userPrev.totalPlaytimeSec || 0) + clampedDelta,
        totalSessions: Number(userPrev.totalSessions || 0) + (isNewSession ? 1 : 0),
        totalActivitiesCompleted: Number(userPrev.totalActivitiesCompleted || 0),
      };

      await Promise.all([
        userRef.set(userPatch, { merge: true }),
        presenceRef.set(presenceDoc),
        sessionRef.set(sessionDoc, { merge: true }),
        adminSessionRef.set(sessionDoc, { merge: true }),
        updateDailyAnalyticsDoc(dateKey, { uid, deltaPlaytimeSec: clampedDelta, newSession: isNewSession }),
      ]);

      return res.status(200).json({
        ok: true,
        sessionId,
        isNewSession,
        activeTabsCount: presenceDoc.activeTabsCount,
        online: true,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to record heartbeat' });
    }
  });

  app.post('/api/telemetry/session-end', requireFirebaseAuth, async (req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    const { sessionId, elapsedDeltaSec = 0 } = req.body || {};
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 120) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    const uid = req.firebaseUser.uid;
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const clampedDelta = Math.max(0, Math.min(120, Math.round(Number(elapsedDeltaSec) || 0)));

    try {
      const userRef = fb.db.collection('users').doc(uid);
      const presenceRef = fb.db.collection('playerPresence').doc(uid);
      const sessionRef = userRef.collection('sessions').doc(sessionId);
      const adminSessionRef = fb.db.collection('adminSessions').doc(`${uid}_${sessionId}`);

      const [userSnap, presenceSnap, sessionSnap] = await Promise.all([
        userRef.get(),
        presenceRef.get(),
        sessionRef.get(),
      ]);

      const userPrev = userSnap.exists ? (userSnap.data() || {}) : {};
      const sessPrev = sessionSnap.exists ? (sessionSnap.data() || {}) : {};
      const nextDuration = Math.max(
        Number(sessPrev.durationSec || 0) + clampedDelta,
        sessPrev.startedAt ? Math.max(0, Math.round((nowMs - toMs(sessPrev.startedAt)) / 1000)) : 0
      );

      const tabs = presenceSnap.exists && presenceSnap.data()?.activeTabs
        ? { ...presenceSnap.data().activeTabs }
        : {};
      delete tabs[sessionId];
      for (const [tid, tab] of Object.entries(tabs)) {
        if (!tab || tab.endedAt || (nowMs - toMs(tab.lastHeartbeatAt)) > HEARTBEAT_TIMEOUT_MS) {
          delete tabs[tid];
        }
      }
      const remainingTabs = Object.values(tabs).sort((a, b) => toMs(b.lastHeartbeatAt) - toMs(a.lastHeartbeatAt));
      const stillOnline = remainingTabs.length > 0;

      const ops = [
        presenceRef.set({
          uid,
          online: stillOnline,
          activeTabs: tabs,
          activeTabsCount: remainingTabs.length,
          currentRoom: stillOnline ? remainingTabs[0].room : (presenceSnap.data()?.currentRoom || 'bedroom'),
          currentActivity: stillOnline ? remainingTabs[0].activity : 'idle',
          currentActivityLabel: stillOnline ? remainingTabs[0].activityLabel : 'Offline',
          lastActiveAt: nowIso,
          updatedAt: nowIso,
        }, { merge: true }),
        sessionRef.set({
          sessionId,
          uid,
          startedAt: sessPrev.startedAt || nowIso,
          lastHeartbeatAt: nowIso,
          endedAt: nowIso,
          durationSec: nextDuration,
          isActive: false,
        }, { merge: true }),
        adminSessionRef.set({
          sessionId,
          uid,
          startedAt: sessPrev.startedAt || nowIso,
          lastHeartbeatAt: nowIso,
          endedAt: nowIso,
          durationSec: nextDuration,
          isActive: false,
        }, { merge: true }),
      ];

      if (clampedDelta > 0) {
        ops.push(userRef.set({
          lastActiveAt: nowIso,
          totalPlaytimeSec: Number(userPrev.totalPlaytimeSec || 0) + clampedDelta,
        }, { merge: true }));
        ops.push(updateDailyAnalyticsDoc(getDateKey(nowMs), { uid, deltaPlaytimeSec: clampedDelta }));
      }

      await Promise.all(ops);
      return res.status(200).json({ ok: true, online: stillOnline, activeTabsCount: remainingTabs.length });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to close session' });
    }
  });

  app.post('/api/telemetry/activity', requireFirebaseAuth, async (req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    const {
      eventId,
      activityType,
      activityLabel,
      room = 'bedroom',
      startAt,
      endAt,
      durationSec = 0,
      status = 'completed',
      levelAfter,
      xpGain = 0,
      bondGain = 0,
      coinsDelta = 0,
      milestones = [],
    } = req.body || {};

    if (!activityType || typeof activityType !== 'string') {
      return res.status(400).json({ error: 'Missing activityType' });
    }
    const safeStatus = ['started', 'completed', 'cancelled'].includes(status) ? status : 'completed';

    const decoded = req.firebaseUser;
    const uid = decoded.uid;
    const email = decoded.email || '';
    const displayName = decoded.name || email.split('@')[0] || 'Little Guardian';
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const resolvedId = (eventId && typeof eventId === 'string' && eventId.length <= 140)
      ? eventId
      : `${uid}_${nowMs}_${Math.random().toString(36).slice(2, 8)}`;

    const normalizedType = normalizeActivityLabel(activityType, activityLabel);
    const eventDoc = {
      eventId: resolvedId,
      uid,
      playerName: displayName,
      playerEmail: email,
      activityType: String(activityType).slice(0, 48),
      activityCategory: normalizedType,
      activityLabel: String(activityLabel || normalizedType).slice(0, 100),
      room: String(room || 'bedroom').slice(0, 40),
      startAt: startAt || nowIso,
      endAt: endAt || (safeStatus === 'started' ? null : nowIso),
      durationSec: Math.max(0, Math.min(7200, Math.round(Number(durationSec) || 0))),
      status: safeStatus,
      levelAfter: levelAfter != null ? Number(levelAfter) : null,
      xpGain: Number(xpGain || 0),
      bondGain: Number(bondGain || 0),
      coinsDelta: Number(coinsDelta || 0),
      timestamp: nowIso,
    };

    try {
      const userRef = fb.db.collection('users').doc(uid);
      const userSnap = await userRef.get();
      const userPrev = userSnap.exists ? (userSnap.data() || {}) : {};

      const ops = [
        userRef.collection('activityEvents').doc(resolvedId).set(eventDoc, { merge: true }),
        fb.db.collection('adminActivityFeed').doc(resolvedId).set({
          ...eventDoc,
          playerName: userPrev.displayName || displayName,
          playerEmail: userPrev.email || email,
        }, { merge: true }),
      ];

      if (safeStatus === 'completed') {
        ops.push(userRef.set({
          uid,
          displayName: userPrev.displayName || displayName,
          email: userPrev.email || email,
          lastActiveAt: nowIso,
          totalActivitiesCompleted: Number(userPrev.totalActivitiesCompleted || 0) + 1,
          ...(levelAfter != null ? { guardianLevel: Number(levelAfter) } : {}),
        }, { merge: true }));
        ops.push(updateDailyAnalyticsDoc(getDateKey(nowMs), {
          uid,
          completedActivityLabel: normalizedType,
        }));
      }

      if (Array.isArray(milestones)) {
        for (const m of milestones.slice(0, 8)) {
          if (!m || !m.title) continue;
          const mid = String(m.entryId || `${uid}_${m.kind || 'milestone'}_${nowMs}_${Math.random().toString(36).slice(2, 6)}`).slice(0, 140);
          ops.push(
            userRef.collection('progressHistory').doc(mid).set({
              entryId: mid,
              uid,
              kind: String(m.kind || 'activity_completed').slice(0, 40),
              title: String(m.title).slice(0, 120),
              detail: String(m.detail || '').slice(0, 200),
              level: Number(m.level ?? levelAfter ?? userPrev.guardianLevel ?? 1),
              xp: Number(m.xp ?? userPrev.guardianXP ?? 0),
              timestamp: m.timestamp || nowIso,
            }, { merge: true })
          );
        }
      }

      await Promise.all(ops);
      return res.status(200).json({ ok: true, eventId: resolvedId });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to record activity telemetry' });
    }
  });

  // ── OWNER-ONLY ADMIN APIS (prans0309@gmail.com verified server-side) ──

  app.get('/api/admin/overview', requireFirebaseAuth, requireVerifiedOwner, async (req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }

    const rangeParam = String(req.query.range || '7d').toLowerCase();
    const range = ['today', '7d', '30d', 'all'].includes(rangeParam) ? rangeParam : '7d';

    try {
      const [users, presences, authEvents, sessions, activities, dailyDocs] = await Promise.all([
        readCollectionDocs(fb.db.collection('users'), 'createdAt', 'desc', 200),
        readCollectionDocs(fb.db.collection('playerPresence'), 'lastActiveAt', 'desc', 200),
        readCollectionDocs(fb.db.collection('authEvents'), 'timestamp', 'desc', 100),
        readCollectionDocs(fb.db.collection('adminSessions'), 'lastHeartbeatAt', 'desc', 250),
        readCollectionDocs(fb.db.collection('adminActivityFeed'), 'startAt', 'desc', 250),
        readCollectionDocs(fb.db.collection('dailyAnalytics'), 'date', 'desc', 60),
      ]);

      // Fetch legacy gameStates safely only for bounded user set (helps backward compat for pre-telemetry users)
      const gameStatesByUid = {};
      await Promise.all(
        users.slice(0, 50).map(async u => {
          if (!u?.uid) return;
          try {
            const gsSnap = await fb.db.collection('users').doc(u.uid).collection('gameState').doc('current').get();
            if (gsSnap.exists) gameStatesByUid[u.uid] = gsSnap.data();
          } catch {}
        })
      );

      const payload = buildOverviewPayload({
        users,
        presences,
        authEvents,
        sessions,
        activities,
        dailyDocs,
        gameStatesByUid,
        range,
      });

      return res.status(200).json(payload);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to load owner analytics' });
    }
  });

  app.get('/api/admin/live', requireFirebaseAuth, requireVerifiedOwner, async (_req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    try {
      const nowMs = Date.now();
      const [users, presences] = await Promise.all([
        readCollectionDocs(fb.db.collection('users'), 'lastActiveAt', 'desc', 200),
        readCollectionDocs(fb.db.collection('playerPresence'), 'lastActiveAt', 'desc', 200),
      ]);
      const userMap = new Map(users.map(u => [u.uid, u]));
      const seenUids = new Set();
      const players = [];

      for (const p of presences) {
        if (!p?.uid) continue;
        seenUids.add(p.uid);
        const userDoc = userMap.get(p.uid) || { uid: p.uid, displayName: p.playerName, email: p.playerEmail };
        const summary = sanitizeUserSummary(userDoc, p, null, nowMs);
        const evalP = evaluatePresence(p, nowMs);
        players.push({
          ...summary,
          activeTabs: evalP.activeTabs.map(t => ({
            sessionId: t.sessionId,
            room: t.room,
            activityLabel: t.activityLabel,
            startedAt: t.startedAt,
            lastHeartbeatAt: t.lastHeartbeatAt,
            deviceLabel: t.deviceLabel || '',
          })),
        });
      }

      for (const u of users) {
        if (!u?.uid || seenUids.has(u.uid)) continue;
        players.push({ ...sanitizeUserSummary(u, null, null, nowMs), activeTabs: [] });
      }

      players.sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return toMs(b.lastActiveAt) - toMs(a.lastActiveAt);
      });

      return res.status(200).json({
        generatedAt: new Date(nowMs).toISOString(),
        heartbeatTimeoutSec: Math.round(HEARTBEAT_TIMEOUT_MS / 1000),
        onlineCount: players.filter(p => p.online).length,
        totalPlayers: players.length,
        players,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to fetch live player status' });
    }
  });

  app.get('/api/admin/users', requireFirebaseAuth, requireVerifiedOwner, async (req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    try {
      const nowMs = Date.now();
      const search = String(req.query.search || '').trim().toLowerCase();
      const statusFilter = String(req.query.status || 'all').toLowerCase();
      const regRange = String(req.query.dateRange || 'all').toLowerCase();
      const sortBy = String(req.query.sortBy || 'lastActive').toLowerCase();
      const sortDir = String(req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));

      const [users, presences] = await Promise.all([
        readCollectionDocs(fb.db.collection('users'), 'createdAt', 'desc', 300),
        readCollectionDocs(fb.db.collection('playerPresence'), 'lastActiveAt', 'desc', 300),
      ]);
      const pMap = new Map(presences.map(p => [p.uid, p]));
      let list = users.map(u => sanitizeUserSummary(u, pMap.get(u.uid), null, nowMs));

      if (search) {
        list = list.filter(u =>
          (u.displayName || '').toLowerCase().includes(search) ||
          (u.email || '').toLowerCase().includes(search)
        );
      }
      if (statusFilter === 'online') {
        list = list.filter(u => u.online);
      } else if (statusFilter === 'offline') {
        list = list.filter(u => !u.online);
      }
      if (['today', '7d', '30d'].includes(regRange)) {
        const bounds = resolveDateBounds(regRange, nowMs);
        list = list.filter(u => toMs(u.createdAt) >= bounds.startMs);
      }

      const dirMult = sortDir === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        if (sortBy === 'level') return (a.guardianLevel - b.guardianLevel) * dirMult;
        if (sortBy === 'xp') return (a.guardianXP - b.guardianXP) * dirMult;
        if (sortBy === 'createdat' || sortBy === 'created_at') {
          return (toMs(a.createdAt) - toMs(b.createdAt)) * dirMult;
        }
        return (toMs(a.lastActiveAt) - toMs(b.lastActiveAt)) * dirMult;
      });

      const total = list.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = Math.min(page, totalPages);
      const offset = (safePage - 1) * limit;

      return res.status(200).json({
        page: safePage,
        limit,
        total,
        totalPages,
        users: list.slice(offset, offset + limit),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to load user directory' });
    }
  });

  app.get('/api/admin/users/:uid', requireFirebaseAuth, requireVerifiedOwner, async (req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    const targetUid = String(req.params.uid || '').trim();
    if (!targetUid || targetUid.length > 128) {
      return res.status(400).json({ error: 'Invalid player UID' });
    }

    try {
      const userRef = fb.db.collection('users').doc(targetUid);
      const [userSnap, gsSnap, presenceSnap, sessions, activityEvents, progressHistory] = await Promise.all([
        userRef.get(),
        userRef.collection('gameState').doc('current').get(),
        fb.db.collection('playerPresence').doc(targetUid).get(),
        readCollectionDocs(userRef.collection('sessions'), 'lastHeartbeatAt', 'desc', 40),
        readCollectionDocs(userRef.collection('activityEvents'), 'startAt', 'desc', 80),
        readCollectionDocs(userRef.collection('progressHistory'), 'timestamp', 'desc', 80),
      ]);

      if (!userSnap.exists && !gsSnap.exists && !presenceSnap.exists) {
        return res.status(404).json({ error: 'Player record not found' });
      }

      const payload = buildPlayerProgressPayload({
        userDoc: userSnap.exists ? { uid: targetUid, ...userSnap.data() } : { uid: targetUid },
        gameStateDoc: gsSnap.exists ? gsSnap.data() : null,
        presenceDoc: presenceSnap.exists ? presenceSnap.data() : null,
        sessions,
        activityEvents,
        progressHistory,
      });

      return res.status(200).json(payload);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to inspect player progress' });
    }
  });

  app.get('/api/admin/activities', requireFirebaseAuth, requireVerifiedOwner, async (req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    try {
      const nowMs = Date.now();
      const uidFilter = String(req.query.uid || '').trim();
      const typeFilter = String(req.query.type || 'all').trim().toLowerCase();
      const statusFilter = String(req.query.status || 'all').trim().toLowerCase();
      const range = String(req.query.dateRange || 'all').trim().toLowerCase();
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 25));

      let items = uidFilter
        ? await readCollectionDocs(fb.db.collection('users').doc(uidFilter).collection('activityEvents'), 'startAt', 'desc', 200)
        : await readCollectionDocs(fb.db.collection('adminActivityFeed'), 'startAt', 'desc', 300);

      if (typeFilter !== 'all') {
        items = items.filter(a => {
          const cat = normalizeActivityLabel(a.activityType, a.activityLabel).toLowerCase();
          return cat === typeFilter || String(a.activityType || '').toLowerCase() === typeFilter;
        });
      }
      if (statusFilter !== 'all') {
        items = items.filter(a => String(a.status || 'completed').toLowerCase() === statusFilter);
      }
      if (['today', '7d', '30d'].includes(range)) {
        const bounds = resolveDateBounds(range, nowMs);
        items = items.filter(a => toMs(a.startAt || a.timestamp) >= bounds.startMs);
      }

      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = Math.min(page, totalPages);
      const offset = (safePage - 1) * limit;

      return res.status(200).json({
        page: safePage,
        limit,
        total,
        totalPages,
        activities: items.slice(offset, offset + limit),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to load activity history' });
    }
  });

  app.get('/api/admin/analytics', requireFirebaseAuth, requireVerifiedOwner, async (req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    const rangeParam = String(req.query.range || '30d').toLowerCase();
    const range = ['today', '7d', '30d', 'all'].includes(rangeParam) ? rangeParam : '30d';

    try {
      const [users, presences, authEvents, sessions, activities, dailyDocs, notificationLogs] = await Promise.all([
        readCollectionDocs(fb.db.collection('users'), 'createdAt', 'desc', 200),
        readCollectionDocs(fb.db.collection('playerPresence'), 'lastActiveAt', 'desc', 200),
        readCollectionDocs(fb.db.collection('authEvents'), 'timestamp', 'desc', 100),
        readCollectionDocs(fb.db.collection('adminSessions'), 'lastHeartbeatAt', 'desc', 250),
        readCollectionDocs(fb.db.collection('adminActivityFeed'), 'startAt', 'desc', 250),
        readCollectionDocs(fb.db.collection('dailyAnalytics'), 'date', 'desc', 60),
        readCollectionDocs(fb.db.collection('notificationLogs'), 'createdAt', 'desc', 50),
      ]);

      const overview = buildOverviewPayload({
        users, presences, authEvents, sessions, activities, dailyDocs, range,
      });

      const providerCounts = {};
      for (const u of users) {
        const p = u.provider || 'email';
        providerCounts[p] = (providerCounts[p] || 0) + 1;
      }

      const roomCounts = {};
      for (const act of activities) {
        const r = act.room || 'bedroom';
        roomCounts[r] = (roomCounts[r] || 0) + 1;
      }

      return res.status(200).json({
        ...overview,
        providers: Object.entries(providerCounts).map(([provider, count]) => ({ provider, count })),
        topRooms: Object.entries(roomCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([room, count]) => ({ room, count })),
        notificationLogs: notificationLogs.slice(0, 25).map(l => ({
          eventId: l.eventId,
          email: l.email,
          eventType: l.eventType,
          provider: l.provider,
          status: l.status,
          createdAt: l.createdAt,
          sentAt: l.sentAt || null,
        })),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to load analytics' });
    }
  });

  app.post('/api/admin/presence/cleanup', requireFirebaseAuth, requireVerifiedOwner, async (_req, res) => {
    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }
    try {
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const presences = await readCollectionDocs(fb.db.collection('playerPresence'), 'lastActiveAt', 'desc', 200);
      let cleaned = 0;
      for (const p of presences) {
        if (!p?.uid) continue;
        const evalP = evaluatePresence(p, nowMs);
        if (p.online && !evalP.online) {
          cleaned += 1;
          await fb.db.collection('playerPresence').doc(p.uid).set({
            online: false,
            activeTabs: {},
            activeTabsCount: 0,
            currentActivity: 'idle',
            currentActivityLabel: 'Offline',
            updatedAt: nowIso,
          }, { merge: true });
        }
      }
      return res.status(200).json({ ok: true, cleaned });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to clean expired sessions' });
    }
  });

  // Clean error handler (including CORS rejection)
  app.use((err, _req, res, _next) => {
    if (err?.message?.includes('CORS')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  });

  return app;
}

// Start server when executed directly via `node server.js` / `npm start`
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const PORT = Number(process.env.PORT) || 5000;
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`HER LITTLE WORLD backend listening on port ${PORT}`);
  });
}
