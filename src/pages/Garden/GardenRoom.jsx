import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { GARDEN_PLANTS, STAGE_EMOJIS } from '../../data/gardenData.js';
import { getPlotStage } from '../../engine/gardenEngine.js';
import './Garden.css';

const OUTDOOR_ACTIVITIES = [
  { id: 'relax',      label: 'Sit & Relax',       icon: '🪑', happiness: 12, social: 5  },
  { id: 'play',       label: 'Play Outdoors',      icon: '🏃', happiness: 18, social: 8  },
  { id: 'butterfly',  label: 'Watch Butterflies',  icon: '🦋', happiness: 15, social: 3  },
];

function PlotCard({ plot, virtualMinutes, onWater, onCollect, onPlant }) {
  const stage = getPlotStage(plot, virtualMinutes);
  const plant = GARDEN_PLANTS.find(p => p.id === plot.plantId);

  if (!plot.plantId) {
    return (
      <motion.div
        className="plot plot--empty"
        onClick={onPlant}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        title="Plant a seed here"
      >
        <span className="plot-empty-icon">+</span>
        <span className="plot-empty-label">Plant</span>
      </motion.div>
    );
  }

  const emoji = stage === 'bloom' ? plant.emoji : STAGE_EMOJIS[stage];
  const isBloom = stage === 'bloom';

  return (
    <motion.div
      className={`plot plot--planted ${isBloom ? 'plot--bloom' : ''}`}
      style={{ '--plant-color': plant.color }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.5, repeat: Infinity }}
    >
      <motion.span
        className="plot-emoji"
        animate={isBloom ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >{emoji}</motion.span>
      <span className="plot-name">{plant.name}</span>
      <span className="plot-stage">{stage}</span>
      <div className="plot-actions">
        {!isBloom && (
          <motion.button
            className="plot-btn plot-btn--water"
            onClick={e => { e.stopPropagation(); onWater(); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Water plant"
          >💧</motion.button>
        )}
        {isBloom && (
          <motion.button
            className="plot-btn plot-btn--collect"
            onClick={e => { e.stopPropagation(); onCollect(); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Collect flower"
          >🌸</motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default function GardenRoom() {
  const { state, dispatch } = useGame();
  const [showPlantPicker, setShowPlantPicker] = useState(null); // plotId
  const [activeOutdoor, setActiveOutdoor] = useState(null);

  const { garden, clock, inventory } = state;
  const virtualMinutes = clock.virtualMinutes;

  function handleWater(plotId) {
    dispatch({ type: 'WATER_PLANT', plotId });
    dispatch({ type: 'START_VISUAL_ACTION', actionKey: 'garden', skipRoomSwitch: true });
  }

  function handleCollect(plotId) {
    dispatch({ type: 'COLLECT_PLANT', plotId });
  }

  function handlePlantSeed(plotId, plantId) {
    dispatch({ type: 'PLANT_SEED', plotId, plantId });
    setShowPlantPicker(null);
  }

  function doOutdoor(act) {
    setActiveOutdoor(act.id);
    dispatch({ type: 'DO_PLAY', activityName: act.label, happinessGain: act.happiness });
    setTimeout(() => setActiveOutdoor(null), 3000);
  }

  return (
    <div className="room garden-room">
      {/* Sky */}
      <div className="garden-sky">
        {/* Animated butterflies */}
        {[...Array(3)].map((_, i) => (
          <motion.span
            key={i}
            className="garden-butterfly"
            style={{ top: `${15 + i * 20}%` }}
            animate={{ x: [-30, 200], y: [0, -15, 0, 10, 0] }}
            transition={{ duration: 8 + i * 3, repeat: Infinity, delay: i * 2.5 }}
          >🦋</motion.span>
        ))}
        {/* Clouds */}
        <motion.span
          className="garden-cloud"
          animate={{ x: [-20, 60] }}
          transition={{ duration: 20, repeat: Infinity }}
        >☁️</motion.span>
      </div>

      {/* Trees */}
      <div className="garden-trees">
        <motion.span
          className="garden-tree"
          animate={{ rotate: [-1, 1, -1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >🌳</motion.span>
        <motion.span
          className="garden-tree garden-tree--right"
          animate={{ rotate: [1, -1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        >🌸</motion.span>
      </div>

      {/* Ground */}
      <div className="garden-ground">
        <div className="garden-path" />

        {/* Garden plots */}
        <div className="garden-plots">
          {garden.plots.map(plot => (
            <PlotCard
              key={plot.id}
              plot={plot}
              virtualMinutes={virtualMinutes}
              onWater={() => handleWater(plot.id)}
              onCollect={() => handleCollect(plot.id)}
              onPlant={() => setShowPlantPicker(plot.id)}
            />
          ))}
        </div>

        {/* Garden bench */}
        <div className="garden-bench">
          <div className="bench-seat" />
          <div className="bench-legs">
            <div className="bench-leg" /><div className="bench-leg" />
          </div>
        </div>

        {/* Watering can */}
        <div className="watering-can">🪣</div>
      </div>

      {/* Outdoor activities */}
      <div className="garden-activities">
        {OUTDOOR_ACTIVITIES.map(act => (
          <motion.button
            key={act.id}
            className={`garden-act-btn ${activeOutdoor === act.id ? 'garden-act-btn--active' : ''}`}
            onClick={() => doOutdoor(act)}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.94 }}
            disabled={!!activeOutdoor}
          >
            <span>{act.icon}</span>
            <span>{act.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Plant picker */}
      <AnimatePresence>
        {showPlantPicker && (
          <motion.div
            className="plant-picker"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="plant-picker-title">🌱 Choose a seed to plant~</div>
            <div className="plant-picker-grid">
              {GARDEN_PLANTS.map(plant => {
                const seedKey = `${plant.id}_seed`;
                const qty = inventory[seedKey] ?? 0;
                return (
                  <motion.button
                    key={plant.id}
                    className={`plant-picker-item ${qty <= 0 ? 'plant-picker-item--empty' : ''}`}
                    style={{ '--plant-color': plant.color }}
                    onClick={() => qty > 0 && handlePlantSeed(showPlantPicker, plant.id)}
                    whileHover={qty > 0 ? { scale: 1.08 } : {}}
                    disabled={qty <= 0}
                  >
                    <span className="ppi-emoji">{plant.emoji}</span>
                    <span className="ppi-name">{plant.name}</span>
                    <span className="ppi-qty">{qty <= 0 ? 'No seeds' : `×${qty}`}</span>
                  </motion.button>
                );
              })}
            </div>
            <button className="plant-picker-close" onClick={() => setShowPlantPicker(null)}>✕ Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="garden-fence" />
    </div>
  );
}
