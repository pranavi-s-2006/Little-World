import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { INITIAL_NEEDS, applyNeedsDecay, applyAction } from '../engine/needsEngine.js';
import { deriveFullCharacterState, selectDialogueKey } from '../engine/behaviourEngine.js';
import { createVirtualClock, advanceClock, getTimeOfDay, getVirtualDay, formatVirtualDate } from '../engine/timeEngine.js';
import { saveGame, loadGame } from '../services/saveService.js';
import { loadUserWorld, saveUserWorld } from '../services/cloudSaveService.js';
import { buildInventory } from '../data/inventoryData.js';
import { buildInitialGarden, plantSeed, waterPlot, collectPlot } from '../engine/gardenEngine.js';
import { addActivityEvent, buildDiaryEntry, upsertDiaryEntry } from '../engine/diaryEngine.js';
import { consumeItem } from '../engine/inventoryEngine.js';
import { getFoodById } from '../data/foodData.js';
import { GARDEN_PLANTS } from '../data/gardenData.js';
import {
  buildInitialRelationship,
  getGuardianLevelFromBond,
  applyBondInteraction,
  GUARDIAN_LEVELS,
} from '../engine/relationshipEngine.js';
import { addUniqueMemory } from '../engine/memoryEngine.js';
import {
  buildInitialStats,
  markDailyRoutine,
  evaluateAchievements,
} from '../engine/achievementEngine.js';
import { isEventCompletedForDay } from '../engine/eventsEngine.js';
import { createInitialWeather, advanceWeather } from '../engine/weatherEngine.js';
import { getSeasonFromDay } from '../engine/seasonEngine.js';
import { canClaimDailyMiniGameReward } from '../engine/miniGameEngine.js';
import { buildInitialRoomPositions, clampPositionToRoom, ROOM_DEFAULT_POSITIONS } from '../engine/movementEngine.js';
import { ACTION_MACHINE_STATES, createVisualActionSession } from '../engine/visualActionEngine.js';
import { audioService, resolveMusicCategory } from '../services/audioService.js';
import {
  HEARTBEAT_INTERVAL_MS,
  getOrCreateTabSessionId,
  deriveLiveActivity,
  sendTelemetryHeartbeat,
  sendTelemetrySessionEnd,
  recordActivityTelemetry,
} from '../services/telemetryService.js';

const GameContext = createContext(null);

function mergeInventoryItems(inventory, itemsToAdd) {
  if (!itemsToAdd) return inventory;
  const next = { ...inventory };
  for (const [id, qty] of Object.entries(itemsToAdd)) {
    next[id] = (next[id] ?? 0) + qty;
  }
  return next;
}

function buildInitialState(saved = null) {
  const relationship = buildInitialRelationship(saved?.relationship);
  const levelInfo = getGuardianLevelFromBond(relationship.bondPoints);
  const clock = saved?.clock ? createVirtualClock(saved.clock.savedAt, saved.clock.virtualMinutes) : createVirtualClock();
  const defaultSettings = {
    musicOn: true,
    sfxOn: true,
    muted: false,
    musicVolume: 0.5,
    sfxVolume: 0.65,
    weatherEffects: true,
    ambientAnimations: true,
    reducedMotion: false,
    effectsQuality: 'medium',
    weatherOverride: 'auto',
    seasonOverride: 'auto',
    birthdayDay: 5,
    speed: 10,
  };
  const settings = { ...defaultSettings, ...(saved?.settings ?? {}) };
  const season = getSeasonFromDay(clock.virtualMinutes, settings.seasonOverride);
  const weather = saved?.weather ?? createInitialWeather(clock.virtualMinutes, season.id);
  const initialDecor = [...(saved?.unlockedDecor ?? [])];
  if (!initialDecor.includes(season.decorId)) initialDecor.push(season.decorId);

  return {
    needs:                saved?.needs                ?? { ...INITIAL_NEEDS },
    clock,
    currentRoom:          saved?.currentRoom          ?? 'bedroom',
    roomPositions:        buildInitialRoomPositions(saved?.roomPositions),
    movementMode:         saved?.movementMode === 'move' ? 'move' : 'normal',
    selectedOutfit:       saved?.selectedOutfit       ?? 'casual',
    unlockedOutfits:      saved?.unlockedOutfits      ?? ['casual', 'school', 'pajamas'],
    guardianXP:           saved?.guardianXP           ?? 0,
    guardianLevel:        levelInfo.level,
    coins:                Number(saved?.coins           ?? 0),
    visitedRooms:         Array.isArray(saved?.visitedRooms) && saved.visitedRooms.length > 0
      ? saved.visitedRooms
      : [saved?.currentRoom ?? 'bedroom'],
    diaryEntries:         saved?.diaryEntries         ?? [],
    activityHistory:      saved?.activityHistory      ?? [],
    inventory:            buildInventory(saved?.inventory),
    garden:               buildInitialGarden(saved?.garden),
    relationship,
    memories:             saved?.memories             ?? [],
    unlockedAchievements: saved?.unlockedAchievements ?? [],
    stats:                buildInitialStats(saved?.stats),
    completedEvents:      saved?.completedEvents      ?? [],
    unlockedStickers:     saved?.unlockedStickers     ?? ['✿', '💕', '✨'],
    unlockedDecor:        initialDecor,
    unlockedThemes:       saved?.unlockedThemes       ?? ['pink'],
    selectedTheme:        saved?.selectedTheme        ?? 'pink',
    rewardHistory:        saved?.rewardHistory        ?? [],
    weather,
    miniGames:            saved?.miniGames            ?? { plays: 0, claimedDaily: {}, bestScores: {} },
    celebrationTrigger:   0,
    activeVisualAction:   null,
    currentActivity:      'idle',
    isSleeping:           false,
    cookingItem:          null,
    cookingProgress:      0,
    conversationActive:   false,
    dialogueKey:          'morning',
    dialogueLastKey:      '',
    dialogueLastTime:     0,
    lastCareId:           null,
    lastOutfitChangeAt:   0,
    lastTelemetryEvent:   null,
    lastInteraction:      null,
    settings,
    notification:         null,
  };
}

const ACTION_TO_ACTIVITY = {
  feed:'eating', water:'drinking', play:'playing', talk:'talking',
  bathe:'bathing', study:'studying', sleep:'sleeping', rest:'resting',
  medicine:'recovering', care:'recovering', hug:'talking',
  brush:'bathing', washface:'bathing', comphair:'bathing',
};

const ACTION_DURATIONS = {
  feed:3000, water:2000, play:4000, talk:4000, bathe:5000,
  study:6000, rest:5000, medicine:2000, care:3000, hug:2000,
  brush:2000, washface:2000, comphair:2000,
};

function clampNeeds(n) {
  const out = {};
  for (const k of Object.keys(n)) out[k] = Math.min(100, Math.max(0, n[k]));
  return out;
}

