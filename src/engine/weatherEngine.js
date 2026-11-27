// weatherEngine.js — Balanced, virtual-clock-driven dynamic weather simulation

export const WEATHER_CONDITIONS = {
  sunny: {
    id: 'sunny',
    label: 'Sunny',
    icon: '☀️',
    description: 'Warm golden sunlight fills the world.',
    skyOverlay: 'rgba(255, 236, 179, 0.14)',
    darkness: 0,
    rainIntensity: 0,
    snowIntensity: 0,
    fogOpacity: 0,
    lightning: false,
    sunRays: true,
    isRainy: false,
  },
  partly_cloudy: {
    id: 'partly_cloudy',
    label: 'Partly Cloudy',
    icon: '⛅',
    description: 'Soft fluffy clouds drift across a bright sky.',
    skyOverlay: 'rgba(235, 244, 255, 0.12)',
    darkness: 0.04,
    rainIntensity: 0,
    snowIntensity: 0,
    fogOpacity: 0,
    lightning: false,
    sunRays: true,
    isRainy: false,
  },
  cloudy: {
    id: 'cloudy',
    label: 'Cloudy',
    icon: '☁️',
    description: 'A calm, overcast sky softens the daylight.',
    skyOverlay: 'rgba(175, 190, 215, 0.25)',
    darkness: 0.14,
    rainIntensity: 0,
    snowIntensity: 0,
    fogOpacity: 0.08,
    lightning: false,
    sunRays: false,
    isRainy: false,
  },
  rainy: {
    id: 'rainy',
    label: 'Rainy',
    icon: '🌧️',
    description: 'Gentle raindrops patter softly on the windows.',
    skyOverlay: 'rgba(115, 145, 185, 0.34)',
    darkness: 0.22,
    rainIntensity: 1,
    snowIntensity: 0,
    fogOpacity: 0.1,
    lightning: false,
    sunRays: false,
    isRainy: true,
  },
  heavy_rain: {
    id: 'heavy_rain',
    label: 'Heavy Rain',
    icon: '⛈️',
    description: 'Steady rain showers refresh the garden outside.',
    skyOverlay: 'rgba(85, 115, 160, 0.44)',
    darkness: 0.3,
    rainIntensity: 2,
    snowIntensity: 0,
    fogOpacity: 0.16,
    lightning: false,
    sunRays: false,
    isRainy: true,
  },
  thunderstorm: {
    id: 'thunderstorm',
    label: 'Thunderstorm',
    icon: '🌩️',
    description: 'Dramatic rain with occasional flashes of lightning!',
    skyOverlay: 'rgba(55, 70, 115, 0.52)',
    darkness: 0.38,
    rainIntensity: 2,
    snowIntensity: 0,
    fogOpacity: 0.18,
    lightning: true,
    sunRays: false,
    isRainy: true,
  },
  foggy: {
    id: 'foggy',
    label: 'Foggy',
    icon: '🌫️',
    description: 'A dreamy pastel mist blankets the garden.',
    skyOverlay: 'rgba(225, 232, 242, 0.38)',
    darkness: 0.1,
    rainIntensity: 0,
    snowIntensity: 0,
    fogOpacity: 0.48,
    lightning: false,
    sunRays: false,
    isRainy: false,
  },
  snowy: {
    id: 'snowy',
    label: 'Snowy',
    icon: '🌨️',
    description: 'Delicate snowflakes flutter peacefully from the sky.',
    skyOverlay: 'rgba(210, 232, 255, 0.26)',
    darkness: 0.08,
    rainIntensity: 0,
    snowIntensity: 1,
    fogOpacity: 0.12,
    lightning: false,
    sunRays: false,
    isRainy: false,
  },
};

// Seasonal probability weights (sum doesn't need to be 100, weighted random)
const SEASON_WEIGHTS = {
  spring: { sunny: 30, partly_cloudy: 28, cloudy: 14, rainy: 16, heavy_rain: 4, thunderstorm: 3, foggy: 5, snowy: 0 },
  summer: { sunny: 42, partly_cloudy: 26, cloudy: 10, rainy: 9, heavy_rain: 4, thunderstorm: 7, foggy: 2, snowy: 0 },
  autumn: { sunny: 20, partly_cloudy: 22, cloudy: 22, rainy: 16, heavy_rain: 5, thunderstorm: 3, foggy: 12, snowy: 0 },
  winter: { sunny: 16, partly_cloudy: 18, cloudy: 20, rainy: 4, heavy_rain: 0, thunderstorm: 0, foggy: 10, snowy: 32 },
};

// Duration in virtual minutes (120 = 2 virtual hours, 360 = 6 virtual hours)
function pickDurationMinutes(weatherId) {
  if (weatherId === 'thunderstorm' || weatherId === 'heavy_rain') {
    return 90 + Math.floor(Math.random() * 90); // 1.5 - 3 virtual hours
  }
  return 150 + Math.floor(Math.random() * 180); // 2.5 - 5.5 virtual hours
}

export function pickNextWeather(seasonId = 'spring', prevWeatherId = 'sunny') {
  const weights = SEASON_WEIGHTS[seasonId] ?? SEASON_WEIGHTS.spring;
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  // Slightly reduce chance of repeating the exact same weather back-to-back unless sunny
  const adjusted = entries.map(([id, w]) => [
    id,
    id === prevWeatherId && id !== 'sunny' ? Math.max(1, w * 0.45) : w,
  ]);
  const total = adjusted.reduce((acc, [, w]) => acc + w, 0);
  let r = Math.random() * total;
  for (const [id, w] of adjusted) {
    r -= w;
    if (r <= 0) return id;
  }
  return 'sunny';
}

export function createInitialWeather(virtualMinutes = 360, seasonId = 'spring') {
  return {
    current: 'sunny',
    previous: 'sunny',
    changedAtVirtualMin: virtualMinutes,
    durationVirtualMin: pickDurationMinutes('sunny'),
    seasonId,
  };
}

export function advanceWeather(weatherState, virtualMinutes, seasonId, override = 'auto') {
  const base = weatherState ?? createInitialWeather(virtualMinutes, seasonId);

  if (override && override !== 'auto' && WEATHER_CONDITIONS[override]) {
    if (base.current === override) return base;
    return {
      current: override,
      previous: base.current,
      changedAtVirtualMin: virtualMinutes,
      durationVirtualMin: 240,
      seasonId,
    };
  }

  // If snowy was active and season changed out of winter, gently transition
  if (base.current === 'snowy' && seasonId !== 'winter') {
    const next = pickNextWeather(seasonId, 'snowy');
    return {
      current: next,
      previous: base.current,
      changedAtVirtualMin: virtualMinutes,
      durationVirtualMin: pickDurationMinutes(next),
      seasonId,
    };
  }

  if (virtualMinutes < base.changedAtVirtualMin + base.durationVirtualMin) {
    return base;
  }

  const next = pickNextWeather(seasonId, base.current);
  return {
    current: next,
    previous: base.current,
    changedAtVirtualMin: virtualMinutes,
    durationVirtualMin: pickDurationMinutes(next),
    seasonId,
  };
}

export function getWeatherInfo(weatherId) {
  return WEATHER_CONDITIONS[weatherId] ?? WEATHER_CONDITIONS.sunny;
}
