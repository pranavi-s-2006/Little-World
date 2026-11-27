import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { getWeatherInfo } from '../../engine/weatherEngine.js';
import { getSeasonFromDay } from '../../engine/seasonEngine.js';
import { audioService } from '../../services/audioService.js';
import './RoomBase.css';

function Curtains({ timeOfDay }) {
  const color = timeOfDay === 'night' ? '#c9a8ff' : '#ffb3cc';
  return (
    <div className="curtains">
      <motion.div
        className="curtain curtain-left"
        style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
        animate={{ skewX: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="curtain curtain-right"
        style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
        animate={{ skewX: [0, -1, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </div>
  );
}

function Window({ timeOfDay }) {
  const skyColors = {
    morning:   'linear-gradient(180deg, #ffd6a5 0%, #ffb3cc 100%)',
    afternoon: 'linear-gradient(180deg, #87ceeb 0%, #c8e6ff 100%)',
    evening:   'linear-gradient(180deg, #ff7043 0%, #ffb74d 100%)',
    night:     'linear-gradient(180deg, #0d0d2b 0%, #2d2b55 100%)',
  };
  return (
    <div className="window-frame">
      <div className="window-glass" style={{ background: skyColors[timeOfDay] }}>
        {timeOfDay === 'night' && (
          <div className="window-stars">
            {[...Array(7)].map((_, i) => (
              <motion.span
                key={i}
                className="w-star"
                style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 22}%` }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.5 + i * 0.4, repeat: Infinity }}
              >✦</motion.span>
            ))}
            <motion.span
              className="w-moon"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
            >🌙</motion.span>
          </div>
        )}
        {(timeOfDay === 'morning' || timeOfDay === 'afternoon') && (
          <>
            <div className="window-birds">
              {[...Array(3)].map((_, i) => (
                <motion.span
                  key={i}
                  className="w-bird"
                  style={{ top: `${18 + i * 16}%` }}
                  animate={{ x: [-20, 130] }}
                  transition={{ duration: 9 + i * 2, repeat: Infinity, delay: i * 3.5 }}
                >🐦</motion.span>
              ))}
            </div>
            {timeOfDay === 'morning' && (
              <motion.span
                className="w-sun"
                animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity }}
              >☀️</motion.span>
            )}
          </>
        )}
        {timeOfDay === 'evening' && (
          <motion.span
            className="w-sunset"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >🌅</motion.span>
        )}
        <div className="window-trees">
          <span className="tree tree-1">🌳</span>
          <span className="tree tree-2">🌸</span>
        </div>
      </div>
      <div className="window-sill">
        <span className="sill-plant">🌷</span>
      </div>
    </div>
  );
}

const MORNING_STEPS = [
  { id: 'wake',      label: 'Wake Up',          icon: '☀️', action: 'wake'    },
  { id: 'brush',     label: 'Brush Teeth',      icon: '🪥', nav: 'bathroom'   },
  { id: 'washface',  label: 'Wash Face',        icon: '💦', nav: 'bathroom'   },
  { id: 'breakfast', label: 'Have Breakfast',   icon: '🍳', nav: 'kitchen'    },
  { id: 'dress',     label: 'Get Dressed',      icon: '👗', outfit: 'casual'  },
];

const NIGHT_STEPS = [
  { id: 'brush',     label: 'Brush Teeth',      icon: '🪥', nav: 'bathroom'  },
  { id: 'pajamas',   label: 'Change to Pyjamas',icon: '🌙', outfit: 'pajamas' },
  { id: 'read',      label: 'Read a Story',     icon: '📖', action: 'rest'   },
  { id: 'sleep',     label: 'Go to Sleep',      icon: '💤', action: 'sleep'  },
];

export default function BedroomRoom({ timeOfDay }) {
  const { state, dispatch } = useGame();
  const isNight    = timeOfDay === 'night';
  const isMorning  = timeOfDay === 'morning';
  const isSleeping = state.isSleeping;
  const [showRoutine, setShowRoutine] = useState(false);
  const [routineStep, setRoutineStep] = useState(0);
  const [lampOn, setLampOn] = useState(() => isNight);
  const [activeMenu, setActiveMenu] = useState(null); // 'window' | 'bed' | 'toys' | null
  const [windowNote, setWindowNote] = useState(null);

  const weatherInfo = getWeatherInfo(state.weather?.current ?? 'sunny');
  const season = getSeasonFromDay(state.clock?.virtualMinutes ?? 360, state.settings?.seasonOverride);
  const birthdayDay = state.settings?.birthdayDay ?? 5;
  const isBirthday = season.day === birthdayDay || (season.day % 28 === birthdayDay % 28);

  const wallBg = isNight
    ? 'linear-gradient(180deg,#2d2b55 0%,#3d3a6e 100%)'
    : 'linear-gradient(180deg,#fff0f5 0%,#ffd6e7 100%)';
  const floorBg = isNight ? '#1e1c3a' : '#ffefc8';

  function toggleLamp() {
    audioService.playSfx('click');
    setLampOn(v => !v);
  }

  function lookOutWindow() {
    audioService.playSfx('birds');
    const anim = weatherInfo.isRainy ? 'rainReact' : weatherInfo.snowIntensity > 0 ? 'snowEnjoy' : 'lookingWindow';
    dispatch({ type: 'TRIGGER_ANIMATION', activity: anim, duration: 3600 });
    setWindowNote(`${weatherInfo.icon} ${weatherInfo.label} · ${season.icon} ${season.name}: ${weatherInfo.description}`);
    setActiveMenu('window');
  }

  function playWithShelfToy() {
    audioService.playSfx('click');
    dispatch({ type: 'TRIGGER_ANIMATION', activity: 'playingToys', duration: 3500 });
    setActiveMenu(null);
  }

  function goSleep()  { audioService.playSfx('click'); dispatch({ type: 'GO_SLEEP' }); setShowRoutine(false); setActiveMenu(null); }
  function wakeUp()   { audioService.playSfx('click'); dispatch({ type: 'WAKE_UP' }); setActiveMenu(null); }
  function doRest()   { audioService.playSfx('click'); dispatch({ type: 'DO_ACTION', actionId: 'rest' }); setActiveMenu(null); }
  function doNap()    {
    audioService.playSfx('click');
    dispatch({ type: 'GO_SLEEP' });
    setActiveMenu(null);
    setTimeout(() => dispatch({ type: 'WAKE_UP' }), 9000);
  }

  function handleRoutineStep(step) {
    if (step.nav)    { dispatch({ type: 'NAVIGATE', room: step.nav }); }
    if (step.outfit) { dispatch({ type: 'CHANGE_OUTFIT', outfitId: step.outfit }); }
    if (step.action === 'sleep') { goSleep(); }
    if (step.action === 'wake')  { wakeUp(); }
    if (step.action === 'rest')  { doRest(); }
    setRoutineStep(i => i + 1);
    if (!step.nav) setShowRoutine(false);
  }

  const routineSteps = isNight ? NIGHT_STEPS : MORNING_STEPS;

  return (
    <div className="room bedroom-room">
      {/* Wall */}
      <div className="room-wall" style={{ background: wallBg }}>
        <div className="wallpaper-pattern" />
      </div>

      {/* Window — clickable to view outside scenery */}
      <div
        className="window-area"
        onClick={lookOutWindow}
        style={{ cursor: 'pointer' }}
        title="Click window to look outside"
      >
        <Window timeOfDay={timeOfDay} />
        <Curtains timeOfDay={timeOfDay} />
      </div>

      {/* Birthday Bunting if today is Pranavi's configured birthday */}
      {isBirthday && (
        <div
          style={{
            position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '10px', fontSize: '1.25rem', zIndex: 5, pointerEvents: 'none',
          }}
          aria-label="Birthday Decorations"
        >
          <span>🎈</span><span>🎊</span><span>🎂</span><span>🎉</span><span>🎈</span>
        </div>
      )}

      {/* Wall decor */}
      <div className="wall-decor">
        <motion.div
          className="wall-frame"
          animate={{ rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <span style={{ fontSize: '1.4rem' }}>🌸</span>
          <span className="frame-text">Pranavi's Room ✿</span>
        </motion.div>

        <div className="wall-shelf">
          <motion.span
            style={{ cursor: 'pointer' }}
            title="Click teddy bear to play with toys"
            onClick={() => setActiveMenu(m => m === 'toys' ? null : 'toys')}
            animate={{ y: [0,-4,0] }}
            transition={{ duration:2, repeat:Infinity, delay:0 }}
          >🧸</motion.span>
          <span>📚</span>
          <motion.span animate={{ y: [0,-4,0] }} transition={{ duration:2.5, repeat:Infinity, delay:0.4 }}>🌷</motion.span>
          <span>⭐</span>
          <motion.span animate={{ y: [0,-3,0] }} transition={{ duration:3, repeat:Infinity, delay:0.8 }}>🎀</motion.span>
          {(state.unlockedDecor ?? []).includes('flower_vase') && (
            <motion.span title="Guardian Reward: Crystal Flower Vase" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }}>💐</motion.span>
          )}
          {(state.unlockedDecor ?? []).includes('star_mobile') && (
            <motion.span title="Forever Bond Star Charm" animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 3.5, repeat: Infinity }}>🌟</motion.span>
          )}
        </div>

        {(state.unlockedDecor ?? []).includes('fairy_lights') && (
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }} title="Guardian Reward: Fairy Lights">
            <span>✨</span><span>💡</span><span>✨</span><span>💡</span><span>✨</span>
          </div>
        )}
        {(state.unlockedDecor ?? []).includes('polaroid_garland') && (
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', marginTop: '2px' }} title="Guardian Reward: Polaroid Garland">
            <span>🖼️</span><span>📷</span><span>🖼️</span>
          </div>
        )}
      </div>

      {/* Furniture layer */}
      <div className="furniture-layer">
        {/* Bed — clickable for rest/sleep menu */}
        <div
          className="furniture bed"
          onClick={() => setActiveMenu(m => m === 'bed' ? null : 'bed')}
          style={{ cursor: 'pointer' }}
          title="Click bed to rest or sleep"
        >
          <div className="bed-headboard">
            <div className="headboard-carving">❋</div>
          </div>
          <div className="bed-body">
            <div className="bed-pillow">
              <div className="pillow-frill" />
            </div>
            <div className="bed-pillow bed-pillow--small" />
            <motion.div
              className="bed-blanket"
              style={{
                background: isNight
                  ? 'linear-gradient(135deg,#6b68a8,#a87de8)'
                  : 'linear-gradient(135deg,#ffb3cc,#ff85aa)',
              }}
              animate={isSleeping ? { scaleY: [1, 1.04, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {isNight && <div className="blanket-stars">✦✦✦</div>}
            </motion.div>

            {/* Sleeping ZZZ */}
            <AnimatePresence>
              {isSleeping && (
                <motion.div
                  className="sleep-zzz-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {['z','Z','💤'].map((z, i) => (
                    <motion.span
                      key={i}
                      className="zzz"
                      style={{ fontSize: `${0.8 + i * 0.3}rem` }}
                      animate={{ y: [0, -(16 + i * 10)], opacity: [1, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                    >{z}</motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="bed-footboard" />
          <div className="bed-legs">
            <div className="bed-leg" /><div className="bed-leg" />
          </div>
        </div>

        {/* Wardrobe */}
        <div className="furniture wardrobe">
          <div className="wardrobe-top-trim" />
          <div className="wardrobe-body">
            <div className="wardrobe-door">
              <div className="wardrobe-mirror-panel" />
              <div className="wardrobe-handle" />
            </div>
            <div className="wardrobe-door">
              <div className="wardrobe-decal">🌸</div>
              <div className="wardrobe-handle" />
            </div>
          </div>
          <div className="wardrobe-legs">
            <div className="wardrobe-leg" /><div className="wardrobe-leg" />
          </div>
        </div>

        {/* Bedside table + lamp */}
        <div className="bedside-unit">
          <div className="bedside-table">
            <div className="bedside-top">
              <span className="bedside-item">📱</span>
              <span className="bedside-item">🌸</span>
            </div>
            <div className="bedside-body">
              <div className="bedside-drawer">
                <div className="bd-handle" />
              </div>
            </div>
          </div>
          <div
            className="bedside-lamp"
            onClick={toggleLamp}
            style={{ cursor: 'pointer' }}
            title={lampOn ? 'Turn lamp off' : 'Turn lamp on'}
          >
            <motion.div
              className="lamp-shade"
              style={{
                background: lampOn
                  ? 'linear-gradient(180deg,#ffd700,#ffb300)'
                  : 'linear-gradient(180deg,#ffefc8,#ffd8a0)',
              }}
            />
            <div className="lamp-pole" />
            {lampOn && (
              <motion.div
                className="lamp-glow"
                animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Alarm clock */}
      <div className="alarm-clock">
        <div className="clock-face">⏰</div>
        <div className="clock-time-label">
          {isSleeping ? 'Zzz…' : timeOfDay === 'morning' ? 'Rise!' : ''}
        </div>
      </div>

      {/* Floating decor */}
      <div className="floating-decor">
        {['✿','♡','✦','✿','♡'].map((d, i) => (
          <motion.span
            key={i}
            className="float-deco"
            style={{
              left: `${8 + i * 20}%`,
              top: `${4 + (i % 2) * 7}%`,
              color: ['#ff85aa','#c9a8ff','#ffd700','#ffb3cc','#90c8f0'][i],
            }}
            animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.6 }}
          >{d}</motion.span>
        ))}
      </div>

      {/* Bedroom action buttons */}
      <div className="bedroom-actions">
        {!isSleeping ? (
          <>
            <motion.button
              className="bed-action-btn bed-action-btn--sleep"
              onClick={goSleep}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
            >💤 Sleep</motion.button>

            <motion.button
              className="bed-action-btn bed-action-btn--nap"
              onClick={doNap}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
            >😴 Nap</motion.button>

            <motion.button
              className="bed-action-btn bed-action-btn--rest"
              onClick={doRest}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
            >🌸 Rest</motion.button>

            <motion.button
              className="bed-action-btn bed-action-btn--routine"
              onClick={() => { setShowRoutine(v => !v); setRoutineStep(0); }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
            >
              {isNight ? '🌙 Night Routine' : '☀️ Morning Routine'}
            </motion.button>
          </>
        ) : (
          <motion.button
            className="bed-action-btn bed-action-btn--wake"
            onClick={wakeUp}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            animate={{ scale: [1, 1.05, 1], boxShadow: ['0 4px 16px rgba(255,215,0,0.3)', '0 4px 24px rgba(255,215,0,0.6)', '0 4px 16px rgba(255,215,0,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >☀️ Wake Up</motion.button>
        )}
      </div>

      {/* Routine panel */}
      <AnimatePresence>
        {showRoutine && (
          <motion.div
            className="routine-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="routine-title">
              {isNight ? '🌙 Night Routine' : '☀️ Morning Routine'}
            </div>
            <p className="routine-subtitle">
              {isNight ? 'Wind down for a restful night~' : 'Start the day fresh and bright~'}
            </p>
            <div className="routine-steps">
              {routineSteps.map((step, i) => (
                <motion.button
                  key={step.id}
                  className={`routine-step-btn ${i < routineStep ? 'routine-step-btn--done' : ''}`}
                  onClick={() => handleRoutineStep(step)}
                  whileHover={{ scale: 1.03, x: 4 }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <span className="routine-step-num">{i < routineStep ? '✓' : i + 1}</span>
                  <span className="routine-step-icon">{step.icon}</span>
                  <span className="routine-step-label">{step.label}</span>
                  {step.nav && <span className="routine-step-nav">→</span>}
                </motion.button>
              ))}
            </div>
            <button className="routine-close" onClick={() => setShowRoutine(false)}>✕ Close</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contextual Furniture Interaction Menu */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.94 }}
            style={{
              position: 'absolute', top: '16%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.96)', border: '2px solid #ffd1e3', borderRadius: '18px',
              padding: '12px 16px', boxShadow: '0 10px 28px rgba(124,77,188,0.2)', zIndex: 45,
              display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px', maxWidth: '320px',
            }}
          >
            {activeMenu === 'window' && (
              <>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#7c4dbc' }}>🪟 Looking Outside</div>
                <div style={{ fontSize: '0.78rem', color: '#6b5280', lineHeight: 1.4 }}>{windowNote}</div>
                <button className="routine-close" onClick={() => setActiveMenu(null)}>Close ✕</button>
              </>
            )}
            {activeMenu === 'bed' && (
              <>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#7c4dbc' }}>🛏️ Cozy Bed</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {!isSleeping ? (
                    <>
                      <button className="room-action-btn" onClick={doRest}>🌸 Rest</button>
                      <button className="room-action-btn" onClick={doNap}>😴 Quick Nap</button>
                      <button className="room-action-btn room-action-btn--sleep" onClick={goSleep}>💤 Sleep</button>
                    </>
                  ) : (
                    <button className="room-action-btn room-action-btn--wake" onClick={wakeUp}>☀️ Wake Up</button>
                  )}
                </div>
                <button className="routine-close" onClick={() => setActiveMenu(null)}>Close ✕</button>
              </>
            )}
            {activeMenu === 'toys' && (
              <>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#7c4dbc' }}>🧸 Plushie & Toys</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button className="room-action-btn" onClick={playWithShelfToy}>🧸 Play Here</button>
                  <button className="room-action-btn" onClick={() => { setActiveMenu(null); dispatch({ type: 'NAVIGATE', room: 'playroom' }); }}>🎮 Go to Playroom</button>
                </div>
                <button className="routine-close" onClick={() => setActiveMenu(null)}>Close ✕</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor */}
      <div className="room-floor" style={{ background: floorBg }}>
        <div className="floor-rug" />
        <motion.div
          className="floor-plant"
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity }}
        >🪴</motion.div>
      </div>

      {/* Night overlay glow from lamp */}
      {isNight && (
        <motion.div
          className="night-ambient"
          animate={{ opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
    </div>
  );
}
