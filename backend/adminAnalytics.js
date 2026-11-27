// adminAnalytics.js — Pure server-side normalization, presence timeout & Firestore analytics aggregation

export const HEARTBEAT_TIMEOUT_MS = 90 * 1000;

export const DAILY_ROUTINE_KEYS = ['ate', 'studied', 'played', 'bathed', 'talked'];
export const DAILY_ROUTINE_LABELS = {
  ate: 'Meal / Breakfast',
  studied: 'Study Session',
  played: 'Playtime / Mini-Game',
  bathed: 'Bath / Personal Care',
  talked: 'Heartfelt Chat',
};

export const ALL_HOUSE_ROOMS = [
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'living', label: 'Living Room' },
  { id: 'study', label: 'Study Room' },
  { id: 'playroom', label: 'Playroom' },
  { id: 'garden', label: 'Garden' },
  { id: 'wardrobe', label: 'Wardrobe' },
  { id: 'diary', label: 'Diary' },
  { id: 'memories', label: 'Memories' },
  { id: 'bond', label: 'Bond' },
  { id: 'achievements', label: 'Awards' },
];

export const GUARDIAN_TITLES = {
  1: 'New Guardian',
  2: 'Kind Guardian',
  3: 'Caring Guardian',
  4: 'Trusted Guardian',
  5: 'Best Companion',
  6: 'Forever Bond',
};

