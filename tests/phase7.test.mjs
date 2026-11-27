import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampPositionToRoom,
  buildInitialRoomPositions,
  computeFacing,
  pointerToRoomPercent,
  ROOM_DEFAULT_POSITIONS,
} from '../src/engine/movementEngine.js';
import { createVirtualClock, advanceClock, getTimeOfDay, getVirtualDay } from '../src/engine/timeEngine.js';
import { getSeasonFromDay } from '../src/engine/seasonEngine.js';
import { createInitialWeather, advanceWeather } from '../src/engine/weatherEngine.js';
import { INITIAL_NEEDS, applyNeedsDecay, applyAction } from '../src/engine/needsEngine.js';
import { deriveFullCharacterState } from '../src/engine/behaviourEngine.js';
import { addUniqueMemory } from '../src/engine/memoryEngine.js';
import { applyBondInteraction, buildInitialRelationship } from '../src/engine/relationshipEngine.js';
import { evaluateAchievements, INITIAL_STATS } from '../src/engine/achievementEngine.js';
import {
  createMemoryDeck, flipCard, checkMatch,
  createSolvablePuzzle, canMoveTile, moveTile, isPuzzleSolved,
  canClaimDailyMiniGameReward,
} from '../src/engine/miniGameEngine.js';
import {
  saveGame, loadGame, clearSave,
} from '../src/services/saveService.js';
import {
  VISUAL_ACTIONS,
  ACTION_MACHINE_STATES,
  createVisualActionSession,
} from '../src/engine/visualActionEngine.js';
import {
  notifyOwnerAuthEvent,
  isNotificationEndpointConfigured,
} from '../src/services/notificationService.js';
import {
  deriveLiveActivity,
  sendTelemetryHeartbeat,
} from '../src/services/telemetryService.js';

// Mock localStorage for Node environment
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

test('movementEngine: clamps coordinates within room bounds and preserves per-room positions', () => {
  const clamped = clampPositionToRoom('bedroom', -50, 999);
  assert.equal(clamped.x, 10);
  assert.equal(clamped.y, 38);

  const positions = buildInitialRoomPositions({
    bedroom: { x: 25, y: 30, facing: 'left' },
    kitchen: { x: 75, y: 20, facing: 'right' },
  });
  assert.deepEqual(positions.bedroom, { x: 25, y: 30, facing: 'left' });
  assert.deepEqual(positions.kitchen, { x: 75, y: 20, facing: 'right' });
  assert.deepEqual(positions.living, ROOM_DEFAULT_POSITIONS.living);
});

test('movementEngine: pointerToRoomPercent & computeFacing work across viewport sizes', () => {
  const rect = { left: 100, bottom: 600, width: 1000, height: 500 };
  const p = pointerToRoomPercent(350, 500, rect, 'bedroom');
  assert.equal(p.x, 25);
  assert.equal(p.y, 20);
  assert.equal(computeFacing(50, 25), 'left');
  assert.equal(computeFacing(25, 70), 'right');
});

test('timeEngine & seasonEngine: clock advances by elapsed timestamp and drives 4 seasons', () => {
  const c0 = createVirtualClock(1000, 360); // Day 1, 6:00 AM
  const c1 = advanceClock({ ...c0, realTimestamp: 0 }, 60000, 10); // +1 real min * 10 = +10 virtual min
  assert.equal(c1.virtualMinutes, 370);
  assert.equal(getTimeOfDay(370), 'morning');
  assert.equal(getVirtualDay(370), 1);

  assert.equal(getSeasonFromDay(0).id, 'spring');
  assert.equal(getSeasonFromDay(7 * 24 * 60).id, 'summer');
  assert.equal(getSeasonFromDay(14 * 24 * 60).id, 'autumn');
  assert.equal(getSeasonFromDay(21 * 24 * 60).id, 'winter');
});

test('weatherEngine: respects weather durations and developer overrides', () => {
  const w0 = createInitialWeather(360, 'spring');
  const wSame = advanceWeather(w0, 365, 'spring', 'auto');
  assert.equal(wSame.current, w0.current);

  const wForced = advanceWeather(w0, 365, 'spring', 'thunderstorm');
  assert.equal(wForced.current, 'thunderstorm');
});

test('needsEngine & behaviourEngine: feeding reduces hunger and activity states take priority', () => {
  const hungry = { ...INITIAL_NEEDS, hunger: 80 };
  const fed = applyAction(hungry, 'feed');
  assert.ok(fed.hunger < hungry.hunger);

  const decayed = applyNeedsDecay(INITIAL_NEEDS, 1, false);
  assert.ok(decayed.hunger > INITIAL_NEEDS.hunger);

  assert.equal(deriveFullCharacterState(INITIAL_NEEDS, 'walking', 'morning', false), 'walking');
});

test('memoryEngine & achievementEngine: prevents duplicate memories and unlocks earned achievements', () => {
  const r1 = addUniqueMemory([], 'first_play', 400);
  const r2 = addUniqueMemory(r1.memories, 'first_play', 500);
  assert.equal(Boolean(r1.added), true);
  assert.equal(Boolean(r2.added), false);
  assert.equal(r2.memories.length, 1);

  const ach = evaluateAchievements({
    stats: { ...INITIAL_STATS, conversations: 1 },
    unlockedAchievements: [],
    unlockedOutfits: ['casual'],
    memories: [],
    guardianLevel: 1,
  }, 400);
  assert.ok(ach.newlyUnlocked.some(a => a.id === 'first_hello'));
});

