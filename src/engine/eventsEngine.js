// eventsEngine.js — Selects active & upcoming virtual-clock events without repetition
import { SPECIAL_EVENTS } from '../data/eventsData.js';
import { getVirtualDay } from './timeEngine.js';

export function isEventCompletedForDay(completedEvents = [], eventId, day) {
  return completedEvents.some(e => e.id === eventId && e.day === day);
}

export function getActiveDailyEvent(virtualMinutes, completedEvents = [], ctx = {}) {
  const day = getVirtualDay(virtualMinutes);
  const hour = Math.floor(virtualMinutes / 60) % 24;

  const matching = SPECIAL_EVENTS.filter(ev =>
    ev.dayMatch(day, hour, ctx) && !isEventCompletedForDay(completedEvents, ev.id, day)
  );
  return matching[0] ?? null;
}

export function getEventsOverview(virtualMinutes, completedEvents = [], ctx = {}) {
  const day = getVirtualDay(virtualMinutes);
  const hour = Math.floor(virtualMinutes / 60) % 24;

  return SPECIAL_EVENTS.map(ev => {
    const completedToday = isEventCompletedForDay(completedEvents, ev.id, day);
    const completedEver = completedEvents.some(e => e.id === ev.id);
    const isAvailableNow = ev.dayMatch(day, hour, ctx) && !completedToday;
    return {
      ...ev,
      isAvailableNow,
      completedToday,
      completedEver,
    };
  });
}