export function toMs(value) {
  if (value == null) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function getDateKey(tsMs = Date.now()) {
  const d = new Date(tsMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeekKey(tsMs = Date.now()) {
  const d = new Date(tsMs);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function normalizeActivityLabel(rawType, rawLabel = '') {
  const key = String(rawType || rawLabel || 'idle').trim().toLowerCase();
  const labelLower = String(rawLabel || '').trim().toLowerCase();

  if (key.includes('walk') || labelLower.includes('walking between')) return 'Walking between rooms';
  if (key === 'cook' || key === 'cooking' || labelLower.includes('cooking')) return 'Cooking';
  if (key === 'eating' || key === 'ate' || key === 'feed' || key === 'drinking' || key === 'drank' || key === 'water') {
    return 'Eating';
  }
  if (key === 'brush' || key === 'brushing' || labelLower === 'brush' || labelLower.includes('brush')) {
    return 'Brushing teeth';
  }
  if (
    key === 'bathe' || key === 'bathing' || key === 'bathed' ||
    key === 'washface' || key === 'comphair' || key === 'skincare' || key === 'care' || key === 'medicine'
  ) {
    return 'Bathing';
  }
  if (key === 'sleep' || key === 'sleeping' || key === 'slept' || key === 'rest' || key === 'resting') {
    return 'Sleeping';
  }
  if (key === 'study' || key === 'studying' || key === 'studied') {
    return 'Studying';
  }
  if (key === 'play' || key === 'playing' || key === 'played' || key === 'draw' || key === 'music_dance' || key === 'celebrating') {
    return 'Playing';
  }
  if (key === 'garden' || key === 'gardening' || key === 'planted' || key === 'watered' || key === 'harvested') {
    return 'Gardening';
  }
  if (key === 'dressed' || key === 'dressing' || key === 'dress') {
    return 'Dressing up';
  }
  if (key === 'talk' || key === 'talking' || key === 'talked' || key === 'hug' || key === 'hugged') {
    return 'Talking';
  }
  if (key === 'event') return 'Special Event';
  if (key === 'woke') return 'Waking up';
  return 'Idle';
}

export function resolveDateBounds(range = '7d', nowMs = Date.now(), fallbackStartMs = null) {
  const todayStart = Date.UTC(
    new Date(nowMs).getUTCFullYear(),
    new Date(nowMs).getUTCMonth(),
    new Date(nowMs).getUTCDate()
  );

  let startMs = todayStart;
  let bucketDays = 7;

  if (range === 'today') {
    startMs = todayStart;
    bucketDays = 1;
  } else if (range === '7d') {
    startMs = todayStart - 6 * 86400000;
    bucketDays = 7;
  } else if (range === '30d') {
    startMs = todayStart - 29 * 86400000;
    bucketDays = 30;
  } else {
    // 'all'
    const earliest = fallbackStartMs && fallbackStartMs < todayStart ? fallbackStartMs : todayStart - 13 * 86400000;
    const earliestDay = Date.UTC(
      new Date(earliest).getUTCFullYear(),
      new Date(earliest).getUTCMonth(),
      new Date(earliest).getUTCDate()
    );
    const diffDays = Math.max(1, Math.min(90, Math.floor((todayStart - earliestDay) / 86400000) + 1));
    startMs = 0;
    bucketDays = diffDays;
  }

  const dayKeys = [];
  const firstBucketDay = range === 'all' ? todayStart - (bucketDays - 1) * 86400000 : startMs;
  for (let i = 0; i < bucketDays; i++) {
    const dayMs = firstBucketDay + i * 86400000;
    dayKeys.push(getDateKey(dayMs));
  }

  return { range, startMs, endMs: nowMs, todayStart, dayKeys };
}

export function evaluatePresence(presenceDoc = null, nowMs = Date.now()) {
  if (!presenceDoc) {
    return {
      online: false,
      activeTabsCount: 0,
      activeTabs: [],
      currentRoom: 'bedroom',
      currentActivity: 'idle',
      currentActivityLabel: 'Idle',
      lastActiveAt: null,
      currentSessionStartedAt: null,
      currentSessionDurationSec: 0,
    };
  }

  const rawTabs = presenceDoc.activeTabs && typeof presenceDoc.activeTabs === 'object'
    ? Object.values(presenceDoc.activeTabs)
    : [];

  const validTabs = rawTabs
    .filter(tab => tab && !tab.endedAt && (nowMs - toMs(tab.lastHeartbeatAt)) <= HEARTBEAT_TIMEOUT_MS)
    .sort((a, b) => toMs(b.lastHeartbeatAt) - toMs(a.lastHeartbeatAt));

  if (validTabs.length > 0) {
    const primary = validTabs[0];
    const earliestStartMs = validTabs.reduce(
      (min, t) => {
        const s = toMs(t.startedAt);
        return s > 0 && s < min ? s : min;
      },
      toMs(primary.startedAt) || nowMs
    );
    const act = primary.activity || presenceDoc.currentActivity || 'idle';
    return {
      online: true,
      activeTabsCount: validTabs.length,
      activeTabs: validTabs,
      currentRoom: primary.room || presenceDoc.currentRoom || 'bedroom',
      currentActivity: act,
      currentActivityLabel: primary.activityLabel || normalizeActivityLabel(act),
      lastActiveAt: primary.lastHeartbeatAt || presenceDoc.lastActiveAt || null,
      currentSessionStartedAt: new Date(earliestStartMs).toISOString(),
      currentSessionDurationSec: Math.max(0, Math.round((nowMs - earliestStartMs) / 1000)),
    };
  }

  // Legacy/single-tab fallback check when activeTabs map absent
  const lastHbMs = toMs(presenceDoc.lastHeartbeatAt || presenceDoc.lastActiveAt);
  const isRecentlyAlive = Boolean(presenceDoc.online) && lastHbMs > 0 && (nowMs - lastHbMs) <= HEARTBEAT_TIMEOUT_MS;
  const startedMs = toMs(presenceDoc.currentSessionStartedAt || presenceDoc.startedAt);

  return {
    online: isRecentlyAlive,
    activeTabsCount: isRecentlyAlive ? 1 : 0,
    activeTabs: [],
    currentRoom: presenceDoc.currentRoom || 'bedroom',
    currentActivity: isRecentlyAlive ? (presenceDoc.currentActivity || 'idle') : 'idle',
    currentActivityLabel: isRecentlyAlive
      ? (presenceDoc.currentActivityLabel || normalizeActivityLabel(presenceDoc.currentActivity))
      : 'Offline',
    lastActiveAt: presenceDoc.lastActiveAt || presenceDoc.lastHeartbeatAt || null,
    currentSessionStartedAt: isRecentlyAlive && startedMs ? new Date(startedMs).toISOString() : null,
    currentSessionDurationSec: isRecentlyAlive && startedMs ? Math.max(0, Math.round((nowMs - startedMs) / 1000)) : 0,
  };
}

export function sanitizeUserSummary(userDoc = {}, presenceDoc = null, gameStateDoc = null, nowMs = Date.now()) {
  const presence = evaluatePresence(presenceDoc, nowMs);
  const guardianLevel = Number(
    userDoc.guardianLevel ?? presenceDoc?.guardianLevel ?? gameStateDoc?.guardianLevel ?? 1
  );
  const guardianXP = Number(
    userDoc.guardianXP ?? presenceDoc?.guardianXP ?? gameStateDoc?.guardianXP ?? 0
  );
  const bondPoints = Number(
    userDoc.bondPoints ?? presenceDoc?.bondPoints ?? gameStateDoc?.relationship?.bondPoints ?? 0
  );
  const lastActiveMs = Math.max(
    toMs(userDoc.lastActiveAt),
    toMs(presence.lastActiveAt),
    toMs(userDoc.lastLoginAt),
    toMs(gameStateDoc?.savedAt)
  );
  const legacyActs = Array.isArray(gameStateDoc?.activityHistory) ? gameStateDoc.activityHistory.length : 0;
  const totalActivitiesCompleted = Math.max(
    Number(userDoc.totalActivitiesCompleted ?? 0),
    legacyActs
  );

  return {
    uid: userDoc.uid || presenceDoc?.uid || '',
    displayName: userDoc.displayName || presenceDoc?.playerName || userDoc.email?.split('@')[0] || 'Little Guardian',
    email: userDoc.email || presenceDoc?.playerEmail || '',
    photoURL: userDoc.photoURL || '',
    provider: userDoc.provider || 'email',
    emailVerified: Boolean(userDoc.emailVerified),
    createdAt: userDoc.createdAt || null,
    lastLoginAt: userDoc.lastLoginAt || null,
    lastActiveAt: lastActiveMs ? new Date(lastActiveMs).toISOString() : null,
    online: presence.online,
    activeTabsCount: presence.activeTabsCount,
    currentRoom: presence.currentRoom || gameStateDoc?.currentRoom || 'bedroom',
    currentActivity: presence.online ? presence.currentActivity : 'idle',
    currentActivityLabel: presence.online ? presence.currentActivityLabel : 'Offline',
    currentSessionDurationSec: presence.currentSessionDurationSec,
    guardianLevel,
    guardianTitle: GUARDIAN_TITLES[guardianLevel] || 'Guardian',
    guardianXP,
    bondPoints,
    coins: Number(userDoc.coins ?? gameStateDoc?.coins ?? 0),
    totalPlaytimeSec: Number(userDoc.totalPlaytimeSec ?? 0),
    totalActivitiesCompleted,
    totalSessions: Number(userDoc.totalSessions ?? 0),
  };
}

export function buildOverviewPayload({
  users = [],
  presences = [],
  authEvents = [],
  sessions = [],
  activities = [],
  dailyDocs = [],
  gameStatesByUid = {},
  range = '7d',
  nowMs = Date.now(),
}) {
  const earliestUserMs = users.reduce((min, u) => {
    const c = toMs(u.createdAt);
    return c > 0 && c < min ? c : min;
  }, nowMs);

  const bounds = resolveDateBounds(range, nowMs, earliestUserMs);
  const todayKey = getDateKey(nowMs);
  const presenceMap = new Map(presences.map(p => [p.uid, p]));

  const enrichedUsers = users.map(u =>
    sanitizeUserSummary(u, presenceMap.get(u.uid), gameStatesByUid[u.uid], nowMs)
  );

  // Deduplicate active users today from presences, users, sessions, dailyAnalytics
  const activeTodaySet = new Set();
  const dailyTodayDoc = dailyDocs.find(d => d.date === todayKey);
  for (const uid of dailyTodayDoc?.activeUids ?? []) activeTodaySet.add(uid);
  for (const u of enrichedUsers) {
    if (u.online || toMs(u.lastActiveAt) >= bounds.todayStart) activeTodaySet.add(u.uid);
  }
  for (const s of sessions) {
    if (toMs(s.lastHeartbeatAt || s.startedAt) >= bounds.todayStart && s.uid) activeTodaySet.add(s.uid);
  }

  const regTodaySet = new Set();
  for (const u of enrichedUsers) {
    if (toMs(u.createdAt) >= bounds.todayStart && u.uid) regTodaySet.add(u.uid);
  }
  for (const ev of authEvents) {
    if (ev.eventType === 'NEW_REGISTRATION' && toMs(ev.timestamp) >= bounds.todayStart && ev.uid) {
      regTodaySet.add(ev.uid);
    }
  }

  const inRange = (ms) => range === 'all' || (ms >= bounds.startMs && ms <= bounds.endMs);
  const sessionsInRange = sessions.filter(s => inRange(toMs(s.startedAt || s.lastHeartbeatAt)));
  const activitiesInRange = activities.filter(a => inRange(toMs(a.startAt || a.timestamp)));

  // Accumulated playtime in range
  let totalPlaytimeSec = 0;
  if (range === 'all') {
    const fromUsers = enrichedUsers.reduce((acc, u) => acc + (u.totalPlaytimeSec || 0), 0);
    const fromDaily = dailyDocs.reduce((acc, d) => acc + Number(d.totalPlaytimeSec || 0), 0);
    totalPlaytimeSec = Math.max(fromUsers, fromDaily);
  } else {
    const filteredDaily = dailyDocs.filter(d => bounds.dayKeys.includes(d.date));
    const fromDaily = filteredDaily.reduce((acc, d) => acc + Number(d.totalPlaytimeSec || 0), 0);
    const fromSessions = sessionsInRange.reduce((acc, s) => acc + Number(s.durationSec || 0), 0);
    totalPlaytimeSec = Math.max(fromDaily, fromSessions);
  }

  let totalActivitiesCompleted = 0;
  const completedInRange = activitiesInRange.filter(a => a.status !== 'started' && a.status !== 'cancelled').length;
  if (range === 'all') {
    const sumUsers = enrichedUsers.reduce((acc, u) => acc + (u.totalActivitiesCompleted || 0), 0);
    totalActivitiesCompleted = Math.max(sumUsers, completedInRange);
  } else {
    const fromDaily = dailyDocs
      .filter(d => bounds.dayKeys.includes(d.date))
      .reduce((acc, d) => acc + Number(d.totalActivitiesCompleted || 0), 0);
    totalActivitiesCompleted = Math.max(fromDaily, completedInRange);
  }

  const totalGameSessions = range === 'all'
    ? Math.max(enrichedUsers.reduce((acc, u) => acc + (u.totalSessions || 0), 0), sessionsInRange.length)
    : Math.max(
        dailyDocs.filter(d => bounds.dayKeys.includes(d.date)).reduce((a, d) => a + Number(d.sessionsCount || 0), 0),
        sessionsInRange.length
      );

  const avgLevel = enrichedUsers.length > 0
    ? Math.round((enrichedUsers.reduce((acc, u) => acc + (u.guardianLevel || 1), 0) / enrichedUsers.length) * 10) / 10
    : 0;

  // Chart 1 & 2 & 5: per-day buckets
  const regByDay = new Map(bounds.dayKeys.map(k => [k, new Set()]));
  const dauByDay = new Map(bounds.dayKeys.map(k => [k, new Set()]));
  const playtimeByDay = new Map(bounds.dayKeys.map(k => [k, 0]));

  for (const d of dailyDocs) {
    if (dauByDay.has(d.date)) {
      for (const uid of d.activeUids ?? []) dauByDay.get(d.date).add(uid);
      playtimeByDay.set(d.date, Math.max(playtimeByDay.get(d.date), Number(d.totalPlaytimeSec || 0)));
    }
  }
  for (const u of enrichedUsers) {
    const dk = u.createdAt ? getDateKey(toMs(u.createdAt)) : null;
    if (dk && regByDay.has(dk)) regByDay.get(dk).add(u.uid);
    const activeDk = u.lastActiveAt ? getDateKey(toMs(u.lastActiveAt)) : null;
    if (activeDk && dauByDay.has(activeDk)) dauByDay.get(activeDk).add(u.uid);
  }
  for (const s of sessions) {
    const dk = getDateKey(toMs(s.startedAt || s.lastHeartbeatAt));
    if (dauByDay.has(dk) && s.uid) dauByDay.get(dk).add(s.uid);
  }

  const registrationTrends = bounds.dayKeys.map(date => ({
    date,
    label: date.slice(5),
    count: regByDay.get(date)?.size ?? 0,
  }));

  const dailyActiveUsers = bounds.dayKeys.map(date => ({
    date,
    label: date.slice(5),
    count: dauByDay.get(date)?.size ?? 0,
  }));

  const playtimeTrends = bounds.dayKeys.map(date => {
    const totalSec = playtimeByDay.get(date) ?? 0;
    const dau = dauByDay.get(date)?.size ?? 0;
    const totalMin = Math.round((totalSec / 60) * 10) / 10;
    const avgMinutes = dau > 0 ? Math.round((totalMin / dau) * 10) / 10 : 0;
    return { date, label: date.slice(5), minutes: totalMin, avgMinutes };
  });

  // Chart 3: Weekly active users (last up to 6 weeks)
  const wauMap = new Map();
  for (const [date, set] of dauByDay.entries()) {
    const wk = getWeekKey(Date.parse(`${date}T12:00:00Z`));
    if (!wauMap.has(wk)) wauMap.set(wk, new Set());
    for (const uid of set) wauMap.get(wk).add(uid);
  }
  const weeklyActiveUsers = [...wauMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, set]) => ({ week, label: week, count: set.size }));

  // Chart 4: Activity distribution
  const distCounts = new Map();
  for (const act of activitiesInRange) {
    if (act.status === 'cancelled') continue;
    const lbl = normalizeActivityLabel(act.activityType, act.activityLabel);
    if (lbl === 'Idle') continue;
    distCounts.set(lbl, (distCounts.get(lbl) ?? 0) + 1);
  }
  if (distCounts.size === 0 && range === 'all') {
    for (const gs of Object.values(gameStatesByUid)) {
      for (const h of gs?.activityHistory ?? []) {
        const lbl = normalizeActivityLabel(h.type, h.label);
        if (lbl === 'Idle') continue;
        distCounts.set(lbl, (distCounts.get(lbl) ?? 0) + 1);
      }
    }
  }
  const distTotal = [...distCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const activityDistribution = [...distCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      type: label,
      label,
      count,
      pct: Math.round((count / distTotal) * 100),
    }));

  // Chart 6: Player level distribution across 1..6
  const lvlCounts = new Map([1, 2, 3, 4, 5, 6].map(l => [l, 0]));
  for (const u of enrichedUsers) {
    const lvl = Math.min(6, Math.max(1, Number(u.guardianLevel || 1)));
    lvlCounts.set(lvl, (lvlCounts.get(lvl) ?? 0) + 1);
  }
  const levelDistribution = [...lvlCounts.entries()].map(([level, count]) => ({
    level,
    title: GUARDIAN_TITLES[level] || `Lv.${level}`,
    count,
  }));

  return {
    totalUsers: enrichedUsers.length,
    users: enrichedUsers,
    recentRegistrations: authEvents.filter(e => e.eventType === 'NEW_REGISTRATION'),
    recentLogins: authEvents.filter(e => e.eventType === 'SUCCESSFUL_LOGIN'),
    dateRange: range,
    summary: {
      totalRegisteredUsers: enrichedUsers.length,
      currentlyOnlineUsers: enrichedUsers.filter(u => u.online).length,
      totalActiveUsersToday: activeTodaySet.size,
      newRegistrationsToday: regTodaySet.size,
      totalGameSessions,
      totalActivitiesCompleted,
      averagePlayerLevel: avgLevel,
      totalAccumulatedPlaytimeSec: totalPlaytimeSec,
    },
    charts: {
      registrationTrends,
      dailyActiveUsers,
      weeklyActiveUsers,
      activityDistribution,
      playtimeTrends,
      levelDistribution,
    },
  };
}

export function buildPlayerProgressPayload({
  userDoc = {},
  gameStateDoc = null,
  presenceDoc = null,
  sessions = [],
  activityEvents = [],
  progressHistory = [],
  nowMs = Date.now(),
}) {
  const summary = sanitizeUserSummary(userDoc, presenceDoc, gameStateDoc, nowMs);
  const presence = evaluatePresence(presenceDoc, nowMs);

  // Build activity history (prefer dedicated activityEvents collection, fall back to gameState.activityHistory)
  let normalizedEvents = activityEvents.map(ev => ({
    eventId: ev.eventId || '',
    activityType: normalizeActivityLabel(ev.activityType, ev.activityLabel),
    rawType: ev.activityType || '',
    label: ev.activityLabel || normalizeActivityLabel(ev.activityType),
    room: ev.room || 'bedroom',
    startAt: ev.startAt || null,
    endAt: ev.endAt || null,
    durationSec: Number(ev.durationSec ?? 0),
    status: ev.status || 'completed',
  }));

  if (normalizedEvents.length === 0 && Array.isArray(gameStateDoc?.activityHistory)) {
    normalizedEvents = [...gameStateDoc.activityHistory]
      .reverse()
      .slice(0, 60)
      .map((item, idx) => ({
        eventId: `save_${idx}_${item.timestamp || idx}`,
        activityType: normalizeActivityLabel(item.type, item.label),
        rawType: item.type || '',
        label: item.label || item.type || 'Activity',
        room: 'house',
        startAt: item.timestamp ? new Date(item.timestamp).toISOString() : null,
        endAt: item.timestamp ? new Date(item.timestamp).toISOString() : null,
        durationSec: 0,
        status: 'completed',
      }));
  }

  // Daily routine
  const routineObj = gameStateDoc?.stats?.dailyRoutine ?? {};
  const tasksCompleted = DAILY_ROUTINE_KEYS.filter(k => Boolean(routineObj[k])).map(k => ({
    key: k,
    label: DAILY_ROUTINE_LABELS[k],
  }));
  const tasksPending = DAILY_ROUTINE_KEYS.filter(k => !routineObj[k]).map(k => ({
    key: k,
    label: DAILY_ROUTINE_LABELS[k],
  }));
  const completionPct = Math.round((tasksCompleted.length / DAILY_ROUTINE_KEYS.length) * 100);

  const routineHistoryFromProgress = progressHistory
    .filter(p => p.kind === 'routine_completed')
    .map(p => ({ title: p.title, detail: p.detail, timestamp: p.timestamp }));
  const routineHistoryFromDiary = (gameStateDoc?.diaryEntries ?? [])
    .slice(0, 14)
    .map(d => ({
      title: `Virtual Day ${d.day} (${d.dateLabel || ''})`,
      detail: `${d.eventCount ?? d.activities?.length ?? 0} logged moments · Mood: ${d.mood || 'Peaceful'}`,
      timestamp: d.timestamp ? new Date(d.timestamp).toISOString() : null,
    }));

  // Playtime breakdown (today, last 7 days, total)
  const todayStart = Date.UTC(
    new Date(nowMs).getUTCFullYear(),
    new Date(nowMs).getUTCMonth(),
    new Date(nowMs).getUTCDate()
  );
  const weekStart = todayStart - 6 * 86400000;
  let todayPlaytimeSec = 0;
  let weeklyPlaytimeSec = 0;
  let totalSessionPlaytimeSec = 0;

  for (const s of sessions) {
    const dur = Number(s.durationSec ?? 0);
    const refMs = toMs(s.lastHeartbeatAt || s.startedAt);
    totalSessionPlaytimeSec += dur;
    if (refMs >= todayStart) todayPlaytimeSec += dur;
    if (refMs >= weekStart) weeklyPlaytimeSec += dur;
  }
  const totalPlaytimeSec = Math.max(Number(userDoc.totalPlaytimeSec ?? 0), totalSessionPlaytimeSec);

  // Visited/unlocked rooms & Wardrobe / Decor progress
  const visitedIds = new Set(
    Array.isArray(gameStateDoc?.visitedRooms) && gameStateDoc.visitedRooms.length > 0
      ? gameStateDoc.visitedRooms
      : ALL_HOUSE_ROOMS.map(r => r.id)
  );
  const unlockedRooms = ALL_HOUSE_ROOMS.map(r => ({
    ...r,
    unlocked: visitedIds.has(r.id),
  }));

  // Combine stored progressHistory with gameState rewardHistory & achievements if timeline is sparse
  const timeline = [...progressHistory];
  if (timeline.length === 0 && gameStateDoc) {
    for (const rw of gameStateDoc.rewardHistory ?? []) {
      timeline.push({
        entryId: `rw_${rw.id}`,
        kind: 'reward',
        title: `Earned Reward: ${rw.label}`,
        detail: rw.source || '',
        timestamp: rw.timestamp ? new Date(rw.timestamp).toISOString() : null,
      });
    }
    for (const ach of gameStateDoc.unlockedAchievements ?? []) {
      timeline.push({
        entryId: `ach_${ach.id}`,
        kind: 'achievement',
        title: `Unlocked Achievement: ${ach.title}`,
        detail: ach.virtualDate || '',
        timestamp: ach.unlockedAt ? new Date(ach.unlockedAt).toISOString() : null,
      });
    }
    timeline.sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));
  }

  return {
    account: {
      uid: summary.uid,
      displayName: summary.displayName,
      email: summary.email,
      photoURL: summary.photoURL,
      provider: summary.provider,
      emailVerified: summary.emailVerified,
      createdAt: summary.createdAt,
      lastLoginAt: summary.lastLoginAt,
      lastActiveAt: summary.lastActiveAt,
      online: presence.online,
      activeTabsCount: presence.activeTabsCount,
      currentRoom: presence.currentRoom,
      currentActivity: presence.currentActivityLabel,
      currentSessionDurationSec: presence.currentSessionDurationSec,
    },
    gameProgress: {
      guardianLevel: summary.guardianLevel,
      guardianTitle: summary.guardianTitle,
      guardianXP: summary.guardianXP,
      bondPoints: summary.bondPoints,
      coins: summary.coins,
      needs: gameStateDoc?.needs ?? null,
      rewards: gameStateDoc?.rewardHistory ?? [],
      achievements: gameStateDoc?.unlockedAchievements ?? [],
      unlockedRooms,
      wardrobe: {
        selectedOutfit: gameStateDoc?.selectedOutfit ?? 'casual',
        unlockedOutfits: gameStateDoc?.unlockedOutfits ?? ['casual', 'school', 'pajamas'],
      },
      decoration: {
        selectedTheme: gameStateDoc?.selectedTheme ?? 'pink',
        unlockedThemes: gameStateDoc?.unlockedThemes ?? ['pink'],
        unlockedDecor: gameStateDoc?.unlockedDecor ?? [],
        unlockedStickers: gameStateDoc?.unlockedStickers ?? [],
      },
      stats: gameStateDoc?.stats ?? null,
    },
    activityHistory: normalizedEvents.slice(0, 80),
    dailyRoutine: {
      virtualDay: gameStateDoc?.stats?.dailyRoutineDay ?? 1,
      tasksCompleted,
      tasksPending,
      completionPct,
      history: routineHistoryFromProgress.length > 0 ? routineHistoryFromProgress : routineHistoryFromDiary,
    },
    playtime: {
      todayPlaytimeSec,
      weeklyPlaytimeSec,
      totalPlaytimeSec,
      sessionHistory: sessions.slice(0, 40),
    },
    progressTimeline: timeline.slice(0, 80),
  };
}
