import { motion } from 'framer-motion';
import './StatusBars.css';

const STATS = [
  { key: 'hunger',    label: 'Hunger',  icon: '🍽️', invert: true,  color: '#f4845f', warnHigh: true  },
  { key: 'happiness', label: 'Happy',   icon: '💕', invert: false, color: '#e8638a', warnHigh: false },
  { key: 'energy',    label: 'Energy',  icon: '⚡', invert: false, color: '#ffd700', warnHigh: false },
  { key: 'health',    label: 'Health',  icon: '💚', invert: false, color: '#6aaa6a', warnHigh: false },
  { key: 'hygiene',   label: 'Hygiene', icon: '✨', invert: false, color: '#90c8f0', warnHigh: false },
  { key: 'social',    label: 'Social',  icon: '💬', invert: false, color: '#a87de8', warnHigh: false },
];

function getBarColor(displayPct) {
  if (displayPct > 60) return null;
  if (displayPct > 30) return '#ffc107';
  return '#ff5252';
}

export default function StatusBars({ needs }) {
  function closeMobileSheet() {
    document.querySelector('.mobile-drawer-backdrop')?.click();
  }

  return (
    <div className="status-bars">
      <div className="status-title-row">
        <div className="status-title">✿ Pranavi's Wellbeing</div>
        <button
          type="button"
          className="mobile-sheet-close"
          onClick={closeMobileSheet}
          aria-label="Close needs panel"
        >
          ✕
        </button>
      </div>
      {STATS.map(stat => {
        const raw = needs[stat.key] ?? 0;
        const displayPct = stat.invert ? 100 - raw : raw;
        const barColor = getBarColor(displayPct) ?? stat.color;
        const isLow = displayPct < 30;
        const isCritical = displayPct < 15;

        return (
          <div
            key={stat.key}
            className={`stat-item ${isLow ? 'stat-low' : ''} ${isCritical ? 'stat-critical' : ''}`}
          >
            <motion.span
              className="stat-icon"
              animate={isCritical ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              {stat.icon}
            </motion.span>

            <div className="stat-info">
              <div className="stat-header">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value" style={{ color: barColor }}>
                  {Math.round(displayPct)}
                </span>
              </div>
              <div className="stat-bar-bg">
                <motion.div
                  className="stat-bar-fill"
                  style={{ background: barColor }}
                  animate={{ width: `${displayPct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
                {/* Shimmer on critical */}
                {isCritical && <div className="stat-bar-shimmer" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
