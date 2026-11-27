// relationshipEngine.js
// Meaningful bonding progression, anti-farming cooldowns & diminishing returns,
// and 6-tier Guardian Levels with rewards.

export const GUARDIAN_LEVELS = [
  {
    level: 1,
    title: 'New Guardian',
    minBond: 0,
    badge: '🌱',
    description: 'Just beginning your gentle journey together in Her Little World.',
    reward: null,
  },
  {
    level: 2,
    title: 'Kind Guardian',
    minBond: 60,
    badge: '🌸',
    description: 'Pranavi lights up whenever you visit and care for her.',
    reward: {
      id: 'reward_lv2',
      label: 'Cozy Sweater Outfit + Strawberry Sticker',
      outfitId: 'cozy',
      sticker: '🍓',
      items: { cookies: 2 },
    },
  },
  {
    level: 3,
    title: 'Caring Guardian',
    minBond: 140,
    badge: '🎀',
    description: 'She trusts you deeply and loves sharing her thoughts with you.',
    reward: {
      id: 'reward_lv3',
      label: 'Fairy Lights Decor + Lavender Scrapbook Theme',
      decorId: 'fairy_lights',
      themeId: 'lavender',
      sticker: '🦋',
      items: { lavender_seed: 2 },
    },
  },
  {
    level: 4,
    title: 'Trusted Guardian',
    minBond: 250,
    badge: '💎',
    description: 'Your thoughtful care makes every day feel safe and bright.',
    reward: {
      id: 'reward_lv4',
      label: 'Garden Party Dress + Polaroid Garland Decor',
      outfitId: 'garden',
      decorId: 'polaroid_garland',
      sticker: '🌷',
      items: { cake: 1, smoothie: 2 },
    },
  },
  {
    level: 5,
    title: 'Best Companion',
    minBond: 400,
    badge: '🌟',
    description: 'You are her favorite person in the whole wide world.',
    reward: {
      id: 'reward_lv5',
      label: 'Starlight Cream Scrapbook Theme + Crown Sticker',
      themeId: 'starlight',
      sticker: '👑',
      decorId: 'flower_vase',
      items: { cherry_seed: 2 },
    },
  },
  {
    level: 6,
    title: 'Forever Bond',
    minBond: 600,
    badge: '💖',
    description: 'An unbreakable bond woven from countless warm memories.',
    reward: {
      id: 'reward_lv6',
      label: 'Baby Blue Sky Theme + Forever Heart Charm',
      themeId: 'skyblue',
      sticker: '💖',
      decorId: 'star_mobile',
      items: { cake: 2, icecream: 2 },
    },
  },
];

export const INITIAL_RELATIONSHIP = {
  trust: 15,
  affection: 15,
  interactionHappiness: 15,
  familiarity: 15,
  emotionalConnection: 12,
  bondPoints: 0,
  cooldowns: {}, // { [category]: { lastTime, dailyCount, dailyDay } }
};

// Cooldown in ms & daily soft caps to prevent click-farming
const INTERACTION_RULES = {
  talk:    { cooldownMs: 25000, maxFullPerDay: 3, maxSoftPerDay: 6, gains: { trust: 2.5, affection: 2.5, interactionHappiness: 2,   familiarity: 3.5, emotionalConnection: 3,   bond: 14 } },
  play:    { cooldownMs: 30000, maxFullPerDay: 3, maxSoftPerDay: 5, gains: { trust: 2,   affection: 3,   interactionHappiness: 4,   familiarity: 2.5, emotionalConnection: 2.5, bond: 16 } },
  study:   { cooldownMs: 30000, maxFullPerDay: 2, maxSoftPerDay: 4, gains: { trust: 3.5, affection: 2,   interactionHappiness: 1.5, familiarity: 3,   emotionalConnection: 2.5, bond: 16 } },
  meal:    { cooldownMs: 25000, maxFullPerDay: 3, maxSoftPerDay: 6, gains: { trust: 3,   affection: 3,   interactionHappiness: 3,   familiarity: 2,   emotionalConnection: 2.5, bond: 15 } },
  care:    { cooldownMs: 30000, maxFullPerDay: 2, maxSoftPerDay: 4, gains: { trust: 3.5, affection: 2.5, interactionHappiness: 2,   familiarity: 2,   emotionalConnection: 2.5, bond: 14 } },
  sleep:   { cooldownMs: 45000, maxFullPerDay: 2, maxSoftPerDay: 3, gains: { trust: 3.5, affection: 3,   interactionHappiness: 2,   familiarity: 2,   emotionalConnection: 3.5, bond: 16 } },
  hug:     { cooldownMs: 35000, maxFullPerDay: 2, maxSoftPerDay: 4, gains: { trust: 2,   affection: 3.5, interactionHappiness: 3,   familiarity: 1.5, emotionalConnection: 3,   bond: 12 } },
  garden:  { cooldownMs: 25000, maxFullPerDay: 3, maxSoftPerDay: 5, gains: { trust: 2,   affection: 2,   interactionHappiness: 2.5, familiarity: 2,   emotionalConnection: 2.5, bond: 12 } },
  event:   { cooldownMs: 5000,  maxFullPerDay: 2, maxSoftPerDay: 3, gains: { trust: 5,   affection: 6,   interactionHappiness: 6,   familiarity: 4,   emotionalConnection: 6,   bond: 28 } },
};