// Shared Phase 5 progression pipeline (anti-farming bond, level rewards, memories, achievements)
function applyPhase5Progression(state, {
  bondCategory = null,
  milestoneId = null,
  milestoneOverrides = null,
  routineKey = null,
  baseNotification = null,
  telemetry = null,
  coinsDelta = 0,
} = {}) {
  const virtualMinutes = state.clock.virtualMinutes;
  const day = getVirtualDay(virtualMinutes);
  const now = Date.now();
  const milestones = [];

  let nextStats = state.stats;
  if (routineKey) {
    const prevRoutine = state.stats?.dailyRoutine ?? {};
    const prevDoneCount = ['ate', 'studied', 'played', 'bathed', 'talked'].filter(k => prevRoutine[k]).length;
    nextStats = markDailyRoutine(nextStats, routineKey, day);
    const nextDoneCount = ['ate', 'studied', 'played', 'bathed', 'talked'].filter(k => nextStats.dailyRoutine[k]).length;
    if (prevDoneCount < 5 && nextDoneCount === 5) {
      milestones.push({
        kind: 'routine_completed',
        title: 'Completed Full Daily Routine!',
        detail: `Finished all 5 daily tasks on Virtual Day ${day}`,
      });
    }
  }

  let nextRel = state.relationship;
  let bondGain = 0;
  if (bondCategory) {
    const prevBond = nextRel.bondPoints ?? 0;
    const res = applyBondInteraction(nextRel, bondCategory, {
      day,
      now,
      needs: state.needs,
    });
    nextRel = res.relationship;
    bondGain = Math.max(0, (nextRel.bondPoints ?? 0) - prevBond);
  }

  const prevLevel = state.guardianLevel ?? 1;
  const levelInfo = getGuardianLevelFromBond(nextRel.bondPoints);
  let nextOutfits = [...state.unlockedOutfits];
  if (state.guardianXP >= 100 && !nextOutfits.includes('summer'))   nextOutfits.push('summer');
  if (state.guardianXP >= 300 && !nextOutfits.includes('princess')) nextOutfits.push('princess');
  if (state.guardianXP >= 600 && !nextOutfits.includes('sporty'))   nextOutfits.push('sporty');

  let nextInventory = state.inventory;
  let nextStickers = [...state.unlockedStickers];
  let nextDecor = [...state.unlockedDecor];
  let nextThemes = [...state.unlockedThemes];
  let nextRewards = [...state.rewardHistory];
  let nextMemories = [...state.memories];
  let topNotification = baseNotification;

  // Unlock Guardian Level rewards & level-up memories
  if (levelInfo.level > prevLevel) {
    for (let lvl = prevLevel + 1; lvl <= levelInfo.level; lvl++) {
      const lvlObj = GUARDIAN_LEVELS.find(l => l.level === lvl);
      if (!lvlObj) continue;

      milestones.push({
        kind: 'level_up',
        title: `Reached Guardian Level ${lvl}: ${lvlObj.title}`,
        detail: lvlObj.description,
        level: lvl,
        xp: state.guardianXP,
      });

      const memRes = addUniqueMemory(nextMemories, `guardian_level_${lvl}`, virtualMinutes, {
        title: `Became ${lvlObj.title}!`,
        description: `${lvlObj.description} (Guardian Level ${lvl} reached!)`,
        category: 'Bonding',
        mood: 'Loved',
        illustration: lvlObj.badge,
      });
      nextMemories = memRes.memories;

      const r = lvlObj.reward;
      if (r) {
        if (r.outfitId && !nextOutfits.includes(r.outfitId)) nextOutfits.push(r.outfitId);
        if (r.sticker && !nextStickers.includes(r.sticker)) nextStickers.push(r.sticker);
        if (r.decorId && !nextDecor.includes(r.decorId)) nextDecor.push(r.decorId);
        if (r.themeId && !nextThemes.includes(r.themeId)) nextThemes.push(r.themeId);
        if (r.items) nextInventory = mergeInventoryItems(nextInventory, r.items);
        if (!nextRewards.some(rw => rw.id === r.id)) {
          nextRewards = [
            { id: r.id, label: r.label, source: `Guardian Lv.${lvl}`, virtualDate: formatVirtualDate(virtualMinutes), timestamp: now },
            ...nextRewards,
          ];
          milestones.push({
            kind: 'reward',
            title: `Earned Reward: ${r.label}`,
            detail: `Guardian Lv.${lvl}`,
          });
        }
      }
      topNotification = { message: `👑 Guardian Level ${lvl}: ${lvlObj.title}!`, type: 'success' };
    }
  }

  // Record one-time milestone memory if applicable
  if (milestoneId) {
    const memRes = addUniqueMemory(nextMemories, milestoneId, virtualMinutes, milestoneOverrides);
    nextMemories = memRes.memories;
  }

  // Evaluate achievements strictly against updated state
  const candidateState = {
    ...state,
    stats: nextStats,
    relationship: nextRel,
    guardianLevel: levelInfo.level,
    coins: Math.max(0, Number(state.coins ?? 0) + coinsDelta),
    unlockedOutfits: nextOutfits,
    memories: nextMemories,
    inventory: nextInventory,
  };

  const achRes = evaluateAchievements(candidateState, virtualMinutes);
  if (achRes.newlyUnlocked.length > 0) {
    for (const ach of achRes.newlyUnlocked) {
      if (ach.rewardSticker && !nextStickers.includes(ach.rewardSticker)) {
        nextStickers.push(ach.rewardSticker);
      }
      if (ach.rewardTheme && !nextThemes.includes(ach.rewardTheme)) {
        nextThemes.push(ach.rewardTheme);
      }
      if (ach.rewardItems) {
        nextInventory = mergeInventoryItems(nextInventory, ach.rewardItems);
      }
      milestones.push({
        kind: 'achievement',
        title: `Unlocked Achievement: ${ach.title}`,
        detail: ach.desc || '',
      });
      const rewardId = `ach_${ach.id}`;
      if (!nextRewards.some(rw => rw.id === rewardId)) {
        nextRewards = [
          { id: rewardId, label: `${ach.title} Badge`, source: 'Achievement', virtualDate: ach.virtualDate, timestamp: now },
          ...nextRewards,
        ];
        milestones.push({
          kind: 'reward',
          title: `Earned Achievement Reward: ${ach.title} Badge`,
          detail: 'Achievement',
        });
      }
    }
    if (levelInfo.level <= prevLevel) {
      const firstAch = achRes.newlyUnlocked[0];
      topNotification = { message: `${firstAch.icon} Achievement Unlocked: ${firstAch.title}!`, type: 'success' };
    }
  }

  const telemetryEvent = telemetry
    ? {
        eventId: `ev_${now}_${Math.random().toString(36).slice(2, 7)}`,
        activityType: telemetry.type,
        activityLabel: telemetry.label,
        room: telemetry.room || state.currentRoom,
        durationSec: telemetry.durationSec ?? 0,
        status: 'completed',
        levelAfter: levelInfo.level,
        xpGain: telemetry.xpGain ?? 0,
        bondGain,
        coinsDelta,
        milestones,
      }
    : null;

  return {
    ...candidateState,
    unlockedAchievements: achRes.unlockedAchievements,
    unlockedStickers: nextStickers,
    unlockedDecor: nextDecor,
    unlockedThemes: nextThemes,
    rewardHistory: nextRewards,
    notification: topNotification,
    ...(telemetryEvent ? { lastTelemetryEvent: telemetryEvent } : {}),
  };
}

