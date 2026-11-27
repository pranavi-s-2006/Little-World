import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameClock } from '../../hooks/useGameClock.js';
import { useGame } from '../../context/GameContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getGuardianLevelFromBond } from '../../engine/relationshipEngine.js';
import WeatherPanel from '../Environment/WeatherPanel.jsx';
import SettingsModal from '../Settings/SettingsModal.jsx';
import { audioService } from '../../services/audioService.js';
import './TopBar.css';

const TIME_ICONS = { morning: '☀️', afternoon: '🌤️', evening: '🌅', night: '🌙' };
const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Routine suggestions per time-of-day
const ROUTINE_SUGGESTIONS = {
  morning:   [
    { icon: '🛁', text: 'Time to wash up!', room: 'bathroom' },
    { icon: '🍳', text: 'Breakfast ready!',  room: 'kitchen'  },
    { icon: '📚', text: 'Morning study~',    room: 'study'    },
  ],
  afternoon: [
    { icon: '🍱', text: 'Lunchtime!',         room: 'kitchen'  },
    { icon: '🌸', text: 'Garden time~',        room: 'garden'   },
    { icon: '📖', text: 'Afternoon study',     room: 'study'    },
  ],
  evening:   [
    { icon: '🍜', text: 'Dinner time!',        room: 'kitchen'  },
    { icon: '🎮', text: 'Evening play!',        room: 'playroom' },
    { icon: '🛋️', text: 'Relax together~',     room: 'living'   },
  ],
  night:     [
    { icon: '🪥', text: 'Brush teeth~',        room: 'bathroom' },
    { icon: '📖', text: 'Bedtime story',        room: 'living'   },
    { icon: '💤', text: 'Time to sleep!',       room: 'bedroom'  },
  ],
};

export default function TopBar() {
  const { timeString, timeOfDay, day } = useGameClock();
  const { state, dispatch } = useGame();
  const { user, isOwner } = useAuth();
  // Phase 5: derive level from bond points; fall back gracefully
  const bondPoints = state.relationship?.bondPoints ?? state.guardianXP ?? 0;
  const { level, title, badge, progress, next } = getGuardianLevelFromBond(bondPoints);
  const dayName = DAY_NAMES[(day - 1) % 7];
  const [showRoutine, setShowRoutine] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const suggestions = ROUTINE_SUGGESTIONS[timeOfDay] ?? ROUTINE_SUGGESTIONS.morning;

  function toggleMusic() {
    audioService.playSfx('click');
    dispatch({ type: 'UPDATE_SETTINGS', settings: { musicOn: !state.settings.musicOn } });
  }

  function goToRoom(room) {
    dispatch({ type: 'NAVIGATE', room });
    setShowRoutine(false);
  }

  // Hunger/energy warnings
  const isHungry  = (state.needs?.hunger ?? 0) > 65;
  const isTired   = (state.needs?.energy ?? 100) < 25;
  const isDirty   = (state.needs?.hygiene ?? 100) < 30;

  const warnings = [
    isHungry && { icon: '🍽️', text: 'Pranavi is hungry!',   room: 'kitchen'  },
    isTired  && { icon: '💤', text: 'Pranavi needs rest!',   room: 'bedroom'  },
    isDirty  && { icon: '🛁', text: 'Time for a bath!',      room: 'bathroom' },
  ].filter(Boolean);

  return (
    <>
    <motion.header
      className="top-bar"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Logo */}
      <div className="top-logo">
        <motion.span
          className="logo-flower"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >✿</motion.span>
        <div className="logo-text">
          <span className="logo-main">Her Little World</span>
          <span className="logo-sub">Pranavi's Life</span>
        </div>
      </div>

      {/* Clock */}
      <div className="top-clock">
        <span className="clock-icon">{TIME_ICONS[timeOfDay]}</span>
        <div className="clock-info">
          <span className="clock-time">{timeString}</span>
          <span className="clock-day">{dayName} · Day {day}</span>
        </div>
      </div>

      {/* Weather & Season chip */}
      <WeatherPanel
        virtualMinutes={state.clock?.virtualMinutes ?? 360}
        weatherState={state.weather}
        seasonOverride={state.settings?.seasonOverride}
      />

      {/* Warning chip — highest priority */}
      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.button
            className="topbar-warning"
            onClick={() => goToRoom(warnings[0].room)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            <span>{warnings[0].icon}</span>
            <span>{warnings[0].text}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Daily routine button */}
      <div className="top-routine-wrap">
        <motion.button
          className="top-routine-btn"
          onClick={() => setShowRoutine(v => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📋 Routine
        </motion.button>

        <AnimatePresence>
          {showRoutine && (
            <motion.div
              className="routine-dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
            >
              <div className="rd-header">
                {TIME_ICONS[timeOfDay]} {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} suggestions
              </div>
              {suggestions.map((s, i) => (
                <motion.button
                  key={i}
                  className="rd-item"
                  onClick={() => goToRoom(s.room)}
                  whileHover={{ x: 4, background: 'var(--pink-100)' }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className="rd-icon">{s.icon}</span>
                  <span className="rd-text">{s.text}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Guardian level */}
      <div className="top-guardian">
        <span className="guardian-icon">{badge ?? '👑'}</span>
        <div className="guardian-info">
          <span className="guardian-level">Lv.{level}</span>
          <span className="guardian-title">{title}</span>
        </div>
        {next && (
          <div className="guardian-bond-bar" title={`${bondPoints} / ${next} bond pts`}>
            <div
              className="guardian-bond-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="top-controls">
        <motion.button
          className={`ctrl-btn ${state.settings.musicOn && !state.settings.muted ? 'ctrl-btn--on' : ''}`}
          onClick={toggleMusic}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Toggle Music"
        >
          {state.settings.musicOn && !state.settings.muted ? '🎵' : '🔇'}
        </motion.button>
        <motion.button
          className="ctrl-btn"
          onClick={() => { audioService.playSfx('click'); setShowSettings(true); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Settings"
        >
          ⚙️
        </motion.button>
        {user && (
          <Link to="/profile" className="ctrl-btn" title="Profile & Account" style={{ textDecoration: 'none' }}>
            👤
          </Link>
        )}
        {isOwner && (
          <Link to="/admin" className="ctrl-btn" title="Owner Dashboard" style={{ textDecoration: 'none' }}>
            👑
          </Link>
        )}
      </div>
    </motion.header>

    <AnimatePresence>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </AnimatePresence>
    </>
  );
}
