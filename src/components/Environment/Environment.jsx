import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherInfo } from '../../engine/weatherEngine.js';
import { SEASONS } from '../../engine/seasonEngine.js';
import './Environment.css';

// Sky gradients per time of day
const SKY_THEMES = {
  morning: {
    sky: 'linear-gradient(180deg, #ffd6a5 0%, #ffb3cc 40%, #fff0f5 100%)',
    light: 'rgba(255, 200, 100, 0.15)',
    stars: false,
    sun: true,
    moon: false,
  },
  afternoon: {
    sky: 'linear-gradient(180deg, #87ceeb 0%, #c8e6ff 60%, #e8f4ff 100%)',
    light: 'rgba(255, 255, 200, 0.1)',
    stars: false,
    sun: true,
    moon: false,
  },
  evening: {
    sky: 'linear-gradient(180deg, #ff7043 0%, #ff8a65 30%, #ffb74d 60%, #ffe0b2 100%)',
    light: 'rgba(255, 150, 50, 0.2)',
    stars: false,
    sun: true,
    moon: false,
  },
  night: {
    sky: 'linear-gradient(180deg, #0d0d2b 0%, #1a1a3e 40%, #2d2b55 100%)',
    light: 'rgba(100, 100, 200, 0.1)',
    stars: true,
    sun: false,
    moon: true,
  },
};

const QUALITY_COUNTS = { low: 0.45, medium: 0.75, high: 1.0 };

const STAR_POSITIONS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 11) % 94) + 3,
  y: ((i * 23 + 7) % 55) + 3,
  size: (i % 3) + 1.5,
  delay: (i % 5) * 0.6,
}));