function gameReducer(state, action) {
  switch (action.type) {

    case 'TICK': {
      const newClock = advanceClock(state.clock, action.now, state.settings?.speed ?? 10);
      const realElapsedMs = Math.max(0, action.now - state.clock.realTimestamp);
      const virtualHoursElapsed = (realElapsedMs / 60000) * ((state.settings?.speed ?? 10) / 60);
      const newNeeds = applyNeedsDecay(state.needs, virtualHoursElapsed, state.isSleeping);
      const timeOfDay = getTimeOfDay(newClock.virtualMinutes);
      const season = getSeasonFromDay(newClock.virtualMinutes, state.settings?.seasonOverride);
      const nextWeather = advanceWeather(
        state.weather,
        newClock.virtualMinutes,
        season.id,
        state.settings?.weatherOverride
      );
      const nextDecor = state.unlockedDecor.includes(season.decorId)
        ? state.unlockedDecor
        : [...state.unlockedDecor, season.decorId];
      const newDialogueKey = selectDialogueKey(
        newNeeds, state.currentActivity, timeOfDay, state.isSleeping,
        state.dialogueLastKey, state.dialogueLastTime, 10000
      );
      return {
        ...state,
        clock: newClock,
        needs: newNeeds,
        weather: nextWeather,
        unlockedDecor: nextDecor,
        ...(newDialogueKey ? { dialogueKey: newDialogueKey, dialogueLastKey: newDialogueKey, dialogueLastTime: action.now } : {}),
      };
    }

    case 'DO_ACTION': {
      const { actionId } = action;
      const newNeeds = clampNeeds(applyAction(state.needs, actionId));
      const isSleeping = actionId === 'sleep';
      const activity = ACTION_TO_ACTIVITY[actionId] ?? 'idle';
      const xpGain = actionId === 'sleep' ? 5 : actionId === 'study' ? 15 : 10;
      const newXP = state.guardianXP + xpGain;
      const day = getVirtualDay(state.clock.virtualMinutes);

      // Map generic quick-actions to grounded stats, activities, and bond categories
      const stats = { ...state.stats };
      let eventRecord = null;
      let bondCategory = null;
      let milestoneId = null;
      let routineKey = null;

      if (actionId === 'talk') {
        stats.conversations += 1;
        eventRecord = { type: 'talked', label: 'chat together' };
        bondCategory = 'talk';
        milestoneId = 'first_hello';
        routineKey = 'talked';
      } else if (actionId === 'hug') {
        eventRecord = { type: 'hugged', label: 'warm hug' };
        bondCategory = 'hug';
      } else if (actionId === 'play') {
        stats.playCount += 1;
        eventRecord = { type: 'played', label: 'fun games' };
        bondCategory = 'play';
        milestoneId = 'first_play';
        routineKey = 'played';
      } else if (actionId === 'study') {
        stats.studyCount += 1;
        eventRecord = { type: 'studied', label: 'daily study' };
        bondCategory = 'study';
        milestoneId = 'first_study';
        routineKey = 'studied';
      } else if (actionId === 'feed') {
        stats.mealsServed += 1;
        eventRecord = { type: 'ate', label: 'home meal' };
        bondCategory = 'meal';
        milestoneId = 'first_meal';
        routineKey = 'ate';
      } else if (actionId === 'water') {
        eventRecord = { type: 'drank', label: 'fresh water' };
        bondCategory = 'meal';
      } else if (actionId === 'bathe') {
        eventRecord = { type: 'bathed', label: 'warm bath' };
        bondCategory = 'care';
        routineKey = 'bathed';
      } else if (actionId === 'sleep') {
        stats.sleepRoutines += 1;
        eventRecord = { type: 'slept', label: 'restful sleep' };
        bondCategory = 'sleep';
        milestoneId = 'first_sleep_routine';
      } else if (actionId === 'rest') {
        eventRecord = { type: 'slept', label: 'cozy rest' };
        bondCategory = 'sleep';
      } else if (actionId === 'care' || actionId === 'medicine') {
        eventRecord = { type: 'bathed', label: 'gentle care' };
        bondCategory = 'care';
        routineKey = 'bathed';
      }

      const newHistory = eventRecord
        ? addActivityEvent(state.activityHistory, eventRecord, day, state.clock.virtualMinutes)
        : state.activityHistory;

      const updated = {
        ...state,
        needs: newNeeds,
        isSleeping,
        currentActivity: activity,
        guardianXP: newXP,
        stats,
        activityHistory: newHistory,
        lastCareId: actionId === 'brush' ? 'brush' : state.lastCareId,
        lastInteraction: { actionId, timestamp: Date.now() },
        dialogueKey: activity,
        dialogueLastKey: activity,
        dialogueLastTime: Date.now(),
      };

      return applyPhase5Progression(updated, {
        bondCategory,
        milestoneId,
        routineKey,
        baseNotification: { message: getActionMessage(actionId), type: 'success' },
        telemetry: { type: activity, label: eventRecord?.label ?? actionId, room: state.currentRoom, xpGain },
        coinsDelta: 5,
      });
    }

    // ── FOOD ──────────────────────────────────────────────────────────────
    case 'SERVE_FOOD': {
      const food = getFoodById(action.foodId);
      if (!food) return state;
      const { inventory, success } = consumeItem(state.inventory, action.foodId);
      if (!success) return { ...state, notification: { message: "We're out of that! 😢", type: 'error' } };

      const n = { ...state.needs };
      n.hunger    = Math.max(0, Math.min(100, n.hunger    + food.hunger));
      n.happiness = Math.max(0, Math.min(100, n.happiness + food.happiness));
      n.health    = Math.max(0, Math.min(100, n.health    + (food.health ?? 0)));
      n.energy    = Math.max(0, Math.min(100, n.energy    + (food.energy ?? 0)));

      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: food.isDrink ? 'drank' : 'ate', label: food.name },
        day,
        state.clock.virtualMinutes
      );

      const stats = {
        ...state.stats,
        mealsServed: (state.stats.mealsServed ?? 0) + (food.isDrink ? 0 : 1),
      };

      const updated = {
        ...state, needs: n, inventory, stats,
        currentActivity: food.isDrink ? 'drinking' : 'eating',
        activityHistory: newHistory,
        lastInteraction: { actionId: food.isDrink ? 'water' : 'feed', timestamp: Date.now() },
        dialogueKey: food.isDrink ? 'drinking' : 'eating',
        dialogueLastKey: food.isDrink ? 'drinking' : 'eating',
        dialogueLastTime: Date.now(),
        cookingItem: null, cookingProgress: 0,
      };

      return applyPhase5Progression(updated, {
        bondCategory: 'meal',
        milestoneId: food.isDrink ? null : 'first_meal',
        routineKey: food.isDrink ? null : 'ate',
        baseNotification: { message: `Pranavi is enjoying ${food.name}! ${food.emoji}`, type: 'success' },
        telemetry: {
          type: food.isDrink ? 'drinking' : 'eating',
          label: food.name,
          room: 'kitchen',
          durationSec: food.prepTime ? food.prepTime * 10 : 15,
        },
        coinsDelta: 6,
      });
    }

    case 'START_COOKING':
      return { ...state, cookingItem: action.foodId, cookingProgress: 0 };

    case 'UPDATE_COOKING':
      return { ...state, cookingProgress: Math.min(100, action.progress) };

    case 'CANCEL_COOKING':
      return { ...state, cookingItem: null, cookingProgress: 0 };

    // ── BATHROOM ──────────────────────────────────────────────────────────
    case 'DO_CARE': {
      const { careId } = action;
      const effects = CARE_EFFECTS[careId] ?? {};
      const n = { ...state.needs };
      for (const [k, v] of Object.entries(effects)) n[k] = Math.max(0, Math.min(100, (n[k] ?? 0) + v));
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'bathed', label: careId },
        day,
        state.clock.virtualMinutes
      );
      const updated = {
        ...state, needs: n, currentActivity: 'bathing',
        activityHistory: newHistory,
        lastCareId: careId,
        lastInteraction: { actionId: 'bathe', timestamp: Date.now() },
        dialogueKey: 'bathing', dialogueLastKey: 'bathing', dialogueLastTime: Date.now(),
      };
      return applyPhase5Progression(updated, {
        bondCategory: 'care',
        routineKey: 'bathed',
        baseNotification: { message: CARE_MESSAGES[careId] ?? 'Pranavi feels fresh! ✨', type: 'success' },
        telemetry: { type: careId === 'brush' ? 'brush' : 'bathing', label: careId, room: 'bathroom', durationSec: 20 },
        coinsDelta: 5,
      });
    }

    // ── SLEEP ─────────────────────────────────────────────────────────────
    case 'GO_SLEEP': {
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'slept', label: 'peaceful sleep' },
        day,
        state.clock.virtualMinutes
      );
      const stats = { ...state.stats, sleepRoutines: (state.stats.sleepRoutines ?? 0) + 1 };
      const updated = {
        ...state, isSleeping: true, currentActivity: 'sleeping', stats,
        activityHistory: newHistory,
        dialogueKey: 'sleeping', dialogueLastKey: 'sleeping', dialogueLastTime: Date.now(),
      };
      return applyPhase5Progression(updated, {
        bondCategory: 'sleep',
        milestoneId: 'first_sleep_routine',
        baseNotification: { message: 'Pranavi is sleeping... 💤', type: 'success' },
        telemetry: { type: 'sleeping', label: 'Peaceful Sleep', room: 'bedroom', durationSec: 30 },
        coinsDelta: 5,
      });
    }

    case 'WAKE_UP': {
      const n = { ...state.needs, energy: Math.min(100, state.needs.energy + 30) };
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'woke', label: 'woke up early' },
        day,
        state.clock.virtualMinutes
      );
      return {
        ...state, isSleeping: false, currentActivity: 'idle', needs: n,
        activityHistory: newHistory,
        notification: { message: 'Good morning, Pranavi! 🌸', type: 'success' },
        dialogueKey: 'morning', dialogueLastKey: 'morning', dialogueLastTime: Date.now(),
        lastTelemetryEvent: {
          eventId: `ev_${Date.now()}_wake`,
          activityType: 'woke',
          activityLabel: 'Woke up early',
          room: 'bedroom',
          status: 'completed',
          levelAfter: state.guardianLevel ?? 1,
          milestones: [],
        },
      };
    }

    // ── STUDY ─────────────────────────────────────────────────────────────
    case 'DO_STUDY': {
      const n = { ...state.needs };
      n.energy    = Math.max(0, n.energy    - 12);
      n.happiness = Math.max(0, n.happiness - 3);
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'studied', label: action.subject },
        day,
        state.clock.virtualMinutes
      );
      const stats = { ...state.stats, studyCount: (state.stats.studyCount ?? 0) + 1 };
      const updated = {
        ...state, needs: n, currentActivity: 'studying', stats,
        activityHistory: newHistory, guardianXP: state.guardianXP + 15,
        lastInteraction: { actionId: 'study', timestamp: Date.now() },
        dialogueKey: 'studying', dialogueLastKey: 'studying', dialogueLastTime: Date.now(),
      };
      return applyPhase5Progression(updated, {
        bondCategory: 'study',
        milestoneId: 'first_study',
        routineKey: 'studied',
        baseNotification: { message: `Pranavi studied ${action.subject}! 📚`, type: 'success' },
        telemetry: { type: 'studying', label: action.subject, room: 'study', xpGain: 15, durationSec: 25 },
        coinsDelta: 8,
      });
    }

    // ── PLAY ──────────────────────────────────────────────────────────────
    case 'DO_PLAY': {
      const n = { ...state.needs };
      n.happiness = Math.min(100, n.happiness + (action.happinessGain ?? 20));
      n.energy    = Math.max(0,   n.energy    - 12);
      n.social    = Math.min(100, n.social    + 10);
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'played', label: action.activityName },
        day,
        state.clock.virtualMinutes
      );
      const stats = { ...state.stats, playCount: (state.stats.playCount ?? 0) + 1 };
      const updated = {
        ...state, needs: n, currentActivity: 'playing', stats,
        activityHistory: newHistory, guardianXP: state.guardianXP + 10,
        lastInteraction: { actionId: 'play', timestamp: Date.now() },
        dialogueKey: 'playing', dialogueLastKey: 'playing', dialogueLastTime: Date.now(),
      };
      return applyPhase5Progression(updated, {
        bondCategory: 'play',
        milestoneId: 'first_play',
        routineKey: 'played',
        baseNotification: { message: `Pranavi loved ${action.activityName}! 🎮`, type: 'success' },
        telemetry: { type: 'playing', label: action.activityName, room: 'playroom', xpGain: 10, durationSec: 20 },
        coinsDelta: 6,
      });
    }

    // ── CONVERSATION ──────────────────────────────────────────────────────
    case 'DO_CONVERSATION': {
      const n = { ...state.needs };
      n.social    = Math.min(100, n.social    + (action.social    ?? 12));
      n.happiness = Math.min(100, n.happiness + (action.happiness ?? 8));
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'talked', label: action.topic },
        day,
        state.clock.virtualMinutes
      );
      const stats = { ...state.stats, conversations: (state.stats.conversations ?? 0) + 1 };
      const updated = {
        ...state, needs: n, currentActivity: 'talking', stats,
        activityHistory: newHistory,
        lastInteraction: { actionId: 'talk', timestamp: Date.now() },
        dialogueKey: 'talking', dialogueLastKey: 'talking', dialogueLastTime: Date.now(),
      };
      return applyPhase5Progression(updated, {
        bondCategory: 'talk',
        milestoneId: 'first_hello',
        routineKey: 'talked',
        baseNotification: { message: 'Pranavi loved the conversation! 💬', type: 'success' },
        telemetry: { type: 'talking', label: action.topic, room: 'living', durationSec: 15 },
        coinsDelta: 5,
      });
    }

    // ── GARDEN ────────────────────────────────────────────────────────────
    case 'PLANT_SEED': {
      const { inventory, success } = consumeItem(state.inventory, `${action.plantId}_seed`);
      if (!success) return { ...state, notification: { message: 'No seeds left! 🌱', type: 'error' } };
      const newGarden = plantSeed(state.garden, action.plotId, action.plantId, state.clock.virtualMinutes);
      const day = getVirtualDay(state.clock.virtualMinutes);
      const plantInfo = GARDEN_PLANTS.find(p => p.id === action.plantId);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'planted', label: `${plantInfo?.name ?? action.plantId} seed` },
        day,
        state.clock.virtualMinutes
      );
      const stats = { ...state.stats, flowersPlanted: (state.stats.flowersPlanted ?? 0) + 1 };
      const updated = { ...state, garden: newGarden, inventory, stats, activityHistory: newHistory };
      return applyPhase5Progression(updated, {
        bondCategory: 'garden',
        milestoneId: 'first_garden_plant',
        baseNotification: { message: 'Planted a new seed! 🌱', type: 'success' },
        telemetry: { type: 'gardening', label: `Planted ${plantInfo?.name ?? action.plantId}`, room: 'garden', durationSec: 10 },
        coinsDelta: 4,
      });
    }

    case 'WATER_PLANT': {
      const newGarden = waterPlot(state.garden, action.plotId, state.clock.virtualMinutes);
      const n = { ...state.needs, happiness: Math.min(100, state.needs.happiness + 5) };
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'watered', label: 'garden' },
        day,
        state.clock.virtualMinutes
      );
      const stats = { ...state.stats, flowersWatered: (state.stats.flowersWatered ?? 0) + 1 };
      const updated = { ...state, garden: newGarden, needs: n, stats, activityHistory: newHistory };
      return applyPhase5Progression(updated, {
        bondCategory: 'garden',
        baseNotification: { message: 'Pranavi watered the plants! 💧', type: 'success' },
        telemetry: { type: 'gardening', label: 'Watered Garden', room: 'garden', durationSec: 10 },
        coinsDelta: 3,
      });
    }

    case 'COLLECT_PLANT': {
      const plant = state.garden.plots.find(p => p.id === action.plotId);
      const plantData = plant ? GARDEN_PLANTS.find(p => p.id === plant.plantId) : null;
      const happinessGain = plantData?.happiness ?? 8;
      const n = { ...state.needs, happiness: Math.min(100, state.needs.happiness + happinessGain) };
      const newGarden = collectPlot(state.garden, action.plotId);
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'harvested', label: plantData?.name ?? 'flower' },
        day,
        state.clock.virtualMinutes
      );
      const stats = { ...state.stats, flowersCollected: (state.stats.flowersCollected ?? 0) + 1 };
      const updated = {
        ...state, garden: newGarden, needs: n, stats,
        activityHistory: newHistory, guardianXP: state.guardianXP + 5,
      };
      return applyPhase5Progression(updated, {
        bondCategory: 'garden',
        milestoneId: 'first_garden_bloom',
        baseNotification: { message: 'Pranavi collected a beautiful flower! 🌸', type: 'success' },
        telemetry: { type: 'gardening', label: `Harvested ${plantData?.name ?? 'flower'}`, room: 'garden', xpGain: 5, durationSec: 10 },
        coinsDelta: 8,
      });
    }

    // ── SPECIAL EVENTS ────────────────────────────────────────────────────
    case 'COMPLETE_EVENT': {
      const ev = action.event;
      if (!ev) return state;
      const day = getVirtualDay(state.clock.virtualMinutes);
      if (isEventCompletedForDay(state.completedEvents, ev.id, day)) {
        return state;
      }

      const n = { ...state.needs };
      n.happiness = Math.min(100, n.happiness + (ev.happinessGain ?? 15));
      n.social    = Math.min(100, n.social    + (ev.socialGain ?? 12));
      if (ev.energyCost) n.energy = Math.max(0, n.energy - ev.energyCost);

      const newInventory = mergeInventoryItems(state.inventory, ev.rewardItems);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'event', label: ev.title },
        day,
        state.clock.virtualMinutes
      );
      const stats = { ...state.stats, eventsCompleted: (state.stats.eventsCompleted ?? 0) + 1 };
      const completedEvents = [
        { id: ev.id, title: ev.title, day, completedAt: Date.now() },
        ...state.completedEvents,
      ].slice(0, 100);

      const updated = {
        ...state,
        needs: n,
        inventory: newInventory,
        stats,
        activityHistory: newHistory,
        completedEvents,
        celebrationTrigger: (state.celebrationTrigger ?? 0) + 1,
        currentActivity: 'celebrating',
        lastInteraction: { actionId: 'play', timestamp: Date.now() },
      };

      return applyPhase5Progression(updated, {
        bondCategory: 'event',
        milestoneId: ev.memoryMilestone,
        milestoneOverrides: {
          title: ev.memoryTitle ?? ev.title,
          description: ev.memoryDescription ?? ev.description,
          category: 'Special Event',
          mood: ev.mood ?? 'Happy',
          illustration: ev.icon ?? '🎉',
        },
        baseNotification: { message: `${ev.icon} ${ev.title} completed!`, type: 'success' },
        telemetry: { type: 'event', label: ev.title, room: state.currentRoom, durationSec: 20 },
        coinsDelta: 20,
      });
    }

    // ── DIARY & SCRAPBOOK ─────────────────────────────────────────────────
    case 'GENERATE_DIARY': {
      const day = getVirtualDay(state.clock.virtualMinutes);
      const characterState = deriveFullCharacterState(
        state.needs, state.currentActivity, getTimeOfDay(state.clock.virtualMinutes), state.isSleeping
      );
      const entry = buildDiaryEntry(state.activityHistory, state.needs, day, {
        virtualMinutes: state.clock.virtualMinutes,
        characterState,
      });
      const { entries, changed } = upsertDiaryEntry(state.diaryEntries, entry);
      if (!changed) {
        return action.manual
          ? { ...state, notification: { message: "Today's diary is already up to date~ 📖", type: 'success' } }
          : state;
      }
      return {
        ...state,
        diaryEntries: entries,
        ...(action.manual ? { notification: { message: "Saved today's diary page! 📖", type: 'success' } } : {}),
      };
    }

    case 'PIN_DIARY_STICKER': {
      const { day, sticker } = action;
      if (!state.unlockedStickers.includes(sticker)) return state;
      const updated = state.diaryEntries.map(entry => {
        if (entry.day !== day) return entry;
        const current = entry.pinnedStickers ?? [];
        const has = current.includes(sticker);
        return {
          ...entry,
          pinnedStickers: has ? current.filter(s => s !== sticker) : [...current, sticker].slice(0, 6),
        };
      });
      return { ...state, diaryEntries: updated };
    }

    case 'SELECT_SCRAPBOOK_THEME': {
      if (!state.unlockedThemes.includes(action.themeId)) return state;
      return { ...state, selectedTheme: action.themeId };
    }

    case 'CLEAR_ACTIVITY':
      return { ...state, currentActivity: 'idle' };

    case 'SET_ACTIVITY':
      return { ...state, currentActivity: action.activity };

    case 'NAVIGATE': {
      const prevRooms = state.visitedRooms ?? ['bedroom'];
      const isNewRoom = action.room && !prevRooms.includes(action.room);
      const visitedRooms = isNewRoom ? [...prevRooms, action.room] : prevRooms;
      return {
        ...state,
        currentRoom: action.room,
        visitedRooms,
        ...(isNewRoom
          ? {
              lastTelemetryEvent: {
                eventId: `ev_${Date.now()}_room_${action.room}`,
                activityType: 'walking',
                activityLabel: `Explored ${action.room}`,
                room: action.room,
                status: 'completed',
                levelAfter: state.guardianLevel ?? 1,
                milestones: [
                  {
                    kind: 'room_unlocked',
                    title: `Explored Room: ${action.room}`,
                    detail: 'Discovered this room inside Her Little World',
                  },
                ],
              },
            }
          : {}),
      };
    }

    case 'SET_CHARACTER_POSITION': {
      const targetRoom = action.room ?? state.currentRoom;
      const clamped = clampPositionToRoom(targetRoom, action.x, action.y);
      const prev = state.roomPositions?.[targetRoom] ?? { x: 50, y: 25, facing: 'right' };
      return {
        ...state,
        roomPositions: {
          ...state.roomPositions,
          [targetRoom]: {
            x: clamped.x,
            y: clamped.y,
            facing: action.facing ?? prev.facing ?? 'right',
          },
        },
      };
    }

    case 'RESET_CHARACTER_POSITION': {
      const targetRoom = action.room ?? state.currentRoom;
      const def = ROOM_DEFAULT_POSITIONS[targetRoom] ?? { x: 50, y: 25, facing: 'right' };
      return {
        ...state,
        roomPositions: {
          ...state.roomPositions,
          [targetRoom]: { ...def },
        },
        notification: { message: 'Reset Pranavi to her cozy spot~ ✨', type: 'success' },
      };
    }

    case 'SET_MOVEMENT_MODE':
      return { ...state, movementMode: action.mode === 'move' ? 'move' : 'normal' };

    case 'CANCEL_VISUAL_ACTION':
      return {
        ...state,
        activeVisualAction: null,
        currentActivity: 'idle',
        notification: { message: 'Activity cancelled~', type: 'info' },
      };

    case 'START_VISUAL_ACTION': {
      const session = createVisualActionSession(action.actionKey, {
        label: action.label,
        meta: action.meta,
      });
      if (!session) return state;
      return {
        ...state,
        currentRoom: action.skipRoomSwitch ? state.currentRoom : session.requiredRoom,
        isSleeping: false,
        activeVisualAction: session,
      };
    }

    case 'VISUAL_ACTION_ARRIVED': {
      const act = state.activeVisualAction;
      if (!act || act.machineState !== ACTION_MACHINE_STATES.WALKING) return state;
      return {
        ...state,
        activeVisualAction: {
          ...act,
          machineState: ACTION_MACHINE_STATES.INTERACTING,
        },
      };
    }

    case 'PAUSE_VISUAL_ACTION': {
      if (!state.activeVisualAction) return state;
      return {
        ...state,
        activeVisualAction: { ...state.activeVisualAction, paused: true },
      };
    }

    case 'RESUME_VISUAL_ACTION': {
      if (!state.activeVisualAction) return state;
      return {
        ...state,
        activeVisualAction: { ...state.activeVisualAction, paused: false },
      };
    }

    case 'ADVANCE_VISUAL_ACTION': {
      const act = state.activeVisualAction;
      if (!act || act.paused || act.machineState !== ACTION_MACHINE_STATES.INTERACTING) return state;

      const stage = act.stages[act.stageIndex];
      if (!stage) return { ...state, activeVisualAction: null, currentActivity: 'idle' };

      const nextElapsed = act.stageElapsedMs + (action.deltaMs ?? 100);
      if (nextElapsed < stage.durationMs) {
        return {
          ...state,
          activeVisualAction: { ...act, stageElapsedMs: nextElapsed },
        };
      }

      // Move to next stage if any
      if (act.stageIndex + 1 < act.stages.length) {
        return {
          ...state,
          activeVisualAction: {
            ...act,
            stageIndex: act.stageIndex + 1,
            stageElapsedMs: 0,
            machineState: ACTION_MACHINE_STATES.WALKING,
          },
        };
      }

      // Final stage completed -> apply real game state updates once!
      const cleared = { ...state, activeVisualAction: null };
      if (act.id === 'sleep') {
        return gameReducer(cleared, { type: 'GO_SLEEP' });
      }
      if (act.careId) {
        return gameReducer(cleared, { type: 'DO_CARE', careId: act.careId });
      }
      if (act.id === 'study') {
        return gameReducer(cleared, { type: 'DO_STUDY', subject: act.meta?.subject ?? 'Study Session' });
      }
      if (act.id === 'cook') {
        const foodId = act.meta?.foodId ?? 'pancakes';
        return gameReducer(cleared, { type: 'SERVE_FOOD', foodId });
      }
      if (act.id === 'play' || act.id === 'draw' || act.id === 'music_dance' || act.id === 'garden') {
        return gameReducer(cleared, {
          type: 'DO_PLAY',
          activityName: act.label,
          happinessGain: 20,
        });
      }
      return gameReducer(cleared, { type: 'DO_ACTION', actionId: act.actionId ?? 'hug' });
    }

    case 'MANUAL_SAVE': {
      const ok = saveGame(state);
      return {
        ...state,
        notification: {
          message: ok ? 'Game progress saved! 💾' : 'Could not save to browser storage.',
          type: ok ? 'success' : 'error',
        },
      };
    }

    case 'TRIGGER_ANIMATION':
      return {
        ...state,
        currentActivity: action.activity ?? 'idle',
        lastInteraction: { actionId: 'play', duration: action.duration ?? 3500, timestamp: Date.now() },
      };

    case 'COMPLETE_MINIGAME': {
      const { gameId, scoreMeta, rewardItems } = action;
      const day = getVirtualDay(state.clock.virtualMinutes);
      const mg = state.miniGames ?? { plays: 0, claimedDaily: {}, bestScores: {} };
      const canClaim = canClaimDailyMiniGameReward(mg, gameId, day) || gameId === 'cooking';
      const nextInventory = canClaim && rewardItems
        ? mergeInventoryItems(state.inventory, rewardItems)
        : state.inventory;
      const nextClaimed = canClaim
        ? { ...(mg.claimedDaily ?? {}), [gameId]: day }
        : (mg.claimedDaily ?? {});
      const nextMiniGames = {
        ...mg,
        plays: (mg.plays ?? 0) + 1,
        claimedDaily: nextClaimed,
        bestScores: { ...(mg.bestScores ?? {}), [gameId]: scoreMeta ?? true },
      };

      const n = { ...state.needs };
      n.happiness = Math.min(100, n.happiness + 18);
      n.social = Math.min(100, n.social + 10);

      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'play', label: `${gameId} mini-game` },
        day,
        state.clock.virtualMinutes
      );
      const nextStats = {
        ...state.stats,
        playCount: (state.stats.playCount ?? 0) + 1,
        ...(gameId === 'cooking' ? { mealsServed: (state.stats.mealsServed ?? 0) } : {}),
      };

      const updated = {
        ...state,
        needs: n,
        inventory: nextInventory,
        miniGames: nextMiniGames,
        stats: nextStats,
        activityHistory: newHistory,
        celebrationTrigger: (state.celebrationTrigger ?? 0) + 1,
        currentActivity: 'celebrating',
        lastInteraction: { actionId: 'play', duration: 3000, timestamp: Date.now() },
      };

      return applyPhase5Progression(updated, {
        bondCategory: canClaim ? 'play' : null,
        routineKey: 'played',
        milestoneId: 'first_play',
        baseNotification: {
          message: canClaim ? `🌟 ${gameId} won! Reward added to inventory!` : `✨ ${gameId} completed!`,
          type: 'success',
        },
        telemetry: { type: 'playing', label: `${gameId} mini-game`, room: 'playroom', durationSec: 25 },
        coinsDelta: canClaim ? 15 : 4,
      });
    }

    case 'CHANGE_OUTFIT': {
      const day = getVirtualDay(state.clock.virtualMinutes);
      const newHistory = addActivityEvent(
        state.activityHistory,
        { type: 'dressed', label: action.outfitId },
        day,
        state.clock.virtualMinutes
      );
      const updated = {
        ...state,
        selectedOutfit: action.outfitId,
        lastOutfitChangeAt: Date.now(),
        activityHistory: newHistory,
      };
      return applyPhase5Progression(updated, {
        milestoneId: action.outfitId !== 'casual' ? 'first_outfit' : null,
        telemetry: { type: 'dressed', label: `Wore ${action.outfitId}`, room: 'wardrobe', durationSec: 5 },
        coinsDelta: 3,
      });
    }

    case 'UPDATE_SETTINGS': {
      const nextSettings = { ...state.settings, ...action.settings };
      const season = getSeasonFromDay(state.clock.virtualMinutes, nextSettings.seasonOverride);
      const nextWeather = advanceWeather(
        state.weather,
        state.clock.virtualMinutes,
        season.id,
        nextSettings.weatherOverride
      );
      const nextDecor = state.unlockedDecor.includes(season.decorId)
        ? state.unlockedDecor
        : [...state.unlockedDecor, season.decorId];
      return {
        ...state,
        settings: nextSettings,
        weather: nextWeather,
        unlockedDecor: nextDecor,
      };
    }

    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    case 'SET_DIALOGUE':
      return { ...state, dialogueKey: action.key, dialogueLastKey: action.key, dialogueLastTime: Date.now() };

    case 'LOAD_WORLD_STATE':
      return buildInitialState(action.saved);

    default:
      return state;
  }
}

