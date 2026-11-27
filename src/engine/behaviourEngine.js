// behaviourEngine.js
// Determines Pranavi's autonomous behaviour priority and dialogue key
// based on her current needs, time of day, and recent interactions.

// Priority order: health > hunger > energy > hygiene > happiness > social
export function getBehaviourPriority(needs, timeOfDay, isSleeping) {
  if (isSleeping) return { state: 'sleeping', dialogueKey: 'sleeping', urgency: 0 };

  // Critical health
  if (needs.health < 25)    return { state: 'sick',    dialogueKey: 'sick',      urgency: 10 };

  // Very hungry
  if (needs.hunger > 85)    return { state: 'hungry',  dialogueKey: 'veryHungry', urgency: 9 };

  // Exhausted
  if (needs.energy < 8)     return { state: 'sleepy',  dialogueKey: 'sleepy',    urgency: 8 };

  // Moderately hungry
  if (needs.hunger > 65)    return { state: 'hungry',  dialogueKey: 'hungry',    urgency: 7 };

  // Needs bath
  if (needs.hygiene < 20)   return { state: 'bored',   dialogueKey: 'dirty',     urgency: 6 };

  // Tired
  if (needs.energy < 20)    return { state: 'tired',   dialogueKey: 'tired',     urgency: 5 };

  // Recovering health
  if (needs.health < 60)    return { state: 'recovering', dialogueKey: 'sick',   urgency: 4 };

  // Sad / lonely
  if (needs.happiness < 25) return { state: 'sad',     dialogueKey: 'sad',       urgency: 3 };
  if (needs.social < 20)    return { state: 'sad',     dialogueKey: 'sad',       urgency: 3 };

  // Happy
  if (needs.happiness > 85) return { state: 'veryHappy', dialogueKey: 'veryHappy', urgency: 1 };
  if (needs.happiness > 65) return { state: 'happy',   dialogueKey: 'happy',     urgency: 1 };

  // Bored
  if (needs.social < 35)    return { state: 'bored',   dialogueKey: 'idle',      urgency: 2 };

  // Time-of-day idle
  return { state: 'idle', dialogueKey: timeOfDay, urgency: 0 };
}

// Derive the final visible character state, respecting active activities
export function deriveFullCharacterState(needs, currentActivity, timeOfDay, isSleeping) {
  // Active activities always win (single source of truth prevents conflicting animations)
  const activityStates = [
    'sleeping', 'eating', 'drinking', 'playing', 'studying', 'bathing', 'talking',
    'walking', 'running', 'jumping', 'dancing', 'waving', 'clapping', 'laughing',
    'reading', 'drawing', 'playingToys', 'lookingWindow', 'watering', 'celebrating',
    'rainReact', 'snowEnjoy', 'relaxingSofa', 'resting',
  ];
  if (activityStates.includes(currentActivity)) return currentActivity;

  const { state } = getBehaviourPriority(needs, timeOfDay, isSleeping);
  return state;
}

// Cooldown-aware dialogue selector
// lastDialogueKey + lastDialogueTime prevent the same key repeating within cooldownMs
export function selectDialogueKey(needs, currentActivity, timeOfDay, isSleeping, lastKey, lastTime, cooldownMs = 8000) {
  const now = Date.now();
  const activityKeys = {
    sleeping: 'sleeping', eating: 'eating', drinking: 'eating',
    playing: 'playing', studying: 'studying', bathing: 'bathing',
    talking: 'talking', resting: 'tired',
  };

  if (activityKeys[currentActivity]) {
    const key = activityKeys[currentActivity];
    if (key === lastKey && now - lastTime < cooldownMs) return null; // no change
    return key;
  }

  const { dialogueKey } = getBehaviourPriority(needs, timeOfDay, isSleeping);
  if (dialogueKey === lastKey && now - lastTime < cooldownMs) return null;
  return dialogueKey;
}