function Stars({ dimmed }) {
  if (dimmed) return null;
  return (
    <div className="stars-layer">
      {STAR_POSITIONS.map(s => (
        <motion.div
          key={s.id}
          className="star"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + s.delay, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </div>
  );
}

function Clouds({ timeOfDay, weatherId }) {
  if (timeOfDay === 'night' && weatherId === 'sunny') return null;
  const isHeavy = weatherId === 'cloudy' || weatherId === 'rainy' || weatherId === 'heavy_rain' || weatherId === 'thunderstorm';
  const count = isHeavy ? 5 : weatherId === 'partly_cloudy' ? 4 : 2;
  const clouds = [
    { id: 1, y: 7,  size: 90,  duration: 42, delay: 0   },
    { id: 2, y: 15, size: 68,  duration: 56, delay: -14 },
    { id: 3, y: 4,  size: 110, duration: 68, delay: -28 },
    { id: 4, y: 20, size: 84,  duration: 48, delay: -20 },
    { id: 5, y: 11, size: 96,  duration: 60, delay: -40 },
  ].slice(0, count);

  return (
    <div className={`clouds-layer ${isHeavy ? 'clouds-layer--heavy' : ''}`}>
      {clouds.map(c => (
        <motion.div
          key={c.id}
          className="cloud"
          style={{ top: `${c.y}%`, width: c.size, height: c.size * 0.5 }}
          animate={{ x: ['-140px', 'calc(100vw + 140px)'] }}
          initial={{ x: `${c.delay * -8}px` }}
          transition={{ duration: c.duration, repeat: Infinity, ease: 'linear', delay: c.delay }}
        />
      ))}
    </div>
  );
}

// High-performance canvas layer for weather + seasonal + celebration particles
function AtmosphericCanvas({
  weatherInfo,
  seasonId,
  timeOfDay,
  room,
  weatherEffectsOn,
  ambientOn,
  reducedMotion,
  quality,
  celebrationTrigger,
}) {
  const canvasRef = useRef(null);
  const fireworksRef = useRef([]);

  useEffect(() => {
    if (!celebrationTrigger || reducedMotion) return;
    const colors = ['#ff85aa', '#c084fc', '#ffd700', '#90c8f0', '#98e6b8'];
    const cx = (0.25 + Math.random() * 0.5) * window.innerWidth;
    const cy = (0.18 + Math.random() * 0.28) * window.innerHeight;
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.15;
      const speed = 1.8 + Math.random() * 3.4;
      fireworksRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: colors[i % colors.length],
        size: 2.5 + Math.random() * 2,
      });
    }
  }, [celebrationTrigger, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (reducedMotion || (!weatherEffectsOn && !ambientOn)) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx = canvas.getContext('2d');
    let rafId = null;
    let paused = document.hidden;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onVis = () => {
      paused = document.hidden;
    };
    document.addEventListener('visibilitychange', onVis);

    const qMult = QUALITY_COUNTS[quality] ?? 0.75;
    const isOutdoor = room === 'garden';
    const roomScale = isOutdoor ? 1 : 0.45;

    const rainCount = weatherEffectsOn && weatherInfo.rainIntensity > 0
      ? Math.round((weatherInfo.rainIntensity === 2 ? 95 : 50) * qMult * (isOutdoor ? 1 : 0.55))
      : 0;
    const raindrops = Array.from({ length: rainCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 12 + Math.random() * 14,
      speed: (weatherInfo.rainIntensity === 2 ? 12 : 8.5) + Math.random() * 4,
    }));

    const snowCount = weatherEffectsOn && (weatherInfo.snowIntensity > 0 || (seasonId === 'winter' && weatherInfo.id === 'cloudy'))
      ? Math.round(45 * qMult * (isOutdoor ? 1 : 0.5))
      : 0;
    const snowflakes = Array.from({ length: snowCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2 + Math.random() * 3.5,
      speedY: 0.7 + Math.random() * 1.1,
      drift: Math.random() * Math.PI * 2,
    }));

    const petalCount = ambientOn && !weatherInfo.isRainy && (seasonId === 'spring' || seasonId === 'autumn')
      ? Math.round(18 * qMult * roomScale)
      : 0;
    const seasonalParticles = Array.from({ length: petalCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 5 + Math.random() * 5,
      speedY: 0.6 + Math.random() * 0.9,
      speedX: 0.3 + Math.random() * 0.7,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      color: seasonId === 'spring'
        ? (Math.random() > 0.3 ? 'rgba(255, 182, 208, 0.8)' : 'rgba(255, 224, 236, 0.85)')
        : (Math.random() > 0.5 ? 'rgba(244, 152, 74, 0.82)' : 'rgba(232, 192, 85, 0.82)'),
    }));

    const fireflyCount = ambientOn && timeOfDay === 'night' && !weatherInfo.isRainy && seasonId !== 'winter'
      ? Math.round(16 * qMult * (isOutdoor ? 1 : 0.4))
      : 0;
    const fireflies = Array.from({ length: fireflyCount }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height * (0.35 + Math.random() * 0.55),
      phase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    const butterflyCount = ambientOn && isOutdoor && !weatherInfo.isRainy && timeOfDay !== 'night' && (seasonId === 'summer' || seasonId === 'spring')
      ? Math.round(6 * qMult)
      : 0;
    const butterflies = Array.from({ length: butterflyCount }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: canvas.height * (0.25 + Math.random() * 0.45),
      phase: i * 1.4,
      speed: 0.7 + Math.random() * 0.6,
      color: i % 2 === 0 ? '#ffd1e6' : '#c9e8ff',
    }));

    function draw() {
      rafId = requestAnimationFrame(draw);
      if (paused) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (raindrops.length > 0) {
        ctx.strokeStyle = 'rgba(195, 225, 255, 0.52)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (const r of raindrops) {
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - 2.5, r.y + r.len);
          r.y += r.speed;
          r.x -= 1.4;
          if (r.y > canvas.height) {
            r.y = -r.len;
            r.x = Math.random() * (canvas.width + 80);
          }
        }
        ctx.stroke();
      }

      if (snowflakes.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (const s of snowflakes) {
          s.drift += 0.02;
          s.y += s.speedY;
          s.x += Math.sin(s.drift) * 0.6;
          if (s.y > canvas.height) {
            s.y = -6;
            s.x = Math.random() * canvas.width;
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const p of seasonalParticles) {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.02) * 0.5;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height + 12) {
          p.y = -12;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width + 12) p.x = -12;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const f of fireflies) {
        f.phase += 0.05;
        f.x += f.vx + Math.sin(f.phase * 0.7) * 0.25;
        f.y += f.vy + Math.cos(f.phase * 0.6) * 0.2;
        if (f.x < 0) f.x = canvas.width;
        if (f.x > canvas.width) f.x = 0;
        const glow = 0.25 + 0.75 * (Math.sin(f.phase) * 0.5 + 0.5);
        ctx.fillStyle = `rgba(255, 245, 150, ${glow})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const b of butterflies) {
        b.phase += 0.08;
        b.x += b.speed;
        b.y += Math.sin(b.phase * 0.6) * 0.8;
        if (b.x > canvas.width + 20) b.x = -20;
        const flap = Math.abs(Math.sin(b.phase * 2.2));
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(-3, 0, 4 * flap + 1, 5, -0.3, 0, Math.PI * 2);
        ctx.ellipse(3, 0, 4 * flap + 1, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (fireworksRef.current.length > 0) {
        fireworksRef.current = fireworksRef.current.filter(fw => fw.alpha > 0.03);
        for (const fw of fireworksRef.current) {
          fw.x += fw.vx;
          fw.y += fw.vy;
          fw.vy += 0.04;
          fw.alpha *= 0.965;
          ctx.globalAlpha = fw.alpha;
          ctx.fillStyle = fw.color;
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, fw.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [weatherInfo, seasonId, timeOfDay, room, weatherEffectsOn, ambientOn, reducedMotion, quality]);

  return <canvas ref={canvasRef} className="atmospheric-canvas" aria-hidden="true" />;
}

export default function Environment({
  timeOfDay,
  room,
  weatherId = 'sunny',
  seasonId = 'spring',
  settings = {},
  celebrationTrigger = 0,
}) {
  const theme = SKY_THEMES[timeOfDay] ?? SKY_THEMES.morning;
  const weatherInfo = getWeatherInfo(weatherId);
  const season = SEASONS[seasonId] ?? SEASONS.spring;
  const [lightningFlash, setLightningFlash] = useState(false);

  const weatherEffectsOn = settings.weatherEffects ?? true;
  const ambientOn = settings.ambientAnimations ?? true;
  const reducedMotion = settings.reducedMotion ?? false;
  const quality = settings.effectsQuality ?? 'medium';

  // Occasional lightning flash during thunderstorms
  useEffect(() => {
    if (!weatherInfo.lightning || !weatherEffectsOn || reducedMotion) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      if (Math.random() < 0.45) {
        setLightningFlash(true);
        setTimeout(() => setLightningFlash(false), 180);
      }
    }, 5500);
    return () => clearInterval(id);
  }, [weatherInfo.lightning, weatherEffectsOn, reducedMotion]);

  const showLightning = lightningFlash && weatherInfo.lightning && weatherEffectsOn && !reducedMotion;

  return (
    <div className={`environment environment--season-${season.id} environment--weather-${weatherInfo.id}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={timeOfDay}
          className="sky-layer"
          style={{ background: theme.sky }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        />
      </AnimatePresence>

      <div className="season-tint-overlay" style={{ background: season.skyTint }} />

      {weatherEffectsOn && (
        <div
          className="weather-tint-overlay"
          style={{
            background: weatherInfo.skyOverlay,
            opacity: weatherEffectsOn ? 1 : 0,
          }}
        />
      )}

      <div className="light-overlay" style={{ background: theme.light }} />

      {weatherEffectsOn && weatherInfo.sunRays && timeOfDay !== 'night' && !reducedMotion && (
        <div className="sun-rays-overlay" />
      )}

      {weatherEffectsOn && weatherInfo.fogOpacity > 0 && (
        <div className="fog-overlay" style={{ opacity: weatherInfo.fogOpacity }} />
      )}

      {showLightning && <div className="lightning-flash" />}

      <AnimatePresence>
        {theme.stars && <Stars dimmed={weatherInfo.darkness > 0.25} />}
      </AnimatePresence>

      {ambientOn && <Clouds timeOfDay={timeOfDay} weatherId={weatherInfo.id} />}

      {theme.sun && weatherInfo.darkness < 0.28 && (
        <motion.div
          className={`celestial sun sun--${timeOfDay}`}
          animate={reducedMotion ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      )}

      {theme.moon && weatherInfo.darkness < 0.32 && (
        <motion.div
          className="celestial moon"
          animate={reducedMotion ? {} : { y: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      )}

      <AtmosphericCanvas
        weatherInfo={weatherInfo}
        seasonId={season.id}
        timeOfDay={timeOfDay}
        room={room}
        weatherEffectsOn={weatherEffectsOn}
        ambientOn={ambientOn}
        reducedMotion={reducedMotion}
        quality={quality}
        celebrationTrigger={celebrationTrigger}
      />
    </div>
  );
}
