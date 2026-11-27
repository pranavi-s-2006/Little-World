import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { WEATHER_CONDITIONS } from '../../engine/weatherEngine.js';
import { SEASONS } from '../../engine/seasonEngine.js';
import { audioService } from '../../services/audioService.js';
import { clearSave } from '../../services/saveService.js';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
  const { state, dispatch } = useGame();
  const s = state.settings ?? {};

  function update(patch) {
    audioService.playSfx('click');
    dispatch({ type: 'UPDATE_SETTINGS', settings: patch });
  }

  return (
    <motion.div
      className="settings-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="settings-modal"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="settings-header">
          <h2>⚙️ World & Audio Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* Audio */}
          <section className="settings-group">
            <h3>🎵 Music & Sound Effects</h3>

            <label className="settings-row">
              <span>Global Mute</span>
              <input
                type="checkbox"
                checked={Boolean(s.muted)}
                onChange={e => update({ muted: e.target.checked })}
              />
            </label>

            <label className="settings-row">
              <span>Background Music</span>
              <input
                type="checkbox"
                checked={s.musicOn ?? true}
                onChange={e => update({ musicOn: e.target.checked })}
              />
            </label>

            <label className="settings-slider-row">
              <span>Music Volume ({Math.round((s.musicVolume ?? 0.5) * 100)}%)</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={s.musicVolume ?? 0.5}
                onChange={e => update({ musicVolume: Number(e.target.value) })}
              />
            </label>

            <label className="settings-row">
              <span>Sound Effects</span>
              <input
                type="checkbox"
                checked={s.sfxOn ?? true}
                onChange={e => update({ sfxOn: e.target.checked })}
              />
            </label>

            <label className="settings-slider-row">
              <span>SFX Volume ({Math.round((s.sfxVolume ?? 0.65) * 100)}%)</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={s.sfxVolume ?? 0.65}
                onChange={e => update({ sfxVolume: Number(e.target.value) })}
              />
            </label>
          </section>

          {/* Visuals & Accessibility */}
          <section className="settings-group">
            <h3>✨ Atmosphere & Accessibility</h3>

            <label className="settings-row">
              <span>Weather Effects</span>
              <input
                type="checkbox"
                checked={s.weatherEffects ?? true}
                onChange={e => update({ weatherEffects: e.target.checked })}
              />
            </label>

            <label className="settings-row">
              <span>Ambient Animations (Petals, Fireflies)</span>
              <input
                type="checkbox"
                checked={s.ambientAnimations ?? true}
                onChange={e => update({ ambientAnimations: e.target.checked })}
              />
            </label>

            <label className="settings-row">
              <span>Reduced Motion</span>
              <input
                type="checkbox"
                checked={Boolean(s.reducedMotion)}
                onChange={e => update({ reducedMotion: e.target.checked })}
              />
            </label>

            <label className="settings-row">
              <span>Visual Effects Quality</span>
              <select
                value={s.effectsQuality ?? 'medium'}
                onChange={e => update({ effectsQuality: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </section>

          {/* Calendar & Testing Overrides */}
          <section className="settings-group">
            <h3>🌦️ Virtual Calendar & Testing</h3>

            <label className="settings-row">
              <span>Pranavi's Birthday (Virtual Day)</span>
              <input
                type="number"
                min="1"
                max="28"
                value={s.birthdayDay ?? 5}
                onChange={e => update({ birthdayDay: Math.max(1, Math.min(28, Number(e.target.value) || 5)) })}
              />
            </label>

            <label className="settings-row">
              <span>Clock Speed</span>
              <select
                value={s.speed ?? 10}
                onChange={e => update({ speed: Number(e.target.value) })}
              >
                <option value={5}>5x (Gentle)</option>
                <option value={10}>10x (Default)</option>
                <option value={30}>30x (Fast)</option>
                <option value={60}>60x (Very Fast)</option>
              </select>
            </label>

            <label className="settings-row">
              <span>Weather Override</span>
              <select
                value={s.weatherOverride ?? 'auto'}
                onChange={e => update({ weatherOverride: e.target.value })}
              >
                <option value="auto">Auto (Dynamic)</option>
                {Object.values(WEATHER_CONDITIONS).map(w => (
                  <option key={w.id} value={w.id}>{w.icon} {w.label}</option>
                ))}
              </select>
            </label>

            <label className="settings-row">
              <span>Season Override</span>
              <select
                value={s.seasonOverride ?? 'auto'}
                onChange={e => update({ seasonOverride: e.target.value })}
              >
                <option value="auto">Auto (Calendar)</option>
                {Object.values(SEASONS).map(sn => (
                  <option key={sn.id} value={sn.id}>{sn.icon} {sn.name}</option>
                ))}
              </select>
            </label>
          </section>

          {/* Save & Data Safety */}
          <section className="settings-group">
            <h3>💾 Save & Data Safety</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="settings-action-btn"
                onClick={() => {
                  audioService.playSfx('click');
                  dispatch({ type: 'MANUAL_SAVE' });
                }}
              >
                💾 Save Progress Now
              </button>
              <button
                type="button"
                className="settings-action-btn is-danger"
                onClick={() => {
                  if (window.confirm('Reset all saved progress and start fresh? This cannot be undone.')) {
                    clearSave();
                    window.location.reload();
                  }
                }}
              >
                🗑️ Reset Save Data
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
