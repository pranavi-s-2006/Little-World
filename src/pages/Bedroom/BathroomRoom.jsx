import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import './Bathroom.css';

const CARE_ACTIVITIES = [
  { id: 'bath',     label: 'Take a Bath',      icon: '🛁', desc: 'Warm relaxing bath',       time: '~5 min', color: '#90c8f0', hygieneGain: 40 },
  { id: 'brush',    label: 'Brush Teeth',      icon: '🪥', desc: 'Fresh minty smile',         time: '~2 min', color: '#c9a8ff', hygieneGain: 10 },
  { id: 'washface', label: 'Wash Face',        icon: '💦', desc: 'Refreshing face wash',      time: '~2 min', color: '#a8d4f0', hygieneGain: 12 },
  { id: 'comphair', label: 'Comb Hair',        icon: '💇', desc: 'Silky smooth hair',         time: '~2 min', color: '#ffb3cc', hygieneGain: 8  },
  { id: 'skincare', label: 'Skincare',         icon: '🌸', desc: 'Gentle glow routine',       time: '~3 min', color: '#ffd6e7', hygieneGain: 10 },
];

const CARE_DIALOGUE = {
  bath:     "I feel so fresh and clean! 🛁✨",
  brush:    "My teeth are sparkling! 🪥💫",
  washface: "My face feels so refreshed! 💦🌸",
  comphair: "My hair looks beautiful! 💇✨",
  skincare: "My skin is glowing! 🌸💕",
};

const ANIM_SPARKLES = {
  bath:     ['💧','🫧','✨','💦','🫧'],
  brush:    ['⭐','✦','🌟','✨','💫'],
  washface: ['💧','✨','🌊','💦','✨'],
  comphair: ['✨','💕','⭐','✦','🌸'],
  skincare: ['🌸','✨','💕','✦','🌟'],
};

