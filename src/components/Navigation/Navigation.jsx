import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import InventoryPanel from '../Inventory/InventoryPanel.jsx';
import './Navigation.css';

const ROOMS = [
  { id: 'bedroom',      label: 'Bedroom',   icon: '🛏️' },
  { id: 'kitchen',      label: 'Kitchen',   icon: '🍳' },
  { id: 'bathroom',     label: 'Bathroom',  icon: '🛁' },
  { id: 'living',       label: 'Living',    icon: '🛋️' },
  { id: 'study',        label: 'Study',     icon: '📚' },
  { id: 'playroom',     label: 'Playroom',  icon: '🎮' },
  { id: 'garden',       label: 'Garden',    icon: '🌸' },
  { id: 'wardrobe',     label: 'Wardrobe',  icon: '👗' },
  { id: 'diary',        label: 'Diary',     icon: '📖' },
  { id: 'memories',     label: 'Memories',  icon: '📷' },
  { id: 'bond',         label: 'Bond',      icon: '💕' },
  { id: 'achievements', label: 'Awards',    icon: '🏆' },
];

export default function Navigation() {
  const { state, dispatch } = useGame();
  const [showInventory, setShowInventory] = useState(false);

  return (
    <>
      <nav className="room-nav">
        {ROOMS.map(room => {
          const isActive = state.currentRoom === room.id;
          return (
            <motion.button
              key={room.id}
              className={`nav-btn ${isActive ? 'nav-btn--active' : ''}`}
              onClick={() => dispatch({ type: 'NAVIGATE', room: room.id })}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
              title={room.label}
            >
              <motion.span
                className="nav-icon"
                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >{room.icon}</motion.span>
              <span className="nav-label">{room.label}</span>
              {isActive && (
                <motion.div
                  className="nav-active-dot"
                  layoutId="nav-active-dot"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}

        {/* Inventory button */}
        <motion.button
          className="nav-btn nav-btn--inventory"
          onClick={() => setShowInventory(true)}
          whileHover={{ scale: 1.08, y: -3 }}
          whileTap={{ scale: 0.92 }}
          title="Inventory"
        >
          <span className="nav-icon">🗃️</span>
          <span className="nav-label">Items</span>
        </motion.button>
      </nav>

      {/* Inventory panel overlay */}
      <AnimatePresence>
        {showInventory && (
          <InventoryPanel onClose={() => setShowInventory(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
