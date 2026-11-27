// cookingEngine.js — manages cooking progress and state
export function requiresCooking(food) {
  return (food?.prepTime ?? 0) > 0;
}

// Returns progress increment per tick (called every 200ms)
// prepTime is in virtual minutes; we simulate it in ~3 real seconds per unit
export function getCookingTickIncrement(food) {
  const prepTime = food?.prepTime ?? 1;
  // Total real ms = prepTime * 600ms; ticks every 200ms → increments = prepTime*3
  return 100 / (prepTime * 3);
}
