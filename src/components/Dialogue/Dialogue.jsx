import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getContextualDialogue } from '../../data/dialogues.js';
import { useGame } from '../../context/GameContext.jsx';
import './Dialogue.css';

// Typing animation — reveals text character by character
function useTypingEffect(text, speed = 26) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timerRef.current);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timerRef.current);
  }, [text, speed]);

  return { displayed, done };
}

export default function Dialogue({ characterState, timeOfDay }) {
  const { state } = useGame();
  const recentLinesRef = useRef([]);
  const hideTimer = useRef(null);
  const cycleTimer = useRef(null);

  function pickLine(forceIdle = false) {
    const line = getContextualDialogue({
      characterState,
      timeOfDay,
      room: state.currentRoom,
      guardianLevel: state.guardianLevel ?? 1,
      recentActivities: state.activityHistory.slice(-5),
      memories: state.memories ?? [],
      recentLines: recentLinesRef.current,
      forceIdle,
    });
    recentLinesRef.current = [line, ...recentLinesRef.current].slice(0, 6);
    return line;
  }

  const [text, setText] = useState(() => pickLine(false));
  const [visible, setVisible] = useState(true);
  const [key, setKey] = useState(0);

  const { displayed, done } = useTypingEffect(text, 24);

  function showNewLine(forceIdle = false) {
    const line = pickLine(forceIdle);
    setText(line);
    setVisible(true);
    setKey(k => k + 1);
    clearTimeout(hideTimer.current);
    clearTimeout(cycleTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 7500);
    cycleTimer.current = setTimeout(() => showNewLine(true), 13000);
  }

  // React to character state, time of day, or room changes
  useEffect(() => {
    showNewLine(false);
    return () => {
      clearTimeout(hideTimer.current);
      clearTimeout(cycleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterState, timeOfDay, state.currentRoom, state.guardianLevel]);

  function handleClick() {
    showNewLine(true);
  }

  const moodColor = {
    happy: '#e8638a', veryHappy: '#ff85aa', excited: '#ff85aa',
    sad: '#a87de8', crying: '#7c4dbd',
    hungry: '#f4845f', sleepy: '#c9a8ff', sick: '#9ecf9e',
    playing: '#e8638a', studying: '#5aaad4', eating: '#f4845f',
    bathing: '#90c8f0', sleeping: '#6b68a8', talking: '#a87de8',
    resting: '#c9a8ff', tired: '#ffd6e7', bored: '#e8d5ff',
  }[characterState] ?? '#e8638a';

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={key}
          className="dialogue-bubble"
          style={{ '--mood-color': moodColor }}
          initial={{ opacity: 0, y: 14, scale: 0.88 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: -8, scale: 0.92  }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={handleClick}
          title="Click for a new message"
        >
          <span className="dialogue-mood-dot" style={{ background: moodColor }} />

          <span className="dialogue-text">
            {displayed}
            {!done && <span className="dialogue-cursor">|</span>}
          </span>

          <div className="dialogue-tail" />

          {done && <span className="dialogue-hint">tap for more~</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
