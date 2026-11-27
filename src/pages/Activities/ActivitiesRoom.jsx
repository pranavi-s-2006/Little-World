import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { ACTIVITIES } from '../../data/activities.js';
import './Activities.css';

export default function ActivitiesRoom() {
  const { dispatch } = useGame();

  function doActivity(activity) {
    dispatch({ type: 'SET_ACTIVITY', activity: activity.id });
    // Apply effects
    dispatch({ type: 'DO_ACTION', actionId: 'play' });
    setTimeout(() => dispatch({ type: 'CLEAR_ACTIVITY' }), activity.duration * 1000);
  }

  return (
    <div className="room activities-room">
      <div className="activities-wall" />
      <div className="activities-title-area">
        <h2 className="activities-heading">✿ What shall we do?</h2>
        <p className="activities-sub">Pick an activity for Pranavi~</p>
      </div>

      <div className="activities-grid">
        {ACTIVITIES.map((act, i) => (
          <motion.button
            key={act.id}
            className="activity-card"
            onClick={() => doActivity(act)}
            whileHover={{ scale: 1.06, y: -5 }}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <span className="act-emoji">{act.emoji}</span>
            <span className="act-name">{act.name}</span>
            <div className="act-effects">
              {act.happiness > 0 && <span className="act-tag happy">💕 +{act.happiness}</span>}
              {act.energy < 0 && <span className="act-tag energy">⚡ {act.energy}</span>}
              {act.social > 0 && <span className="act-tag social">💬 +{act.social}</span>}
            </div>
            <span className="act-duration">~{act.duration} min</span>
          </motion.button>
        ))}
      </div>

      <div className="activities-floor" />
    </div>
  );
}
