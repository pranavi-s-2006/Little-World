// Needs simulation engine
// All values 0–100. Higher = better (except hunger: higher = more hungry)

export const INITIAL_NEEDS = {
  hunger:    20,  // 0=full, 100=starving
  happiness: 80,
  energy:    90,
  health:    100,
  hygiene:   90,
  social:    70,
};

// Decay/change rates per virtual hour
const RATES = {
  hunger:    4,    // increases per hour
  happiness: -2,   // decreases per hour
  energy:    -3,   // decreases per hour (awake)
  hygiene:   -2,   // decreases per hour
  social:    -1.5, // decreases per hour
};

export function applyNeedsDecay(needs, virtualHoursElapsed, isSleeping = false) {
  const n = { ...needs };

  if (isSleeping) {
    n.energy    = clamp(n.energy + 8 * virtualHoursElapsed);
    n.hunger    = clamp(n.hunger + 1 * virtualHoursElapsed);
    n.hygiene   = clamp(n.hygiene - 0.5 * virtualHoursElapsed);
    return n;
  }

  n.hunger    = clamp(n.hunger    + RATES.hunger    * virtualHoursElapsed);
  n.happiness = clamp(n.happiness + RATES.happiness * virtualHoursElapsed);
  n.energy    = clamp(n.energy    + RATES.energy    * virtualHoursElapsed);
  n.hygiene   = clamp(n.hygiene   + RATES.hygiene   * virtualHoursElapsed);
  n.social    = clamp(n.social    + RATES.social    * virtualHoursElapsed);

  // Health deteriorates when multiple needs are critical
  const criticalCount = [
    n.hunger > 80,
    n.happiness < 20,
    n.energy < 10,
    n.hygiene < 20,
  ].filter(Boolean).length;

  if (criticalCount >= 2) {
    n.health = clamp(n.health - 1.5 * virtualHoursElapsed);
  } else if (criticalCount === 0 && n.health < 100) {
    n.health = clamp(n.health + 0.5 * virtualHoursElapsed);
  }

  return n;
}

export function applyAction(needs, action) {
  const n = { ...needs };
  const changes = ACTION_EFFECTS[action] ?? {};
  for (const [key, delta] of Object.entries(changes)) {
    n[key] = clamp((n[key] ?? 0) + delta);
  }
  return n;
}

export const ACTION_EFFECTS = {
  feed:      { hunger: -30, happiness: 8,  energy: 5  },
  water:     { hunger: -10, happiness: 5,  health: 3  },
  play:      { happiness: 25, energy: -15, social: 15 },
  talk:      { happiness: 15, social: 20               },
  bathe:     { hygiene: 40,  happiness: 10             },
  study:     { happiness: -5, energy: -10              },
  sleep:     { energy: 50,   hunger: 5                 },
  rest:      { energy: 20,   happiness: 5              },
  medicine:  { health: 30,   happiness: -5             },
  care:      { health: 20,   happiness: 10, social: 10 },
  hug:       { happiness: 20, social: 15               },
};

// Full state derivation — used by behaviourEngine, not directly by UI
export function deriveCharacterState(needs, currentActivity) {
  if (currentActivity && currentActivity !== 'idle') return currentActivity;
  if (needs.energy < 15)    return 'sleepy';
  if (needs.hunger > 75)    return 'hungry';
  if (needs.health < 40)    return 'sick';
  if (needs.health < 65)    return 'recovering';
  if (needs.happiness > 85) return 'veryHappy';
  if (needs.happiness > 65) return 'happy';
  if (needs.happiness < 30) return 'sad';
  if (needs.hygiene < 25)   return 'bored';
  if (needs.social < 20)    return 'sad';
  if (needs.energy < 30)    return 'tired';
  return 'idle';
}

function clamp(val, min = 0, max = 100) {
  return Math.min(max, Math.max(min, val));
}
