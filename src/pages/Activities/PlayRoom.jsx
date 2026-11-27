import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import MiniGamesHub from '../../components/MiniGames/MiniGamesHub.jsx';
import { audioService } from '../../services/audioService.js';
import './PlayRoom.css';

const PLAY_ACTIVITIES = [
  { id: 'drawing',  name: 'Drawing',    emoji: '🎨', color: '#5aaad4' },
  { id: 'music',    name: 'Music',      emoji: '🎵', color: '#e8638a' },
  { id: 'dance',    name: 'Dancing',    emoji: '💃', color: '#ffb3cc' },
  { id: 'toys',     name: 'Toys',       emoji: '🧸', color: '#f4845f' },
  { id: 'puzzle',   name: 'Puzzle',     emoji: '🧩', color: '#a87de8' },
];

export default function PlayRoom() {
  const { dispatch } = useGame();
  const [activeGame, setActiveGame] = useState(null); // 'memory' | 'garden' | 'cooking' | 'puzzle' | null
  const [activePlay, setActivePlay] = useState(null);

  function doPlay(act) {
    audioService.playSfx('click');
    setActivePlay(act.id);
    if (act.id === 'drawing') {
      dispatch({ type: 'START_VISUAL_ACTION', actionKey: 'draw', label: 'Drawing Art' });
    } else if (act.id === 'dance' || act.id === 'music') {
      dispatch({ type: 'START_VISUAL_ACTION', actionKey: 'music_dance', label: act.name });
    } else {
      dispatch({ type: 'START_VISUAL_ACTION', actionKey: 'play', label: `Playing ${act.name}` });
    }
    setTimeout(() => setActivePlay(null), 3500);
  }

  return (
    <div className="room playroom">
      <div className="pr-wall" />

      {/* Toy shelf — clickable to play with toys */}
      <div
        className="pr-toy-shelf"
        onClick={() => {
          audioService.playSfx('click');
          dispatch({ type: 'TRIGGER_ANIMATION', activity: 'playingToys', duration: 3200 });
        }}
        style={{ cursor: 'pointer' }}
        title="Click toys to play together"
      >
        {['🧸','🎪','🎠','🎡','🎭','🪆'].map((t, i) => (
          <motion.span
            key={i}
            className="pr-shelf-toy"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
          >{t}</motion.span>
        ))}
      </div>

      {/* Art corner — clickable to draw together */}
      <div
        className="pr-art-corner"
        onClick={() => {
          audioService.playSfx('click');
          dispatch({ type: 'TRIGGER_ANIMATION', activity: 'drawing', duration: 3500 });
        }}
        style={{ cursor: 'pointer' }}
        title="Click easel to draw together"
      >
        <div className="pr-easel">🖼️</div>
        <div className="pr-art-supplies">
          <span>🎨</span><span>✏️</span><span>🖌️</span>
        </div>
      </div>

      {/* Musical instruments — clickable to dance & play music */}
      <div
        className="pr-instruments"
        onClick={() => {
          audioService.playSfx('minigameSuccess');
          dispatch({ type: 'TRIGGER_ANIMATION', activity: 'dancing', duration: 3600 });
        }}
        style={{ cursor: 'pointer' }}
        title="Click piano to play music & dance"
      >
        <motion.span
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >🎹</motion.span>
        <span>🎸</span>
      </div>

      {/* Activity buttons */}
      <div className="pr-activities">
        {PLAY_ACTIVITIES.map((act, i) => (
          <motion.button
            key={act.id}
            className={`pr-act-btn ${activePlay === act.id ? 'pr-act-btn--active' : ''}`}
            style={{ '--act-color': act.color }}
            onClick={() => doPlay(act)}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.92 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            disabled={!!activePlay}
          >
            <motion.span
              className="pr-act-emoji"
              animate={activePlay === act.id ? { rotate: [0, 10, -10, 0] } : { rotate: [0, 3, -3, 0] }}
              transition={{ duration: activePlay === act.id ? 0.4 : 2 + i * 0.3, repeat: Infinity }}
            >{act.emoji}</motion.span>
            <span className="pr-act-name">{act.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Mini-game buttons */}
      <div className="pr-minigames">
        <div className="pr-mg-title">✿ Mini-Games Arcade</div>
        <div className="pr-mg-btns" style={{ flexWrap: 'wrap' }}>
          <motion.button
            className="pr-mg-btn"
            onClick={() => setActiveGame('memory')}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.94 }}
          >
            🃏 Memory
          </motion.button>
          <motion.button
            className="pr-mg-btn pr-mg-btn--color"
            onClick={() => setActiveGame('garden')}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.94 }}
          >
            🌷 Gardening
          </motion.button>
          <motion.button
            className="pr-mg-btn"
            onClick={() => setActiveGame('cooking')}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.94 }}
          >
            🍳 Cooking
          </motion.button>
          <motion.button
            className="pr-mg-btn pr-mg-btn--color"
            onClick={() => setActiveGame('puzzle')}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.94 }}
          >
            🧩 Puzzle
          </motion.button>
        </div>
      </div>

      {/* Mini-game overlay */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            className="mg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mg-container"
              style={{ maxWidth: '520px', width: '92vw', maxHeight: '88vh', overflowY: 'auto' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <MiniGamesHub initialTab={activeGame} onClose={() => setActiveGame(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active play animation */}
      <AnimatePresence>
        {activePlay && (
          <motion.div
            className="pr-play-anim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="pr-play-anim-icon"
              animate={{ scale: [1, 1.3, 1], rotate: [-5, 5, -5] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              {PLAY_ACTIVITIES.find(a => a.id === activePlay)?.emoji}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pr-floor" />
    </div>
  );
}
