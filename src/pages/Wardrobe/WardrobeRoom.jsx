import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { OUTFITS } from '../../data/outfits.js';
import './Wardrobe.css';

export default function WardrobeRoom() {
  const { state, dispatch } = useGame();

  function selectOutfit(id) {
    if (!state.unlockedOutfits.includes(id)) return;
    dispatch({ type: 'CHANGE_OUTFIT', outfitId: id });
  }

  return (
    <div className="room wardrobe-room">
      <div className="wardrobe-wall" />
      <div className="wardrobe-title-area">
        <h2 className="wardrobe-heading">✿ Pranavi's Wardrobe</h2>
        <p className="wardrobe-sub">Choose an outfit for today~</p>
      </div>

      <div className="outfit-grid">
        {OUTFITS.map(outfit => {
          const isUnlocked = state.unlockedOutfits.includes(outfit.id);
          const isSelected = state.selectedOutfit === outfit.id;
          return (
            <motion.button
              key={outfit.id}
              className={`outfit-card ${isSelected ? 'outfit-selected' : ''} ${!isUnlocked ? 'outfit-locked' : ''}`}
              style={{ '--outfit-color': outfit.color }}
              onClick={() => selectOutfit(outfit.id)}
              whileHover={isUnlocked ? { scale: 1.06, y: -4 } : {}}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
            >
              <span className="outfit-emoji">{outfit.emoji}</span>
              <span className="outfit-name">{outfit.name}</span>
              <span className="outfit-desc">{outfit.description}</span>
              {!isUnlocked && <div className="outfit-lock">🔒</div>}
              {isSelected && <div className="outfit-check">✓</div>}
            </motion.button>
          );
        })}
      </div>

      <div className="wardrobe-floor" />
    </div>
  );
}
