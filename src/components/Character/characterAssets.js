// characterAssets.js
// ─────────────────────────────────────────────────────────────────────────────
// ASSET REGISTRY — Character state & outfit configuration
// Uses the animated SVG CharacterRenderer for all states (never raw JPG).
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTER_ASSETS = {
  idle:       null,
  happy:      null,
  veryHappy:  null,
  excited:    null,
  sad:        null,
  crying:     null,
  bored:      null,
  hungry:     null,
  sleepy:     null,
  sleeping:   null,
  tired:      null,
  sick:       null,
  recovering: null,
  eating:     null,
  drinking:   null,
  walking:    null,
  playing:    null,
  studying:   null,
  bathing:    null,
  talking:    null,
  resting:    null,
};

export function getCharacterAsset(state) {
  return CHARACTER_ASSETS[state] ?? null;
}

// Outfit colour palette — default 'casual' matches girl-reference.jpg
// Pastel blue puff-sleeve dress, light blue headband, matching shoes, dark brown hair
export const OUTFIT_COLORS = {
  casual:   { primary: '#b7dbf9', secondary: '#83b8ea', trim: '#e2f1fe', shoe: '#9bc6ef', hair: '#473328', eye: '#6d3b21', headband: '#aad3f7' },
  school:   { primary: '#c8e6ff', secondary: '#5aaad4', trim: '#e8f4ff', shoe: '#4a7ba8', hair: '#473328', eye: '#6d3b21', headband: '#ffd6e7' },
  pajamas:  { primary: '#e8d5ff', secondary: '#a87de8', trim: '#f5f0ff', shoe: '#b794f4', hair: '#473328', eye: '#6d3b21', headband: '#e8d5ff' },
  summer:   { primary: '#ffd8c0', secondary: '#f4845f', trim: '#fff4ee', shoe: '#f2a488', hair: '#473328', eye: '#6d3b21', headband: '#ffd8c0' },
  princess: { primary: '#ffd6e7', secondary: '#e8638a', trim: '#fff0f5', shoe: '#f29ab8', hair: '#473328', eye: '#6d3b21', headband: '#ffd6e7' },
  sporty:   { primary: '#c8e6c8', secondary: '#6aaa6a', trim: '#f0f7f0', shoe: '#8cc48c', hair: '#473328', eye: '#6d3b21', headband: '#c8e6c8' },
  cozy:     { primary: '#ffefc8', secondary: '#e59a54', trim: '#fffdf7', shoe: '#e8b67d', hair: '#473328', eye: '#6d3b21', headband: '#ffefc8' },
  garden:   { primary: '#c8e6c8', secondary: '#6aaa6a', trim: '#f0f7f0', shoe: '#89bf89', hair: '#473328', eye: '#6d3b21', headband: '#b8d4a8' },
};
