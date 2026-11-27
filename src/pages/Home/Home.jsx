import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import { useGameClock } from '../../hooks/useGameClock.js';
import { useCharacterNeeds } from '../../hooks/useCharacterNeeds.js';
import {
  getRoomPosition,
  ROOM_CHARACTER_HEIGHT,
  ACTIVITY_ROOM_TARGETS,
  computeFacing,
  pointerToRoomPercent,
} from '../../engine/movementEngine.js';
import { ACTION_MACHINE_STATES } from '../../engine/visualActionEngine.js';
import { audioService } from '../../services/audioService.js';
import Character from '../../components/Character/Character.jsx';
import Dialogue from '../../components/Dialogue/Dialogue.jsx';
import StatusBars from '../../components/StatusBars/StatusBars.jsx';
import Actions from '../../components/Actions/Actions.jsx';
import ActivityControlBar from '../../components/Actions/ActivityControlBar.jsx';
import Navigation from '../../components/Navigation/Navigation.jsx';
import Environment from '../../components/Environment/Environment.jsx';
import TopBar from '../../components/Navigation/TopBar.jsx';
import Notification from '../../components/Notifications/Notification.jsx';

// Room components
import BedroomRoom from './BedroomRoom.jsx';
import LivingRoom from './LivingRoom.jsx';
import KitchenRoom from '../../pages/Kitchen/KitchenRoom.jsx';
import WardrobeRoom from '../../pages/Wardrobe/WardrobeRoom.jsx';
import ActivitiesRoom from '../../pages/Activities/ActivitiesRoom.jsx';
import DiaryRoom from '../../pages/Diary/DiaryRoom.jsx';
import GardenRoom from '../../pages/Garden/GardenRoom.jsx';
import BathroomRoom from '../../pages/Bedroom/BathroomRoom.jsx';
import StudyRoom from '../../pages/Activities/StudyRoom.jsx';
import PlayRoom from '../../pages/Activities/PlayRoom.jsx';
import MemoryBookRoom from '../../pages/Memories/MemoryBookRoom.jsx';
import BondRoom from '../../pages/Bond/BondRoom.jsx';
import AchievementsRoom from '../../pages/Achievements/AchievementsRoom.jsx';
import EventBanner from '../../components/Events/EventBanner.jsx';

import './Home.css';

const ROOM_COMPONENTS = {
  bedroom:      BedroomRoom,
  living:       LivingRoom,
  kitchen:      KitchenRoom,
  wardrobe:     WardrobeRoom,
  activities:   ActivitiesRoom,
  diary:        DiaryRoom,
  garden:       GardenRoom,
  bathroom:     BathroomRoom,
  study:        StudyRoom,
  playroom:     PlayRoom,
  memories:     MemoryBookRoom,
  bond:         BondRoom,
  achievements: AchievementsRoom,
};

