import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { FOOD_DATA } from '../../data/foodData.js';
import { GARDEN_PLANTS } from '../../data/gardenData.js';
import './InventoryPanel.css';

const BATH_ITEMS = [
  { id: 'shampoo',    name: 'Shampoo',    emoji: '🧴' },
  { id: 'soap',       name: 'Soap',       emoji: '🧼' },
  { id: 'toothpaste', name: 'Toothpaste', emoji: '🪥' },
  { id: 'facewash',   name: 'Face Wash',  emoji: '💦' },
];

const INVENTORY_SECTIONS = [
  { id: 'food',   label: 'Food',       icon: '🍽️' },
  { id: 'drinks', label: 'Drinks',     icon: '💧' },
  { id: 'bath',   label: 'Bath',       icon: '🛁' },
  { id: 'garden', label: 'Seeds',      icon: '🌱' },
];

function ItemRow({ item, qty }) {
  const isOut = qty <= 0;
  return (
    <div className={`inv-item-row ${isOut ? 'inv-item-row--out' : ''}`}>
      <span className="inv-item-emoji">{item.emoji}</span>
      <span className="inv-item-name">{item.name}</span>
      <span className={`inv-item-qty ${isOut ? 'inv-item-qty--out' : ''}`}>
        {isOut ? 'Out!' : `×${qty}`}
      </span>
    </div>
  );
}

export default function InventoryPanel({ onClose }) {
  const { state } = useGame();
  const [activeSection, setActiveSection] = useState('food');
  const inv = state.inventory;

  const foodItems    = FOOD_DATA.filter(f => f.category !== 'drink');
  const drinkItems   = FOOD_DATA.filter(f => f.category === 'drink');
  const gardenSeeds  = GARDEN_PLANTS.map(p => ({
    id: `${p.id}_seed`, name: `${p.name} Seed`, emoji: p.seedEmoji
  }));

  const sections = {
    food:   foodItems,
    drinks: drinkItems,
    bath:   BATH_ITEMS,
    garden: gardenSeeds,
  };

  const currentItems = sections[activeSection] ?? [];

  return (
    <motion.div
      className="inv-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="inv-panel"
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Header */}
        <div className="inv-header">
          <span className="inv-header-icon">🗃️</span>
          <div>
            <div className="inv-title">Inventory</div>
            <div className="inv-subtitle">Pranavi's supplies~</div>
          </div>
          <button className="inv-close" onClick={onClose}>✕</button>
        </div>

        {/* Section tabs */}
        <div className="inv-tabs">
          {INVENTORY_SECTIONS.map(sec => (
            <button
              key={sec.id}
              className={`inv-tab ${activeSection === sec.id ? 'inv-tab--active' : ''}`}
              onClick={() => setActiveSection(sec.id)}
            >
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>

        {/* Items list */}
        <div className="inv-items">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {currentItems.map(item => (
                <ItemRow key={item.id} item={item} qty={inv[item.id] ?? 0} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Summary footer */}
        <div className="inv-footer">
          <span className="inv-footer-text">
            {currentItems.filter(i => (inv[i.id] ?? 0) > 0).length}/{currentItems.length} available
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
