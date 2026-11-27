import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { audioService } from '../../services/audioService.js';
import './LivingRoom.css';

const CONVERSATION_TOPICS = [
  { id: 'today',    label: 'How was your day?',       icon: '☀️', responses: { happy: 'It was wonderful! Thank you for asking! 💕', sad: 'It was okay... could be better~', tired: 'A bit tiring, but I am fine!', idle: 'Pretty good! I enjoyed spending time with you~ ✨' } },
  { id: 'dreams',   label: 'What are your dreams?',   icon: '✨', responses: { happy: 'I dream of adventures and magical places! 🌟', sad: 'I wish I could travel to faraway lands...', tired: 'Right now I dream of a cozy nap! 😴', idle: 'I want to learn many things and have fun! 🌸' } },
  { id: 'favorite', label: 'What is your favorite thing?', icon: '💝', responses: { happy: 'I love spending time with you the most! 💕', sad: 'I love when we are together... it makes me happy~', tired: 'I love peaceful quiet moments...', idle: 'I love books, flowers, and playing! 🌷' } },
  { id: 'story',    label: 'Tell me a story~',         icon: '📖', responses: { happy: 'Once upon a time in a magical garden... 🌸✨', sad: 'There was a little girl who felt lonely...', tired: 'Mm... maybe later? I am a bit sleepy~ 💤', idle: 'Did I tell you about the butterfly I saw? 🦋' } },
  { id: 'future',   label: 'What do you want to do?',  icon: '🌈', responses: { happy: 'I want to play, study, and grow my garden! 🌻', sad: 'I would like to feel better first...', tired: 'Maybe rest a little first? 😌', idle: 'I want to learn something new today! 📚' } },
];

const ACTIVITIES = [
  { id: 'tv',    label: 'Watch Together',  icon: '📺', desc: 'Enjoy a show together~', happiness: 15, social: 12 },
  { id: 'read',  label: 'Read a Story',    icon: '📖', desc: 'Cozy reading time',      happiness: 12, social: 10 },
  { id: 'music', label: 'Listen to Music', icon: '🎵', desc: 'Peaceful music time',    happiness: 10, social: 8  },
  { id: 'relax', label: 'Just Relax',      icon: '🌸', desc: 'Quiet time together',    happiness: 8,  social: 6  },
];

