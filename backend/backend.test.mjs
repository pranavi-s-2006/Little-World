import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, OWNER_NOTIFICATION_EMAIL } from './server.js';

function createMockDb() {
  const store = new Map();
  const getMap = (path) => {
    if (!store.has(path)) store.set(path, new Map());
    return store.get(path);
  };

  function makeCollection(colPath) {
    return {
      doc: (id) => {
        const docPath = `${colPath}/${id}`;
        return {
          async get() {
            const val = getMap(colPath).get(id);
            return { exists: val !== undefined, id, data: () => (val ? structuredClone(val) : undefined) };
          },
          async set(data, opts) {
            if (opts?.merge) {
              const prev = getMap(colPath).get(id) ?? {};
              getMap(colPath).set(id, { ...prev, ...structuredClone(data) });
            } else {
              getMap(colPath).set(id, structuredClone(data));
            }
          },
          async update(patch) {
            const prev = getMap(colPath).get(id) ?? {};
            getMap(colPath).set(id, { ...prev, ...structuredClone(patch) });
          },
          collection: (subName) => makeCollection(`${docPath}/${subName}`),
        };
      },
      orderBy(field, dir = 'desc') {
        const makeSorted = (lim = Infinity) => ({
          limit(n) {
            return makeSorted(n);
          },
          async get() {
            const all = [...getMap(colPath).values()].map(d => structuredClone(d));
            all.sort((a, b) => {
              const av = a?.[field] ?? '';
              const bv = b?.[field] ?? '';
              if (av === bv) return 0;
              return dir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
            });
            return { docs: all.slice(0, lim).map(d => ({ data: () => d })) };
          },
        });
        return makeSorted();
      },
      limit(n) {
        return {
          async get() {
            const docs = [...getMap(colPath).values()].slice(0, n).map(d => ({ data: () => structuredClone(d) }));
            return { docs };
          },
        };
      },
      async get() {
        const docs = [...getMap(colPath).values()].map(d => ({ data: () => structuredClone(d) }));
        return { docs };
      },
    };
  }

  return {
    _store: store,
    collection: (name) => makeCollection(name),
    async runTransaction(fn) {
      const tx = {
        async get(ref) { return ref.get(); },
        set(ref, data, opts) { ref.set(data, opts); },
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

test('Protected notification and admin endpoints reject missing tokens with HTTP 401', async () => {
  const mockAuth = { verifyIdToken: async () => ({ uid: 'u1', email: 'player@example.com', email_verified: true }) };
  const app = createApp({ authClient: mockAuth, dbClient: createMockDb() });
  await withServer(app, async (base) => {
    for (const [method, url] of [
      ['POST', '/api/auth/login-event'],
      ['POST', '/api/telemetry/heartbeat'],
      ['GET', '/api/admin/overview'],
      ['GET', '/api/admin/live'],
      ['GET', '/api/admin/users'],
      ['GET', '/api/admin/users/u1'],
      ['GET', '/api/admin/activities'],
      ['GET', '/api/admin/analytics'],
    ]) {
      const res = await fetch(`${base}${url}`, { method });
      assert.equal(res.status, 401, `Expected 401 for unauthenticated ${method} ${url}`);
    }
  });
});

test('All admin endpoints block non-owners AND unverified owner emails with HTTP 403', async () => {
  const mockAuth = {
    verifyIdToken: async (tok) => {
      if (tok === 'owner-verified') return { uid: 'owner1', email: 'prans0309@gmail.com', email_verified: true };
      if (tok === 'owner-unverified') return { uid: 'owner2', email: 'prans0309@gmail.com', email_verified: false };
      return { uid: 'player1', email: 'player@example.com', email_verified: true };
    },
  };
  const db = createMockDb();
  const app = createApp({ authClient: mockAuth, dbClient: db });

  await withServer(app, async (base) => {
    for (const url of [
      '/api/admin/overview',
      '/api/admin/live',
      '/api/admin/users',
      '/api/admin/activities',
      '/api/admin/analytics',
    ]) {
      const rPlayer = await fetch(`${base}${url}`, { headers: { Authorization: 'Bearer player-tok' } });
      assert.equal(rPlayer.status, 403, `Non-owner must receive 403 on ${url}`);

      const rUnverified = await fetch(`${base}${url}`, { headers: { Authorization: 'Bearer owner-unverified' } });
      assert.equal(rUnverified.status, 403, `Unverified owner must receive 403 on ${url}`);

      const rOwner = await fetch(`${base}${url}`, { headers: { Authorization: 'Bearer owner-verified' } });
      assert.equal(rOwner.status, 200, `Verified owner must receive 200 on ${url}`);
    }
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
    assert.equal((await r1.json()).sent, true);

    const rDup = await fetch(`${base}/api/auth/register-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ eventId: 'evt_reg_1', provider: 'google.com' }),
    });
    assert.equal((await rDup.json()).duplicate, true);
    assert.equal(sentEmails.length, 1);

    const rLogin = await fetch(`${base}/api/auth/login-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ eventId: 'evt_log_1', provider: 'google.com' }),
    });
    assert.equal(rLogin.status, 200);
    assert.equal(sentEmails.length, 2);
    assert.deepEqual(sentEmails[0].to, [OWNER_NOTIFICATION_EMAIL]);
  });
});

test('Telemetry enforces UID isolation across two players, tracks multi-tab presence, expires >90s heartbeats, and populates admin analytics', async () => {
  const db = createMockDb();
  const mockAuth = {
    verifyIdToken: async (tok) => {
      if (tok === 'owner-tok') return { uid: 'owner1', email: 'prans0309@gmail.com', email_verified: true };
      if (tok === 'alice-tok') return { uid: 'uid_alice', email: 'alice@example.com', name: 'Alice', email_verified: true };
      if (tok === 'bob-tok') return { uid: 'uid_bob', email: 'bob@example.com', name: 'Bob', email_verified: true };
      throw new Error('bad token');
    },
  };
  const app = createApp({ authClient: mockAuth, dbClient: db });

  // Seed gameState for Alice & Bob to check progress profile synthesis
  await db.collection('users').doc('uid_alice').collection('gameState').doc('current').set({
    ownerUid: 'uid_alice',
    guardianLevel: 3,
    guardianXP: 240,
    coins: 45,
    visitedRooms: ['bedroom', 'kitchen', 'garden'],
    stats: { dailyRoutineDay: 2, dailyRoutine: { ate: true, studied: true, played: false, bathed: false, talked: true } },
    rewardHistory: [{ id: 'rw1', label: 'Kind Badge', source: 'Guardian Lv.2', timestamp: Date.now() }],
    unlockedAchievements: [{ id: 'ach1', title: 'First Meal', icon: '🍳', unlockedAt: Date.now() }],
  });

  await withServer(app, async (base) => {
    // 1. Alice sends heartbeat across TWO browser tabs, and tries spoofing role/uid
    const hbA1 = await fetch(`${base}/api/telemetry/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer alice-tok' },
      body: JSON.stringify({
        uid: 'uid_bob', // spoof attempt MUST be ignored
        role: 'owner',
        isOwner: true,
        sessionId: 'alice_tab1',
        elapsedDeltaSec: 30,
        room: 'kitchen',
        activity: 'cooking',
        guardianLevel: 3,
        guardianXP: 240,
        coins: 45,
      }),
    });
    assert.equal(hbA1.status, 200);
    assert.equal((await hbA1.json()).activeTabsCount, 1);

    const hbA2 = await fetch(`${base}/api/telemetry/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer alice-tok' },
      body: JSON.stringify({
        sessionId: 'alice_tab2',
        elapsedDeltaSec: 30,
        room: 'study',
        activity: 'studying',
        guardianLevel: 3,
        guardianXP: 240,
      }),
    });
    assert.equal(hbA2.status, 200);
    assert.equal((await hbA2.json()).activeTabsCount, 2);

    // Ensure Alice could NOT escalate her role or pollute Bob's doc
    const aliceUser = (await db.collection('users').doc('uid_alice').get()).data();
    assert.equal(aliceUser.role, 'user');
    assert.equal(aliceUser.isOwner, false);
    assert.equal((await db.collection('users').doc('uid_bob').get()).exists, false);

    // 2. Bob logs activity in his own isolated account
    await fetch(`${base}/api/telemetry/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer bob-tok' },
      body: JSON.stringify({
        sessionId: 'bob_tab1',
        elapsedDeltaSec: 25,
        room: 'garden',
        activity: 'gardening',
        guardianLevel: 2,
        guardianXP: 110,
      }),
    });
    await fetch(`${base}/api/telemetry/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer bob-tok' },
      body: JSON.stringify({
        eventId: 'bob_act_1',
        activityType: 'gardening',
        activityLabel: 'Rose Seed',
        room: 'garden',
        durationSec: 45,
        status: 'completed',
        levelAfter: 2,
        milestones: [{ kind: 'activity_completed', title: 'Planted Rose Seed' }],
      }),
    });

    // 3. Closing Alice tab1 keeps Alice ONLINE because tab2 is still active
    const endA1 = await fetch(`${base}/api/telemetry/session-end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer alice-tok' },
      body: JSON.stringify({ sessionId: 'alice_tab1' }),
    });
    const endA1Json = await endA1.json();
    assert.equal(endA1Json.online, true);
    assert.equal(endA1Json.activeTabsCount, 1);

    // 4. Verify live players via Owner Admin API shows both Alice (1 tab) & Bob (1 tab) online
    const liveRes = await fetch(`${base}/api/admin/live`, { headers: { Authorization: 'Bearer owner-tok' } });
    assert.equal(liveRes.status, 200);
    const liveBody = await liveRes.json();
    assert.equal(liveBody.onlineCount, 2);
    const aliceLive = liveBody.players.find(p => p.uid === 'uid_alice');
    const bobLive = liveBody.players.find(p => p.uid === 'uid_bob');
    assert.equal(aliceLive.currentActivityLabel, 'Studying');
    assert.equal(bobLive.currentActivityLabel, 'Gardening');

    // 5. Simulate heartbeat expiration (> 90 seconds ago) for Bob and verify Bob becomes offline
    const bobPresence = (await db.collection('playerPresence').doc('uid_bob').get()).data();
    const staleIso = new Date(Date.now() - 120 * 1000).toISOString();
    bobPresence.activeTabs.bob_tab1.lastHeartbeatAt = staleIso;
    bobPresence.lastHeartbeatAt = staleIso;
    await db.collection('playerPresence').doc('uid_bob').set(bobPresence);

    const liveAfterExpiry = await (await fetch(`${base}/api/admin/live`, { headers: { Authorization: 'Bearer owner-tok' } })).json();
    assert.equal(liveAfterExpiry.onlineCount, 1);
    assert.equal(liveAfterExpiry.players.find(p => p.uid === 'uid_bob').online, false);

    // 6. Verify directory search/filter/sort + Alice detail profile isolation
    const dirRes = await fetch(`${base}/api/admin/users?search=alice&sortBy=level&sortDir=desc`, {
      headers: { Authorization: 'Bearer owner-tok' },
    });
    const dirBody = await dirRes.json();
    assert.equal(dirBody.users.length, 1);
    assert.equal(dirBody.users[0].uid, 'uid_alice');

    const aliceProfile = await (await fetch(`${base}/api/admin/users/uid_alice`, {
      headers: { Authorization: 'Bearer owner-tok' },
    })).json();
    assert.equal(aliceProfile.account.uid, 'uid_alice');
    assert.equal(aliceProfile.gameProgress.guardianLevel, 3);
    assert.equal(aliceProfile.dailyRoutine.completionPct, 60);
    assert.equal(aliceProfile.playtime.totalPlaytimeSec, 60);
    // Ensure Bob's gardening activity never leaks into Alice's profile
    assert.equal(aliceProfile.activityHistory.some(a => a.label === 'Rose Seed'), false);

    // 7. Verify overview metrics & charts reflect real totals
    const ovBody = await (await fetch(`${base}/api/admin/overview?range=7d`, {
      headers: { Authorization: 'Bearer owner-tok' },
    })).json();
    assert.equal(ovBody.summary.totalRegisteredUsers, 2);
    assert.equal(ovBody.summary.currentlyOnlineUsers, 1);
    assert.equal(ovBody.summary.totalActivitiesCompleted, 1);
    assert.ok(Array.isArray(ovBody.charts.dailyActiveUsers));
    assert.equal(ovBody.charts.dailyActiveUsers.length, 7);
  });
});
