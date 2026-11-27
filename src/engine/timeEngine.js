// Virtual time engine
// 1 real second = SPEED virtual seconds
// Default: 1 real minute = 10 virtual minutes -> speed = 10

export const TIME_SPEED = 10; // virtual minutes per real minute
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TIME_PERIODS = {
  morning:   { start: 6,  end: 11, label: 'Morning',   sky: 'morning'   },
  afternoon: { start: 11, end: 16, label: 'Afternoon', sky: 'afternoon' },
  evening:   { start: 16, end: 19, label: 'Evening',   sky: 'evening'   },
  night:     { start: 19, end: 24, label: 'Night',     sky: 'night'     },
  lateNight: { start: 0,  end: 6,  label: 'Night',     sky: 'night'     },
};

export function createVirtualClock(savedTimestamp = null, savedVirtualMinutes = null) {
  const now = Date.now();
  return {
    realTimestamp: now,
    virtualMinutes: savedVirtualMinutes ?? 6 * 60, // Day 1 starts at 6:00 AM
    savedAt: savedTimestamp ?? now,
  };
}

export function advanceClock(clock, now = Date.now(), speed = TIME_SPEED) {
  const realElapsedMs = Math.max(0, now - clock.realTimestamp);
  const realElapsedMinutes = realElapsedMs / 60000;
  const virtualElapsed = realElapsedMinutes * speed;
  return {
    ...clock,
    realTimestamp: now,
    virtualMinutes: clock.virtualMinutes + virtualElapsed,
  };
}

export function getTimeOfDay(virtualMinutes) {
  const hour = Math.floor(virtualMinutes / 60) % 24;
  if (hour >= 6  && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'evening';
  return 'night';
}

export function formatVirtualTime(virtualMinutes) {
  const totalMins = Math.floor(virtualMinutes) % (24 * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function getVirtualDay(clock) {
  const mins = typeof clock === 'number' ? clock : (clock?.virtualMinutes ?? 0);
  return Math.floor(mins / (24 * 60)) + 1;
}

export function getDayName(day, short = false) {
  const list = short ? SHORT_DAY_NAMES : DAY_NAMES;
  return list[(Math.max(1, day) - 1) % 7];
}

export function formatVirtualDate(virtualMinutes) {
  const day = getVirtualDay(virtualMinutes);
  const dayName = getDayName(day, true);
  const timeStr = formatVirtualTime(virtualMinutes);
  return `${dayName} · Day ${day} · ${timeStr}`;
}
