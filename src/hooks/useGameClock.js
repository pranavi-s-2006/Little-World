import { useGame } from '../context/GameContext.jsx';
import { formatVirtualTime, getTimeOfDay } from '../engine/timeEngine.js';

export function useGameClock() {
  const { state } = useGame();
  const { clock } = state;
  const virtualMinutes = clock.virtualMinutes;
  const timeOfDay = getTimeOfDay(virtualMinutes);
  const timeString = formatVirtualTime(virtualMinutes);
  const hour = Math.floor(virtualMinutes / 60) % 24;
  const day = Math.floor(virtualMinutes / (24 * 60)) + 1;

  return { virtualMinutes, timeOfDay, timeString, hour, day };
}