const CARE_EFFECTS = {
  bath:      { hygiene: 40, happiness: 10 },
  brush:     { hygiene: 10, happiness: 5  },
  washface:  { hygiene: 12, happiness: 5  },
  comphair:  { hygiene: 8,  happiness: 8  },
  skincare:  { hygiene: 10, health: 5     },
};

const CARE_MESSAGES = {
  bath:     'Pranavi feels so fresh and clean! 🛁',
  brush:    'Pranavi brushed her teeth! 🪥',
  washface: 'Pranavi washed her face! 💦',
  comphair: 'Pranavi combed her hair! ✨',
  skincare: 'Pranavi did her skincare! 🌸',
};

function getActionMessage(actionId) {
  const msgs = {
    feed:'Pranavi enjoyed her meal! 🍽️', water:'Pranavi had some water! 💧',
    play:'Pranavi had so much fun! 🎮', talk:'Pranavi loved the conversation! 💬',
    bathe:'Pranavi feels fresh and clean! 🛁', study:'Pranavi studied hard! 📚',
    sleep:'Pranavi is resting now... 💤', rest:'Pranavi is taking a break~ 🌸',
    medicine:'Pranavi took her medicine! 💊', care:'Pranavi feels cared for! 💕',
    hug:'Pranavi loved the hug! 🤗',
  };
  return msgs[actionId] ?? 'Action completed!';
}

