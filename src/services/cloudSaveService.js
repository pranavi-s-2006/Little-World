// cloudSaveService.js — Per-user Firestore cloud saves + safe localStorage migration
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseClient.js';
import { loadGame as loadLocalLegacy, saveGame as saveLocal } from './saveService.js';

export async function loadUserWorld(uid) {
  if (!uid) return loadLocalLegacy();

  // Check UID-scoped local cache first
  const scopedKey = `hlw_save_v3_${uid}`;
  let localScoped = null;
  try {
    const raw = localStorage.getItem(scopedKey);
    localScoped = raw ? JSON.parse(raw) : null;
  } catch {
    localScoped = null;
  }

  if (!isFirebaseConfigured || !db) {
    return localScoped;
  }

  try {
    const ref = doc(db, 'users', uid, 'gameState', 'current');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const cloudData = snap.data();
      // Prefer whichever has a newer savedAt timestamp if both exist
      if (localScoped?.savedAt && cloudData?.savedAt && localScoped.savedAt > cloudData.savedAt) {
        return localScoped;
      }
      try {
        localStorage.setItem(scopedKey, JSON.stringify(cloudData));
      } catch {}
      return cloudData;
    }

    // Careful migration: only migrate anonymous legacy save if no cloud save exists yet
    // and mark it as migrated so it is not duplicated into another user's account
    const legacy = loadLocalLegacy();
    const migratedKey = 'hlw_legacy_migrated_uid';
    const alreadyMigratedTo = localStorage.getItem(migratedKey);
    if (legacy && (!alreadyMigratedTo || alreadyMigratedTo === uid)) {
      const migrated = { ...legacy, ownerUid: uid, migratedAt: Date.now() };
      await setDoc(ref, migrated, { merge: true });
      localStorage.setItem(migratedKey, uid);
      localStorage.setItem(scopedKey, JSON.stringify(migrated));
      return migrated;
    }

    return localScoped;
  } catch (err) {
    console.warn('Cloud load failed, falling back to UID-scoped local cache:', err);
    return localScoped;
  }
}

export async function saveUserWorld(uid, state) {
  if (!uid) {
    return saveLocal(state);
  }

  const payload = {
    ownerUid:             uid,
    needs:                state.needs,
    clock:                state.clock,
    currentRoom:          state.currentRoom,
    roomPositions:        state.roomPositions,
    movementMode:         state.movementMode,
    selectedOutfit:       state.selectedOutfit,
    unlockedOutfits:      state.unlockedOutfits,
    guardianXP:           state.guardianXP,
    guardianLevel:        state.guardianLevel,
    diaryEntries:         state.diaryEntries,
    activityHistory:      state.activityHistory,
    inventory:            state.inventory,
    garden:               state.garden,
    relationship:         state.relationship,
    memories:             state.memories,
    unlockedAchievements: state.unlockedAchievements,
    stats:                state.stats,
    completedEvents:      state.completedEvents,
    unlockedStickers:     state.unlockedStickers,
    unlockedDecor:        state.unlockedDecor,
    unlockedThemes:       state.unlockedThemes,
    selectedTheme:        state.selectedTheme,
    rewardHistory:        state.rewardHistory,
    weather:              state.weather,
    miniGames:            state.miniGames,
    settings:             state.settings,
    dialogueLastKey:      state.dialogueLastKey,
    dialogueLastTime:     state.dialogueLastTime,
    savedAt:              Date.now(),
  };

  try {
    localStorage.setItem(`hlw_save_v3_${uid}`, JSON.stringify(payload));
  } catch {}

  if (!isFirebaseConfigured || !db) return true;

  try {
    const ref = doc(db, 'users', uid, 'gameState', 'current');
    await setDoc(ref, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Cloud save failed:', err);
    return false;
  }
}
