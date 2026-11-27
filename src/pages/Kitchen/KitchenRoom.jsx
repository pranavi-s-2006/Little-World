import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { FOOD_DATA, getFoodByCategory } from '../../data/foodData.js';
import { requiresCooking, getCookingTickIncrement } from '../../engine/cookingEngine.js';
import { getFoodById } from '../../data/foodData.js';
import { getSuggestedCategory } from '../../engine/foodEngine.js';
import './Kitchen.css';

const CATEGORIES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { id: 'lunch',     label: 'Lunch',     icon: '☀️' },
  { id: 'dinner',    label: 'Dinner',    icon: '🌙' },
  { id: 'snack',     label: 'Snacks',    icon: '🍪' },
  { id: 'drink',     label: 'Drinks',    icon: '💧' },
];

const COOKING_STEPS = [
  'Gathering ingredients~',
  'Preparing with love~',
  'Cooking beautifully~',
  'Almost ready! 🌸',
];

function CookingOverlay({ foodId, progress, onCancel }) {
  const food = getFoodById(foodId);
  if (!food) return null;
  const stepIdx = Math.min(Math.floor((progress / 100) * COOKING_STEPS.length), COOKING_STEPS.length - 1);
  const isDone = progress >= 100;

  return (
    <motion.div
      className="cooking-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="cooking-panel"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
      >
        {/* Steam particles */}
        <div className="cooking-steam" aria-hidden>
          {[0,1,2].map(i => (
            <motion.span
              key={i}
              className="steam-puff"
              style={{ left: `${28 + i * 22}%` }}
              animate={{ y: [0, -30], opacity: [0.7, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45 }}
            >〰️</motion.span>
          ))}
        </div>

        <motion.div
          className="cooking-emoji"
          animate={isDone
            ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
            : { rotate: [-5, 5, -5], scale: [1, 1.08, 1] }
          }
          transition={{ duration: isDone ? 0.6 : 1.2, repeat: Infinity }}
        >
          {food.emoji}
        </motion.div>

        <h3 className="cooking-title">
          {isDone ? `✨ ${food.name} is ready!` : `Cooking ${food.name}~`}
        </h3>

        <p className="cooking-step">{COOKING_STEPS[stepIdx]}</p>
        <p className="cooking-desc">{food.desc}</p>

        <div className="cooking-bar-wrap">
          <motion.div
            className="cooking-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="cooking-pct">{Math.round(progress)}%</p>

        {isDone && (
          <motion.div
            className="cooking-serve-hint"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Serving Pranavi~
          </motion.div>
        )}

        {!isDone && (
          <button className="cooking-cancel" onClick={onCancel}>✕ Cancel</button>
        )}
      </motion.div>
    </motion.div>
  );
}

function FridgeContents({ inventory, activeCategory, onSelectCategory, onSelectFood }) {
  const categoryFoods = getFoodByCategory(activeCategory);

  return (
    <motion.div
      className="food-panel"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="food-panel-header">
        <div className="food-panel-title-row">
          <span className="food-panel-icon">❄️</span>
          <span className="food-panel-title">What shall we have?</span>
        </div>
      </div>

      <div className="food-cats">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`food-cat-btn ${activeCategory === cat.id ? 'food-cat-btn--active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="food-grid">
        {categoryFoods.map(food => {
          const qty = inventory[food.id] ?? 0;
          const unavailable = qty <= 0;
          return (
            <motion.button
              key={food.id}
              className={`food-card ${unavailable ? 'food-card--empty' : ''}`}
              onClick={() => !unavailable && onSelectFood(food)}
              whileHover={!unavailable ? { scale: 1.07, y: -4 } : {}}
              whileTap={!unavailable ? { scale: 0.94 } : {}}
              disabled={unavailable}
              title={food.desc}
            >
              <span className="food-emoji">{food.emoji}</span>
              <span className="food-name">{food.name}</span>
              <div className="food-effects">
                <span className="effect hunger">🍽 -{Math.abs(food.hunger)}</span>
                {food.happiness > 0 && <span className="effect happy">💕 +{food.happiness}</span>}
              </div>
              {food.prepTime > 0 && (
                <span className="food-prep">⏱ {food.prepTime}m</span>
              )}
              <span className={`food-qty ${unavailable ? 'food-qty--empty' : ''}`}>
                {unavailable ? 'Out!' : `×${qty}`}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function KitchenRoom({ timeOfDay }) {
  const { state, dispatch } = useGame();
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(() =>
    getSuggestedCategory(state.clock?.virtualMinutes ?? 0)
  );
  const [charAtTable, setCharAtTable] = useState(false);
  const cookingRef = useRef(null);
  const isNight = timeOfDay === 'night';
  const isEating = state.currentActivity === 'eating' || state.currentActivity === 'drinking';

  // Move character to table when eating
  useEffect(() => {
    if (isEating) {
      setCharAtTable(true);
      const t = setTimeout(() => setCharAtTable(false), 5500);
      return () => clearTimeout(t);
    }
  }, [isEating]);

  // Cooking tick
  useEffect(() => {
    if (!state.cookingItem) {
      clearInterval(cookingRef.current);
      return;
    }
    const food = getFoodById(state.cookingItem);
    const inc = getCookingTickIncrement(food);
    cookingRef.current = setInterval(() => {
      dispatch({ type: 'UPDATE_COOKING', progress: state.cookingProgress + inc });
    }, 200);
    return () => clearInterval(cookingRef.current);
  }, [state.cookingItem, state.cookingProgress]);

  // Auto-serve when cooking complete
  useEffect(() => {
    if (state.cookingItem && state.cookingProgress >= 100) {
      clearInterval(cookingRef.current);
      setTimeout(() => dispatch({ type: 'SERVE_FOOD', foodId: state.cookingItem }), 900);
    }
  }, [state.cookingProgress]);

  function handleSelectFood(food) {
    const qty = state.inventory[food.id] ?? 0;
    if (qty <= 0) return;
    if (requiresCooking(food)) {
      dispatch({
        type: 'START_VISUAL_ACTION',
        actionKey: 'cook',
        label: `Cooking ${food.name}`,
        meta: { foodId: food.id },
      });
    } else {
      dispatch({ type: 'SERVE_FOOD', foodId: food.id });
      dispatch({ type: 'START_VISUAL_ACTION', actionKey: 'feed', label: `Eating ${food.name}` });
    }
    setFridgeOpen(false);
  }

  const wallBg = isNight
    ? 'linear-gradient(180deg,#2d1f0e,#3d2a14)'
    : 'linear-gradient(180deg,#fff9f0,#fff0d8)';

  return (
    <div className="room kitchen-room">
      {/* Wall */}
      <div className="kitchen-wall" style={{ background: wallBg }}>
        <div className="kitchen-wall-tiles" />
      </div>

      {/* Window */}
      <div className="kitchen-window">
        <div className="kw-frame">
          <div className="kw-glass" style={{
            background: isNight
              ? 'linear-gradient(180deg,#0d0d2b,#2d2b55)'
              : 'linear-gradient(180deg,#b3e0ff,#dff0ff)'
          }}>
            {!isNight && <span className="kw-sun">☀️</span>}
            {isNight && <span className="kw-moon">🌙</span>}
            <div className="kw-sill-plant">🌿</div>
          </div>
          <div className="kw-cross-h" />
          <div className="kw-cross-v" />
        </div>
      </div>

      {/* Upper cabinets */}
      <div className="kitchen-cabinets">
        {[0,1,2,3].map(i => (
          <div key={i} className="cabinet-door">
            <div className="cabinet-handle" />
          </div>
        ))}
      </div>

      {/* Counter & backsplash */}
      <div className="kitchen-backsplash" />
      <div className="kitchen-counter">
        <div className="counter-top" />
        <div className="counter-body" />
      </div>

      {/* Stove */}
      <div className="kitchen-stove">
        <div className="stove-hood">
          <span className="stove-hood-icon">💨</span>
        </div>
        <div className="stove-body">
          <div className="stove-burners">
            {[0,1,2,3].map(i => (
              <motion.div
                key={i}
                className="burner"
                animate={state.cookingItem && i < 2
                  ? { background: ['#333','#ff4400','#ff6600','#333'] }
                  : {}
                }
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            ))}
          </div>
          <div className="stove-controls">
            {[0,1,2].map(i => <div key={i} className="stove-knob" />)}
          </div>
        </div>
      </div>

      {/* Microwave */}
      <div className="kitchen-microwave">
        <div className="microwave-screen">
          {state.cookingItem ? (
            <motion.span
              animate={{ opacity: [0.5,1,0.5] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >⏱</motion.span>
          ) : '00:00'}
        </div>
        <div className="microwave-buttons">
          <div className="mw-btn" /><div className="mw-btn" /><div className="mw-btn" />
        </div>
      </div>

      {/* Water dispenser */}
      <div className="kitchen-water-dispenser">
        <div className="wd-tank">💧</div>
        <div className="wd-spout" />
        <div className="wd-tray" />
        <span className="wd-label">Water</span>
      </div>

      {/* Kitchen decorations on counter */}
      <div className="kitchen-counter-decor">
        <motion.span className="kcd" animate={{ rotate:[-2,2,-2] }} transition={{ duration:3, repeat:Infinity }}>🫙</motion.span>
        <span className="kcd">🧂</span>
        <motion.span className="kcd" animate={{ y:[0,-3,0] }} transition={{ duration:2.5, repeat:Infinity }}>🍯</motion.span>
        <span className="kcd">🌺</span>
        <motion.span className="kcd" animate={{ rotate:[0,5,-5,0] }} transition={{ duration:4, repeat:Infinity }}>🧅</motion.span>
      </div>

      {/* Refrigerator */}
      <motion.div
        className={`fridge ${fridgeOpen ? 'fridge--open' : ''}`}
        onClick={() => setFridgeOpen(v => !v)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        title="Open refrigerator"
      >
        <div className="fridge-top-section">
          <div className="fridge-top-handle" />
          <div className="fridge-ice">❄️</div>
        </div>
        <div className="fridge-divider" />
        <div className="fridge-bottom-section">
          <div className="fridge-handle" />
          {fridgeOpen && (
            <motion.div
              className="fridge-interior"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="fridge-shelf">🥛 🥚 🧃</div>
              <div className="fridge-shelf">🍓 🥦 🫐</div>
            </motion.div>
          )}
        </div>
        <div className="fridge-label">Fridge</div>
        {fridgeOpen && (
          <motion.div
            className="fridge-open-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </motion.div>

      {/* Dining area */}
      <div className="dining-area">
        <div className="dining-table">
          <div className="table-surface">
            {/* Food appears when eating */}
            <AnimatePresence>
              {isEating && (
                <motion.div
                  className="table-serving"
                  initial={{ scale: 0, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <span className="table-food-emoji">
                    {state.lastInteraction?.actionId === 'water' ? '🥤' : '🍽️'}
                  </span>
                  <div className="table-steam">
                    {[0,1,2].map(i => (
                      <motion.span
                        key={i}
                        className="food-steam"
                        style={{ left: `${20+i*25}%` }}
                        animate={{ y: [0,-16], opacity: [0.8,0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i*0.3 }}
                      >~</motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!isEating && (
              <div className="table-items">
                <span>🍽️</span>
                <span>🥄</span>
                <span>🌸</span>
              </div>
            )}
          </div>
          <div className="table-legs">
            <div className="table-leg" /><div className="table-leg" />
          </div>
        </div>

        {/* Chairs */}
        <div className="dining-chairs">
          <motion.div
            className={`dining-chair ${charAtTable ? 'dining-chair--occupied' : ''}`}
            animate={charAtTable ? { y: [-3, 0] } : {}}
            transition={{ duration: 0.3 }}
          />
          <div className="dining-chair dining-chair--right" />
        </div>
      </div>

      {/* Kitchen plants / decor */}
      <div className="kitchen-wall-art">
        <div className="wall-art-frame">
          <span>🍴</span>
          <span className="wall-art-text">Bon Appétit</span>
        </div>
      </div>

      {/* Hunger hint */}
      <AnimatePresence>
        {(state.needs?.hunger ?? 0) > 60 && !fridgeOpen && !state.cookingItem && (
          <motion.div
            className="hunger-hint"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            🍽️ Pranavi is hungry! Open the fridge~
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fridge open button */}
      <motion.button
        className="fridge-open-btn"
        onClick={() => setFridgeOpen(v => !v)}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        {fridgeOpen ? '✕ Close Fridge' : '❄️ Open Fridge'}
      </motion.button>

      {/* Food selection panel */}
      <AnimatePresence>
        {fridgeOpen && !state.cookingItem && (
          <FridgeContents
            inventory={state.inventory}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSelectFood={handleSelectFood}
          />
        )}
      </AnimatePresence>

      {/* Cooking overlay */}
      <AnimatePresence>
        {state.cookingItem && (
          <CookingOverlay
            foodId={state.cookingItem}
            progress={state.cookingProgress}
            onCancel={() => dispatch({ type: 'CANCEL_COOKING' })}
          />
        )}
      </AnimatePresence>

      {/* Eating animation sparkles */}
      <AnimatePresence>
        {isEating && (
          <motion.div
            className="eating-sparkles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {['😋','✨','💕','🌸','⭐'].map((s, i) => (
              <motion.span
                key={i}
                className="eat-spark"
                style={{ left: `${10 + i * 18}%` }}
                animate={{ y: [0, -50], opacity: [1, 0], scale: [0.8, 1.2] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
              >{s}</motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor */}
      <div className="kitchen-floor">
        <div className="kitchen-floor-tiles" />
      </div>
    </div>
  );
}
