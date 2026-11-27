// simulationEngine.js
// Orchestrates the full simulation tick:
//   - needs decay
//   - offline catch-up (capped)
//   - diary auto-entry generation

import { applyNeedsDecay } from './needsEngine.js';

const MAX_OFFLINE_HOURS = 4; // cap offline progression at 4 virtual hours

export function simulateTick(state, now) {
  const realElapsedMs = now - state.clock.realTimestamp;
  const realElapsedMinutes = realElapsedMs / 60000;
  const speed = state.settings?.speed ?? 10;

  // Cap offline time
  const maxRealMinutes = (MAX_OFFLINE_HOURS * 60) / speed;
  const cappedRealMinutes = Math.min(realElapsedMinutes, maxRealMinutes);

  const virtualHoursElapsed = (cappedRealMinutes * speed) / 60;
  const newNeeds = applyNeedsDecay(state.needs, virtualHoursElapsed, state.isSleeping);

  return { newNeeds, virtualHoursElapsed };
}

// Generate a diary entry based on the day's events
export function generateDiaryEntry(needs, timeOfDay, day) {
  const entries = [];

  if (needs.happiness > 75) entries.push("Today was such a wonderful day! I felt so happy and loved.");
  else if (needs.happiness < 30) entries.push("I felt a little sad today. I hope tomorrow is brighter.");
  else entries.push("Today was a pretty normal day. I enjoyed spending time in my little world.");

  if (needs.hunger < 30) entries.push("I had the most delicious meal today~");
  if (needs.energy > 80) entries.push("I feel so energetic and refreshed!");
  if (needs.hygiene > 85) entries.push("I took a lovely bath and feel so clean and fresh.");
  if (needs.social > 75) entries.push("Thank you for spending so much time with me today 💕");
  if (needs.health > 90) entries.push("I'm feeling really healthy and strong!");

  return {
    text: entries[Math.floor(Math.random() * entries.length)] ?? "Another day in my little world~",
    date: `Day ${day} · ${timeOfDay}`,
    timestamp: Date.now(),
  };
}
