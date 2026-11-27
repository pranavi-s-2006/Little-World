import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterAnimations } from './CharacterAnimations.jsx';
import CharacterRenderer from './CharacterRenderer.jsx';
import CatCompanion from './CatCompanion.jsx';
import './Character.css';

// Body-level Framer Motion variants per state (kept gentle so facial features stay crisp)
const BODY_VARIANTS = {
  idle:       { y: [0, -3.5, 0],                    transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
  happy:      { y: [0, -5, 0],                      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
  veryHappy:  { y: [0, -10, 0], scale: [1, 1.025, 1], transition: { duration: 1.0, repeat: Infinity, ease: 'easeInOut' } },
  excited:    { y: [0, -9, 0], rotate: [-1.5, 1.5, -1.5], transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } },
  sad:        { y: [0, -1.5, 0],                    transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } },
  crying:     { x: [-1, 1, -1],                     transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
  bored:      { y: [0, -1.5, 0],                    transition: { duration: 5,   repeat: Infinity, ease: 'easeInOut' } },
  hungry:     { y: [0, -2.5, 0],                    transition: { duration: 2,   repeat: Infinity, ease: 'easeInOut' } },
  sleepy:     { y: [0, -1.5, 0], rotate: [-0.8, 0.8, -0.8], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } },
  sleeping:   { y: [0, -1, 0], rotate: [-0.8, 0.8, -0.8],   transition: { duration: 4,   repeat: Infinity, ease: 'easeInOut' } },
  tired:      { y: [0, -1, 0],                      transition: { duration: 5,   repeat: Infinity, ease: 'easeInOut' } },
  sick:       { x: [-1.5, 1.5, -1.5],               transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } },
  recovering: { y: [0, -2.5, 0],                    transition: { duration: 3,   repeat: Infinity, ease: 'easeInOut' } },
  eating:     { y: [0, -3.5, 0],                    transition: { duration: 0.65, repeat: Infinity, ease: 'easeInOut' } },
  drinking:   { y: [0, -2.5, 0],                    transition: { duration: 0.85, repeat: Infinity, ease: 'easeInOut' } },
  walking:       { x: [-12, 12, -12], y: [0, -4, 0],     transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } },
  running:       { x: [-18, 18, -18], y: [0, -7, 0],     transition: { duration: 0.65, repeat: Infinity, ease: 'easeInOut' } },
  jumping:       { y: [0, -22, 0], scaleY: [1, 1.04, 0.96, 1], transition: { duration: 0.75, repeat: Infinity, ease: 'easeOut' } },
  dancing:       { x: [-6, 6, -6], y: [0, -8, 0], rotate: [-3, 3, -3], transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } },
  waving:        { y: [0, -4, 0], rotate: [-1.5, 1.5, -1.5], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
  clapping:      { y: [0, -5, 0], scale: [1, 1.02, 1],  transition: { duration: 0.55, repeat: Infinity, ease: 'easeInOut' } },
  laughing:      { y: [0, -6, 0], rotate: [-1.5, 1.5, -1.5], transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } },
  reading:       { y: [0, -2, 0],                      transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } },
  drawing:       { y: [0, -2, 0], rotate: [-1, 1, -1], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
  playingToys:   { y: [0, -8, 0], rotate: [-2, 2, -2], transition: { duration: 0.85, repeat: Infinity, ease: 'easeInOut' } },
  lookingWindow: { y: [0, -2.5, 0],                    transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  watering:      { y: [0, -3, 0], rotate: [0, 3, 0],   transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
  celebrating:   { y: [0, -14, 0], scale: [1, 1.04, 1], rotate: [-2, 2, -2], transition: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } },
  rainReact:     { y: [0, -3, 0], rotate: [-1, 1, -1], transition: { duration: 2.0, repeat: Infinity, ease: 'easeInOut' } },
  snowEnjoy:     { y: [0, -6, 0], rotate: [-2, 2, -2], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
  relaxingSofa:  { y: [0, -1.5, 0],                    transition: { duration: 4.0, repeat: Infinity, ease: 'easeInOut' } },
  playing:       { y: [0, -10, 0],                     transition: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } },
  studying:   { y: [0, -2, 0],                      transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } },
  bathing:    { rotate: [-1.5, 1.5, -1.5],          transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
  talking:    { y: [0, -3, 0],                      transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } },
  resting:    { y: [0, -1, 0],                      transition: { duration: 4,   repeat: Infinity, ease: 'easeInOut' } },
};

// When to show the cat companion
const CAT_VISIBLE_STATES = new Set([
  'idle', 'happy', 'veryHappy', 'excited', 'talking', 'resting', 'playing',
]);

const CAT_POSITION_MAP = {
  idle:      'sitting',
  happy:     'sitting',
  veryHappy: 'playing',
  excited:   'playing',
  talking:   'sitting',
  resting:   'sleeping',
  playing:   'playing',
};

export default function Character({
  state = 'idle',
  outfit = 'casual',
  room = 'bedroom',
  facing = 'right',
  isDragging = false,
  visualAction = null, // { pose, prop, stageProgress, paused }
  onClick,
  showCat = true,
}) {
  const isPaused = Boolean(visualAction?.paused);
  const effectivePose = visualAction?.pose ?? state;
  const { blinkProgress, breatheScale, hairSway, talkProgress, walkPhase, actionPhase } =
    useCharacterAnimations(effectivePose, isPaused);
  const bodyVariant = BODY_VARIANTS[state] ?? BODY_VARIANTS.idle;

  // Cat is shown in bedroom, living room, and playroom for certain states
  const catVisible = showCat
    && CAT_VISIBLE_STATES.has(state)
    && (room === 'bedroom' || room === 'living' || room === 'playroom');

  const catPosition = CAT_POSITION_MAP[state] ?? 'sitting';

  return (
    <div className={`character-inner-stage ${isDragging ? 'character-inner-stage--dragging' : ''}`}>
      <motion.div
        className="character-wrapper"
        animate={isDragging ? { y: -8, scale: 1.04 } : bodyVariant}
        initial={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={!isDragging ? { scale: 1.03, filter: 'drop-shadow(0 14px 36px rgba(90,170,212,0.35))' } : undefined}
        whileTap={!isDragging ? { scale: 0.96 } : undefined}
        onClick={onClick}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <div
          className="character-facing-box"
          style={{
            transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
            transition: 'transform 0.22s ease',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <CharacterRenderer
            state={state}
            outfit={outfit}
            blinkProgress={blinkProgress}
            breatheScale={breatheScale}
            hairSway={hairSway}
            talkProgress={talkProgress}
            walkPhase={walkPhase}
            actionPhase={actionPhase}
            visualAction={visualAction}
          />
        </div>

        {/* Interaction sparkles */}
        <div className="character-sparkles" aria-hidden="true">
          {(state === 'veryHappy' || state === 'excited') && (
            <>
              <span className="sparkle s1">✦</span>
              <span className="sparkle s2">✿</span>
              <span className="sparkle s3">♡</span>
              <span className="sparkle s4">✦</span>
            </>
          )}
          {state === 'happy' && (
            <>
              <span className="sparkle s1">♡</span>
              <span className="sparkle s3">✿</span>
            </>
          )}
        </div>
      </motion.div>

      {isDragging && (
        <div className="character-drag-badge" aria-hidden="true">
          ✨ Moving~
        </div>
      )}

      {/* Cat companion — sits beside Pranavi */}
      <AnimatePresence>
        {catVisible && (
          <motion.div
            className="cat-companion-wrap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CatCompanion visible position={catPosition} scale={0.9} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
