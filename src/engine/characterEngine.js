import { deriveCharacterState } from './needsEngine.js';
import { getGuardianLevelFromBond } from './relationshipEngine.js';

export function deriveCharacterEmotion(needs, activity) {
  return deriveCharacterState(needs, activity);
}

// Accepts either a bondPoints number or relationship object
export function getGuardianLevel(bondOrRelationship = 0) {
  const bond = typeof bondOrRelationship === 'number'
    ? bondOrRelationship
    : (bondOrRelationship?.bondPoints ?? 0);
  return getGuardianLevelFromBond(bond);
}

export function addXP(currentXP, amount) {
  return currentXP + amount;
}
