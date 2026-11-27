import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { ACTION_MACHINE_STATES } from '../../engine/visualActionEngine.js';
import { audioService } from '../../services/audioService.js';
import './ActivityControlBar.css';

export default function ActivityControlBar() {
  const { state, dispatch } = useGame();
  const act = state.activeVisualAction;
  if (!act) return null;

  const stage = act.stages[act.stageIndex] ?? act.stages[0];
  const totalDuration = act.stages.reduce((s, st) => s + st.durationMs, 0);
  const completedDuration = act.stages
    .slice(0, act.stageIndex)
    .reduce((s, st) => s + st.durationMs, 0) + act.stageElapsedMs;
  const pct = Math.min(100, Math.round((completedDuration / Math.max(1, totalDuration)) * 100));

  const statusText = act.paused
    ? 'Paused'
    : act.machineState === ACTION_MACHINE_STATES.WALKING
    ? `Walking to ${stage?.label ?? act.label}`
    : stage?.label ?? act.label;

  return (
    <AnimatePresence>
      <motion.div
        className="activity-ctrl-bar"
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
      >
        <span className="acb-icon">{act.icon}</span>
        <div className="acb-info">
          <div className="acb-title">{act.label}</div>
          <div className="acb-stage">{statusText}</div>
          <div className="acb-track">
            <div className="acb-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="acb-btns">
          <button
            className="acb-btn"
            onClick={() => {
              audioService.playSfx('click');
              dispatch({ type: act.paused ? 'RESUME_VISUAL_ACTION' : 'PAUSE_VISUAL_ACTION' });
            }}
            title={act.paused ? 'Resume activity' : 'Pause activity'}
          >
            {act.paused ? '▶' : '⏸'}
          </button>
          <button
            className="acb-btn acb-btn--cancel"
            onClick={() => {
              audioService.playSfx('click');
              dispatch({ type: 'CANCEL_VISUAL_ACTION' });
            }}
            title="Cancel activity"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
