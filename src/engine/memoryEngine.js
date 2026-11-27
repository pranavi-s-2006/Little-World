// memoryEngine.js — Manages unique, event-grounded Memory Book milestones
import { formatVirtualDate, getVirtualDay } from './timeEngine.js';

export const MEMORY_MILESTONES = {
  first_hello: {
    title: 'Our First Hello',
    description: 'The very first time we sat down and talked heart-to-heart. Pranavi smiled brightly and felt truly heard.',
    category: 'Bonding',
    mood: 'Warm',
    illustration: '💬',
  },
  first_meal: {
    title: 'A Warm Meal Together',
    description: 'You prepared Pranavi’s very first meal in her little kitchen, and she savored every bite.',
    category: 'Care',
    mood: 'Happy',
    illustration: '🍽️',
  },
  first_play: {
    title: 'First Playtime Together',
    description: 'Laughter filled the house during our first play session! A memory full of joy and sparkles.',
    category: 'Play & Fun',
    mood: 'Excited',
    illustration: '🎮',
  },
  first_study: {
    title: 'First Study Session',
    description: 'Pranavi opened her notebook with your encouragement and felt so proud of what she learned.',
    category: 'Growth',
    mood: 'Proud',
    illustration: '📚',
  },
  first_garden_plant: {
    title: 'First Seed Planted',
    description: 'We tucked a tiny seed into the warm soil together, promising to watch it grow.',
    category: 'Garden',
    mood: 'Hopeful',
    illustration: '🌱',
  },
  first_garden_bloom: {
    title: 'First Garden Bloom',
    description: 'All that patient watering paid off—Pranavi gathered her first glowing flower from the garden!',
    category: 'Garden',
    mood: 'Overjoyed',
    illustration: '🌸',
  },
  first_outfit: {
    title: 'A New Outfit Moment',
    description: 'Pranavi twirled happily in front of the mirror trying on a new look from her wardrobe.',
    category: 'Style',
    mood: 'Cheerful',
    illustration: '👗',
  },
  first_sleep_routine: {
    title: 'Sweet Goodnight Routine',
    description: 'Tucked safely under soft blankets with a peaceful smile, knowing her guardian was nearby.',
    category: 'Routine',
    mood: 'Peaceful',
    illustration: '🌙',
  },
};

export function createMemoryRecord({
  milestoneId,
  title,
  description,
  category = 'Milestone',
  mood = 'Happy',
  illustration = '✨',
  virtualMinutes = 360,
}) {
  return {
    id: `mem_${milestoneId}`,
    milestoneId,
    title,
    description,
    category,
    mood,
    illustration,
    day: getVirtualDay(virtualMinutes),
    virtualDate: formatVirtualDate(virtualMinutes),
    timestamp: Date.now(),
  };
}

// Appends a one-time milestone memory only if milestoneId has not already been recorded
export function addUniqueMemory(memories, milestoneId, virtualMinutes, overrides = null) {
  if (!milestoneId) return { memories, added: null };
  if (memories.some(m => m.milestoneId === milestoneId)) {
    return { memories, added: null };
  }
  const template = MEMORY_MILESTONES[milestoneId] ?? {};
  const record = createMemoryRecord({
    milestoneId,
    title: overrides?.title ?? template.title ?? 'Special Moment',
    description: overrides?.description ?? template.description ?? 'A gentle moment shared together.',
    category: overrides?.category ?? template.category ?? 'Milestone',
    mood: overrides?.mood ?? template.mood ?? 'Happy',
    illustration: overrides?.illustration ?? template.illustration ?? '✨',
    virtualMinutes,
  });
  return {
    memories: [record, ...memories],
    added: record,
  };
}
