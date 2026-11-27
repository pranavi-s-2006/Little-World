import { useGame } from '../context/GameContext.jsx';
import { deriveFullCharacterState } from '../engine/behaviourEngine.js';
import { getTimeOfDay } from '../engine/timeEngine.js';

export function useCharacterNeeds() {
  const { state, characterState } = useGame();
  const { needs, currentActivity, isSleeping } = state;

  const warnings = [];
  if (needs.hunger > 70)    warnings.push({ type: 'hunger',    message: 'Pranavi is hungry!' });
  if (needs.energy < 20)    warnings.push({ type: 'energy',    message: 'Pranavi is tired!' });
  if (needs.happiness < 25) warnings.push({ type: 'happiness', message: 'Pranavi is sad!' });
  if (needs.health < 40)    warnings.push({ type: 'health',    message: 'Pranavi is unwell!' });
  if (needs.hygiene < 25)   warnings.push({ type: 'hygiene',   message: 'Pranavi needs a bath!' });
  if (needs.social < 20)    warnings.push({ type: 'social',    message: 'Pranavi is lonely!' });

  return { needs, characterState, isSleeping, warnings, currentActivity };
}
