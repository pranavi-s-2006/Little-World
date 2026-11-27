// CharacterAnimations.jsx
// Provides live ambient & action animation values via a custom hook:
//   blinkProgress  0->1 (eye close)
//   breatheScale   subtle chest scale
//   hairSway       degrees
//   talkProgress   0->1 mouth open
//   bodyBob        px vertical offset
//   walkPhase      -1->1 alternating stride
//   actionPhase    0->1 continuous phase for interactive activity props & limb motion

import { useState, useEffect, useRef } from 'react';

export function useCharacterAnimations(state, paused = false) {
  const [blinkProgress, setBlinkProgress] = useState(0);
  const [breatheScale, setBreatheScale]   = useState(1);
  const [hairSway, setHairSway]           = useState(0);
  const [talkProgress, setTalkProgress]   = useState(0);
  const [bodyBob, setBodyBob]             = useState(0);
  const [walkPhase, setWalkPhase]         = useState(0);
  const [actionPhase, setActionPhase]     = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (startRef.current === null) startRef.current = Date.now();
    let running = true;

    function tick() {
      if (!running) return;
      if (paused || document.hidden) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const t = (Date.now() - startRef.current) / 1000;

      // Breathe — gentle chest breathing
      setBreatheScale(1 + Math.sin(t * 2.1) * 0.01);

      // Hair sway — slow gentle flow
      setHairSway(Math.sin(t * 0.9) * 1.4);

      // Body bob — depends on state
      const bobAmp = state === 'playing' || state === 'dancing' || state === 'jumping' || state === 'playing_toy' ? 6
        : state === 'veryHappy' || state === 'excited' || state === 'celebrating' || state === 'laughing' ? 5
        : state === 'sleeping' || state === 'resting' || state === 'relaxingSofa' || state === 'sleeping_bed' ? 0
        : state === 'sad' || state === 'sick' ? 1
        : 2.2;
      const bobSpeed = state === 'running' ? 6.5 : state === 'playing' || state === 'dancing' ? 4 : state === 'veryHappy' || state === 'celebrating' ? 3 : 1.2;
      setBodyBob(Math.sin(t * bobSpeed) * bobAmp);

      // Blink — natural quick blink every ~3.8s (disabled when eyes are closed)
      if (state === 'sleeping' || state === 'resting' || state === 'sleeping_bed' || state === 'veryHappy' || state === 'laughing' || state === 'celebrating') {
        setBlinkProgress(0);
      } else {
        const blinkCycle = t % 3.8;
        if (blinkCycle > 3.58) {
          setBlinkProgress(Math.sin(((blinkCycle - 3.58) / 0.22) * Math.PI));
        } else {
          setBlinkProgress(0);
        }
      }

      // Talk/eat animation — subtle mouth movement
      if (state === 'talking' || state === 'eating' || state === 'drinking' || state === 'laughing' || state === 'eating_utensil') {
        setTalkProgress((Math.sin(t * 9) * 0.5 + 0.5) * 0.85);
      } else {
        setTalkProgress(0);
      }

      // Walk / run / dance stride phase
      if (state === 'walking' || state === 'dancing') {
        setWalkPhase(Math.sin(t * 8));
      } else if (state === 'running') {
        setWalkPhase(Math.sin(t * 13));
      } else {
        setWalkPhase(0);
      }

      // Continuous 0..1 oscillating phase for real-time limb + prop animations
      setActionPhase(Math.sin(t * 5.2) * 0.5 + 0.5);

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [state, paused]);

  return { blinkProgress, breatheScale, hairSway, talkProgress, bodyBob, walkPhase, actionPhase };
}
