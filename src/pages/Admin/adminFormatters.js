// adminFormatters.js — Shared date, duration & label formatters for Owner Admin Dashboard

export function formatDateTime(isoOrMs) {
  if (!isoOrMs) return '—';
  const d = new Date(isoOrMs);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(isoOrMs) {
  if (!isoOrMs) return '—';
  const d = new Date(isoOrMs);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDurationSec(totalSec = 0) {
  const sec = Math.max(0, Math.round(Number(totalSec) || 0));
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (mins < 60) return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMin = mins % 60;
  return remMin > 0 ? `${hrs}h ${remMin}m` : `${hrs}h`;
}

export function formatRoomLabel(roomId = 'bedroom') {
  const labels = {
    bedroom: '🛏️ Bedroom',
    kitchen: '🍳 Kitchen',
    bathroom: '🛁 Bathroom',
    living: '🛋️ Living Room',
    study: '📚 Study Room',
    playroom: '🎮 Playroom',
    garden: '🌸 Garden',
    wardrobe: '👗 Wardrobe',
    diary: '📖 Diary',
    memories: '📷 Memories',
    bond: '💕 Bond',
    achievements: '🏆 Awards',
    house: '🏡 House',
  };
  return labels[roomId] || roomId;
}

export const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'all', label: 'All Time' },
];
