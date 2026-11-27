import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import {
  createMemoryDeck, flipCard, checkMatch, unflipUnmatched,
  createSolvablePuzzle, canMoveTile, moveTile, isPuzzleSolved, PUZZLE_TILES,
  COOKING_RECIPES, canClaimDailyMiniGameReward,
} from '../../engine/miniGameEngine.js';
import { GARDEN_PLANTS, STAGE_EMOJIS } from '../../data/gardenData.js';
import { getPlotStage } from '../../engine/gardenEngine.js';
import { getVirtualDay } from '../../engine/timeEngine.js';
import { audioService } from '../../services/audioService.js';
import './MiniGamesHub.css';

// ── 1. MEMORY MATCH ──────────────────────────────────────────────────────────
function MemoryMatchGame({ onWin, rewardAvailable }) {
  const [cards, setCards] = useState(() => createMemoryDeck());
  const [flippedIds, setFlippedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (complete) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [complete]);

  function handleFlip(card) {
    if (locked || card.flipped || card.matched) return;
    audioService.playSfx('click');
    const newCards = flipCard(cards, card.id);
    const newFlipped = [...flippedIds, card.id];
    setCards(newCards);
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const pair = newCards.filter(c => newFlipped.includes(c.id));
      const isMatch = pair[0].symbol === pair[1].symbol;
      setTimeout(() => {
        if (isMatch) {
          audioService.playSfx('minigameSuccess');
          const { cards: matched, complete: done } = checkMatch(newCards);
          setCards(matched);
          if (done) {
            setComplete(true);
            onWin('memory', { moves: moves + 1, seconds }, { cookies: 1 });
          }
        } else {
          setCards(unflipUnmatched(newCards));
        }
        setFlippedIds([]);
        setLocked(false);
      }, 680);
    }
  }

  function restart() {
    setCards(createMemoryDeck());
    setFlippedIds([]);
    setMoves(0);
    setSeconds(0);
    setLocked(false);
    setComplete(false);
  }

  return (
    <div className="mg-card-panel">
      <div className="mg-top-row">
        <div>
          <h3 className="mg-title">🃏 Memory Match</h3>
          <p className="mg-inst">Flip two cards at a time to match all 8 pairs!</p>
        </div>
        <div className="mg-stats">
          <span>Moves: <b>{moves}</b></span>
          <span>Time: <b>{seconds}s</b></span>
        </div>
      </div>

      {complete ? (
        <motion.div className="mg-victory" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <div className="mg-vic-icon">🌟</div>
          <h4>All Pairs Matched!</h4>
          <p>Finished in {moves} moves and {seconds}s!</p>
          <p className="mg-reward-note">
            {rewardAvailable ? '🎁 Daily Reward Claimed: +1 Cookie & +Bond!' : '✨ Great practice! (Daily reward already claimed today)'}
          </p>
          <button className="mg-primary-btn" onClick={restart}>Play Again</button>
        </motion.div>
      ) : (
        <div className="mg-memory-grid">
          {cards.map(card => (
            <motion.button
              key={card.id}
              className={`mg-mem-card ${card.flipped || card.matched ? 'is-open' : ''} ${card.matched ? 'is-matched' : ''}`}
              onClick={() => handleFlip(card)}
              whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
              whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
            >
              {card.flipped || card.matched ? card.symbol : '✿'}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 2. GARDENING MINI-GAME ───────────────────────────────────────────────────
function GardeningGame({ state, dispatch }) {
  const [selectedPlantId, setSelectedPlantId] = useState(GARDEN_PLANTS[0].id);
  const virtualMinutes = state.clock.virtualMinutes;

  function handlePlant(plotId) {
    audioService.playSfx('waterPlant');
    dispatch({ type: 'PLANT_SEED', plotId, plantId: selectedPlantId });
  }

  function handleWater(plotId) {
    audioService.playSfx('waterPlant');
    dispatch({ type: 'WATER_PLANT', plotId });
  }

  function handleCollect(plotId) {
    audioService.playSfx('minigameSuccess');
    dispatch({ type: 'COLLECT_PLANT', plotId });
  }

  return (
    <div className="mg-card-panel">
      <div className="mg-top-row">
        <div>
          <h3 className="mg-title">🌷 Gardening Studio</h3>
          <p className="mg-inst">Pick a seed, plant it in an empty plot, water it, and harvest blooms into your inventory!</p>
        </div>
      </div>

      <div className="mg-seed-bar">
        {GARDEN_PLANTS.map(p => {
          const qty = state.inventory[`${p.id}_seed`] ?? 0;
          return (
            <button
              key={p.id}
              className={`mg-seed-btn ${selectedPlantId === p.id ? 'is-active' : ''}`}
              onClick={() => setSelectedPlantId(p.id)}
              disabled={qty <= 0}
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
              <span className="mg-qty">×{qty}</span>
            </button>
          );
        })}
      </div>

      <div className="mg-garden-grid">
        {state.garden.plots.map(plot => {
          const stage = getPlotStage(plot, virtualMinutes);
          const plant = GARDEN_PLANTS.find(p => p.id === plot.plantId);
          return (
            <div key={plot.id} className="mg-plot-card">
              {!plot.plantId ? (
                <button className="mg-plot-plant" onClick={() => handlePlant(plot.id)}>
                  <span>🌱</span>
                  <span>Plant Selected</span>
                </button>
              ) : (
                <>
                  <div className="mg-plot-emoji">{stage === 'bloom' ? plant?.emoji : STAGE_EMOJIS[stage]}</div>
                  <div className="mg-plot-name">{plant?.name}</div>
                  <div className="mg-plot-stage">{stage}</div>
                  {stage !== 'bloom' ? (
                    <button className="mg-mini-btn" onClick={() => handleWater(plot.id)}>💧 Water</button>
                  ) : (
                    <button className="mg-mini-btn is-harvest" onClick={() => handleCollect(plot.id)}>🌸 Harvest</button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 3. COOKING MINI-GAME ─────────────────────────────────────────────────────
function CookingGame({ onCookComplete, dispatch }) {
  const [recipe, setRecipe] = useState(COOKING_RECIPES[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [heat, setHeat] = useState(30);
  const [cookedDish, setCookedDish] = useState(null);
  const [failedMsg, setFailedMsg] = useState(null);

  useEffect(() => {
    if (stepIndex !== 2 || cookedDish) return;
    const id = setInterval(() => {
      setHeat(h => (h >= 96 ? 18 : h + 6));
    }, 110);
    return () => clearInterval(id);
  }, [stepIndex, cookedDish]);

  function advanceStep() {
    setFailedMsg(null);
    if (stepIndex < 2) {
      audioService.playSfx('click');
      setStepIndex(s => s + 1);
      return;
    }
    // Step 3: timing check (sweet spot 45 - 88)
    if (heat >= 45 && heat <= 88) {
      audioService.playSfx('minigameSuccess');
      setCookedDish(recipe);
      onCookComplete(recipe);
    } else {
      audioService.playSfx('minigameFail');
      setFailedMsg('Oops! Try stopping the heat inside the golden zone (45–88%)!');
    }
  }

  function serveNow() {
    if (!cookedDish) return;
    audioService.playSfx('eat');
    dispatch({ type: 'SERVE_FOOD', foodId: cookedDish.id });
    setCookedDish(null);
    setStepIndex(0);
  }

  return (
    <div className="mg-card-panel">
      <div className="mg-top-row">
        <div>
          <h3 className="mg-title">🍳 Cozy Cooking</h3>
          <p className="mg-inst">Choose a recipe, complete all 3 steps, and stop the heat in the golden zone!</p>
        </div>
      </div>

      <div className="mg-seed-bar">
        {COOKING_RECIPES.map(r => (
          <button
            key={r.id}
            className={`mg-seed-btn ${recipe.id === r.id ? 'is-active' : ''}`}
            onClick={() => { setRecipe(r); setStepIndex(0); setCookedDish(null); setFailedMsg(null); }}
          >
            <span>{r.emoji}</span>
            <span>{r.name}</span>
          </button>
        ))}
      </div>

      {cookedDish ? (
        <div className="mg-victory">
          <div className="mg-vic-icon">{cookedDish.emoji}</div>
          <h4>{cookedDish.name} Ready!</h4>
          <p>Added +1 {cookedDish.name} to your Kitchen inventory.</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="mg-primary-btn" onClick={serveNow}>🍽️ Serve Pranavi Now</button>
            <button className="mg-mini-btn" onClick={() => { setCookedDish(null); setStepIndex(0); }}>Cook Another</button>
          </div>
        </div>
      ) : (
        <div className="mg-cook-box">
          <div className="mg-cook-ingredients">
            Ingredients: {recipe.ingredients.join(' · ')}
          </div>
          <div className="mg-cook-step">
            Step {stepIndex + 1}/3: <b>{recipe.steps[stepIndex]}</b>
          </div>

          {stepIndex === 2 && (
            <div className="mg-heat-wrap">
              <div className="mg-heat-track">
                <div className="mg-heat-zone" />
                <div className="mg-heat-marker" style={{ left: `${heat}%` }} />
              </div>
              <div className="mg-heat-label">Heat: {heat}% (Golden zone: 45%–88%)</div>
            </div>
          )}

          {failedMsg && <div className="mg-error">{failedMsg}</div>}

          <button className="mg-primary-btn" onClick={advanceStep}>
            {stepIndex < 2 ? 'Next Step ➜' : '✨ Finish Cooking!'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── 4. SLIDING PUZZLE MINI-GAME ──────────────────────────────────────────────
function PuzzleGame({ onWin, rewardAvailable }) {
  const [board, setBoard] = useState(() => createSolvablePuzzle());
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);

  function handleTile(idx) {
    if (solved || !canMoveTile(board, idx)) return;
    audioService.playSfx('click');
    const next = moveTile(board, idx);
    setBoard(next);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    if (isPuzzleSolved(next)) {
      audioService.playSfx('minigameSuccess');
      setSolved(true);
      onWin('puzzle', { moves: nextMoves }, { smoothie: 1 });
    }
  }

  function reset() {
    setBoard(createSolvablePuzzle());
    setMoves(0);
    setSolved(false);
  }

  return (
    <div className="mg-card-panel">
      <div className="mg-top-row">
        <div>
          <h3 className="mg-title">🧩 Pastel Tile Puzzle</h3>
          <p className="mg-inst">Slide tiles into the empty space to arrange numbers 1 to 8 in order!</p>
        </div>
        <div className="mg-stats">Moves: <b>{moves}</b></div>
      </div>

      {solved ? (
        <motion.div className="mg-victory" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <div className="mg-vic-icon">🧩✨</div>
          <h4>Puzzle Solved!</h4>
          <p>Completed in {moves} moves!</p>
          <p className="mg-reward-note">
            {rewardAvailable ? '🎁 Daily Reward Claimed: +1 Smoothie & +Bond!' : '✨ Awesome job! (Daily reward already claimed today)'}
          </p>
          <button className="mg-primary-btn" onClick={reset}>New Puzzle</button>
        </motion.div>
      ) : (
        <div className="mg-puzzle-grid">
          {board.map((val, idx) => (
            <button
              key={idx}
              className={`mg-puzzle-tile ${val === 0 ? 'is-empty' : canMoveTile(board, idx) ? 'is-movable' : ''}`}
              onClick={() => handleTile(idx)}
              disabled={val === 0 || !canMoveTile(board, idx)}
            >
              {val !== 0 && (
                <>
                  <span className="mg-pt-emoji">{PUZZLE_TILES[val]}</span>
                  <span className="mg-pt-num">{val}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HUB EXPORT ───────────────────────────────────────────────────────────────
export default function MiniGamesHub({ initialTab = 'memory', onClose }) {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState(initialTab);
  const day = getVirtualDay(state.clock.virtualMinutes);

  function handleWin(gameId, scoreMeta, rewardItems) {
    dispatch({
      type: 'COMPLETE_MINIGAME',
      gameId,
      scoreMeta,
      rewardItems,
    });
  }

  function handleCookComplete(recipe) {
    dispatch({
      type: 'COMPLETE_MINIGAME',
      gameId: 'cooking',
      scoreMeta: { recipe: recipe.id },
      rewardItems: recipe.rewardItems,
    });
  }

  return (
    <div className="mg-hub">
      <div className="mg-hub-header">
        <h2>🎮 Mini-Games Arcade</h2>
        {onClose && <button className="mg-close-x" onClick={onClose}>✕</button>}
      </div>

      <div className="mg-tabs">
        {[
          { id: 'memory', label: '🃏 Memory' },
          { id: 'garden', label: '🌷 Garden' },
          { id: 'cooking', label: '🍳 Cooking' },
          { id: 'puzzle', label: '🧩 Puzzle' },
        ].map(t => (
          <button
            key={t.id}
            className={`mg-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => { audioService.playSfx('click'); setTab(t.id); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mg-stage">
        {tab === 'memory' && (
          <MemoryMatchGame
            onWin={handleWin}
            rewardAvailable={canClaimDailyMiniGameReward(state.miniGames, 'memory', day)}
          />
        )}
        {tab === 'garden' && <GardeningGame state={state} dispatch={dispatch} />}
        {tab === 'cooking' && <CookingGame onCookComplete={handleCookComplete} dispatch={dispatch} />}
        {tab === 'puzzle' && (
          <PuzzleGame
            onWin={handleWin}
            rewardAvailable={canClaimDailyMiniGameReward(state.miniGames, 'puzzle', day)}
          />
        )}
      </div>
    </div>
  );
}
