import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, OWNER_NOTIFICATION_EMAIL } from './server.js';

function createMockDb() {
  const collections = new Map();
  const getCol = (name) => {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name);
  };
  return {
    collection: (name) => ({
      doc: (id) => ({
        async get() {
          const val = getCol(name).get(id);
          return { exists: Boolean(val), data: () => val };
        },
        async set(data) {
          getCol(name).set(id, data);
        },
        async update(patch) {
          const prev = getCol(name).get(id) ?? {};
          getCol(name).set(id, { ...prev, ...patch });
        },
      }),
      orderBy: () => ({
        limit: () => ({
          async get() {
            const docs = [...getCol(name).values()].map(d => ({ data: () => d }));
            return { docs };
          },
        }),
      }),
    }),
    async runTransaction(fn) {
      const tx = {
        async get(ref) { return ref.get(); },
        set(ref, data) { ref.set(data); },
      };
      return fn(tx);
    },
  };
}

async function withServer(app, fn) {
  const srv = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const { port } = srv.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise(resolve => srv.close(resolve));
  }
}

test('GET /health and GET / return status ok JSON cleanly', async () => {
  const app = createApp();
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.ok, true);
    assert.equal(body.service, 'HER LITTLE WORLD backend');
    assert.equal(body.ownerEmail, 'prans0309@gmail.com');

    const rootRes = await fetch(`${base}/`);
    assert.equal(rootRes.status, 200);
    const rootBody = await rootRes.json();
    assert.equal(rootBody.status, 'ok');
    assert.equal(rootBody.service, 'HER LITTLE WORLD backend');
  });
});

test('Protected endpoints reject missing tokens with 401 when Firebase Admin is ready', async () => {
  const mockAuth = { verifyIdToken: async () => ({ uid: 'u1', email: 'player@example.com', email_verified: true }) };
  const app = createApp({ authClient: mockAuth, dbClient: createMockDb() });
  await withServer(app, async (base) => {
    const res = await fetch(`${base}/api/auth/login-event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(res.status, 401);
  });
});

test('POST /api/auth/register-event and /api/auth/login-event verify token, enforce idempotency, and send via Resend', async () => {
  const sentEmails = [];
  const mockAuth = {
    verifyIdToken: async (tok) => {
      assert.equal(tok, 'valid-token');
      return { uid: 'uid_abc', email: 'player@example.com', name: 'Pranavi', firebase: { sign_in_provider: 'google.com' } };
    },
  };
  const mockResend = {
    emails: {
      send: async (payload) => {
        sentEmails.push(payload);
        return { data: { id: `email_${sentEmails.length}` }, error: null };
      },
    },
  };
  const app = createApp({ authClient: mockAuth, dbClient: createMockDb(), resendClient: mockResend });

  await withServer(app, async (base) => {
    const r1 = await fetch(`${base}/api/auth/register-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ eventId: 'evt_reg_1', provider: 'google.com' }),
    });
    assert.equal(r1.status, 200);
    const b1 = await r1.json();
    assert.equal(b1.sent, true);

    // Duplicate eventId should be deduplicated
    const rDup = await fetch(`${base}/api/auth/register-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ eventId: 'evt_reg_1', provider: 'google.com' }),
    });
    assert.equal(rDup.status, 200);
    const bDup = await rDup.json();
    assert.equal(bDup.duplicate, true);
    assert.equal(sentEmails.length, 1);

    const rLogin = await fetch(`${base}/api/auth/login-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ eventId: 'evt_log_1', provider: 'google.com' }),
    });
    assert.equal(rLogin.status, 200);
    assert.equal(sentEmails.length, 2);
    assert.deepEqual(sentEmails[0].to, [OWNER_NOTIFICATION_EMAIL]);
    assert.match(sentEmails[0].subject, /New user registered/);
    assert.match(sentEmails[1].subject, /New login/);
  });
});

test('GET /api/admin/overview blocks non-owner with 403 and allows verified owner prans0309@gmail.com', async () => {
  const mockAuth = {
    verifyIdToken: async (tok) => {
      if (tok === 'owner-token') return { uid: 'owner1', email: 'prans0309@gmail.com', email_verified: true };
      return { uid: 'user2', email: 'other@example.com', email_verified: true };
    },
  };
  const app = createApp({ authClient: mockAuth, dbClient: createMockDb() });

  await withServer(app, async (base) => {
    const rUser = await fetch(`${base}/api/admin/overview`, { headers: { Authorization: 'Bearer user-token' } });
    assert.equal(rUser.status, 403);

    const rOwner = await fetch(`${base}/api/admin/overview`, { headers: { Authorization: 'Bearer owner-token' } });
    assert.equal(rOwner.status, 200);
    const body = await rOwner.json();
    assert.equal(typeof body.totalUsers, 'number');
  });
});
