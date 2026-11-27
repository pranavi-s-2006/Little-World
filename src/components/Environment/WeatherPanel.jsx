import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherInfo } from '../../engine/weatherEngine.js';
import { getSeasonFromDay } from '../../engine/seasonEngine.js';
import './WeatherPanel.css';

export default function WeatherPanel({ virtualMinutes, weatherState, seasonOverride = 'auto' }) {
  const [open, setOpen] = useState(false);
  const weather = getWeatherInfo(weatherState?.current ?? 'sunny');
  const season = getSeasonFromDay(virtualMinutes, seasonOverride);

  return (
    <div className="weather-panel-wrap">
      <motion.button
        className="weather-chip"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        title="Weather & Season Info"
      >
        <span className="wc-icon">{weather.icon}</span>
        <span className="wc-label">{weather.label}</span>
        <span className="wc-sep">·</span>
        <span className="wc-season">{season.icon} {season.name}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="weather-popover"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.16 }}
          >
            <div className="wp-row">
              <span className="wp-big-icon">{weather.icon}</span>
              <div>
                <div className="wp-title">{weather.label}</div>
                <div className="wp-desc">{weather.description}</div>
              </div>
            </div>
            <div className="wp-divider" />
            <div className="wp-row">
              <span className="wp-big-icon">{season.icon}</span>
              <div>
                <div className="wp-title">
                  {season.name} · Day {season.dayInSeason}/{season.daysPerSeason} (Year {season.year})
                </div>
                <div className="wp-desc">{season.description}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