function FloatingParticles({ trigger }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 120,
      y: -(40 + Math.random() * 60),
      symbol: ['♡', '✿', '✦', '♡', '✿', '⭐'][i],
      color: ['#e8638a','#a87de8','#ffd700','#ffb3cc','#90c8f0','#ffd700'][i],
    }));
    setParticles(newParticles);
    const t = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="floating-particles" aria-hidden="true">
      <AnimatePresence>
        {particles.map(p => (
          <motion.span
            key={p.id}
            className="particle"
            style={{ color: p.color }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {p.symbol}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { state, dispatch, season } = useGame();
  const { timeOfDay } = useGameClock();
  const { needs, characterState } = useCharacterNeeds();
  const [interactionTrigger, setInteractionTrigger] = useState(0);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Free movement state
  const worldRef = useRef(null);
  const walkRafRef = useRef(null);
  const dragInfoRef = useRef({ active: false, pointerId: null, startX: 0, startY: 0, moved: false });

  const [isDragging, setIsDragging] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [livePos, setLivePos] = useState(null); // { x, y, facing } while dragging or walking
  const [walkMarker, setWalkMarker] = useState(null); // { x, y, id }

  const room = state.currentRoom;
  const isMoveMode = state.movementMode === 'move';
  const savedPos = getRoomPosition(state.roomPositions, room);
  const activePos = livePos ?? savedPos;
  const charHeight = ROOM_CHARACTER_HEIGHT[room] ?? '230px';

  const stopWalking = useCallback(() => {
    if (walkRafRef.current) {
      cancelAnimationFrame(walkRafRef.current);
      walkRafRef.current = null;
    }
    setIsWalking(false);
  }, []);

  // Reset transient movement state when switching rooms
  useEffect(() => {
    stopWalking();
    setIsDragging(false);
    setLivePos(null);
    setWalkMarker(null);
  }, [room, stopWalking]);

  const startWalkTo = useCallback((targetX, targetY, targetRoom = room, onArrive = null) => {
    if (targetRoom !== room) return;
    stopWalking();

    const startPos = getRoomPosition(state.roomPositions, room);
    const dx = targetX - startPos.x;
    const dy = targetY - startPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 1.2) {
      const facing = computeFacing(startPos.x, targetX, startPos.facing);
      dispatch({ type: 'SET_CHARACTER_POSITION', room, x: targetX, y: targetY, facing });
      onArrive?.();
      return;
    }

    const facing = computeFacing(startPos.x, targetX, startPos.facing);
    const speedPerSec = 26; // % per second
    const durationMs = Math.max(300, Math.min(2600, (dist / speedPerSec) * 1000));
    const startedAt = performance.now();

    setIsWalking(true);
    setWalkMarker({ x: targetX, y: targetY, id: Date.now() });
    audioService.playSfx('footsteps');

    const step = (now) => {
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / durationMs);
      // Smooth easeInOutQuad
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const curX = startPos.x + dx * eased;
      const curY = startPos.y + dy * eased;
      setLivePos({ x: curX, y: curY, facing });

      if (t < 1) {
        walkRafRef.current = requestAnimationFrame(step);
      } else {
        walkRafRef.current = null;
        setIsWalking(false);
        setLivePos(null);
        setWalkMarker(null);
        dispatch({ type: 'SET_CHARACTER_POSITION', room, x: targetX, y: targetY, facing });
        onArrive?.();
      }
    };

    walkRafRef.current = requestAnimationFrame(step);
  }, [room, state.roomPositions, dispatch, stopWalking]);

  // Visual Action State Machine Runner: WALKING -> INTERACTING -> COMPLETION
  const visualAct = state.activeVisualAction;
  const visualStage = visualAct ? visualAct.stages[visualAct.stageIndex] : null;

  useEffect(() => {
    if (!visualAct || visualAct.paused || visualAct.machineState !== ACTION_MACHINE_STATES.WALKING) return;
    if (room !== visualAct.requiredRoom && visualAct.requiredRoom) return;
    const target = visualStage?.targetPos;
    if (!target) {
      dispatch({ type: 'VISUAL_ACTION_ARRIVED' });
      return;
    }
    startWalkTo(target.x, target.y, room, () => {
      dispatch({ type: 'VISUAL_ACTION_ARRIVED' });
    });
  }, [visualAct?.id, visualAct?.stageIndex, visualAct?.machineState, visualAct?.paused, room]);

  useEffect(() => {
    if (!visualAct || visualAct.paused || visualAct.machineState !== ACTION_MACHINE_STATES.INTERACTING) return;
    const id = setInterval(() => {
      dispatch({ type: 'ADVANCE_VISUAL_ACTION', deltaMs: 100 });
    }, 100);
    return () => clearInterval(id);
  }, [visualAct?.id, visualAct?.stageIndex, visualAct?.machineState, visualAct?.paused, dispatch]);

  // Listen for activity-driven movement requests (e.g. Feed in Kitchen -> walk to dining table)
  useEffect(() => {
    const onActivityWalk = (ev) => {
      const actionId = ev.detail?.actionId;
      const target = ACTIVITY_ROOM_TARGETS[actionId];
      if (target && target.room === room) {
        startWalkTo(target.x, target.y, room);
      }
    };
    window.addEventListener('hlw:activity-walk', onActivityWalk);
    return () => window.removeEventListener('hlw:activity-walk', onActivityWalk);
  }, [room, startWalkTo]);

  // Pointer drag handlers on the character
  function handleCharPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    stopWalking();
    dragInfoRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handleCharPointerMove(e) {
    const d = dragInfoRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    const moveDist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
    if (!d.moved && moveDist > 6) {
      d.moved = true;
      setIsDragging(true);
    }
    if (!d.moved || !worldRef.current) return;

    const rect = worldRef.current.getBoundingClientRect();
    const pos = pointerToRoomPercent(e.clientX, e.clientY, rect, room);
    const prevX = livePos?.x ?? savedPos.x;
    const facing = computeFacing(prevX, pos.x, livePos?.facing ?? savedPos.facing);
    setLivePos({ x: pos.x, y: pos.y, facing });
  }

  function handleCharPointerUp(e) {
    const d = dragInfoRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    const wasDragged = d.moved;
    dragInfoRef.current.active = false;
    setIsDragging(false);

    if (wasDragged && livePos) {
      dispatch({
        type: 'SET_CHARACTER_POSITION',
        room,
        x: livePos.x,
        y: livePos.y,
        facing: livePos.facing,
      });
      setLivePos(null);
    }
  }

  function handleCharacterClick() {
    if (dragInfoRef.current.moved) {
      dragInfoRef.current.moved = false;
      return;
    }
    if (isMoveMode) return;
    dispatch({ type: 'DO_ACTION', actionId: 'hug' });
    setInteractionTrigger(t => t + 1);
  }

  // Click-to-move anywhere in the room when Move Mode is active
  function handleWorldClick(e) {
    if (!isMoveMode || isDragging || !worldRef.current) return;
    if (e.target.closest('.character-stage, .move-controls, .side-panel, .panel-toggle')) return;

    const rect = worldRef.current.getBoundingClientRect();
    const target = pointerToRoomPercent(e.clientX, e.clientY, rect, room);
    startWalkTo(target.x, target.y, room);
  }

  const RoomComponent = ROOM_COMPONENTS[room] ?? BedroomRoom;
  const isVisualInteracting = Boolean(
    visualAct && visualAct.machineState === ACTION_MACHINE_STATES.INTERACTING && visualStage
  );
  const visualActionProps = isVisualInteracting
    ? {
        pose: visualStage.pose,
        prop: visualStage.prop,
        stageProgress: Math.min(1, visualAct.stageElapsedMs / Math.max(1, visualStage.durationMs)),
        paused: visualAct.paused,
      }
    : null;
  const effectiveCharState = isWalking
    ? 'walking'
    : isVisualInteracting
    ? (visualStage.expression ?? characterState)
    : characterState;

  return (
    <div className="game-root">
      <TopBar />

      <div
        ref={worldRef}
        className={`game-world ${isMoveMode ? 'game-world--move-mode' : ''}`}
        onClick={handleWorldClick}
      >
        {/* Environment sky/weather/season layer */}
        <Environment
          timeOfDay={timeOfDay}
          room={room}
          weatherId={state.weather?.current ?? 'sunny'}
          seasonId={season?.id ?? 'spring'}
          settings={state.settings}
          celebrationTrigger={state.celebrationTrigger ?? 0}
        />

        {/* Room */}
        <AnimatePresence mode="wait">
          <motion.div
            key={room}
            className={`room-container ${isMoveMode ? 'room-container--move-mode' : ''}`}
            style={room === 'garden' && season?.gardenFilter ? { filter: season.gardenFilter } : undefined}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.38, ease: 'easeInOut' }}
          >
            <RoomComponent timeOfDay={timeOfDay} />
          </motion.div>
        </AnimatePresence>

        {/* Destination marker during click-to-move */}
        <AnimatePresence>
          {walkMarker && (
            <motion.div
              key={walkMarker.id}
              className="walk-target-marker"
              style={{ left: `${walkMarker.x}%`, bottom: `${walkMarker.y}%` }}
              initial={{ scale: 0.5, opacity: 0.9 }}
              animate={{ scale: 1.35, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, repeat: Infinity }}
              aria-hidden="true"
            >
              ✿
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CHARACTER — freely movable & persistent per room ── */}
        <div
          className={`character-stage ${isDragging ? 'character-stage--dragging' : ''}`}
          style={{
            position: 'absolute',
            bottom: `${activePos.y}%`,
            left: `${activePos.x}%`,
            transform: 'translateX(-50%)',
            height: charHeight,
            width: '200px',
            zIndex: 'var(--z-character)',
            touchAction: 'none',
          }}
          onPointerDown={handleCharPointerDown}
          onPointerMove={handleCharPointerMove}
          onPointerUp={handleCharPointerUp}
          onPointerCancel={handleCharPointerUp}
        >
          {/* Dialogue bubble above character */}
          <div className="dialogue-area">
            <Dialogue characterState={effectiveCharState} timeOfDay={timeOfDay} />
          </div>

          {/* Character */}
          <div className="character-area">
            <Character
              state={effectiveCharState}
              outfit={state.selectedOutfit ?? 'casual'}
              room={room}
              facing={activePos.facing}
              isDragging={isDragging}
              visualAction={visualActionProps}
              showCat={true}
              onClick={handleCharacterClick}
            />
          </div>

          {/* Floating particles on interaction */}
          <FloatingParticles trigger={interactionTrigger} />

          {/* Character shadow */}
          <div className="character-shadow" />
        </div>

        {/* ── VISUAL ACTIVITY PROGRESS & CONTROLS ── */}
        <ActivityControlBar />

        {/* ── MOVEMENT CONTROLS (Normal / Move Mode + Reset Position) ── */}
        <div className="move-controls" onClick={e => e.stopPropagation()}>
          <button
            className={`move-mode-btn ${isMoveMode ? 'is-active' : ''}`}
            onClick={() => {
              audioService.playSfx('click');
              dispatch({ type: 'SET_MOVEMENT_MODE', mode: isMoveMode ? 'normal' : 'move' });
            }}
            title={isMoveMode ? 'Exit Move Mode' : 'Move Pranavi anywhere in the room'}
          >
            {isMoveMode ? '✓ Done Moving' : '🚶 Move Pranavi'}
          </button>

          <button
            className="move-reset-btn"
            onClick={() => {
              audioService.playSfx('click');
              stopWalking();
              setLivePos(null);
              dispatch({ type: 'RESET_CHARACTER_POSITION', room });
            }}
            title="Reset Pranavi's position in this room"
          >
            ↺ Reset Spot
          </button>

          {isMoveMode && (
            <div className="move-mode-hint">
              Drag Pranavi or click anywhere in the room to walk there~
            </div>
          )}
        </div>

        {/* Mobile drawer backdrop */}
        {(showLeftPanel || showRightPanel) && (
          <div
            className="mobile-drawer-backdrop"
            onClick={() => { setShowLeftPanel(false); setShowRightPanel(false); }}
            aria-hidden="true"
          />
        )}

        {/* ── LEFT PANEL — Status bars ── */}
        <motion.div
          className={`side-panel side-panel--left ${showLeftPanel ? 'side-panel--open' : ''}`}
          initial={{ x: -220, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <StatusBars needs={needs} />
        </motion.div>

        {/* ── RIGHT PANEL — Actions ── */}
        <motion.div
          className={`side-panel side-panel--right ${showRightPanel ? 'side-panel--open' : ''}`}
          initial={{ x: 220, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <Actions />
        </motion.div>

        {/* Panel toggle buttons for mobile/tablet */}
        <button
          className="panel-toggle panel-toggle--left"
          onClick={() => { setShowLeftPanel(v => !v); setShowRightPanel(false); }}
          aria-label="Toggle status panel"
        >
          {showLeftPanel ? '✕ Needs' : '💕 Needs'}
        </button>
        <button
          className="panel-toggle panel-toggle--right"
          onClick={() => { setShowRightPanel(v => !v); setShowLeftPanel(false); }}
          aria-label="Toggle actions panel"
        >
          {showRightPanel ? '✕ Care' : '✨ Care'}
        </button>
      </div>

      {/* Bottom navigation */}
      <div className="bottom-nav-area">
        <Navigation />
      </div>

      {/* Notifications */}
      <Notification />

      {/* Phase 5/6: Floating event banner */}
      <EventBanner />
    </div>
  );
}