test('relationshipEngine: anti-farming cooldown blocks rapid duplicate clicks', () => {
  const rel = buildInitialRelationship();
  const first = applyBondInteraction(rel, 'talk', { day: 1, now: 100000, needs: INITIAL_NEEDS });
  assert.ok(first.gained > 0);
  const spam = applyBondInteraction(first.relationship, 'talk', { day: 1, now: 102000, needs: INITIAL_NEEDS });
  assert.equal(spam.throttled, true);
  assert.equal(spam.gained, 0);
});

test('miniGameEngine: memory deck, sliding puzzle, and daily reward guard work', () => {
  const deck = createMemoryDeck();
  assert.equal(deck.length, 16);
  const d1 = flipCard(deck, 0);
  assert.equal(d1[0].flipped, true);
  const checked = checkMatch(d1);
  assert.equal(checked.complete, false);

  const board = createSolvablePuzzle(12);
  assert.equal(isPuzzleSolved(board), false);
  const movableIdx = board.findIndex((_, i) => canMoveTile(board, i));
  assert.ok(movableIdx >= 0);
  const moved = moveTile(board, movableIdx);
  assert.notDeepEqual(moved, board);

  assert.equal(canClaimDailyMiniGameReward({ claimedDaily: { memory: 1 } }, 'memory', 1), false);
  assert.equal(canClaimDailyMiniGameReward({ claimedDaily: { memory: 1 } }, 'memory', 2), true);
});

test('saveService: persists roomPositions, settings, and recovers safely from corrupted JSON', () => {
  clearSave();
  const ok = saveGame({
    needs: INITIAL_NEEDS,
    clock: createVirtualClock(1000, 400),
    currentRoom: 'kitchen',
    roomPositions: { kitchen: { x: 42, y: 22, facing: 'left' } },
    movementMode: 'move',
    settings: { musicOn: false, sfxVolume: 0.4 },
  });
  assert.equal(ok, true);
  const loaded = loadGame();
  assert.equal(loaded.currentRoom, 'kitchen');
  assert.deepEqual(loaded.roomPositions.kitchen, { x: 42, y: 22, facing: 'left' });
  assert.equal(loaded.movementMode, 'move');

  globalThis.localStorage.setItem('hlw_save_v3', '{corrupted-json');
  assert.equal(loadGame(), null);
});

test('visualActionEngine: defines multi-stage actions with rooms, poses, props, and state machine transitions', () => {
  const cook = createVisualActionSession('cook', { meta: { foodId: 'pancakes' } });
  assert.equal(cook.requiredRoom, 'kitchen');
  assert.equal(cook.machineState, ACTION_MACHINE_STATES.WALKING);
  assert.equal(cook.stages.length, 3);
  assert.equal(cook.stages[0].prop, 'chopping_board');
  assert.equal(cook.stages[1].prop, 'cooking_pan');
  assert.equal(cook.stages[2].prop, 'plated_meal');

  for (const key of ['feed', 'water', 'brush', 'bathe', 'sleep', 'study', 'play', 'garden']) {
    const def = VISUAL_ACTIONS[key];
    assert.ok(def, `Missing visual action ${key}`);
    assert.ok(def.stages.length >= 1);
    assert.ok(def.stages[0].pose);
  }
});

test('notificationService: gracefully skips owner notification on Spark plan when endpoint is unconfigured', async () => {
  assert.equal(isNotificationEndpointConfigured(), false);
  let fetchCalled = false;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response('{}', { status: 200 });
  };
  try {
    const res = await notifyOwnerAuthEvent({
      user: { uid: 'u123', getIdToken: async () => 'tok' },
      eventType: 'SUCCESSFUL_LOGIN',
      provider: 'google.com',
    });
    assert.equal(fetchCalled, false);
    assert.equal(res.ok, false);
    assert.equal(res.skipped, true);
    assert.equal(res.reason, 'endpoint_not_configured');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('telemetryService: derives accurate live gameplay activities and skips network cleanly when unconfigured', async () => {
  assert.equal(deriveLiveActivity({ currentActivity: 'idle' }, true).label, 'Walking between rooms');
  assert.equal(deriveLiveActivity({ cookingItem: 'pancakes' }, false).label, 'Cooking');
  assert.equal(deriveLiveActivity({ currentActivity: 'eating' }, false).label, 'Eating');
  assert.equal(deriveLiveActivity({ activeVisualAction: { id: 'brush', machineState: 'INTERACTING' } }, false).label, 'Brushing teeth');
  assert.equal(deriveLiveActivity({ currentActivity: 'bathing', lastCareId: 'bath' }, false).label, 'Bathing');
  assert.equal(deriveLiveActivity({ isSleeping: true, currentActivity: 'sleeping' }, false).label, 'Sleeping');
  assert.equal(deriveLiveActivity({ currentActivity: 'studying' }, false).label, 'Studying');
  assert.equal(deriveLiveActivity({ currentActivity: 'playing' }, false).label, 'Playing');
  assert.equal(deriveLiveActivity({ activeVisualAction: { id: 'garden', machineState: 'INTERACTING' } }, false).label, 'Gardening');
  assert.equal(deriveLiveActivity({ lastOutfitChangeAt: Date.now() }, false).label, 'Dressing up');

  const hb = await sendTelemetryHeartbeat({ user: { getIdToken: async () => 't' }, sessionId: 's1' });
  assert.equal(hb.skipped, true);
});
