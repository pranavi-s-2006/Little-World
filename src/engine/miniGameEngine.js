// miniGameEngine.js — logic for Memory Match and Color Match

// ── MEMORY MATCH ──────────────────────────────────────────────────────────
const CARD_SYMBOLS = ['🌸','🍓','🌈','⭐','🦋','🍦','🎀','🌻'];

export function createMemoryDeck() {
  const pairs = [...CARD_SYMBOLS, ...CARD_SYMBOLS];
  // Fisher-Yates shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }));
}

export function flipCard(cards, id) {
  return cards.map(c => c.id === id ? { ...c, flipped: true } : c);
}

export function checkMatch(cards) {
  const flipped = cards.filter(c => c.flipped && !c.matched);
  if (flipped.length !== 2) return { cards, matched: false, complete: false };
  const [a, b] = flipped;
  const matched = a.symbol === b.symbol;
  const newCards = cards.map(c =>
    (c.id === a.id || c.id === b.id)
      ? { ...c, matched, flipped: matched }
      : c
  );
  const complete = newCards.every(c => c.matched);
  return { cards: newCards, matched, complete };
}

export function unflipUnmatched(cards) {
  return cards.map(c => c.matched ? c : { ...c, flipped: false });
}

// ── COLOR MATCH ───────────────────────────────────────────────────────────
const COLORS = [
  { id: 'pink',     label: 'Pink',     hex: '#ff85aa' },
  { id: 'lavender', label: 'Lavender', hex: '#c9a8ff' },
  { id: 'mint',     label: 'Mint',     hex: '#9ecf9e' },
  { id: 'peach',    label: 'Peach',    hex: '#f4845f' },
  { id: 'sky',      label: 'Sky Blue', hex: '#90c8f0' },
  { id: 'yellow',   label: 'Yellow',   hex: '#ffd700' },
  { id: 'coral',    label: 'Coral',    hex: '#ff7043' },
  { id: 'lilac',    label: 'Lilac',    hex: '#e8d5ff' },
];

export function createColorRound() {
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  const target = shuffled[0];
  const options = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);
  return { target, options };
}

// ── SLIDING PUZZLE (3x3) ──────────────────────────────────────────────────
const SOLVED_PUZZLE = [1, 2, 3, 4, 5, 6, 7, 8, 0];

export const PUZZLE_TILES = {
  1: '🌸', 2: '🍓', 3: '🌈',
  4: '🦋', 5: '🎀', 6: '⭐',
  7: '🌷', 8: '🍰', 0: '',
};

export function isPuzzleSolved(board) {
  return board.every((v, i) => v === SOLVED_PUZZLE[i]);
}

export function canMoveTile(board, index) {
  const emptyIdx = board.indexOf(0);
  const r1 = Math.floor(index / 3), c1 = index % 3;
  const r2 = Math.floor(emptyIdx / 3), c2 = emptyIdx % 3;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

export function moveTile(board, index) {
  if (!canMoveTile(board, index)) return board;
  const emptyIdx = board.indexOf(0);
  const next = [...board];
  [next[index], next[emptyIdx]] = [next[emptyIdx], next[index]];
  return next;
}

export function createSolvablePuzzle(scrambleMoves = 24) {
  let board = [...SOLVED_PUZZLE];
  let lastEmpty = -1;
  for (let i = 0; i < scrambleMoves; i++) {
    const emptyIdx = board.indexOf(0);
    const neighbors = [];
    for (let idx = 0; idx < 9; idx++) {
      if (idx !== lastEmpty && canMoveTile(board, idx)) neighbors.push(idx);
    }
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)] ?? 0;
    lastEmpty = emptyIdx;
    board = moveTile(board, pick);
  }
  if (isPuzzleSolved(board)) board = moveTile(board, 7);
  return board;
}

// ── COOKING MINI-GAME RECIPES ─────────────────────────────────────────────
export const COOKING_RECIPES = [
  {
    id: 'pancakes',
    name: 'Fluffy Berry Pancakes',
    emoji: '🥞',
    ingredients: ['🥚 Egg', '🌾 Flour', '🍓 Strawberries'],
    steps: ['Whisk batter gently', 'Pour onto warm pan', 'Top with berries & honey'],
    rewardItems: { pancakes: 1 },
  },
  {
    id: 'smoothie',
    name: 'Pastel Fruit Smoothie',
    emoji: '🥤',
    ingredients: ['🍓 Strawberries', '🥛 Milk', '🍯 Honey'],
    steps: ['Wash sweet berries', 'Blend until creamy', 'Add a cute straw'],
    rewardItems: { smoothie: 1 },
  },
  {
    id: 'cake',
    name: 'Strawberry Shortcake',
    emoji: '🍰',
    ingredients: ['🍰 Sponge', '🍦 Cream', '🍓 Berries'],
    steps: ['Layer soft sponge', 'Spread whipped cream', 'Decorate with berries'],
    rewardItems: { cake: 1 },
  },
];

export function canClaimDailyMiniGameReward(miniGamesState = {}, gameId, day) {
  const claimed = miniGamesState.claimedDaily?.[gameId];
  return claimed !== day;
}

export { COLORS };
