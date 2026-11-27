import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { useGameClock } from '../../hooks/useGameClock.js';
import { buildDiaryNarrative, resolveDiaryMood } from '../../engine/diaryEngine.js';
import { getDayName } from '../../engine/timeEngine.js';
import './Diary.css';

const EVENT_ICONS = {
  ate: '🍽️', drank: '💧', played: '🎮', studied: '📚',
  bathed: '🛁', slept: '💤', talked: '💬', hugged: '🤗',
  planted: '🌱', watered: '💧', harvested: '🌸', dressed: '👗',
  woke: '☀️', event: '🎉',
};

function ScrapbookEntryCard({ entry, unlockedStickers, onToggleSticker, isFocused, onSelect }) {
  const pinned = entry.pinnedStickers ?? [];
  return (
    <motion.div
      className={`diary-entry ${isFocused ? 'diary-entry--active' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
    >
      <div className="entry-washi-tape" aria-hidden="true" />
      <div className="entry-header">
        <span className="entry-day">✿ {entry.dateLabel ?? entry.dayName ?? `Day ${entry.day}`}</span>
        <div className="entry-badges">
          {entry.mood && (
            <span className="entry-mood-pill">{entry.moodEmoji ?? '🌸'} {entry.mood}</span>
          )}
          <span className="entry-date">{entry.timeLabel ? `${entry.timeLabel}` : `Day ${entry.day}`}</span>
        </div>
      </div>

      <p className="entry-text">"{entry.text}"</p>

      {(entry.stickers?.length > 0 || pinned.length > 0) && (
        <div className="entry-stickers-row">
          {(entry.stickers ?? []).map((s, idx) => (
            <span key={`auto-${idx}`} className="entry-sticker">{s}</span>
          ))}
          {pinned.map((s, idx) => (
            <span key={`pin-${idx}`} className="entry-sticker entry-sticker--pinned" title="Pinned sticker">{s}</span>
          ))}
        </div>
      )}

      {isFocused && unlockedStickers.length > 0 && (
        <div className="entry-sticker-picker" onClick={e => e.stopPropagation()}>
          <span className="picker-label">Decorate with stickers:</span>
          <div className="picker-list">
            {unlockedStickers.map(st => {
              const active = pinned.includes(st);
              return (
                <button
                  key={st}
                  className={`picker-btn ${active ? 'picker-btn--active' : ''}`}
                  onClick={() => onToggleSticker(entry.day, st)}
                  title={active ? 'Remove sticker' : 'Add sticker to page'}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function DiaryRoom() {
  const { state, dispatch, characterState } = useGame();
  const { timeString, day, timeOfDay } = useGameClock();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const todayEvents = state.activityHistory.filter(e => e.day === day);
  const dayName = getDayName(day, false);
  const todayMood = resolveDiaryMood(state.needs, characterState);
  const todayNarrative = buildDiaryNarrative(todayEvents, state.needs, dayName);

  const savedEntries = state.diaryEntries ?? [];
  const safeIdx = Math.min(selectedIdx, Math.max(0, savedEntries.length - 1));
  const focusedEntry = savedEntries[safeIdx] ?? null;

  function generateDiary() {
    dispatch({ type: 'GENERATE_DIARY', manual: true });
    setSelectedIdx(0);
  }

  function handleToggleSticker(entryDay, sticker) {
    dispatch({ type: 'PIN_DIARY_STICKER', day: entryDay, sticker });
  }

  return (
    <div className="room diary-room">
      <div className="diary-wall" />

      {/* Floating scrapbook decor */}
      <div className="diary-decor">
        {['✿', '🎀', '✦', '🌸', '⭐'].map((d, i) => (
          <motion.span
            key={i}
            className="diary-deco-item"
            style={{ left: `${8 + i * 20}%`, top: `${4 + (i % 2) * 5}%` }}
            animate={{ y: [0, -8, 0], opacity: [0.45, 0.85, 0.45] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          >{d}</motion.span>
        ))}
      </div>

      <div className="diary-content">
        <div className="diary-book">
          <div className="diary-ribbon" aria-hidden="true">🎀</div>

          {/* Header */}
          <div className="diary-header">
            <span className="diary-flower">📖 ✿</span>
            <h2 className="diary-title">Pranavi's Scrapbook Diary</h2>
            <span className="diary-date">{dayName} · Day {day} · {timeString} ({timeOfDay})</span>
          </div>

          {/* Today's live grounded entry */}
          <div className="diary-today">
            <div className="diary-today-header">
              <span className="diary-today-label">Today's Page — {dayName}</span>
              <div className="diary-today-meta">
                <span className="diary-mood-badge">{todayMood.emoji} {todayMood.label}</span>
                <span className="diary-today-count">{todayEvents.length} recorded</span>
              </div>
            </div>

            <p className="diary-auto-entry">"{todayNarrative}"</p>

            {todayEvents.length > 0 && (
              <div className="diary-event-list">
                {todayEvents.slice(-8).map((ev, i) => (
                  <span key={i} className="diary-event-tag">
                    {EVENT_ICONS[ev.type] ?? '✿'} {ev.label}
                    {ev.timeLabel ? ` · ${ev.timeLabel}` : ''}
                  </span>
                ))}
              </div>
            )}

            <motion.button
              className="diary-save-btn"
              onClick={generateDiary}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              📖 Save Today's Scrapbook Page
            </motion.button>
          </div>

          {/* Past & Saved Days Browser */}
          <div className="diary-entries-section">
            <div className="diary-entries-bar">
              <div className="diary-entries-title">✿ Saved Scrapbook Pages ({savedEntries.length})</div>
              {savedEntries.length > 1 && (
                <div className="diary-pager">
                  <button
                    className="pager-btn"
                    onClick={() => setSelectedIdx(i => Math.min(savedEntries.length - 1, i + 1))}
                    disabled={safeIdx >= savedEntries.length - 1}
                  >◀ Older</button>
                  <span className="pager-info">{safeIdx + 1}/{savedEntries.length}</span>
                  <button
                    className="pager-btn"
                    onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                    disabled={safeIdx <= 0}
                  >Newer ▶</button>
                </div>
              )}
            </div>

            <div className="diary-entries">
              <AnimatePresence mode="wait">
                {savedEntries.length === 0 ? (
                  <p className="diary-empty">No saved pages yet. Do some activities together or save today's page~ 🌸</p>
                ) : (
                  savedEntries.map((entry, i) => (
                    <ScrapbookEntryCard
                      key={entry.id ?? `${entry.day}-${i}`}
                      entry={entry}
                      unlockedStickers={state.unlockedStickers ?? []}
                      onToggleSticker={handleToggleSticker}
                      isFocused={focusedEntry?.day === entry.day}
                      onSelect={() => setSelectedIdx(i)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="diary-floor" />
    </div>
  );
}