export default function BathroomRoom({ timeOfDay }) {
  const { state, dispatch } = useGame();
  const [activeAnim, setActiveAnim] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [justDone, setJustDone] = useState(null);
  const isNight = timeOfDay === 'night';
  const isBathing = state.currentActivity === 'bathing';

  function doCare(careId) {
    setActiveAnim(careId);
    setShowPanel(false);
    const visualKey = careId === 'bath' ? 'bathe' : careId;
    dispatch({ type: 'START_VISUAL_ACTION', actionKey: visualKey });
    setTimeout(() => {
      setActiveAnim(null);
      setJustDone(careId);
      setTimeout(() => setJustDone(null), 2500);
    }, 3200);
  }

  const wallBg = isNight
    ? 'linear-gradient(180deg,#1a2a3a,#2a3a4a)'
    : 'linear-gradient(180deg,#e0f4ff,#c8e8f8)';

  return (
    <div className="room bathroom-room">
      {/* Wall */}
      <div className="bathroom-wall" style={{ background: wallBg }}>
        <div className="bathroom-tiles" />
      </div>

      {/* Mirror with reflection shimmer — clickable for mirror care */}
      <div
        className="bathroom-mirror"
        onClick={() => setShowPanel(v => !v)}
        style={{ cursor: 'pointer' }}
        title="Click mirror for skincare & hair care"
      >
        <div className="mirror-frame">
          <div className="mirror-glass">
            <motion.div
              className="mirror-shine"
              animate={{ x: [-80, 80], opacity: [0, 0.4, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            />
            <span className="mirror-reflection">
              {activeAnim ? CARE_ACTIVITIES.find(a => a.id === activeAnim)?.icon : '🪞'}
            </span>
          </div>
          <motion.span
            className="mirror-sparkle-top"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >✨</motion.span>
        </div>
        <div className="mirror-label">Mirror</div>
      </div>

      {/* Bathtub — clickable to take a bath */}
      <div
        className="bathtub"
        onClick={() => doCare('bath')}
        style={{ cursor: 'pointer' }}
        title="Click tub to take a warm bath"
      >
        <div className="tub-faucet-assembly">
          <div className="tub-faucet" />
          <div className="tub-handles">
            <div className="tub-handle hot" />
            <div className="tub-handle cold" />
          </div>
        </div>
        <div className="tub-body">
          <motion.div
            className="tub-water"
            animate={isBathing
              ? { background: ['rgba(144,200,240,0.5)','rgba(90,170,212,0.65)','rgba(144,200,240,0.5)'] }
              : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Bubbles */}
          <div className="tub-bubbles">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="bubble"
                style={{ left: `${8 + i * 11}%`, width: `${7 + (i%3)*3}px`, height: `${7 + (i%3)*3}px` }}
                animate={{ y: [-4, -20], opacity: [0.9, 0] }}
                transition={{ duration: 1.4 + i*0.15, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          {isBathing && (
            <motion.div
              className="bath-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              🛁 Bathing~
            </motion.div>
          )}
        </div>
        <div className="tub-rim" />
        <div className="tub-feet">
          <div className="tub-foot" /><div className="tub-foot" />
          <div className="tub-foot" /><div className="tub-foot" />
        </div>
      </div>

      {/* Shower head (decorative) */}
      <div className="shower-head">
        <div className="shower-pipe" />
        <div className="shower-head-cap">🚿</div>
      </div>

      {/* Wash basin / sink */}
      <div className="sink-area">
        <div className="sink-cabinet">
          <div className="sink-counter-top">
            <div className="sink-basin">
              <div className="sink-drain" />
            </div>
            <div className="sink-faucet">
              <div className="faucet-neck" />
              <div className="faucet-head" />
            </div>
          </div>
          <div className="sink-cabinet-body">
            <div className="sink-door"><div className="sink-door-handle" /></div>
            <div className="sink-door"><div className="sink-door-handle" /></div>
          </div>
        </div>
      </div>

      {/* Product shelf */}
      <div className="bathroom-shelf">
        <div className="shelf-board">
          <motion.span className="shelf-product" title="Shampoo"       whileHover={{ y: -4 }}>🧴</motion.span>
          <motion.span className="shelf-product" title="Soap"          whileHover={{ y: -4 }}>🧼</motion.span>
          <motion.span className="shelf-product" title="Toothbrush"    whileHover={{ y: -4 }}>🪥</motion.span>
          <motion.span className="shelf-product" title="Face cream"    whileHover={{ y: -4 }}>🌸</motion.span>
          <motion.span className="shelf-product" title="Perfume"       whileHover={{ y: -4 }}>🌺</motion.span>
        </div>
        <div className="shelf-bracket left-bracket" />
        <div className="shelf-bracket right-bracket" />
      </div>

      {/* Toothbrush holder */}
      <div className="toothbrush-holder">
        <div className="holder-cup">
          <span>🪥</span>
          <span>🪥</span>
        </div>
      </div>

      {/* Towel rack */}
      <div className="towel-rack">
        <div className="towel-bar" />
        <div className="towel pink-towel">
          <div className="towel-stripe" />
        </div>
        <div className="towel lavender-towel">
          <div className="towel-stripe" />
        </div>
      </div>

      {/* Bath mat */}
      <div className="bath-mat">
        <div className="bath-mat-pattern">
          {[...Array(6)].map((_, i) => <div key={i} className="mat-stripe" />)}
        </div>
      </div>

      {/* Bathroom decor */}
      <div className="bathroom-decor-items">
        <motion.span className="bd-item"
          animate={{ rotate: [-3,3,-3] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        >🪴</motion.span>
        <span className="bd-item">🐚</span>
        <motion.span className="bd-item"
          animate={{ y: [0,-4,0], opacity: [0.7,1,0.7] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >🌿</motion.span>
      </div>

      {/* Hygiene status */}
      <AnimatePresence>
        {(state.needs?.hygiene ?? 100) < 40 && !showPanel && !activeAnim && (
          <motion.div
            className="hygiene-hint"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            💦 Pranavi needs some care~
          </motion.div>
        )}
      </AnimatePresence>

      {/* Just-done feedback */}
      <AnimatePresence>
        {justDone && (
          <motion.div
            className="care-done-toast"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <span className="cdt-icon">{CARE_ACTIVITIES.find(a => a.id === justDone)?.icon}</span>
            <span className="cdt-msg">{CARE_DIALOGUE[justDone]}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Care button */}
      <motion.button
        className="care-open-btn"
        onClick={() => setShowPanel(v => !v)}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.94 }}
        disabled={!!activeAnim}
      >
        {showPanel ? '✕ Close' : '✿ Care for Pranavi'}
      </motion.button>

      {/* Care panel */}
      <AnimatePresence>
        {showPanel && !activeAnim && (
          <motion.div
            className="care-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="care-panel-header">
              <div>
                <div className="care-panel-title">✿ Personal Care</div>
                <div className="care-panel-subtitle">Choose an activity for Pranavi~</div>
              </div>
              <button
                type="button"
                className="care-panel-close"
                onClick={() => setShowPanel(false)}
                aria-label="Close personal care menu"
              >
                ✕
              </button>
            </div>
            <div className="care-grid">
              {CARE_ACTIVITIES.map((act, i) => (
                <motion.button
                  key={act.id}
                  className="care-card"
                  style={{ '--care-color': act.color }}
                  onClick={() => doCare(act.id)}
                  whileHover={{ scale: 1.07, y: -4 }}
                  whileTap={{ scale: 0.93 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className="care-icon">{act.icon}</span>
                  <span className="care-label">{act.label}</span>
                  <span className="care-desc">{act.desc}</span>
                  <div className="care-meta">
                    <span className="care-time">{act.time}</span>
                    <span className="care-hygiene">+{act.hygieneGain} 🫧</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active care animation overlay */}
      <AnimatePresence>
        {activeAnim && (
          <motion.div
            className="care-anim-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="care-anim-content"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              {/* Privacy curtain for bath */}
              {activeAnim === 'bath' && (
                <motion.div
                  className="privacy-curtain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}

              <motion.span
                className="care-anim-icon"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [-8, 8, -8],
                }}
                transition={{ duration: 0.7, repeat: Infinity }}
              >
                {CARE_ACTIVITIES.find(a => a.id === activeAnim)?.icon}
              </motion.span>

              <p className="care-anim-label">
                {CARE_ACTIVITIES.find(a => a.id === activeAnim)?.label}
              </p>

              <div className="care-anim-bar-wrap">
                <motion.div
                  className="care-anim-bar-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                />
              </div>

              {/* Floating sparkles */}
              <div className="care-sparkle-field">
                {(ANIM_SPARKLES[activeAnim] ?? ['✨','💧','🌸']).map((s, i) => (
                  <motion.span
                    key={i}
                    className="care-sparkle"
                    style={{ left: `${10 + i * 18}%` }}
                    animate={{ y: [0, -50], opacity: [1, 0], scale: [0.8, 1.3] }}
                    transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.28 }}
                  >{s}</motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor */}
      <div className="bathroom-floor">
        <div className="bathroom-floor-tiles" />
      </div>
    </div>
  );
}
