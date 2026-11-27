// diaryEngine.js — generates grounded diary entries from actual recorded activities
import { getDayName, formatVirtualTime, getTimeOfDay } from './timeEngine.js';

const MOOD_INFO = {
  veryHappy: { label: 'Overjoyed',  emoji: '🌟' },
  happy:     { label: 'Happy',      emoji: '💕' },
  excited:   { label: 'Excited',    emoji: '✨' },
  sad:       { label: 'Lonely',     emoji: '💜' },
  crying:    { label: 'Tearful',    emoji: '💧' },
  hungry:    { label: 'Hungry',     emoji: '🍽️' },
  sleepy:    { label: 'Sleepy',     emoji: '😴' },
  tired:     { label: 'Tired',      emoji: '🌙' },
  sick:      { label: 'Unwell',     emoji: '🤒' },
  peaceful:  { label: 'Peaceful',   emoji: '🌸' },
  content:   { label: 'Content',    emoji: '✿'  },
};

export function resolveDiaryMood(needs, characterState) {
  if (MOOD_INFO[characterState]) return MOOD_INFO[characterState];
  if ((needs?.happiness ?? 50) > 85) return MOOD_INFO.veryHappy;
  if ((needs?.happiness ?? 50) > 65) return MOOD_INFO.happy;
  if ((needs?.happiness ?? 50) < 30) return MOOD_INFO.sad;
  if ((needs?.energy ?? 50) < 20)    return MOOD_INFO.tired;
  return MOOD_INFO.peaceful;
}

function formatList(items) {
  const unique = [...new Set(items.filter(Boolean))];
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(', ')}, and ${unique[unique.length - 1]}`;
}

export function buildDiaryNarrative(dayEvents, needs, dayName) {
  if (dayEvents.length === 0) {
    return `${dayName} has been peaceful and quiet so far. I am spending time in my little world, waiting to see what we do together~`;
  }

  const parts = [];
  const woke     = dayEvents.find(e => e.type === 'woke');
  const ate      = dayEvents.filter(e => e.type === 'ate');
  const drank    = dayEvents.filter(e => e.type === 'drank');
  const studied  = dayEvents.filter(e => e.type === 'studied');
  const played   = dayEvents.filter(e => e.type === 'played');
  const talked   = dayEvents.filter(e => e.type === 'talked');
  const hugged   = dayEvents.find(e => e.type === 'hugged');
  const bathed   = dayEvents.filter(e => e.type === 'bathed');
  const planted  = dayEvents.filter(e => e.type === 'planted');
  const watered  = dayEvents.find(e => e.type === 'watered');
  const harvested= dayEvents.filter(e => e.type === 'harvested');
  const dressed  = dayEvents.find(e => e.type === 'dressed');
  const slept    = dayEvents.find(e => e.type === 'slept');
  const special  = dayEvents.filter(e => e.type === 'event');

  // Morning opening only if waking or morning meal actually happened
  if (woke) {
    parts.push('I woke up feeling refreshed today!');
  } else if (ate.some(e => e.timeOfDay === 'morning')) {
    parts.push('I started my morning with a lovely breakfast!');
  }

  if (ate.length > 0) {
    const foods = formatList(ate.map(e => e.label));
    parts.push(`I enjoyed ${foods} — it was so delicious!`);
  }

  if (drank.length > 0) {
    const drinks = formatList(drank.map(e => e.label));
    parts.push(`I had ${drinks} to stay refreshed.`);
  }

  if (studied.length > 0) {
    const subjects = formatList(studied.map(e => e.label));
    parts.push(`I spent time studying ${subjects}. I feel proud of myself!`);
  }

  if (played.length > 0) {
    const games = formatList(played.map(e => e.label));
    parts.push(`We played ${games} together today. I had so much fun!`);
  }

  if (talked.length > 0) {
    parts.push(`We had a warm, heartfelt conversation together.`);
  } else if (hugged) {
    parts.push(`You gave me such a comforting hug today.`);
  }

  if (planted.length > 0 || harvested.length > 0 || watered) {
    if (harvested.length > 0) {
      parts.push(`My garden bloomed! I collected ${formatList(harvested.map(e => e.label))}.`);
    } else if (planted.length > 0) {
      parts.push(`I planted ${formatList(planted.map(e => e.label))} in the garden!`);
    } else {
      parts.push(`I watered the flowers in my little garden.`);
    }
  }

  if (bathed.length > 0) {
    parts.push(`I freshened up and felt cozy and clean.`);
  }

  if (dressed) {
    parts.push(`I tried on my ${dressed.label} outfit today.`);
  }

  if (special.length > 0) {
    parts.push(`Today's special moment was ${formatList(special.map(e => e.label))}!`);
  }

  if (slept) {
    parts.push(`I got tucked in for a peaceful rest.`);
  }

  const closing = (needs?.happiness ?? 50) > 75
    ? 'Today was a beautiful day. I am happy you spent time with me!'
    : (needs?.happiness ?? 50) > 45
    ? 'It was a gentle, cozy day in my little world~'
    : 'Today felt a bit heavy, but having you near still means a lot.';

  parts.push(closing);
  return parts.join(' ');
}

