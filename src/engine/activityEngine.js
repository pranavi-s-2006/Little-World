import { ACTIVITIES } from '../data/activities.js';

export function startActivity(state, activityId) {
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) return state;
  return {
    ...state,
    currentActivity: activityId,
    activityStartTime: state.clock.virtualMinutes,
    activityDuration: activity.duration,
  };
}

export function completeActivity(state, activityId) {
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) return state;
  const needs = { ...state.needs };
  if (activity.happiness) needs.happiness = clamp(needs.happiness + activity.happiness);
  if (activity.energy)    needs.energy    = clamp(needs.energy    + activity.energy);
  if (activity.social)    needs.social    = clamp(needs.social    + activity.social);
  return { ...state, needs, currentActivity: 'idle', activityStartTime: null };
}

function clamp(v) { return Math.min(100, Math.max(0, v)); }
