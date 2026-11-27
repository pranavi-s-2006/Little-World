import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { Resend } from 'resend';
import { pathToFileURL } from 'node:url';

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

  // Public health check for Render
  app.get('/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'her-little-world-backend',
      firebaseAdminReady: fb.ready,
      resendConfigured: Boolean(resend),
      ownerEmail,
      timestamp: new Date().toISOString(),
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

  // Unified Auth Notification endpoint
  app.post('/api/auth/notify', requireFirebaseAuth, (req, res) =>
    handleAuthNotification(req, res, null)
  );

  // Owner-only Admin API for prans0309@gmail.com
  app.get('/api/admin/overview', requireFirebaseAuth, async (req, res) => {
    const decoded = req.firebaseUser;
    if (!decoded || decoded.email !== ownerEmail || !decoded.email_verified) {
      return res.status(403).json({ error: 'Forbidden: Verified owner access only' });
    }

    if (!fb.db) {
      return res.status(503).json({ error: 'Firestore Admin SDK is not connected.' });
    }

    try {
      const [usersSnap, eventsSnap] = await Promise.all([
        fb.db.collection('users').orderBy('createdAt', 'desc').limit(100).get(),
        fb.db.collection('authEvents').orderBy('timestamp', 'desc').limit(50).get(),
      ]);

      const users = usersSnap.docs.map(d => d.data());
      const events = eventsSnap.docs.map(d => d.data());

      return res.status(200).json({
        totalUsers: users.length,
        users,
        recentRegistrations: events.filter(e => e.eventType === 'NEW_REGISTRATION'),
        recentLogins: events.filter(e => e.eventType === 'SUCCESSFUL_LOGIN'),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to load owner analytics' });
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
