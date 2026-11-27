// EventBanner.jsx — Floating event notification banner
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { getActiveDailyEvent } from '../../engine/eventsEngine.js';
import { audioService } from '../../services/audioService.js';
import './EventBanner.css';

export default function EventBanner() {
  const { state, dispatch } = useGame();
  const [dismissed, setDismissed] = useState(false);

  const event = getActiveDailyEvent(state.clock?.virtualMinutes ?? 0, state.completedEvents ?? [], {
    weatherId: state.weather?.current ?? 'sunny',
    birthdayDay: state.settings?.birthdayDay ?? 5,
  });

  if (!event || dismissed) return null;

  function handleJoin() {
    audioService.playSfx(event.id === 'birthday' ? 'birthday' : 'achievement');
    dispatch({ type: 'COMPLETE_EVENT', event });
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="event-banner"
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      >
        {/* Shimmer overlay */}
        <div className="event-banner__shimmer" aria-hidden="true" />

        <span className="event-banner__icon">{event.icon ?? '🎉'}</span>

        <div className="event-banner__body">
          <span className="event-banner__label">Special Event!</span>
          <span className="event-banner__title">{event.title}</span>
          {event.description && (
            <span className="event-banner__desc">{event.description}</span>
          )}
        </div>

        <div className="event-banner__actions">
          <motion.button
            className="event-banner__join-btn"
            onClick={handleJoin}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            Join ✨
          </motion.button>
          <motion.button
            className="event-banner__dismiss-btn"
            onClick={() => setDismissed(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Dismiss event"
          >
            ✕
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
