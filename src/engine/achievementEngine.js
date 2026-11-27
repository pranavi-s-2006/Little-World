// achievementEngine.js — Evaluates achievement conditions strictly against real state
import { ACHIEVEMENTS } from '../data/achievementsData.js';
import { formatVirtualDate } from './timeEngine.js';

export const INITIAL_STATS = {
  conversations: 0,
  mealsServed: 0,
  playCount: 0,
  sleepRoutines: 0,
  flowersPlanted: 0,
  flowersWatered: 0,
  flowersCollected: 0,
  studyCount: 0,
  eventsCompleted: 0,
  dailyRoutineDay: 1,
  dailyRoutine: {
    ate: false,
    studied: false,
    played: false,
    bathed: false,
    talked: false,
  },
};

export function buildInitialStats(saved = null) {
  if (!saved) return { ...INITIAL_STATS, dailyRoutine: { ...INITIAL_STATS.dailyRoutine } };
  return {
    ...INITIAL_STATS,
    ...saved,
    dailyRoutine: {
      ...INITIAL_STATS.dailyRoutine,
      ...(saved.dailyRoutine ?? {}),
    },
  };
}

export function markDailyRoutine(stats, key, day) {
  const sameDay = stats.dailyRoutineDay === day;
  const baseRoutine = sameDay
    ? stats.dailyRoutine
    : { ate: false, studied: false, played: false, bathed: false, talked: false };
  return {
    ...stats,
    dailyRoutineDay: day,
    dailyRoutine: {
      ...baseRoutine,
      [key]: true,
    },
  };
}

export function evaluateAchievements(state, virtualMinutes) {
  const unlocked = state.unlockedAchievements ?? [];
  const unlockedIds = new Set(unlocked.map(a => a.id));
  const ctx = {
    stats: state.stats ?? INITIAL_STATS,
    dailyRoutine: state.stats?.dailyRoutine ?? {},
    unlockedOutfits: state.unlockedOutfits ?? [],
    memories: state.memories ?? [],
    guardianLevel: state.guardianLevel ?? 1,
  };

  const newlyUnlocked = [];
  for (const ach of ACHIEVEMENTS) {
    if (unlockedIds.has(ach.id)) continue;
    const progress = ach.getProgress(ctx);
    if (progress >= ach.target) {
      newlyUnlocked.push({
        id: ach.id,
        title: ach.title,
        icon: ach.icon,
        unlockedAt: Date.now(),
        virtualDate: formatVirtualDate(virtualMinutes),
        rewardSticker: ach.rewardSticker ?? null,
        rewardItems: ach.rewardItems ?? null,
        rewardTheme: ach.rewardTheme ?? null,
      });
    }
  }

  return {
    unlockedAchievements: newlyUnlocked.length > 0 ? [...unlocked, ...newlyUnlocked] : unlocked,
    newlyUnlocked,
  };
}

export function getAchievementProgressList(state) {
  const unlockedMap = new Map((state.unlockedAchievements ?? []).map(a => [a.id, a]));
  const ctx = {
    stats: state.stats ?? INITIAL_STATS,
    dailyRoutine: state.stats?.dailyRoutine ?? {},
    unlockedOutfits: state.unlockedOutfits ?? [],
    memories: state.memories ?? [],
    guardianLevel: state.guardianLevel ?? 1,
  };

  return ACHIEVEMENTS.map(ach => {
    const unlockedRecord = unlockedMap.get(ach.id) ?? null;
    const rawProgress = ach.getProgress(ctx);
    const current = Math.min(ach.target, Math.max(0, rawProgress));
    return {
      ...ach,
      unlocked: Boolean(unlockedRecord),
      unlockedRecord,
      current,
      percent: Math.round((current / ach.target) * 100),
    };
  });
}