export function buildDiaryEntry(activityHistory, needs, day, options = {}) {
  const dayName = getDayName(day, false);
  const dayEvents = activityHistory.filter(e => e.day === day);
  const virtualMinutes = options.virtualMinutes ?? ((day - 1) * 1440 + 12 * 60);
  const timeOfDay = options.timeOfDay ?? getTimeOfDay(virtualMinutes);
  const timeLabel = options.timeLabel ?? formatVirtualTime(virtualMinutes);
  const mood = resolveDiaryMood(needs, options.characterState);

  const signature = `${day}:${dayEvents.length}:${dayEvents.map(e => `${e.type}-${e.label}`).join('|')}`;
  const text = buildDiaryNarrative(dayEvents, needs, dayName);

  // Pick decorative stickers matching what happened
  const stickers = ['✿'];
  if (dayEvents.some(e => e.type === 'played'))  stickers.push('⭐');
  if (dayEvents.some(e => e.type === 'studied')) stickers.push('📚');
  if (dayEvents.some(e => e.type === 'ate'))     stickers.push('🍓');
  if (dayEvents.some(e => e.type === 'planted' || e.type === 'watered' || e.type === 'harvested')) stickers.push('🌷');
  if (dayEvents.some(e => e.type === 'talked' || e.type === 'hugged')) stickers.push('💖');
  if (dayEvents.some(e => e.type === 'event'))   stickers.push('🎀');

  return {
    id: `diary-day-${day}`,
    day,
    dayName,
    dateLabel: `${dayName} · Day ${day}`,
    timeLabel,
    timeOfDay,
    mood: mood.label,
    moodEmoji: mood.emoji,
    eventCount: dayEvents.length,
    activities: dayEvents.slice(-10).map(e => ({ type: e.type, label: e.label, timeLabel: e.timeLabel })),
    stickers: [...new Set(stickers)].slice(0, 5),
    signature,
    text,
    timestamp: Date.now(),
  };
}

export function upsertDiaryEntry(diaryEntries, newEntry) {
  const existingIdx = diaryEntries.findIndex(e => e.day === newEntry.day);
  if (existingIdx >= 0) {
    const existing = diaryEntries[existingIdx];
    // Prevent duplicate identical entry overwrites
    if (existing.signature === newEntry.signature && existing.text === newEntry.text) {
      return { entries: diaryEntries, changed: false };
    }
    const updated = [...diaryEntries];
    updated[existingIdx] = {
      ...existing,
      ...newEntry,
      pinnedStickers: existing.pinnedStickers ?? [],
    };
    return { entries: updated, changed: true };
  }
  return {
    entries: [{ ...newEntry, pinnedStickers: [] }, ...diaryEntries].slice(0, 60),
    changed: true,
  };
}

export function addActivityEvent(history, event, day, virtualMinutes = null) {
  const timeOfDay = virtualMinutes != null ? getTimeOfDay(virtualMinutes) : 'day';
  const timeLabel = virtualMinutes != null ? formatVirtualTime(virtualMinutes) : '';
  return [
    ...history,
    {
      ...event,
      day,
      timeOfDay,
      timeLabel,
      timestamp: Date.now(),
    },
  ].slice(-200);
}