export default function LivingRoom({ timeOfDay }) {
  const { state, dispatch, characterState } = useGame();
  const [showConvo, setShowConvo] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [justDone, setJustDone] = useState(null);
  const [tvOn, setTvOn] = useState(false);
  const [lampOn, setLampOn] = useState(() => timeOfDay === 'night');
  const isNight = timeOfDay === 'night';

  function handleConversation(topic) {
    const mood = characterState;
    const baseResponse = topic.responses[mood] ?? topic.responses.idle;
    const bondBonus = (state.guardianLevel ?? 1) >= 4
      ? ' Everything is extra special with you~ 💖'
      : (state.guardianLevel ?? 1) >= 2
      ? ' I really like talking with you! 💕'
      : '';
    const response = `${baseResponse}${bondBonus}`;
    dispatch({ type: 'DO_CONVERSATION', topic: topic.label, social: 15, happiness: 12 });
    setSelectedTopic({ topic: topic.label, response });
    setShowConvo(false);
    setTimeout(() => setSelectedTopic(null), 4500);
  }

  function handleActivity(act) {
    audioService.playSfx('click');
    dispatch({ type: 'DO_CONVERSATION', topic: act.label, social: act.social, happiness: act.happiness });
    if (act.id === 'tv') {
      setTvOn(true);
      dispatch({ type: 'TRIGGER_ANIMATION', activity: 'relaxingSofa', duration: 3600 });
    } else if (act.id === 'read') {
      dispatch({ type: 'TRIGGER_ANIMATION', activity: 'reading', duration: 3600 });
    } else if (act.id === 'music') {
      dispatch({ type: 'TRIGGER_ANIMATION', activity: 'dancing', duration: 3600 });
    } else if (act.id === 'relax') {
      dispatch({ type: 'TRIGGER_ANIMATION', activity: 'relaxingSofa', duration: 3600 });
    }
    setShowActivities(false);
    setJustDone(act);
    setTimeout(() => setJustDone(null), 3500);
  }

  function toggleTv() {
    audioService.playSfx('click');
    const next = !tvOn;
    setTvOn(next);
    if (next) {
      handleActivity(ACTIVITIES[0]);
    }
  }

  function relaxOnSofa() {
    audioService.playSfx('click');
    handleActivity(ACTIVITIES[3]);
  }

  function readFromShelf() {
    audioService.playSfx('click');
    handleActivity(ACTIVITIES[1]);
  }

  const wallBg = isNight
    ? 'linear-gradient(180deg,#2d2b55,#3d3a6e)'
    : 'linear-gradient(180deg,#fff9f0,#ffefc8)';

  return (
    <div className="room living-room">
      {/* Wall */}
      <div className="living-wall" style={{ background: wallBg }}>
        <div className="living-wall-pattern" />
      </div>

      {/* Window */}
      <div className="living-window">
        <div className="lw-frame">
          <div className="lw-glass" style={{
            background: isNight
              ? 'linear-gradient(180deg,#0d0d2b,#2d2b55)'
              : 'linear-gradient(180deg,#b3e0ff,#dff0ff)'
          }}>
            {!isNight && <span className="lw-sun">☀️</span>}
            {isNight && <span className="lw-moon">🌙</span>}
            <div className="lw-curtain lw-curtain-left" />
            <div className="lw-curtain lw-curtain-right" />
          </div>
        </div>
      </div>

      {/* Bookshelf — clickable to read a story */}
      <div
        className="living-bookshelf"
        onClick={readFromShelf}
        style={{ cursor: 'pointer' }}
        title="Click bookshelf to read a story"
      >
        <div className="bookshelf-frame">
          {[0,1,2].map(row => (
            <div key={row} className="bookshelf-row">
              <span className="book book-pink" />
              <span className="book book-lavender" />
              <span className="book book-sage" />
              <span className="book book-peach" />
              <span className="book book-pink" />
              <span className="book-deco">🌸</span>
            </div>
          ))}
        </div>
      </div>

      {/* TV stand — clickable to toggle TV & watch together */}
      <div
        className="living-tv-stand"
        onClick={toggleTv}
        style={{ cursor: 'pointer' }}
        title={tvOn ? 'Turn TV off' : 'Turn TV on & watch together'}
      >
        <motion.div
          className="tv-screen"
          animate={tvOn
            ? { background: ['#2b344a', '#3d4f73', '#2b344a'] }
            : {}
          }
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          {tvOn ? '🎬 ✨' : '📺'}
        </motion.div>
        <div className="tv-base" />
      </div>

      {/* Coffee table */}
      <div className="living-coffee-table">
        <div className="coffee-table-top">
          <span className="table-item">☕</span>
          <span className="table-item">🌸</span>
          <span className="table-item">📖</span>
        </div>
        <div className="coffee-table-legs">
          <div className="coffee-leg" /><div className="coffee-leg" />
        </div>
      </div>

      {/* Sofa — clickable to sit & relax */}
      <div
        className="living-sofa"
        onClick={relaxOnSofa}
        style={{ cursor: 'pointer' }}
        title="Click sofa to relax together"
      >
        <div className="sofa-back" />
        <div className="sofa-seat">
          <div className="sofa-cushion" />
          <div className="sofa-cushion" />
          <div className="sofa-cushion" />
        </div>
        <div className="sofa-armrest sofa-armrest-left" />
        <div className="sofa-armrest sofa-armrest-right" />
      </div>

      {/* Plants */}
      <motion.div
        className="living-plant living-plant-left"
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity }}
      >🪴</motion.div>

      <motion.div
        className="living-plant living-plant-right"
        animate={{ rotate: [2, -2, 2] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >🌿</motion.div>

      {/* Lamp — clickable to toggle light */}
      <div
        className="living-lamp"
        onClick={() => { audioService.playSfx('click'); setLampOn(v => !v); }}
        style={{ cursor: 'pointer' }}
        title={lampOn ? 'Turn lamp off' : 'Turn lamp on'}
      >
        <div className="lamp-shade-living" style={{
          background: lampOn
            ? 'linear-gradient(180deg,#ffd700,#ffb300)'
            : 'linear-gradient(180deg,#ffefc8,#ffd8a0)',
        }} />
        <div className="lamp-pole-living" />
        {lampOn && (
          <motion.div
            className="lamp-glow-living"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Wall art */}
      <div className="living-wall-art">
        <div className="wall-picture">
          <span className="pic-emoji">🌸</span>
          <span className="pic-title">Together</span>
        </div>
      </div>

      {/* Floating conversation response */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            className="conversation-bubble"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="bubble-topic">{selectedTopic.topic}</div>
            <div className="bubble-response">{selectedTopic.response}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Just done activity */}
      <AnimatePresence>
        {justDone && !selectedTopic && (
          <motion.div
            className="activity-done-toast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="adt-icon">{justDone.icon}</span>
            <span className="adt-text">Pranavi enjoyed {justDone.label}!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="living-actions">
        <motion.button
          className="living-btn living-btn-convo"
          onClick={() => setShowConvo(v => !v)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >💬 Talk with Pranavi</motion.button>

        <motion.button
          className="living-btn living-btn-activity"
          onClick={() => setShowActivities(v => !v)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >✨ Spend Time Together</motion.button>
      </div>

      {/* Conversation panel */}
      <AnimatePresence>
        {showConvo && (
          <motion.div
            className="conversation-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
          >
            <div className="convo-panel-title">💬 What would you like to talk about?</div>
            <div className="convo-topics">
              {CONVERSATION_TOPICS.map((t, i) => (
                <motion.button
                  key={t.id}
                  className="convo-topic-btn"
                  onClick={() => handleConversation(t)}
                  whileHover={{ scale: 1.03, x: 4 }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className="convo-icon">{t.icon}</span>
                  <span className="convo-label">{t.label}</span>
                </motion.button>
              ))}
            </div>
            <button className="convo-close" onClick={() => setShowConvo(false)}>✕ Close</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activities panel */}
      <AnimatePresence>
        {showActivities && (
          <motion.div
            className="activities-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
          >
            <div className="act-panel-title">✨ Spend Time Together</div>
            <div className="act-grid">
              {ACTIVITIES.map((act, i) => (
                <motion.button
                  key={act.id}
                  className="act-card"
                  onClick={() => handleActivity(act)}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.94 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <span className="act-icon">{act.icon}</span>
                  <span className="act-label">{act.label}</span>
                  <span className="act-desc">{act.desc}</span>
                  <div className="act-effects">
                    <span>💕 +{act.happiness}</span>
                    <span>🤝 +{act.social}</span>
                  </div>
                </motion.button>
              ))}
            </div>
            <button className="act-close" onClick={() => setShowActivities(false)}>✕ Close</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor */}
      <div className="living-floor">
        <div className="living-floor-pattern" />
        <div className="living-rug" />
      </div>
    </div>
  );
}