export function GameProvider({ children, uid = null, telemetryUser = null }) {
  const saved = uid ? null : loadGame();
  const [state, dispatch] = useReducer(gameReducer, saved, buildInitialState);
  const [cloudLoaded, setCloudLoaded] = useState(!uid);
  const [isWalkingLive, setIsWalkingLive] = useState(false);
  const tickRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const sessionIdRef = useRef(getOrCreateTabSessionId());
  const sessionStartRef = useRef(new Date().toISOString());
  const lastHbSentMsRef = useRef(Date.now());
  const cachedTokenRef = useRef('');
  const lastReportedEvRef = useRef(null);

  useEffect(() => {
    const onWalkState = (ev) => setIsWalkingLive(Boolean(ev.detail?.isWalking));
    window.addEventListener('hlw:walking-state', onWalkState);
    return () => window.removeEventListener('hlw:walking-state', onWalkState);
  }, []);

  // Refresh & cache Firebase ID token cleanly so pagehide/beforeunload keepalive can close session synchronously
  useEffect(() => {
    if (!uid || !telemetryUser?.getIdToken) return;
    let active = true;
    telemetryUser.getIdToken().then(t => {
      if (active && t) cachedTokenRef.current = t;
    }).catch(() => {});
    return () => { active = false; };
  }, [uid, telemetryUser]);

  // Presence heartbeat (~30s), instant state sync (debounced on room/activity transitions), & cleanup
  useEffect(() => {
    if (!uid || !telemetryUser || !cloudLoaded) return;
    const sessionId = sessionIdRef.current;
    const startedAt = sessionStartRef.current;
    lastHbSentMsRef.current = Date.now();

    const dispatchHeartbeat = (includeElapsed = true) => {
      const nowMs = Date.now();
      const rawDeltaSec = includeElapsed ? Math.round((nowMs - lastHbSentMsRef.current) / 1000) : 0;
      const elapsedDeltaSec = document.visibilityState === 'hidden'
        ? 0
        : Math.max(0, Math.min(45, rawDeltaSec));
      lastHbSentMsRef.current = nowMs;

      const curState = stateRef.current;
      const liveInfo = deriveLiveActivity(curState, isWalkingLive, nowMs);
      sendTelemetryHeartbeat({
        user: telemetryUser,
        sessionId,
        startedAt,
        elapsedDeltaSec,
        room: curState.currentRoom,
        activity: liveInfo.activity,
        activityLabel: liveInfo.label,
        state: curState,
      }).then(res => {
        if (res?.idToken) cachedTokenRef.current = res.idToken;
      });
    };

    dispatchHeartbeat(false);
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        dispatchHeartbeat(true);
      } else {
        lastHbSentMsRef.current = Date.now();
      }
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastHbSentMsRef.current = Date.now();
        dispatchHeartbeat(false);
      }
    };
    const handleOnline = () => dispatchHeartbeat(false);
    const handleClose = () => {
      const finalDelta = document.visibilityState === 'hidden'
        ? 0
        : Math.max(0, Math.min(45, Math.round((Date.now() - lastHbSentMsRef.current) / 1000)));
      sendTelemetrySessionEnd({
        idToken: cachedTokenRef.current,
        sessionId,
        elapsedDeltaSec: finalDelta,
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    window.addEventListener('pagehide', handleClose);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pagehide', handleClose);
      handleClose();
    };
  }, [uid, telemetryUser, cloudLoaded]);

  // Debounced sync when room, active visual stage, cooking, sleeping, or walking status changes
  const liveInfoNow = deriveLiveActivity(state, isWalkingLive);
  useEffect(() => {
    if (!uid || !telemetryUser || !cloudLoaded) return;
    const t = setTimeout(() => {
      const curState = stateRef.current;
      const info = deriveLiveActivity(curState, isWalkingLive);
      sendTelemetryHeartbeat({
        user: telemetryUser,
        sessionId: sessionIdRef.current,
        startedAt: sessionStartRef.current,
        elapsedDeltaSec: 0,
        room: curState.currentRoom,
        activity: info.activity,
        activityLabel: info.label,
        state: curState,
      }).then(res => {
        if (res?.idToken) cachedTokenRef.current = res.idToken;
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [uid, telemetryUser, cloudLoaded, state.currentRoom, liveInfoNow.activity, liveInfoNow.label, isWalkingLive]);

  // Discrete gameplay event & milestone telemetry recorder (no movement-frame spam)
  useEffect(() => {
    const ev = state.lastTelemetryEvent;
    if (!uid || !telemetryUser || !cloudLoaded || !ev || !ev.eventId) return;
    if (lastReportedEvRef.current === ev.eventId) return;
    lastReportedEvRef.current = ev.eventId;
    recordActivityTelemetry({ user: telemetryUser, event: ev });
  }, [uid, telemetryUser, cloudLoaded, state.lastTelemetryEvent]);

  // Load authenticated user's isolated cloud world (with legacy migration if first cloud login)
  useEffect(() => {
    if (!uid) return;
    let active = true;
    loadUserWorld(uid).then((cloudData) => {
      if (!active) return;
      if (cloudData) {
        dispatch({ type: 'LOAD_WORLD_STATE', saved: cloudData });
      }
      setCloudLoaded(true);
    });
    return () => { active = false; };
  }, [uid]);

  useEffect(() => {
    tickRef.current = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // Auto-clear non-sleep activities
  useEffect(() => {
    const { currentActivity, lastInteraction } = state;
    if (!lastInteraction || currentActivity === 'idle' || currentActivity === 'sleeping') return;
    const duration = lastInteraction.duration ?? ACTION_DURATIONS[lastInteraction.actionId] ?? 3000;
    const id = setTimeout(() => dispatch({ type: 'CLEAR_ACTIVITY' }), duration);
    return () => clearTimeout(id);
  }, [state.lastInteraction]);

  // Unlock Web Audio on first user interaction (browser autoplay policy compliant)
  useEffect(() => {
    const unlock = () => audioService.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Sync audio preferences
  useEffect(() => {
    audioService.updatePrefs({
      musicOn: state.settings?.musicOn ?? true,
      sfxOn: state.settings?.sfxOn ?? true,
      muted: state.settings?.muted ?? false,
      musicVolume: state.settings?.musicVolume ?? 0.5,
      sfxVolume: state.settings?.sfxVolume ?? 0.65,
    });
  }, [
    state.settings?.musicOn,
    state.settings?.sfxOn,
    state.settings?.muted,
    state.settings?.musicVolume,
    state.settings?.sfxVolume,
  ]);

  // Auto-save every 30s and on state changes (debounced lightly via unmount + periodic save)
  useEffect(() => {
    const id = setInterval(() => saveGame(state), 15000);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => {
    if (!cloudLoaded) return;
    if (uid) {
      saveUserWorld(uid, state);
    } else {
      saveGame(state);
    }
  }, [
    uid, cloudLoaded,
    state.needs, state.currentRoom, state.selectedOutfit, state.guardianLevel,
    state.diaryEntries, state.memories, state.unlockedAchievements,
    state.completedEvents, state.relationship.bondPoints, state.unlockedDecor,
    state.unlockedStickers, state.unlockedThemes, state.selectedTheme,
    state.settings, state.weather, state.miniGames,
    state.roomPositions, state.movementMode,
    state.coins, state.visitedRooms,
  ]);

  // Play room transition SFX smoothly
  const prevRoomRef = useRef(state.currentRoom);
  useEffect(() => {
    if (prevRoomRef.current !== state.currentRoom) {
      prevRoomRef.current = state.currentRoom;
      audioService.playSfx('transition');
    }
  }, [state.currentRoom]);

  useEffect(() => {
    if (!state.notification) return;
    const id = setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 3200);
    return () => clearTimeout(id);
  }, [state.notification]);

  // Auto-generate diary entry at end of each virtual day (11 PM)
  const currentHour = Math.floor(state.clock.virtualMinutes / 60) % 24;
  useEffect(() => {
    if (currentHour === 23) dispatch({ type: 'GENERATE_DIARY', manual: false });
  }, [currentHour]);

  const timeOfDay = getTimeOfDay(state.clock.virtualMinutes);
  const season = getSeasonFromDay(state.clock.virtualMinutes, state.settings?.seasonOverride);
  const characterState = deriveFullCharacterState(state.needs, state.currentActivity, timeOfDay, state.isSleeping);

  // Adaptive BGM track based on time of day, room, weather, and celebration
  const isCelebrating = state.currentActivity === 'celebrating';
  useEffect(() => {
    const track = resolveMusicCategory({
      timeOfDay,
      room: state.currentRoom,
      weatherId: state.weather?.current ?? 'sunny',
      isCelebrating,
    });
    audioService.setMusicTrack(track);
  }, [timeOfDay, state.currentRoom, state.weather?.current, isCelebrating]);

  return (
    <GameContext.Provider value={{ state, dispatch, timeOfDay, season, characterState }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
