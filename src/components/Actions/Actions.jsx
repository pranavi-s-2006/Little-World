import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { audioService } from '../../services/audioService.js';
import './Actions.css';

const ACTIONS = [
  { id: 'feed',     label: 'Feed',     icon: '🍽️', color: '#f4845f', desc: 'Reduces hunger'       },
  { id: 'water',    label: 'Water',    icon: '💧', color: '#90c8f0', desc: 'Hydrates & heals'     },
  { id: 'play',     label: 'Play',     icon: '🎮', color: '#e8638a', desc: 'Boosts happiness'     },
  { id: 'talk',     label: 'Talk',     icon: '💬', color: '#a87de8', desc: 'Improves social'      },
  { id: 'bathe',    label: 'Bathe',    icon: '🛁', color: '#5aaad4', desc: 'Restores hygiene'     },
  { id: 'study',    label: 'Study',    icon: '📚', color: '#6aaa6a', desc: 'Earns XP'             },
  { id: 'rest',     label: 'Rest',     icon: '🌸', color: '#c9a8ff', desc: 'Restores energy'      },
  { id: 'sleep',    label: 'Sleep',    icon: '💤', color: '#6b68a8', desc: 'Full energy restore'  },
  { id: 'hug',      label: 'Hug',      icon: '🤗', color: '#ffb3cc', desc: 'Boosts happiness'     },
  { id: 'care',     label: 'Care',     icon: '💊', color: '#9ecf9e', desc: 'Supports health'      },
];

export default function Actions() {
  const { dispatch, state } = useGame();
  const [activeAction, setActiveAction] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const VISUAL_ACTION_KEYS = new Set(['feed', 'water', 'play', 'bathe', 'study', 'rest', 'sleep']);

  function handleAction(actionId) {
    if (state.isSleeping && actionId !== 'sleep') return;
    audioService.playSfx(actionId === 'feed' ? 'eat' : actionId === 'water' ? 'drink' : 'click');
    setActiveAction(actionId);
    if (VISUAL_ACTION_KEYS.has(actionId)) {
      dispatch({ type: 'START_VISUAL_ACTION', actionKey: actionId });
    } else {
      window.dispatchEvent(new CustomEvent('hlw:activity-walk', { detail: { actionId } }));
      dispatch({ type: 'DO_ACTION', actionId });
    }
    setTimeout(() => setActiveAction(null), 1200);
  }

  function closeMobileSheet() {
    document.querySelector('.mobile-drawer-backdrop')?.click();
  }

  return (
    <div className="actions-panel">
      <div className="actions-title-row">
        <div className="actions-title">✿ Care for Pranavi</div>
        <button
          type="button"
          className="mobile-sheet-close"
          onClick={closeMobileSheet}
          aria-label="Close care actions panel"
        >
          ✕
        </button>
      </div>
      <div className="actions-grid">
        {ACTIONS.map((action, i) => {
          const isActive = activeAction === action.id;
          const isDisabled = state.isSleeping && action.id !== 'sleep';
          const isCurrent = state.currentActivity === action.id.replace('feed','eating').replace('water','drinking').replace('play','playing').replace('talk','talking').replace('bathe','bathing').replace('study','studying').replace('rest','resting').replace('hug','talking').replace('care','recovering');

          return (
            <div key={action.id} className="action-wrapper">
              <motion.button
                className={`action-btn ${isActive ? 'action-btn--active' : ''} ${isCurrent ? 'action-btn--current' : ''}`}
                style={{ '--action-color': action.color }}
                onClick={() => handleAction(action.id)}
                onMouseEnter={() => setTooltip(action.id)}
                onMouseLeave={() => setTooltip(null)}
                whileHover={!isDisabled ? { scale: 1.12, y: -4 } : {}}
                whileTap={!isDisabled ? { scale: 0.9 } : {}}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                disabled={isDisabled}
                title={action.desc}
              >
                <motion.span
                  className="action-icon"
                  animate={isActive ? { scale: [1, 1.4, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {action.icon}
                </motion.span>
                <span className="action-label">{action.label}</span>

                {/* Active ripple */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="action-ripple"
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Tooltip */}
              <AnimatePresence>
                {tooltip === action.id && (
                  <motion.div
                    className="action-tooltip"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {action.desc}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
