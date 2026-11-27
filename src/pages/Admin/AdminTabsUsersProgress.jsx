// AdminTabsUsersProgress.jsx — All Users Directory, Player Progress Profile & Global Activity History
import { EmptyChartState } from './AdminCharts.jsx';
import {
  DATE_RANGES,
  formatDateTime,
  formatDurationSec,
  formatRoomLabel,
  formatShortDate,
} from './adminFormatters.js';

export function UsersDirectoryTab({
  directory,
  loading,
  filters,
  onUpdateFilters,
  onSelectUser,
}) {
  const users = directory?.users ?? [];
  const total = directory?.total ?? 0;
  const page = directory?.page ?? 1;
  const totalPages = directory?.totalPages ?? 1;

  return (
    <>
      <div className="adm-section-head">
        <div>
          <h2>👥 All Users Directory</h2>
          <p className="adm-section-sub">
            {total} registered account{total === 1 ? '' : 's'}. Click any player to open their full progress profile.
          </p>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-toolbar" style={{ marginBottom: 14 }}>
          <input
            type="search"
            className="adm-input"
            placeholder="Search by display name or email..."
            value={filters.search}
            onChange={e => onUpdateFilters({ search: e.target.value, page: 1 })}
          />
          <select
            className="adm-select"
            value={filters.status}
            onChange={e => onUpdateFilters({ status: e.target.value, page: 1 })}
            aria-label="Filter by online status"
          >
            <option value="all">All Status</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>
          <select
            className="adm-select"
            value={filters.dateRange}
            onChange={e => onUpdateFilters({ dateRange: e.target.value, page: 1 })}
            aria-label="Filter by registration date"
          >
            {DATE_RANGES.map(r => (
              <option key={r.id} value={r.id}>Reg: {r.label}</option>
            ))}
          </select>
          <select
            className="adm-select"
            value={`${filters.sortBy}:${filters.sortDir}`}
            onChange={e => {
              const [sortBy, sortDir] = e.target.value.split(':');
              onUpdateFilters({ sortBy, sortDir, page: 1 });
            }}
            aria-label="Sort players"
          >
            <option value="lastActive:desc">Sort: Last Active (Newest)</option>
            <option value="level:desc">Sort: Level (Highest)</option>
            <option value="level:asc">Sort: Level (Lowest)</option>
            <option value="xp:desc">Sort: XP (Highest)</option>
            <option value="createdAt:desc">Sort: Registration Date (Newest)</option>
          </select>
        </div>

        {loading && users.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <EmptyChartState icon="🔎" message="No players match the current search or filters." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Playtime</th>
                  <th>Activities</th>
                  <th>Registered</th>
                  <th>Last Login</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.uid} className="adm-row-clickable" onClick={() => onSelectUser(u.uid)}>
                    <td><strong>{u.displayName}</strong></td>
                    <td>{u.email || '—'}</td>
                    <td>
                      <span className={`adm-status ${u.online ? 'adm-status--online' : 'adm-status--offline'}`}>
                        {u.online ? '🟢 Online' : 'Offline'}
                      </span>
                    </td>
                    <td>Lv.{u.guardianLevel}</td>
                    <td>{u.guardianXP}</td>
                    <td>{formatDurationSec(u.totalPlaytimeSec)}</td>
                    <td>{u.totalActivitiesCompleted}</td>
                    <td>{formatShortDate(u.createdAt)}</td>
                    <td>{formatDateTime(u.lastLoginAt)}</td>
                    <td>{formatDateTime(u.lastActiveAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="adm-pagination">
          <span>Page {page} of {totalPages} ({total} total)</span>
          <div className="adm-top-actions">
            <button
              type="button"
              className="adm-chip-btn"
              disabled={page <= 1}
              onClick={() => onUpdateFilters({ page: page - 1 })}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="adm-chip-btn"
              disabled={page >= totalPages}
              onClick={() => onUpdateFilters({ page: page + 1 })}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function PlayerProgressTab({
  selectedUid,
  userList = [],
  profile,
  loading,
  onSelectUid,
  onBackToUsers,
}) {
  const acc = profile?.account;
  const gp = profile?.gameProgress;
  const dr = profile?.dailyRoutine;
  const pt = profile?.playtime;

  return (
    <>
      <div className="adm-section-head">
        <div>
          <h2>🌟 Individual Player Progress</h2>
          <p className="adm-section-sub">Account info, game state, daily routine, playtime sessions, and milestones.</p>
        </div>
        <div className="adm-toolbar">
          <select
            className="adm-select"
            value={selectedUid || ''}
            onChange={e => onSelectUid(e.target.value)}
            aria-label="Select player profile"
          >
            <option value="">Choose a player...</option>
            {userList.map(u => (
              <option key={u.uid} value={u.uid}>
                {u.displayName} ({u.email || u.uid})
              </option>
            ))}
          </select>
          <button type="button" className="adm-chip-btn" onClick={onBackToUsers}>
            ← User Directory
          </button>
        </div>
      </div>

      {!selectedUid ? (
        <div className="adm-card">
          <EmptyChartState icon="👤" message="Select a player above or click any user in All Users / Live Players to view full progress." />
        </div>
      ) : loading ? (
        <div className="adm-card">Loading player profile...</div>
      ) : !profile ? (
        <div className="adm-card">
          <EmptyChartState icon="🌸" message="No details found for this account yet." />
        </div>
      ) : (
        <>
          {/* Account & Live Summary */}
          <div className="adm-charts-grid">
            <div className="adm-card">
              <h3 className="adm-card-title">
                <span>👤 Account Information</span>
                <span className={`adm-status ${acc.online ? 'adm-status--online' : 'adm-status--offline'}`}>
                  {acc.online ? `Online (${acc.activeTabsCount} tab${acc.activeTabsCount === 1 ? '' : 's'})` : 'Offline'}
                </span>
              </h3>
              <div className="adm-meta-grid">
                <div><span className="adm-meta-label">Display Name</span><span className="adm-meta-val">{acc.displayName}</span></div>
                <div><span className="adm-meta-label">Email</span><span className="adm-meta-val">{acc.email || '—'}</span></div>
                <div><span className="adm-meta-label">Created At</span><span className="adm-meta-val">{formatDateTime(acc.createdAt)}</span></div>
                <div><span className="adm-meta-label">Last Login</span><span className="adm-meta-val">{formatDateTime(acc.lastLoginAt)}</span></div>
                <div><span className="adm-meta-label">Last Active</span><span className="adm-meta-val">{formatDateTime(acc.lastActiveAt)}</span></div>
                <div><span className="adm-meta-label">Current Status</span><span className="adm-meta-val">{acc.online ? `${formatRoomLabel(acc.currentRoom)} · ${acc.currentActivity}` : 'Offline'}</span></div>
              </div>
            </div>

            <div className="adm-card">
              <h3 className="adm-card-title"><span>🎮 Game Progress</span></h3>
              <div className="adm-meta-grid">
                <div><span className="adm-meta-label">Guardian Level</span><span className="adm-meta-val">Lv.{gp.guardianLevel} · {gp.guardianTitle}</span></div>
                <div><span className="adm-meta-label">Total XP / Bond</span><span className="adm-meta-val">{gp.guardianXP} XP · {gp.bondPoints} Bond</span></div>
                <div><span className="adm-meta-label">Coins Earned</span><span className="adm-meta-val">🪙 {gp.coins ?? 0}</span></div>
                <div><span className="adm-meta-label">Achievements</span><span className="adm-meta-val">🏆 {gp.achievements?.length ?? 0} unlocked</span></div>
                <div><span className="adm-meta-label">Rewards Earned</span><span className="adm-meta-val">🎁 {gp.rewards?.length ?? 0} rewards</span></div>
                <div><span className="adm-meta-label">Wardrobe &amp; Theme</span><span className="adm-meta-val">👗 {gp.wardrobe?.unlockedOutfits?.length ?? 0} outfits · 🎨 {gp.decoration?.selectedTheme}</span></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <span className="adm-meta-label" style={{ marginBottom: 4 }}>Explored / Unlocked Rooms</span>
                <div className="adm-tag-list">
                  {(gp.unlockedRooms ?? []).map(r => (
                    <span key={r.id} className={`adm-tag ${r.unlocked ? 'adm-tag--done' : ''}`}>
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Routine & Playtime */}
          <div className="adm-charts-grid">
            <div className="adm-card">
              <h3 className="adm-card-title">
                <span>📋 Daily Routine (Virtual Day {dr.virtualDay})</span>
                <span>{dr.completionPct}%</span>
              </h3>
              <div className="adm-progress-track">
                <div className="adm-progress-fill" style={{ width: `${dr.completionPct}%` }} />
              </div>
              <div className="adm-tag-list" style={{ marginTop: 10 }}>
                {dr.tasksCompleted.map(t => (
                  <span key={t.key} className="adm-tag adm-tag--done">✓ {t.label}</span>
                ))}
                {dr.tasksPending.map(t => (
                  <span key={t.key} className="adm-tag adm-tag--pending">○ {t.label}</span>
                ))}
              </div>
              {dr.history?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <span className="adm-meta-label" style={{ marginBottom: 4 }}>Routine &amp; Diary History</span>
                  {dr.history.slice(0, 5).map((h, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid #f7eeff' }}>
                      <strong>{h.title}</strong> — {h.detail}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="adm-card">
              <h3 className="adm-card-title"><span>⏱️ Playtime &amp; Session History</span></h3>
              <div className="adm-meta-grid" style={{ marginBottom: 12 }}>
                <div><span className="adm-meta-label">Today's Playtime</span><span className="adm-meta-val">{formatDurationSec(pt.todayPlaytimeSec)}</span></div>
                <div><span className="adm-meta-label">Weekly Playtime</span><span className="adm-meta-val">{formatDurationSec(pt.weeklyPlaytimeSec)}</span></div>
                <div><span className="adm-meta-label">Total Playtime</span><span className="adm-meta-val">{formatDurationSec(pt.totalPlaytimeSec)}</span></div>
                <div><span className="adm-meta-label">Recorded Sessions</span><span className="adm-meta-val">{pt.sessionHistory?.length ?? 0}</span></div>
              </div>
              {(!pt.sessionHistory || pt.sessionHistory.length === 0) ? (
                <EmptyChartState icon="🕹️" message="No individual sessions logged yet." />
              ) : (
                <div className="adm-table-wrap" style={{ maxHeight: 210, overflowY: 'auto' }}>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Duration</th>
                        <th>Room / Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pt.sessionHistory.slice(0, 15).map(s => (
                        <tr key={s.sessionId}>
                          <td>{s.isActive ? '🟢 Active' : 'Ended'}</td>
                          <td>{formatDateTime(s.startedAt)}</td>
                          <td>{formatDurationSec(s.durationSec)}</td>
                          <td>{formatRoomLabel(s.room)} · {s.lastActivity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Wardrobe, Achievements, Activity History & Timeline */}
          <div className="adm-charts-grid">
            <div className="adm-card">
              <h3 className="adm-card-title"><span>📝 Activity History</span></h3>
              {(!profile.activityHistory || profile.activityHistory.length === 0) ? (
                <EmptyChartState icon="🌸" message="No player activities recorded yet." />
              ) : (
                <div className="adm-table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Activity</th>
                        <th>Room</th>
                        <th>Started</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.activityHistory.map(ev => (
                        <tr key={ev.eventId}>
                          <td><strong>{ev.activityType}</strong><br /><small style={{ color: '#8f74a8' }}>{ev.label}</small></td>
                          <td>{formatRoomLabel(ev.room)}</td>
                          <td>{formatDateTime(ev.startAt)}</td>
                          <td>{formatDurationSec(ev.durationSec)}</td>
                          <td><span className="adm-tag adm-tag--done">{ev.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="adm-card">
              <h3 className="adm-card-title"><span>🕰️ Progress Timeline</span></h3>
              {(!profile.progressTimeline || profile.progressTimeline.length === 0) ? (
                <EmptyChartState icon="🌟" message="Level-ups, rewards, and milestone achievements will appear here." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {profile.progressTimeline.map(item => (
                    <div
                      key={item.entryId}
                      style={{
                        background: '#fdf8ff',
                        borderLeft: '3.5px solid #c084fc',
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong>{item.title}</strong>
                        <span style={{ color: '#8f74a8', fontSize: '0.7rem' }}>{formatDateTime(item.timestamp)}</span>
                      </div>
                      {item.detail && <div style={{ color: '#7b6196', marginTop: 2 }}>{item.detail}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title"><span>🎀 Rewards, Wardrobe &amp; Decor Unlocked</span></h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span className="adm-meta-label" style={{ marginBottom: 4 }}>Outfits ({gp.wardrobe?.unlockedOutfits?.length ?? 0})</span>
                <div className="adm-tag-list">
                  {(gp.wardrobe?.unlockedOutfits ?? []).map(o => (
                    <span key={o} className={`adm-tag ${o === gp.wardrobe.selectedOutfit ? 'adm-tag--done' : ''}`}>
                      👗 {o}{o === gp.wardrobe.selectedOutfit ? ' (Active)' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="adm-meta-label" style={{ marginBottom: 4 }}>Achievements ({gp.achievements?.length ?? 0})</span>
                <div className="adm-tag-list">
                  {(gp.achievements ?? []).length === 0 ? (
                    <span className="adm-tag">No achievements unlocked yet</span>
                  ) : (
                    gp.achievements.map(a => (
                      <span key={a.id} className="adm-tag adm-tag--done">{a.icon} {a.title}</span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <span className="adm-meta-label" style={{ marginBottom: 4 }}>Decor, Themes &amp; Stickers</span>
                <div className="adm-tag-list">
                  {(gp.decoration?.unlockedThemes ?? []).map(t => <span key={t} className="adm-tag">🎨 Theme: {t}</span>)}
                  {(gp.decoration?.unlockedDecor ?? []).map(d => <span key={d} className="adm-tag">🏡 {d}</span>)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function ActivitiesTab({
  activitiesData,
  loading,
  filters,
  userList = [],
  onUpdateFilters,
  onInspectUser,
}) {
  const items = activitiesData?.activities ?? [];
  const total = activitiesData?.total ?? 0;
  const page = activitiesData?.page ?? 1;
  const totalPages = activitiesData?.totalPages ?? 1;

  return (
    <>
      <div className="adm-section-head">
        <div>
          <h2>📝 Activity History Feed</h2>
          <p className="adm-section-sub">Meaningful player activities across all rooms (zero cursor/frame noise).</p>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-toolbar" style={{ marginBottom: 14 }}>
          <select
            className="adm-select"
            value={filters.uid}
            onChange={e => onUpdateFilters({ uid: e.target.value, page: 1 })}
            aria-label="Filter by player"
          >
            <option value="">All Players</option>
            {userList.map(u => (
              <option key={u.uid} value={u.uid}>{u.displayName}</option>
            ))}
          </select>
          <select
            className="adm-select"
            value={filters.type}
            onChange={e => onUpdateFilters({ type: e.target.value, page: 1 })}
            aria-label="Filter by activity type"
          >
            <option value="all">All Activities</option>
            <option value="cooking">Cooking</option>
            <option value="eating">Eating</option>
            <option value="bathing">Bathing</option>
            <option value="brushing teeth">Brushing teeth</option>
            <option value="sleeping">Sleeping</option>
            <option value="studying">Studying</option>
            <option value="playing">Playing</option>
            <option value="gardening">Gardening</option>
            <option value="dressing up">Dressing up</option>
            <option value="talking">Talking</option>
          </select>
          <select
            className="adm-select"
            value={filters.dateRange}
            onChange={e => onUpdateFilters({ dateRange: e.target.value, page: 1 })}
            aria-label="Filter activity date range"
          >
            {DATE_RANGES.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {loading && items.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center' }}>Loading activities...</div>
        ) : items.length === 0 ? (
          <EmptyChartState icon="🎀" message="No activity events recorded for these filters yet." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Activity</th>
                  <th>Room</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(ev => (
                  <tr
                    key={ev.eventId}
                    className="adm-row-clickable"
                    onClick={() => ev.uid && onInspectUser(ev.uid)}
                  >
                    <td>
                      <strong>{ev.playerName || 'Guardian'}</strong>
                      <br />
                      <small style={{ color: '#8f74a8' }}>{ev.playerEmail || ev.uid}</small>
                    </td>
                    <td>
                      <strong>{ev.activityCategory || ev.activityType}</strong>
                      <br />
                      <small style={{ color: '#7b6196' }}>{ev.activityLabel}</small>
                    </td>
                    <td>{formatRoomLabel(ev.room)}</td>
                    <td>{formatDateTime(ev.startAt || ev.timestamp)}</td>
                    <td>{formatDurationSec(ev.durationSec)}</td>
                    <td><span className="adm-tag adm-tag--done">{ev.status || 'completed'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="adm-pagination">
          <span>Page {page} of {totalPages} ({total} events)</span>
          <div className="adm-top-actions">
            <button
              type="button"
              className="adm-chip-btn"
              disabled={page <= 1}
              onClick={() => onUpdateFilters({ page: page - 1 })}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="adm-chip-btn"
              disabled={page >= totalPages}
              onClick={() => onUpdateFilters({ page: page + 1 })}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
