// visualActionEngine.js — Centralized Visual Action State Machine & Activity Definitions
// State machine: IDLE -> WALKING -> INTERACTING -> COMPLETION -> IDLE

export const ACTION_MACHINE_STATES = {
  IDLE: 'IDLE',
  WALKING: 'WALKING',
  INTERACTING: 'INTERACTING',
  PAUSED: 'PAUSED',
  COMPLETION: 'COMPLETION',
};

export const VISUAL_ACTIONS = {
  cook: {
    id: 'cook',
    label: 'Cooking',
    icon: '🍳',
    requiredRoom: 'kitchen',
    actionId: 'feed',
    stages: [
      {
        id: 'prep_chop',
        label: 'Chopping fresh ingredients~',
        targetPos: { x: 40, y: 26 },
        durationMs: 2400,
        pose: 'chopping',
        expression: 'happy',
        prop: 'chopping_board',
        objectEffect: 'counter_ingredients',
      },
      {
        id: 'cook_stir',
        label: 'Stirring the simmering pan~',
        targetPos: { x: 56, y: 26 },
        durationMs: 2800,
        pose: 'stirring',
        expression: 'excited',
        prop: 'cooking_pan',
        objectEffect: 'stove_steam',
      },
      {
        id: 'plate_serve',
        label: 'Plating the warm meal! ✨',
        targetPos: { x: 52, y: 24 },
        durationMs: 1400,
        pose: 'serving',
        expression: 'veryHappy',
        prop: 'plated_meal',
        objectEffect: 'table_plate',
      },
    ],
  },

  feed: {
    id: 'feed',
    label: 'Eating Meal',
    icon: '🍽️',
    requiredRoom: 'kitchen',
    actionId: 'feed',
    stages: [
      {
        id: 'sit_eat',
        label: 'Sitting at the dining table & eating~',
        targetPos: { x: 52, y: 24 },
        durationMs: 3600,
        pose: 'eating_utensil',
        expression: 'eating',
        prop: 'spoon_plate',
        objectEffect: 'food_portion_shrink',
      },
      {
        id: 'finish_meal',
        label: 'Yummy! Finished the meal! 💕',
        targetPos: { x: 52, y: 24 },
        durationMs: 1100,
        pose: 'celebrating',
        expression: 'veryHappy',
        prop: 'empty_plate',
        objectEffect: null,
      },
    ],
  },

  water: {
    id: 'water',
    label: 'Drinking Water',
    icon: '💧',
    requiredRoom: 'kitchen',
    actionId: 'water',
    stages: [
      {
        id: 'drink_sip',
        label: 'Sipping refreshing water~',
        targetPos: { x: 58, y: 24 },
        durationMs: 2600,
        pose: 'drinking_glass',
        expression: 'drinking',
        prop: 'water_glass',
        objectEffect: 'water_level_drop',
      },
    ],
  },

  brush: {
    id: 'brush',
    label: 'Brushing Teeth',
    icon: '🪥',
    requiredRoom: 'bathroom',
    actionId: 'brush',
    careId: 'brush',
    stages: [
      {
        id: 'brush_teeth',
        label: 'Brushing teeth in front of mirror~',
        targetPos: { x: 64, y: 22 },
        durationMs: 2800,
        pose: 'brushing_teeth',
        expression: 'happy',
        prop: 'toothbrush_foam',
        objectEffect: 'mirror_active',
      },
      {
        id: 'rinse_mouth',
        label: 'Rinsing fresh and clean! ✨',
        targetPos: { x: 64, y: 22 },
        durationMs: 1300,
        pose: 'rinsing',
        expression: 'veryHappy',
        prop: 'water_splash',
        objectEffect: null,
      },
    ],
  },

  bathe: {
    id: 'bathe',
    label: 'Taking a Bath',
    icon: '🛁',
    requiredRoom: 'bathroom',
    actionId: 'bathe',
    careId: 'bath',
    stages: [
      {
        id: 'bath_soak',
        label: 'Warm bubbly bath & shower~',
        targetPos: { x: 36, y: 22 },
        durationMs: 3200,
        pose: 'bathing_bubbles',
        expression: 'happy',
        prop: 'shower_bubbles',
        objectEffect: 'tub_bubbles_active',
      },
      {
        id: 'bath_dry',
        label: 'Drying off with a fluffy towel~',
        targetPos: { x: 48, y: 22 },
        durationMs: 1500,
        pose: 'towel_dry',
        expression: 'veryHappy',
        prop: 'fluffy_towel',
        objectEffect: null,
      },
    ],
  },

  washface: {
    id: 'washface',
    label: 'Washing Face',
    icon: '💦',
    requiredRoom: 'bathroom',
    actionId: 'washface',
    careId: 'washface',
    stages: [
      {
        id: 'splash_face',
        label: 'Splashing cool water on face~',
        targetPos: { x: 64, y: 22 },
        durationMs: 2400,
        pose: 'rinsing',
        expression: 'happy',
        prop: 'water_splash',
        objectEffect: 'mirror_active',
      },
    ],
  },

  comphair: {
    id: 'comphair',
    label: 'Combing Hair',
    icon: '💇',
    requiredRoom: 'bathroom',
    actionId: 'comphair',
    careId: 'comphair',
    stages: [
      {
        id: 'comb_hair',
        label: 'Combing silky hair gently~',
        targetPos: { x: 64, y: 22 },
        durationMs: 2600,
        pose: 'combing_hair',
        expression: 'happy',
        prop: 'hair_comb',
        objectEffect: 'mirror_active',
      },
    ],
  },

  skincare: {
    id: 'skincare',
    label: 'Skincare Routine',
    icon: '🌸',
    requiredRoom: 'bathroom',
    actionId: 'care',
    careId: 'skincare',
    stages: [
      {
        id: 'apply_skincare',
        label: 'Applying gentle pastel skincare~',
        targetPos: { x: 64, y: 22 },
        durationMs: 2600,
        pose: 'skincare_pat',
        expression: 'happy',
        prop: 'skincare_puff',
        objectEffect: 'mirror_active',
      },
    ],
  },

  sleep: {
    id: 'sleep',
    label: 'Going to Sleep',
    icon: '💤',
    requiredRoom: 'bedroom',
    actionId: 'sleep',
    stages: [
      {
        id: 'get_in_bed',
        label: 'Tucking into the cozy bed~',
        targetPos: { x: 34, y: 28 },
        durationMs: 2200,
        pose: 'sleeping_bed',
        expression: 'sleeping',
        prop: 'cozy_blanket',
        objectEffect: 'bed_sleep_active',
      },
    ],
  },

  rest: {
    id: 'rest',
    label: 'Resting',
    icon: '🌸',
    requiredRoom: 'bedroom',
    actionId: 'rest',
    stages: [
      {
        id: 'rest_bed',
        label: 'Taking a peaceful rest~',
        targetPos: { x: 34, y: 28 },
        durationMs: 2800,
        pose: 'sleeping_bed',
        expression: 'resting',
        prop: 'cozy_blanket',
        objectEffect: null,
      },
    ],
  },

  study: {
    id: 'study',
    label: 'Studying & Reading',
    icon: '📚',
    requiredRoom: 'study',
    actionId: 'study',
    stages: [
      {
        id: 'read_book',
        label: 'Opening book & reading carefully~',
        targetPos: { x: 48, y: 24 },
        durationMs: 2400,
        pose: 'reading_desk',
        expression: 'studying',
        prop: 'open_book',
        objectEffect: 'desk_book_open',
      },
      {
        id: 'write_notes',
        label: 'Writing neat study notes~',
        targetPos: { x: 48, y: 24 },
        durationMs: 2400,
        pose: 'writing_desk',
        expression: 'studying',
        prop: 'pencil_notebook',
        objectEffect: 'desk_book_open',
      },
      {
        id: 'finish_study',
        label: 'Closing book — proud of today! 🌟',
        targetPos: { x: 48, y: 24 },
        durationMs: 1000,
        pose: 'celebrating',
        expression: 'veryHappy',
        prop: null,
        objectEffect: null,
      },
    ],
  },

  play: {
    id: 'play',
    label: 'Playing with Toys',
    icon: '🧸',
    requiredRoom: 'playroom',
    actionId: 'play',
    stages: [
      {
        id: 'play_toy',
        label: 'Playing joyfully with teddy! 🧸',
        targetPos: { x: 42, y: 24 },
        durationMs: 3000,
        pose: 'playing_toy',
        expression: 'laughing',
        prop: 'teddy_toy',
        objectEffect: 'toy_bounce',
      },
    ],
  },

  draw: {
    id: 'draw',
    label: 'Drawing Art',
    icon: '🎨',
    requiredRoom: 'playroom',
    actionId: 'play',
    stages: [
      {
        id: 'paint_easel',
        label: 'Painting a pastel picture~ 🎨',
        targetPos: { x: 64, y: 24 },
        durationMs: 3000,
        pose: 'drawing_easel',
        expression: 'happy',
        prop: 'paintbrush_palette',
        objectEffect: null,
      },
    ],
  },

  music_dance: {
    id: 'music_dance',
    label: 'Music & Dancing',
    icon: '🎵',
    requiredRoom: 'playroom',
    actionId: 'play',
    stages: [
      {
        id: 'dance_notes',
        label: 'Dancing happily to the music! 🎶',
        targetPos: { x: 52, y: 24 },
        durationMs: 3200,
        pose: 'dancing',
        expression: 'veryHappy',
        prop: 'music_notes',
        objectEffect: null,
      },
    ],
  },

  garden: {
    id: 'garden',
    label: 'Watering Garden',
    icon: '🌷',
    requiredRoom: 'garden',
    actionId: 'play',
    stages: [
      {
        id: 'water_flowers',
        label: 'Watering the flowers gently~ 💧',
        targetPos: { x: 50, y: 32 },
        durationMs: 2600,
        pose: 'watering_can',
        expression: 'happy',
        prop: 'watering_can_drops',
        objectEffect: 'garden_water_drops',
      },
      {
        id: 'observe_blooms',
        label: 'Admiring the blooming garden! 🌸',
        targetPos: { x: 50, y: 32 },
        durationMs: 1400,
        pose: 'celebrating',
        expression: 'veryHappy',
        prop: null,
        objectEffect: null,
      },
    ],
  },
};

export function getVisualAction(actionKey) {
  return VISUAL_ACTIONS[actionKey] ?? null;
}

export function createVisualActionSession(actionKey, overrides = {}) {
  const def = getVisualAction(actionKey);
  if (!def) return null;
  return {
    id: def.id,
    label: overrides.label ?? def.label,
    icon: overrides.icon ?? def.icon,
    requiredRoom: def.requiredRoom,
    actionId: def.actionId,
    careId: def.careId ?? null,
    meta: overrides.meta ?? null,
    machineState: ACTION_MACHINE_STATES.WALKING,
    stageIndex: 0,
    stageElapsedMs: 0,
    stages: def.stages,
    paused: false,
    startedAt: Date.now(),
  };
}
