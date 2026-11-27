import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import './MemoryBook.css';

const SCRAPBOOK_THEMES = [
  { id: 'pink',      label: 'Pastel Pink',     icon: '🌸' },
  { id: 'lavender',  label: 'Dreamy Lavender', icon: '💜' },
  { id: 'starlight', label: 'Starlight Cream', icon: '⭐' },
  { id: 'skyblue',   label: 'Baby Blue Sky',   icon: '🩵' },
];

export default function MemoryBookRoom() {
  const { state, dispatch } = useGame();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeMemory, setActiveMemory] = useState(null);

  const memories = state.memories ?? [];
  const categories = ['All', ...new Set(memories.map(m => m.category))];
  const filtered = selectedCategory === 'All'
    ? memories
    : memories.filter(m => m.category === selectedCategory);

  const theme = state.selectedTheme ?? 'pink';
  const unlockedThemes = state.unlockedThemes ?? ['pink'];

  return (
    <div className={`room memory-room memory-theme--${theme}`}>
      <div className="memory-backdrop" />

      <div className="memory-decor" aria-hidden="true">
        {['📷', '✿', '⭐', '🎀', '💖'].map((d, i) => (
          <motion.span
            key={i}
            className="memory-deco-item"
            style={{ left: `${9 + i * 20}%`, top: `${4 + (i % 2) * 5}%` }}
            animate={{ y: [0, -7, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3.2 + i * 0.4, repeat: Infinity }}
          >{d}</motion.span>
        ))}
      </div>

      <div className="memory-content">
        <div className="memory-book-shell">
          <div className="memory-header">
            <div className="memory-title-wrap">
              <span className="memory-icon-head">📷 ✿</span>
              <h2 className="memory-title">Our Memory Book</h2>
              <span className="memory-sub">{memories.length} treasured {memories.length === 1 ? 'moment' : 'moments'} preserved</span>
            </div>

            {/* Scrapbook theme switcher */}
            <div className="memory-themes">
              {SCRAPBOOK_THEMES.map(t => {
                const unlocked = unlockedThemes.includes(t.id);
                const selected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    className={`theme-chip ${selected ? 'theme-chip--active' : ''} ${!unlocked ? 'theme-chip--locked' : ''}`}
                    onClick={() => unlocked && dispatch({ type: 'SELECT_SCRAPBOOK_THEME', themeId: t.id })}
                    title={unlocked ? `Use ${t.label} theme` : `Unlock via Guardian Levels / Achievements`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {!unlocked && <span>🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category filter pills */}
          {memories.length > 0 && (
            <div className="memory-filters">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`mem-filter-btn ${selectedCategory === cat ? 'mem-filter-btn--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Polaroid grid */}
          {filtered.length === 0 ? (
            <div className="memory-empty">
              <div className="memory-empty-icon">📷 🌸</div>
              <p className="memory-empty-title">No memories recorded here yet~</p>
              <p className="memory-empty-desc">
                Memories are created automatically when real milestones happen: talking together, playing, studying, cooking, planting flowers, celebrating events, and leveling up your bond!
              </p>
            </div>
          ) : (
            <div className="memory-grid">
              {filtered.map((mem, i) => (
                <motion.button
                  key={mem.id}
                  className="polaroid-card"
                  onClick={() => setActiveMemory(mem)}
                  initial={{ opacity: 0, y: 12, rotate: i % 2 === 0 ? -1 : 1 }}
                  animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -0.8 : 0.8 }}
                  whileHover={{ scale: 1.04, rotate: 0, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="polaroid-tape" aria-hidden="true" />
                  <div className="polaroid-photo">
                    <span className="polaroid-illus">{mem.illustration ?? '✨'}</span>
                    <span className="polaroid-mood">{mem.mood}</span>
                  </div>
                  <div className="polaroid-caption">
                    <div className="polaroid-title">{mem.title}</div>
                    <div className="polaroid-meta">
                      <span className="polaroid-cat">{mem.category}</span>
                      <span className="polaroid-date">{mem.virtualDate}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Memory Reader Modal */}
      <AnimatePresence>
        {activeMemory && (
          <motion.div
            className="memory-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveMemory(null)}
          >
            <motion.div
              className="memory-modal-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="memory-modal-close" onClick={() => setActiveMemory(null)}>✕</button>
              <div className="memory-modal-photo">
                <span className="memory-modal-illus">{activeMemory.illustration ?? '✨'}</span>
              </div>
              <div className="memory-modal-badges">
                <span className="mm-badge">{activeMemory.category}</span>
                <span className="mm-badge mm-badge--mood">Mood: {activeMemory.mood}</span>
              </div>
              <h3 className="memory-modal-title">{activeMemory.title}</h3>
              <p className="memory-modal-date">📅 {activeMemory.virtualDate}</p>
              <p className="memory-modal-desc">"{activeMemory.description}"</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="memory-floor" />
    </div>
  );
}
