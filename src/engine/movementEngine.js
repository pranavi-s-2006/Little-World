// movementEngine.js — Free character positioning, walkable bounds, defaults, and activity targets

export const ROOM_WALKABLE_BOUNDS = {
  bedroom:      { minX: 10, maxX: 90, minY: 12, maxY: 38 },
  living:       { minX: 10, maxX: 90, minY: 12, maxY: 35 },
  kitchen:      { minX: 10, maxX: 90, minY: 12, maxY: 34 },
  bathroom:     { minX: 12, maxX: 88, minY: 12, maxY: 30 },
  study:        { minX: 10, maxX: 90, minY: 12, maxY: 34 },
  playroom:     { minX: 10, maxX: 90, minY: 12, maxY: 35 },
  garden:       { minX: 10, maxX: 90, minY: 14, maxY: 42 },
  wardrobe:     { minX: 15, maxX: 85, minY: 6,  maxY: 22 },
  activities:   { minX: 15, maxX: 85, minY: 6,  maxY: 22 },
  diary:        { minX: 15, maxX: 85, minY: 6,  maxY: 22 },
  memories:     { minX: 15, maxX: 85, minY: 6,  maxY: 22 },
  bond:         { minX: 15, maxX: 85, minY: 6,  maxY: 22 },
  achievements: { minX: 15, maxX: 85, minY: 6,  maxY: 22 },
};

export const ROOM_DEFAULT_POSITIONS = {
  bedroom:      { x: 50, y: 28, facing: 'right' },
  living:       { x: 38, y: 26, facing: 'right' },
  kitchen:      { x: 70, y: 26, facing: 'left'  },
  bathroom:     { x: 36, y: 22, facing: 'right' },
  study:        { x: 44, y: 24, facing: 'right' },
  playroom:     { x: 50, y: 24, facing: 'right' },
  garden:       { x: 50, y: 34, facing: 'right' },
  wardrobe:     { x: 50, y: 8,  facing: 'right' },
  activities:   { x: 50, y: 8,  facing: 'right' },
  diary:        { x: 50, y: 8,  facing: 'right' },
  memories:     { x: 50, y: 8,  facing: 'right' },
  bond:         { x: 50, y: 8,  facing: 'right' },
  achievements: { x: 50, y: 8,  facing: 'right' },
};

export const ROOM_CHARACTER_HEIGHT = {
  bedroom: '250px',
  living: '235px',
  kitchen: '225px',
  bathroom: '215px',
  study: '230px',
  playroom: '235px',
  garden: '215px',
  wardrobe: '220px',
  activities: '205px',
  diary: '205px',
  memories: '205px',
  bond: '205px',
  achievements: '205px',
};

// Optional activity destination inside its matching room
export const ACTIVITY_ROOM_TARGETS = {
  feed:  { room: 'kitchen',  x: 52, y: 24 },
  water: { room: 'kitchen',  x: 58, y: 24 },
  sleep: { room: 'bedroom',  x: 34, y: 28 },
  rest:  { room: 'bedroom',  x: 34, y: 28 },
  study: { room: 'study',    x: 48, y: 24 },
  play:  { room: 'playroom', x: 50, y: 24 },
  bathe: { room: 'bathroom', x: 36, y: 22 },
};

export function clampPositionToRoom(room, x, y) {
  const b = ROOM_WALKABLE_BOUNDS[room] ?? ROOM_WALKABLE_BOUNDS.bedroom;
  const clampedX = Math.round(Math.min(b.maxX, Math.max(b.minX, x)) * 10) / 10;
  const clampedY = Math.round(Math.min(b.maxY, Math.max(b.minY, y)) * 10) / 10;
  return { x: clampedX, y: clampedY };
}

export function buildInitialRoomPositions(saved = null) {
  const out = {};
  for (const [room, def] of Object.entries(ROOM_DEFAULT_POSITIONS)) {
    const s = saved?.[room];
    if (s && typeof s.x === 'number' && typeof s.y === 'number') {
      const clamped = clampPositionToRoom(room, s.x, s.y);
      out[room] = {
        x: clamped.x,
        y: clamped.y,
        facing: s.facing === 'left' ? 'left' : 'right',
      };
    } else {
      out[room] = { ...def };
    }
  }
  return out;
}

export function getRoomPosition(roomPositions, room) {
  return roomPositions?.[room] ?? ROOM_DEFAULT_POSITIONS[room] ?? { x: 50, y: 25, facing: 'right' };
}

export function computeFacing(fromX, toX, currentFacing = 'right') {
  if (Math.abs(toX - fromX) < 0.8) return currentFacing;
  return toX < fromX ? 'left' : 'right';
}

export function pointerToRoomPercent(clientX, clientY, containerRect, room) {
  if (!containerRect || containerRect.width <= 0 || containerRect.height <= 0) {
    return getRoomPosition(null, room);
  }
  const relX = ((clientX - containerRect.left) / containerRect.width) * 100;
  // bottom % = distance from bottom of container
  const relYBottom = ((containerRect.bottom - clientY) / containerRect.height) * 100;
  return clampPositionToRoom(room, relX, relYBottom);
}
