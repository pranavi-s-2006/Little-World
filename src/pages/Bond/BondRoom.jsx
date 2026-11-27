// BondRoom.jsx — Relationship & Guardian Bond page
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { GUARDIAN_LEVELS, getGuardianLevelFromBond } from '../../engine/relationshipEngine.js';
import './Bond.css';

const ATTR_META = [
  { key: 'trust',                label: 'Trust',               icon: '🤝', color: '#a87de8' },
  { key: 'affection',            label: 'Affection',           icon: '💕', color: '#e8638a' },
  { key: 'interactionHappiness', label: 'Joy from Time Together', icon: '✨', color: '#ffd700' },
  { key: 'familiarity',         label: 'Familiarity',         icon: '🌸', color: '#90c8f0' },
  { key: 'emotionalConnection',  label: 'Emotional Connection',icon: '💖', color: '#f4a0c8' },
];

const BOND_TIPS = [
  { icon: '💬', label: 'Talk with her',       desc: 'Share a conversation in the Living Room.' },
  { icon: '🎮', label: 'Play together',        desc: 'Visit the Playroom for fun activities.' },
  { icon: '📚', label: 'Help her study',       desc: 'Support her learning in the Study Room.' },
  { icon: '🍳', label: 'Prepare her meals',    desc: 'Cook and serve food in the Kitchen.' },
  { icon: '🌸', label: 'Garden together',      desc: 'Plant and tend flowers in the Garden.' },
  { icon: '💤', label: 'Tuck her in',          desc: 'Help with her sleep routine in the Bedroom.' },
  { icon: '🤗', label: 'Give a hug',           desc: 'Click Pranavi to give her a warm hug.' },
  { icon: '🎉', label: 'Join special events',  desc: 'Participate in daily events when they appear.' },
];

function AttrBar({ meta, value }) {
  return (
    <motion.div
      className="bond-attr"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <div className="bond-attr__header">
        <span className="bond-attr__icon">{meta.icon}</span>
        <span className="bond-attr__label">{meta.label}</span>
        <span className="bond-attr__value">{Math.round(value)}/100</span>
      </div>
      <div className="bond-attr__track">
        <motion.div
          className="bond-attr__fill"
          style={{ background: meta.color }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: value / 100 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function LevelBadge({ lvl, isCurrent }) {
  return (
    <motion.div
      className={`bond-lvl-badge ${isCurrent ? 'bond-lvl-badge--current' : ''}`}
      whileHover={{ scale: 1.06 }}
    >
      <span className="bond-lvl-badge__icon">{lvl.badge}</span>
      <div className="bond-lvl-badge__info">
        <span className="bond-lvl-badge__title">Lv.{lvl.level} — {lvl.title}</span>
        <span className="bond-lvl-badge__min">{lvl.minBond} bond pts</span>
      </div>
      {isCurrent && <span className="bond-lvl-badge__you">YOU ♡</span>}
    </motion.div>
  );
}

export default function BondRoom() {
  const { state } = useGame();
  const rel = state.relationship ?? {};
  const bondInfo = useMemo(() => getGuardianLevelFromBond(rel.bondPoints ?? 0), [rel.bondPoints]);
  const rewardHistory = state.rewardHistory ?? [];

  return (
    <div className="bond-room">
      {/* Decorative floating petals */}
      <div className="bond-petals" aria-hidden="true">
        {['🌸','💕','✿','💖','🌷','✦'].map((p, i) => (
          <motion.span
            key={i}
            className="bond-petal"
            style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.7}s` }}
            animate={{ y: [-10, -40, -10], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {p}
          </motion.span>
        ))}
      </div>

      <div className="bond-room__inner">
        {/* ── HERO: Guardian Level ── */}
        <motion.section
          className="bond-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        >
          <div className="bond-hero__badge">{bondInfo.badge}</div>
          <div className="bond-hero__info">
            <h1 className="bond-hero__level">Level {bondInfo.level}</h1>
            <h2 className="bond-hero__title">{bondInfo.title}</h2>
            <p className="bond-hero__desc">{bondInfo.description}</p>
          </div>
          <div className="bond-hero__points">
            <span className="bond-pts-num">{Math.round(rel.bondPoints ?? 0)}</span>
            <span className="bond-pts-label">Bond Points</span>
          </div>
        </motion.section>

        {/* ── Progress to next level ── */}
        {bondInfo.next && (
          <motion.section
            className="bond-progress-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bond-progress-header">
              <span>Progress to <strong>{bondInfo.nextTitle}</strong></span>
              <span className="bond-progress-pct">{bondInfo.progress}%</span>
            </div>
            <div className="bond-progress-track">
              <motion.div
                className="bond-progress-fill"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: bondInfo.progress / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            <p className="bond-progress-need">
              {bondInfo.next - Math.round(rel.bondPoints ?? 0)} more points needed
            </p>
          </motion.section>
        )}

        {/* ── Relationship attributes ── */}
        <motion.section className="bond-attrs-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 className="bond-section-title">💞 Relationship Attributes</h3>
          <div className="bond-attrs-grid">
            {ATTR_META.map((meta, i) => (
              <motion.div key={meta.key} transition={{ delay: 0.1 * i }}>
                <AttrBar meta={meta} value={rel[meta.key] ?? 0} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Guardian level ladder ── */}
        <motion.section className="bond-levels-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <h3 className="bond-section-title">🌈 Guardian Journey</h3>
          <div className="bond-levels-list">
            {GUARDIAN_LEVELS.map(lvl => (
              <LevelBadge key={lvl.level} lvl={lvl} isCurrent={lvl.level === bondInfo.level} />
            ))}
          </div>
        </motion.section>

        {/* ── Bond tips ── */}
        <motion.section className="bond-tips-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h3 className="bond-section-title">💡 What Builds Our Bond</h3>
          <div className="bond-tips-grid">
            {BOND_TIPS.map((tip, i) => (
              <motion.div
                key={i}
                className="bond-tip"
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(168,125,232,0.18)' }}
              >
                <span className="bond-tip__icon">{tip.icon}</span>
                <div>
                  <div className="bond-tip__label">{tip.label}</div>
                  <div className="bond-tip__desc">{tip.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Reward history ── */}
        {rewardHistory.length > 0 && (
          <motion.section className="bond-rewards-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            <h3 className="bond-section-title">🎁 Unlocked Rewards</h3>
            <div className="bond-rewards-list">
              {rewardHistory.map((r, i) => (
                <motion.div
                  key={i}
                  className="bond-reward-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <span className="bond-reward-badge">{GUARDIAN_LEVELS.find(l => l.level === r.level)?.badge ?? '🎁'}</span>
                  <div>
                    <div className="bond-reward-title">Level {r.level} — {r.label}</div>
                    <div className="bond-reward-date">{r.virtualDate ?? ''}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
