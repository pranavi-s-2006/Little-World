// characters.js — re-exports from characterAssets for backward compatibility
export { CHARACTER_ASSETS, getCharacterAsset, OUTFIT_COLORS } from '../components/Character/characterAssets.js';

export const CHARACTER_STATES = {
  idle:       { label: 'Idle',       color: '#e8638a' },
  happy:      { label: 'Happy',      color: '#ffb3cc' },
  veryHappy:  { label: 'Very Happy', color: '#ff85aa' },
  excited:    { label: 'Excited',    color: '#ff85aa' },
  sad:        { label: 'Sad',        color: '#a87de8' },
  crying:     { label: 'Crying',     color: '#7c4dbd' },
  bored:      { label: 'Bored',      color: '#e8d5ff' },
  hungry:     { label: 'Hungry',     color: '#f4845f' },
  sleepy:     { label: 'Sleepy',     color: '#c9a8ff' },
  sleeping:   { label: 'Sleeping',   color: '#6b68a8' },
  tired:      { label: 'Tired',      color: '#ffd6e7' },
  sick:       { label: 'Sick',       color: '#9ecf9e' },
  recovering: { label: 'Recovering', color: '#c8e6c8' },
  eating:     { label: 'Eating',     color: '#ffd8c0' },
  drinking:   { label: 'Drinking',   color: '#90c8f0' },
  walking:    { label: 'Walking',    color: '#c8e6c8' },
  playing:    { label: 'Playing',    color: '#ffb3cc' },
  studying:   { label: 'Studying',   color: '#c8e6ff' },
  bathing:    { label: 'Bathing',    color: '#c8e6ff' },
  talking:    { label: 'Talking',    color: '#e8d5ff' },
  resting:    { label: 'Resting',    color: '#f5f0ff' },
};
