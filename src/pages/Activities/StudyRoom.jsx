import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import './StudyRoom.css';

const SUBJECTS = [
  { id: 'math',    label: 'Mathematics',  icon: '📐', color: '#c9a8ff', desc: 'Numbers and patterns',    duration: 20 },
  { id: 'reading', label: 'Reading',      icon: '📖', color: '#ffb3cc', desc: 'Stories and language',    duration: 15 },
  { id: 'science', label: 'Science',      icon: '🔭', color: '#90c8f0', desc: 'Discover the world',      duration: 20 },
  { id: 'art',     label: 'Art & Drawing',icon: '🎨', color: '#ffd6a5', desc: 'Creative expression',     duration: 12 },
  { id: 'music',   label: 'Music',        icon: '🎵', color: '#b8d4a8', desc: 'Notes and melodies',      duration: 15 },
  { id: 'writing', label: 'Writing',      icon: '✏️', color: '#f4845f', desc: 'Stories and journals',    duration: 15 },
];

const STUDY_TIPS = [
  "Learning something new today! 📚",
  "Knowledge is a beautiful gift~",
  "Every page is an adventure! ✨",
  "I'm getting smarter every day! 🌟",
  "Let's explore together~",
];

const COMPLETION_MSGS = {
  math:    "I solved all the problems! 🎉",
  reading: "That was a wonderful story! 📖",
  science: "Science is so amazing! 🔭✨",
  art:     "I made something beautiful! 🎨",
  music:   "Music fills my heart! 🎵💕",
  writing: "I wrote my thoughts beautifully! ✏️",
};