function clampAttr(v) {
  return Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
}

export function buildInitialRelationship(saved = null) {
  if (!saved) return { ...INITIAL_RELATIONSHIP, cooldowns: {} };
  return {
    trust:                saved.trust                ?? INITIAL_RELATIONSHIP.trust,
    affection:            saved.affection            ?? INITIAL_RELATIONSHIP.affection,
    interactionHappiness: saved.interactionHappiness ?? INITIAL_RELATIONSHIP.interactionHappiness,
    familiarity:          saved.familiarity          ?? INITIAL_RELATIONSHIP.familiarity,
    emotionalConnection:  saved.emotionalConnection  ?? INITIAL_RELATIONSHIP.emotionalConnection,
    bondPoints:           saved.bondPoints           ?? 0,
    cooldowns:            saved.cooldowns            ?? {},
  };
}

export function getGuardianLevelFromBond(bondPoints = 0) {
  let current = GUARDIAN_LEVELS[0];
  for (const lvl of GUARDIAN_LEVELS) {
    if (bondPoints >= lvl.minBond) current = lvl;
  }
  const nextLvl = GUARDIAN_LEVELS.find(l => l.level === current.level + 1) ?? null;
  const span = nextLvl ? nextLvl.minBond - current.minBond : 1;
  const progress = nextLvl
    ? Math.min(100, Math.max(0, Math.round(((bondPoints - current.minBond) / span) * 100)))
    : 100;

  return {
    ...current,
    bondPoints,
    next: nextLvl ? nextLvl.minBond : null,
    nextTitle: nextLvl ? nextLvl.title : null,
    progress,
  };
}

// Check whether the interaction directly addressed an active need
function getNeedResponsivenessBonus(category, needs) {
  if (!needs) return 1;
  if (category === 'meal'  && needs.hunger > 55)     return 1.35;
  if (category === 'sleep' && needs.energy < 35)     return 1.35;
  if (category === 'care'  && (needs.hygiene < 45 || needs.health < 70)) return 1.35;
  if ((category === 'talk' || category === 'hug') && (needs.happiness < 45 || needs.social < 45)) return 1.35;
  if (category === 'play'  && needs.happiness < 55)  return 1.25;
  return 1;
}

export function applyBondInteraction(relationship, category, { day = 1, now = Date.now(), needs = null } = {}) {
  const rel = buildInitialRelationship(relationship);
  const rule = INTERACTION_RULES[category];
  if (!rule) return { relationship: rel, gained: 0, throttled: false, reason: null };

  const prevCd = rel.cooldowns[category] ?? { lastTime: 0, dailyCount: 0, dailyDay: day };
  const isNewDay = prevCd.dailyDay !== day;
  const dailyCount = isNewDay ? 0 : prevCd.dailyCount;
  const elapsed = now - prevCd.lastTime;

  // Cooldown guard against rapid clicking
  if (elapsed < rule.cooldownMs) {
    return {
      relationship: rel,
      gained: 0,
      throttled: true,
      reason: 'cooldown',
      remainingSec: Math.ceil((rule.cooldownMs - elapsed) / 1000),
    };
  }

  // Daily diminishing returns guard
  if (dailyCount >= rule.maxSoftPerDay) {
    return {
      relationship: {
        ...rel,
        cooldowns: {
          ...rel.cooldowns,
          [category]: { lastTime: now, dailyCount, dailyDay: day },
        },
      },
      gained: 0,
      throttled: true,
      reason: 'daily_cap',
    };
  }

  const diminishing = dailyCount < rule.maxFullPerDay ? 1 : 0.4;
  const needMult = getNeedResponsivenessBonus(category, needs);
  const mult = diminishing * needMult;

  const bondGain = Math.max(1, Math.round(rule.gains.bond * mult));
  const updated = {
    trust:                clampAttr(rel.trust + rule.gains.trust * mult),
    affection:            clampAttr(rel.affection + rule.gains.affection * mult),
    interactionHappiness: clampAttr(rel.interactionHappiness + rule.gains.interactionHappiness * mult),
    familiarity:          clampAttr(rel.familiarity + rule.gains.familiarity * mult),
    emotionalConnection:  clampAttr(rel.emotionalConnection + rule.gains.emotionalConnection * mult),
    bondPoints:           rel.bondPoints + bondGain,
    cooldowns: {
      ...rel.cooldowns,
      [category]: {
        lastTime: now,
        dailyCount: dailyCount + 1,
        dailyDay: day,
      },
    },
  };

  return {
    relationship: updated,
    gained: bondGain,
    needBonus: needMult > 1,
    throttled: false,
    reason: null,
  };
}
