const SAVE_KEY = 'hlw_save_v3';
export const SAVE_VERSION = 7;

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      saveVersion:          SAVE_VERSION,
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
    }));
    return true;
  } catch (e) {
    console.warn('Save failed:', e);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
      ?? localStorage.getItem('hlw_save_v2')
      ?? localStorage.getItem('hlw_save_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (e) {
    console.warn('Corrupted save data detected; falling back safely:', e);
    return null;
  }
}

export function clearSave() {
  ['hlw_save_v3', 'hlw_save_v2', 'hlw_save_v1'].forEach(k => localStorage.removeItem(k));
}
