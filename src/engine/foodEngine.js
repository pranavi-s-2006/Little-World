// foodEngine.js — helpers for meal timing suggestions
import { getTimeOfDay } from './timeEngine.js';

export function getSuggestedCategory(virtualMinutes) {
  const hour = Math.floor(virtualMinutes / 60) % 24;
  if (hour >= 6  && hour < 10) return 'breakfast';
  if (hour >= 12 && hour < 14) return 'lunch';
  if (hour >= 15 && hour < 17) return 'snack';
  if (hour >= 19 && hour < 22) return 'dinner';
  return 'snack';
}

export function getMealLabel(virtualMinutes) {
  const cat = getSuggestedCategory(virtualMinutes);
  return { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }[cat] ?? 'Meal';
}