export default function StudyRoom({ timeOfDay }) {
  const { state, dispatch } = useGame();
  const [activeSubject, setActiveSubject] = useState(null);
  const [studyProgress, setStudyProgress] = useState(0);
  const [studyComplete, setStudyComplete] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const timerRef = useRef(null);
  const isNight = timeOfDay === 'night';

  useEffect(() => {
    if (!activeSubject || studyComplete) return;
    timerRef.current = setInterval(() => {
      setStudyProgress(p => {
        if (p >= 100) {
          clearInterval(timerRef.current);
          setStudyComplete(true);
          dispatch({ type: 'DO_STUDY', subject: activeSubject.label });
          return 100;
        }
        return p + (100 / (activeSubject.duration * 10));
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [activeSubject, studyComplete]);

  function startStudy(subject) {
    setActiveSubject(subject);
    setStudyProgress(0);
    setStudyComplete(false);
    dispatch({
      type: 'START_VISUAL_ACTION',
      actionKey: 'study',
      label: `Studying ${subject.label}`,
      meta: { subject: subject.label },
    });
  }

  function cancelStudy() {
    clearInterval(timerRef.current);
    setActiveSubject(null);
    setStudyProgress(0);
    setStudyComplete(false);
  }

  function handleBreak() {
    clearInterval(timerRef.current);
    setOnBreak(true);
    dispatch({ type: 'DO_ACTION', actionId: 'rest' });
    setTimeout(() => { setOnBreak(false); setActiveSubject(null); setStudyProgress(0); }, 3500);
  }

  function finishStudy() {
    setActiveSubject(null);
    setStudyProgress(0);
    setStudyComplete(false);
  }

  const wallBg = isNight
    ? 'linear-gradient(180deg,#2a2a4a,#3a3a5e)'
    : 'linear-gradient(180deg,#f0f8ff,#e8f4ff)';

  return (
    <div className="room study-room">
      {/* Wall */}
      <div className="study-wall" style={{ background: wallBg }} />

      {/* Clock on wall */}
      <div className="study-wall-clock">
        <div className="wall-clock-face">
          <div className="clock-hour-hand" />
          <div className="clock-minute-hand" />
          <div className="clock-center" />
        </div>
      </div>

      {/* Bookshelf — clickable to start reading */}
      <div
        className="study-bookshelf"
        onClick={() => startStudy(SUBJECTS[1])}
        style={{ cursor: 'pointer' }}
        title="Click bookshelf to start reading"
      >
        <div className="study-bs-top" />
        {[0, 1].map(row => (
          <div key={row} className="study-bs-row">
            {['📘','📗','📕','📙','📔','📒','🏆','🌸'].map((b, i) => (
              <span key={i} className="study-bs-item">{b}</span>
            ))}
          </div>
        ))}
        <div className="study-bs-bottom" />
      </div>

      {/* Study desk */}
      <div className="study-desk">
        <div className="desk-surface">
          {/* Items on desk */}
          <div className="desk-items">
            <span className="desk-item" title="Laptop">💻</span>
            <span className="desk-item" title="Notebook">📓</span>
            <span className="desk-item" title="Pencil">✏️</span>
            <span className="desk-item" title="Eraser">🧹</span>
          </div>

          {/* Study lamp on desk */}
          <div className="desk-lamp">
            <div className="desk-lamp-head" style={{
              background: isNight
                ? 'linear-gradient(180deg,#ffd700,#ffb300)'
                : 'linear-gradient(180deg,#ffefc8,#ffd8a0)',
            }} />
            <div className="desk-lamp-arm" />
            <div className="desk-lamp-base" />
          </div>

          {/* Active study display */}
          <AnimatePresence>
            {activeSubject && !studyComplete && (
              <motion.div
                className="desk-study-display"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.span
                  className="study-active-icon"
                  animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >{activeSubject.icon}</motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="desk-body">
          <div className="desk-drawer">
            <div className="desk-drawer-handle" />
          </div>
        </div>
        <div className="desk-chair">
          <div className="chair-back" />
          <div className="chair-seat" />
          <div className="chair-pole" />
          <div className="chair-wheels">
            {[0,1,2].map(i => <div key={i} className="chair-wheel" />)}
          </div>
        </div>
      </div>

      {/* Stationery corner */}
      <div className="stationery-corner">
        <span>🖊️</span><span>📏</span><span>📌</span><span>🔖</span>
      </div>

      {/* Break overlay */}
      <AnimatePresence>
        {onBreak && (
          <motion.div
            className="break-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="break-icon"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >☕</motion.span>
            <p className="break-text">Taking a little break~</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion modal */}
      <AnimatePresence>
        {studyComplete && (
          <motion.div
            className="study-complete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="study-complete-card"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8 }}
            >
              <motion.span
                className="complete-trophy"
                animate={{ rotate: [-10, 10, -10], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >🏆</motion.span>
              <h3 className="complete-title">Study Complete!</h3>
              <p className="complete-subject">{activeSubject?.label}</p>
              <p className="complete-msg">{COMPLETION_MSGS[activeSubject?.id]}</p>
              <div className="complete-rewards">
                <span>⚡ -12 Energy</span>
                <span>⭐ +15 XP</span>
              </div>
              <button className="complete-btn" onClick={finishStudy}>
                ✨ Wonderful!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active study progress */}
      <AnimatePresence>
        {activeSubject && !studyComplete && !onBreak && (
          <motion.div
            className="study-progress-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="sp-header">
              <span className="sp-icon">{activeSubject.icon}</span>
              <span className="sp-subject">{activeSubject.label}</span>
            </div>
            <p className="sp-tip">{STUDY_TIPS[Math.floor(studyProgress / 20) % STUDY_TIPS.length]}</p>
            <div className="sp-bar-wrap">
              <motion.div className="sp-bar-fill" style={{ width: `${studyProgress}%` }} />
            </div>
            <p className="sp-pct">{Math.round(studyProgress)}% complete</p>
            <div className="sp-buttons">
              <button className="sp-break-btn" onClick={handleBreak}>☕ Take a Break</button>
              <button className="sp-cancel-btn" onClick={cancelStudy}>✕ Stop</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject selection (shown when not studying) */}
      {!activeSubject && !onBreak && (
        <div className="subject-panel">
          <div className="subject-panel-title">📚 What shall we study today?</div>
          <div className="subject-grid">
            {SUBJECTS.map((sub, i) => (
              <motion.button
                key={sub.id}
                className="subject-card"
                style={{ '--sub-color': sub.color }}
                onClick={() => startStudy(sub)}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.94 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <span className="sub-icon">{sub.icon}</span>
                <span className="sub-label">{sub.label}</span>
                <span className="sub-desc">{sub.desc}</span>
                <span className="sub-time">⏱ {sub.duration}s</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Floor */}
      <div className="study-floor">
        <div className="study-floor-rug" />
      </div>
    </div>
  );
}
