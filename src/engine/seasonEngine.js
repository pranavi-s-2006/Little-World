// seasonEngine.js — Four-season virtual calendar system
import { getVirtualDay } from './timeEngine.js';

export const DAYS_PER_SEASON = 7;

export const SEASONS = {
  spring: {
    id: 'spring',
    name: 'Spring',
    icon: '🌸',
    badgeColor: '#ffb3cc',
    skyTint: 'rgba(255, 225, 238, 0.14)',
    houseTint: 'rgba(255, 240, 248, 0.08)',
    groundColor: '#d9f2d9',
    gardenFilter: 'saturate(1.08) brightness(1.03)',
    description: 'Cherry blossoms bloom and soft pink petals drift on the breeze.',
    decorId: 'spring_wreath',
    decorLabel: 'Cherry Blossom Wreath',
  },
  summer: {
    id: 'summer',
    name: 'Summer',
    icon: '🌻',
    badgeColor: '#ffd700',
    skyTint: 'rgba(255, 242, 180, 0.12)',
    houseTint: 'rgba(255, 250, 220, 0.06)',
    groundColor: '#c8ecc8',
    gardenFilter: 'saturate(1.16) brightness(1.06)',
    description: 'Bright golden sunshine, blue skies, and lively garden butterflies.',
    decorId: 'summer_shells',
    decorLabel: 'Seashell Wind Chime',
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn',
    icon: '🍂',
    badgeColor: '#f4a261',
    skyTint: 'rgba(255, 190, 130, 0.16)',
    houseTint: 'rgba(255, 215, 175, 0.12)',
    groundColor: '#e8d5b5',
    gardenFilter: 'sepia(0.18) saturate(1.12)',
    description: 'Golden-orange leaves flutter down into a warm, cozy house.',
    decorId: 'autumn_garland',
    decorLabel: 'Autumn Leaf Garland',
  },
  winter: {
    id: 'winter',
    name: 'Winter',
    icon: '❄️',
    badgeColor: '#a8d8ff',
    skyTint: 'rgba(180, 220, 255, 0.2)',
    houseTint: 'rgba(200, 228, 255, 0.12)',
    groundColor: '#e8f4fc',
    gardenFilter: 'hue-rotate(8deg) saturate(0.85) brightness(1.04)',
    description: 'Cool blue winter light outside with warm lamps and blankets indoors.',
    decorId: 'winter_lanterns',
    decorLabel: 'Warm Winter Lanterns',
  },
};

export const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];

export function getSeasonFromDay(virtualMinutes, override = 'auto') {
  const day = getVirtualDay(virtualMinutes);
  const year = Math.floor((day - 1) / (DAYS_PER_SEASON * 4)) + 1;
  const dayOfYear = ((day - 1) % (DAYS_PER_SEASON * 4)) + 1;
  const autoIndex = Math.floor((dayOfYear - 1) / DAYS_PER_SEASON);
  const seasonId = override && override !== 'auto' && SEASONS[override]
    ? override
    : SEASON_ORDER[autoIndex];
  const dayInSeason = ((dayOfYear - 1) % DAYS_PER_SEASON) + 1;

  return {
    ...SEASONS[seasonId],
    day,
    year,
    dayOfYear,
    dayInSeason,
    daysPerSeason: DAYS_PER_SEASON,
  };
}
