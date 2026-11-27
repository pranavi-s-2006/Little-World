// functions/index.js — Secure Owner Email Notification & Owner Dashboard Backend
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Strictly configured owner notification recipient
const OWNER_NOTIFICATION_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL || 'prans0309@gmail.com';
const ALLOWED_EVENT_TYPES = new Set(['NEW_REGISTRATION', 'SUCCESSFUL_LOGIN']);

// Configure secret in Firebase: firebase functions:secrets:set RESEND_API_KEY
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
}

async function verifyBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const idToken = header.slice(7).trim();
  if (!idToken) return null;
  return admin.auth().verifyIdToken(idToken);
}

async function sendEmailViaResend({ apiKey, subject, html, text }) {
  const fromAddress = process.env.MAIL_FROM || 'HER LITTLE WORLD <onboarding@resend.dev>';
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [OWNER_NOTIFICATION_EMAIL], // Restricted strictly to owner email
      subject,
      html,
      text,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Resend error (${resp.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

exports.notifyOwnerAuthEvent = onRequest(
  { secrets: [RESEND_API_KEY], maxInstances: 10 },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let decoded;
    try {
      decoded = await verifyBearerToken(req);
    } catch {
      return res.status(401).json({ error: 'Invalid Firebase ID token' });
    }
    if (!decoded) return res.status(401).json({ error: 'Missing Authorization token' });

    const { eventType, eventId, provider } = req.body || {};
    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType' });
    }
    if (!eventId || typeof eventId !== 'string' || eventId.length > 128) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }

    const uid = decoded.uid;
    const email = decoded.email || 'unknown';
    const displayName = decoded.name || email.split('@')[0] || 'Little Guardian';
    const authProvider = provider || decoded.firebase?.sign_in_provider || 'unknown';
    const timestampIso = new Date().toISOString();

    // Rate limiting: max 10 auth notifications per user per 10 minutes
    const rateRef = db.collection('rateLimits').doc(uid);
    const nowMs = Date.now();
    const rateSnap = await rateRef.get();
    if (rateSnap.exists) {
      const rData = rateSnap.data();
      if (nowMs - (rData.windowStart || 0) < 10 * 60 * 1000 && (rData.count || 0) >= 10) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
    }

    // Idempotency check: prevent duplicate notifications for the same eventId
    const logRef = db.collection('notificationLogs').doc(eventId);
    const existing = await db.runTransaction(async (tx) => {
      const snap = await tx.get(logRef);
      if (snap.exists) return true;
      tx.set(logRef, {
        eventId,
        uid,
        email,
        displayName,
        provider: authProvider,
        eventType,
        recipient: OWNER_NOTIFICATION_EMAIL,
        status: 'pending',
        createdAt: timestampIso,
      });
      return false;
    });

    if (existing) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Update rate limit window
    await rateRef.set({
      windowStart: rateSnap.exists && nowMs - (rateSnap.data().windowStart || 0) < 10 * 60 * 1000
        ? rateSnap.data().windowStart
        : nowMs,
      count: rateSnap.exists && nowMs - (rateSnap.data().windowStart || 0) < 10 * 60 * 1000
        ? (rateSnap.data().count || 0) + 1
        : 1,
    });

    // Record audit event for /admin dashboard
    await db.collection('authEvents').doc(eventId).set({
      eventId,
      uid,
      email,
      displayName,
      provider: authProvider,
      eventType,
      timestamp: timestampIso,
    });

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

    const apiKey = RESEND_API_KEY.value();
    if (!apiKey) {
      await logRef.update({ status: 'unconfigured', error: 'RESEND_API_KEY secret is not set' });
      return res.status(503).json({ ok: false, error: 'Email provider secret RESEND_API_KEY not configured' });
    }

    try {
      const providerResp = await sendEmailViaResend({ apiKey, subject, html, text });
      await logRef.update({ status: 'sent', providerId: providerResp.id || null, sentAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, sent: true, id: providerResp.id || null });
    } catch (err) {
      await logRef.update({ status: 'failed', error: err.message });
      return res.status(502).json({ ok: false, error: err.message });
    }
  }
);

exports.getOwnerDashboardData = onRequest({ maxInstances: 5 }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');

  let decoded;
  try {
    decoded = await verifyBearerToken(req);
  } catch {
    return res.status(401).json({ error: 'Invalid Firebase ID token' });
  }

  if (!decoded || decoded.email !== OWNER_NOTIFICATION_EMAIL || !decoded.email_verified) {
    return res.status(403).json({ error: 'Forbidden: Owner access only' });
  }

  const usersSnap = await db.collection('users').orderBy('createdAt', 'desc').limit(100).get();
  const eventsSnap = await db.collection('authEvents').orderBy('timestamp', 'desc').limit(50).get();

  const users = usersSnap.docs.map(d => d.data());
  const events = eventsSnap.docs.map(d => d.data());

  return res.status(200).json({
    totalUsers: users.length,
    users,
    recentRegistrations: events.filter(e => e.eventType === 'NEW_REGISTRATION'),
    recentLogins: events.filter(e => e.eventType === 'SUCCESSFUL_LOGIN'),
  });
});
