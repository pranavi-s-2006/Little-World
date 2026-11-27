// gardenData.js

export const GARDEN_PLANTS = [
  { id:'rose',      name:'Rose',            emoji:'🌹', seedEmoji:'🌱', color:'#e8638a', growTime:10, happiness:8  },
  { id:'sunflower', name:'Sunflower',       emoji:'🌻', seedEmoji:'🌱', color:'#ffd700', growTime:12, happiness:10 },
  { id:'tulip',     name:'Tulip',           emoji:'🌷', seedEmoji:'🌱', color:'#ff85aa', growTime:8,  happiness:7  },
  { id:'daisy',     name:'Daisy',           emoji:'🌼', seedEmoji:'🌱', color:'#fff9c4', growTime:6,  happiness:6  },
  { id:'lavender',  name:'Lavender',        emoji:'💜', seedEmoji:'🌱', color:'#c9a8ff', growTime:14, happiness:9  },
  { id:'cherry',    name:'Cherry Blossom',  emoji:'🌸', seedEmoji:'🌱', color:'#ffb3cc', growTime:16, happiness:12 },
];

// Growth stages: seed → sprout → bud → bloom
export const GROWTH_STAGES = ['seed', 'sprout', 'bud', 'bloom'];
export const STAGE_EMOJIS  = { seed:'🌱', sprout:'🪴', bud:'🌿', bloom:null }; // bloom uses plant emoji

export function getGrowthStage(plantedAt, wateredAt, virtualMinutes, growTime) {
  const waterBonus = wateredAt ? 2 : 0;
  const elapsed = (virtualMinutes - plantedAt) / 60; // virtual hours
  const progress = Math.min(1, (elapsed + waterBonus) / growTime);
  if (progress >= 1)    return 'bloom';
  if (progress >= 0.66) return 'bud';
  if (progress >= 0.33) return 'sprout';
  return 'seed';
}
