// AchievementsRoom.jsx — Achievement collection page
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { getAchievementProgressList } from '../../engine/achievementEngine.js';
import './Achievements.css';

const CATEGORIES = ['All', 'Bonding', 'Care', 'Play', 'Routine', 'Garden', 'Growth', 'Style', 'Memories'];

const RARITY_COLORS = {
  Bonding:   '#a87de8',
  Care:      '#e8638a',
  Play:      '#ffd700',
  Routine:   '#90c8f0',
  Garden:    '#78d47e',
  Growth:    '#5ba3e0',
  Style:     '#f4a0c8',
  Memories:  '#ffb347',
};

export default function AchievementsRoom() {
  const { state } = useGame();
  const [filter, setFilter] = useState('All');
  const [modalAch, setModalAch] = useState(null);

  const achievements = useMemo(() => getAchievementProgressList(state), [state]);

  const filtered = useMemo(() =>
    filter === 'All' ? achievements : achievements.filter(a => a.category === filter),
    [achievements, filter]
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="ach-room">
      {/* Decorative stars */}
      <div className="ach-stars" aria-hidden="true">
        {['⭐','🌟','✦','⭐','✨','🌟','✦'].map((s, i) => (
          <motion.span
            key={i}
            className="ach-star"
            style={{ left: `${5 + i * 13}%` }}
            animate={{ y: [-8, -30, -8], opacity: [0.5, 1, 0.5], rotate: [0, 15, 0] }}
            transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {s}
          </motion.span>
        ))}
      </div>

      <div className="ach-room__inner">
        {/* Header */}
        <motion.div
          className="ach-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        >
          <span className="ach-header__icon">🏆</span>
          <div>
            <h1 className="ach-header__title">Achievements</h1>
            <p className="ach-header__sub">{unlockedCount} of {achievements.length} unlocked</p>
          </div>
          <div className="ach-header__badge">
            <span className="ach-score">{unlockedCount}</span>
            <span className="ach-score-label">/ {achievements.length}</span>
          </div>
        </motion.div>

        {/* Overall progress bar */}
        <div className="ach-overall-track">
          <motion.div
            className="ach-overall-fill"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: unlockedCount / achievements.length }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        {/* Category filter */}
        <div className="ach-filters">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat}
              className={`ach-filter-btn ${filter === cat ? 'ach-filter-btn--active' : ''}`}
              onClick={() => setFilter(cat)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Achievement grid */}
        <motion.div className="ach-grid" layout>
          <AnimatePresence mode="popLayout">
            {filtered.map((ach, i) => (
              <motion.div
                key={ach.id}
                className={`ach-card ${ach.unlocked ? 'ach-card--unlocked' : 'ach-card--locked'}`}
                style={{ '--cat-color': RARITY_COLORS[ach.category] ?? '#a87de8' }}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 200, damping: 22 }}
                whileHover={{ y: -4, boxShadow: '0 10px 28px rgba(0,0,0,0.12)' }}
                onClick={() => setModalAch(ach)}
              >
                {/* Lock overlay */}
                {!ach.unlocked && (
                  <div className="ach-card__lock-overlay">
                    <span className="ach-card__lock-icon">🔒</span>
                  </div>
                )}

                {/* Icon */}
                <div className="ach-card__icon-wrap" style={{ background: ach.unlocked ? 'var(--cat-color)' : '#ccc' }}>
                  <span className="ach-card__icon">{ach.icon}</span>
                  {ach.unlocked && (
                    <motion.span
                      className="ach-card__sparkle"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    >✨</motion.span>
                  )}
                </div>

                {/* Info */}
                <div className="ach-card__body">
                  <span className="ach-card__title">{ach.title}</span>
                  <span className="ach-card__cat" style={{ color: 'var(--cat-color)' }}>{ach.category}</span>

                  {/* Progress */}
                  {!ach.unlocked ? (
                    <div className="ach-card__progress-wrap">
                      <div className="ach-card__progress-track">
                        <motion.div
                          className="ach-card__progress-fill"
                          style={{ background: 'var(--cat-color)' }}
                          initial={{ scaleX: 0, originX: 0 }}
                          animate={{ scaleX: ach.percent / 100 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="ach-card__progress-text">{ach.current}/{ach.target}</span>
                    </div>
                  ) : (
                    <div className="ach-card__unlocked-label">
                      ✅ {ach.unlockedRecord?.virtualDate ?? 'Completed!'}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal detail */}
      <AnimatePresence>
        {modalAch && (
          <motion.div
            className="ach-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalAch(null)}
          >
            <motion.div
              className={`ach-modal ${modalAch.unlocked ? 'ach-modal--unlocked' : ''}`}
              style={{ '--cat-color': RARITY_COLORS[modalAch.category] ?? '#a87de8' }}
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="ach-modal__icon-wrap" style={{ background: modalAch.unlocked ? 'var(--cat-color)' : '#ccc' }}>
                <span className="ach-modal__icon">{modalAch.icon}</span>
              </div>
              <h2 className="ach-modal__title">{modalAch.title}</h2>
              <span className="ach-modal__cat" style={{ color: 'var(--cat-color)' }}>{modalAch.category}</span>
              <p className="ach-modal__desc">{modalAch.description}</p>

              {!modalAch.unlocked && (
                <div className="ach-modal__prog">
                  <div className="ach-modal__prog-track">
                    <div className="ach-modal__prog-fill" style={{ width: `${modalAch.percent}%`, background: 'var(--cat-color)' }} />
                  </div>
                  <span>{modalAch.current} / {modalAch.target}</span>
                </div>
              )}

              {modalAch.unlocked && modalAch.unlockedRecord && (
                <div className="ach-modal__unlocked-info">
                  <span>🎉 Unlocked on {modalAch.unlockedRecord.virtualDate ?? 'Day 1'}</span>
                </div>
              )}

              {/* Rewards */}
              {(modalAch.rewardSticker || modalAch.rewardItems || modalAch.rewardTheme) && (
                <div className="ach-modal__rewards">
                  <h4>🎁 Reward</h4>
                  {modalAch.rewardSticker && <span className="ach-modal__reward-chip">{modalAch.rewardSticker} Sticker</span>}
                  {modalAch.rewardTheme && <span className="ach-modal__reward-chip">🎨 {modalAch.rewardTheme} theme</span>}
                  {modalAch.rewardItems && Object.entries(modalAch.rewardItems).map(([k, v]) => (
                    <span key={k} className="ach-modal__reward-chip">{v}× {k.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              )}

              <button className="ach-modal__close" onClick={() => setModalAch(null)}>Close ✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
