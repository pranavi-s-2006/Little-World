// AdminTabsOverviewLive.jsx — Overview, Live Players, Analytics & Settings views
import { useEffect, useState } from 'react';
import {
  PastelLineChart,
  PastelBarChart,
  PastelDonutChart,
  EmptyChartState,
} from './AdminCharts.jsx';
import {
  DATE_RANGES,
  formatDateTime,
  formatDurationSec,
  formatRoomLabel,
} from './adminFormatters.js';

export function OverviewTab({ data, loading, dateRange, onChangeRange, onInspectUser }) {
  const s = data?.summary ?? {};
  const c = data?.charts ?? {};

  return (
    <>
      <div className="adm-section-head">
        <div>
          <h2>✿ Admin Overview</h2>
          <p className="adm-section-sub">Real Firestore metrics across registrations, sessions, and gameplay.</p>
        </div>
        <div className="adm-filter-pills" role="group" aria-label="Date range filter">
          {DATE_RANGES.map(r => (
            <button
              key={r.id}
              type="button"
              className={`adm-pill ${dateRange === r.id ? 'adm-pill--active' : ''}`}
              onClick={() => onChangeRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && <div className="adm-card">Loading real-time Firestore overview...</div>}

      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-top"><span>Total Registered Users</span><span>🎀</span></div>
          <div className="adm-kpi-val">{s.totalRegisteredUsers ?? 0}</div>
          <div className="adm-kpi-hint">Unique player accounts</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-top"><span>Currently Online</span><span>🟢</span></div>
          <div className="adm-kpi-val">{s.currentlyOnlineUsers ?? 0}</div>
          <div className="adm-kpi-hint">Active heartbeat (&lt;= 90s)</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-top"><span>Active Users Today</span><span>✨</span></div>
          <div className="adm-kpi-val">{s.totalActiveUsersToday ?? 0}</div>
          <div className="adm-kpi-hint">Unique active players today</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-top"><span>New Registrations Today</span><span>🌱</span></div>
          <div className="adm-kpi-val">{s.newRegistrationsToday ?? 0}</div>
          <div className="adm-kpi-hint">Signed up since UTC midnight</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-top"><span>Total Game Sessions</span><span>🎮</span></div>
          <div className="adm-kpi-val">{s.totalGameSessions ?? 0}</div>
          <div className="adm-kpi-hint">Within selected filter</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-top"><span>Activities Completed</span><span>🌸</span></div>
          <div className="adm-kpi-val">{s.totalActivitiesCompleted ?? 0}</div>
          <div className="adm-kpi-hint">Care, meals, study, play</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-top"><span>Average Player Level</span><span>👑</span></div>
          <div className="adm-kpi-val">Lv.{s.averagePlayerLevel ?? 0}</div>
          <div className="adm-kpi-hint">Across registered accounts</div>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-top"><span>Accumulated Playtime</span><span>⏱️</span></div>
          <div className="adm-kpi-val">{formatDurationSec(s.totalAccumulatedPlaytimeSec ?? 0)}</div>
          <div className="adm-kpi-hint">Tracked active time</div>
        </div>
      </div>

      <div className="adm-charts-grid">
        <div className="adm-card">
          <h3 className="adm-card-title"><span>🌱 User Registration Trends</span></h3>
          <PastelLineChart data={c.registrationTrends} valueKey="count" color="#e8638a" />
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title"><span>🌸 Daily Active Users (DAU)</span></h3>
          <PastelBarChart data={c.dailyActiveUsers} valueKey="count" color="#a87de8" />
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title"><span>📅 Weekly Active Users (WAU)</span></h3>
          <PastelBarChart data={c.weeklyActiveUsers} valueKey="count" color="#5aaad4" />
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title"><span>🎨 Activity Distribution</span></h3>
          <PastelDonutChart data={c.activityDistribution} />
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title"><span>⏱️ Average Playtime Trends (min)</span></h3>
          <PastelLineChart data={c.playtimeTrends} valueKey="avgMinutes" color="#5aaad4" unit="m" />
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title"><span>👑 Player Level Distribution</span></h3>
          <PastelBarChart data={c.levelDistribution} valueKey="count" labelKey="title" color="#c084fc" />
        </div>
      </div>

      <div className="adm-card">
        <h3 className="adm-card-title"><span>✨ Recent Sign-In Activity</span></h3>
        {(!data?.recentLogins || data.recentLogins.length === 0) ? (
          <EmptyChartState icon="💌" message="No login events recorded yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.recentLogins.slice(0, 8).map(ev => (
              <div
                key={ev.eventId}
                className="adm-row-clickable"
                onClick={() => ev.uid && onInspectUser(ev.uid)}
                style={{
                  background: '#fdf8ff',
                  border: '1px solid #f0e0ff',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <span>
                  <strong>{ev.displayName}</strong> ({ev.email}) via <code>{ev.provider}</code>
                </span>
                <span style={{ color: '#8f74a8' }}>{formatDateTime(ev.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function LivePlayersTab({
  liveData,
  loading,
  onRefresh,
  onCleanup,
  onInspectUser,
  autoRefreshSec,
}) {
  const [tickNow, setTickNow] = useState(Date.now());
  const [filterMode, setFilterMode] = useState('all');

  useEffect(() => {
    const id = setInterval(() => setTickNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const allPlayers = liveData?.players ?? [];
  const filtered = filterMode === 'online'
    ? allPlayers.filter(p => p.online)
    : filterMode === 'offline'
      ? allPlayers.filter(p => !p.online)
      : allPlayers;

  return (
    <>
      <div className="adm-section-head">
        <div>
          <h2>🟢 Live Player Monitoring</h2>
          <p className="adm-section-sub">
            Heartbeat cadence ~30s · Inactive cutoff 90s ·{' '}
            {autoRefreshSec > 0 ? `Auto-refreshing every ${autoRefreshSec}s` : 'Auto-refresh paused'}
          </p>
        </div>
        <div className="adm-top-actions">
          <button type="button" className="adm-chip-btn" onClick={onRefresh} disabled={loading}>
            🔄 {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
          <button type="button" className="adm-chip-btn" onClick={onCleanup}>
            🧹 Mark Stale Offline
          </button>
        </div>
      </div>

      <div className="adm-filter-pills">
        <button
          type="button"
          className={`adm-pill ${filterMode === 'all' ? 'adm-pill--active' : ''}`}
          onClick={() => setFilterMode('all')}
        >
          All ({allPlayers.length})
        </button>
        <button
          type="button"
          className={`adm-pill ${filterMode === 'online' ? 'adm-pill--active' : ''}`}
          onClick={() => setFilterMode('online')}
        >
          Online Now ({liveData?.onlineCount ?? 0})
        </button>
        <button
          type="button"
          className={`adm-pill ${filterMode === 'offline' ? 'adm-pill--active' : ''}`}
          onClick={() => setFilterMode('offline')}
        >
          Offline ({Math.max(0, allPlayers.length - (liveData?.onlineCount ?? 0))})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="adm-card">
          <EmptyChartState
            icon="🏡"
            message={filterMode === 'online'
              ? 'No players are actively connected right now. Open the game in another tab or device to see live status here.'
              : 'No player presence records found yet.'}
          />
        </div>
      ) : (
        <div className="adm-live-grid">
          {filtered.map(player => {
            const firstTabStart = player.activeTabs?.[player.activeTabs.length - 1]?.startedAt;
            const liveDurationSec = player.online && firstTabStart
              ? Math.max(0, Math.round((tickNow - Date.parse(firstTabStart)) / 1000))
              : player.currentSessionDurationSec || 0;

            return (
              <div
                key={player.uid}
                className={`adm-player-card ${player.online ? 'adm-player-card--online' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: '0.95rem', color: '#6b4394', display: 'block' }}>
                      {player.displayName}
                    </strong>
                    <span style={{ fontSize: '0.73rem', color: '#8f74a8', wordBreak: 'break-all' }}>
                      {player.email || player.uid}
                    </span>
                  </div>
                  <span className={`adm-status ${player.online ? 'adm-status--online' : 'adm-status--offline'}`}>
                    {player.online && <span className="adm-dot-pulse" aria-hidden="true" />}
                    {player.online ? `Online (${player.activeTabsCount} tab${player.activeTabsCount === 1 ? '' : 's'})` : 'Offline'}
                  </span>
                </div>

                <div className="adm-meta-grid">
                  <div>
                    <span className="adm-meta-label">Current Room</span>
                    <span className="adm-meta-val">{formatRoomLabel(player.currentRoom)}</span>
                  </div>
                  <div>
                    <span className="adm-meta-label">Current Activity</span>
                    <span className="adm-meta-val">{player.online ? player.currentActivityLabel : 'Offline'}</span>
                  </div>
                  <div>
                    <span className="adm-meta-label">Game Level</span>
                    <span className="adm-meta-val">Lv.{player.guardianLevel} ({player.guardianTitle})</span>
                  </div>
                  <div>
                    <span className="adm-meta-label">Session Duration</span>
                    <span className="adm-meta-val">
                      {player.online ? formatDurationSec(liveDurationSec) : '—'}
                    </span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="adm-meta-label">Last Active</span>
                    <span className="adm-meta-val">{formatDateTime(player.lastActiveAt)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="adm-chip-btn adm-chip-btn--primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  onClick={() => onInspectUser(player.uid)}
                >
                  Inspect Player Progress →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function AnalyticsTab({ analyticsData, loading, dateRange, onChangeRange }) {
  const c = analyticsData?.charts ?? {};
  const providers = analyticsData?.providers ?? [];
  const topRooms = analyticsData?.topRooms ?? [];
  const logs = analyticsData?.notificationLogs ?? [];

  return (
    <>
      <div className="adm-section-head">
        <div>
          <h2>📊 Deep Analytics</h2>
          <p className="adm-section-sub">Engagement, sign-in methods, popular rooms, and email notification delivery audit.</p>
        </div>
        <div className="adm-filter-pills">
          {DATE_RANGES.map(r => (
            <button
              key={r.id}
              type="button"
              className={`adm-pill ${dateRange === r.id ? 'adm-pill--active' : ''}`}
              onClick={() => onChangeRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !analyticsData && <div className="adm-card">Loading analytics...</div>}

      <div className="adm-charts-grid">
        <div className="adm-card">
          <h3 className="adm-card-title"><span>⏱️ Daily Playtime Minutes</span></h3>
          <PastelBarChart data={c.playtimeTrends} valueKey="minutes" color="#e8638a" unit="m" />
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title"><span>🔐 Auth Provider Split</span></h3>
          {providers.length === 0 ? (
            <EmptyChartState message="No registered users yet." />
          ) : (
            <PastelDonutChart
              data={providers.map(p => ({
                label: p.provider === 'google.com' ? 'Google OAuth' : 'Email / Password',
                count: p.count,
                pct: Math.round((p.count / Math.max(1, providers.reduce((a, b) => a + b.count, 0))) * 100),
              }))}
            />
          )}
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title"><span>🏡 Most Visited / Active Rooms</span></h3>
          {topRooms.length === 0 ? (
            <EmptyChartState message="No room activity events recorded yet." />
          ) : (
            <PastelBarChart
              data={topRooms.slice(0, 8).map(r => ({ label: r.room, count: r.count }))}
              valueKey="count"
              color="#6aaa6a"
            />
          )}
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title"><span>📬 Recent Owner Notification Emails</span></h3>
          {logs.length === 0 ? (
            <EmptyChartState icon="✉️" message="No notification logs recorded yet." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 10).map(l => (
                    <tr key={l.eventId}>
                      <td>{l.eventType}</td>
                      <td>{l.email}</td>
                      <td>
                        <span className={`adm-tag ${l.status === 'sent' ? 'adm-tag--done' : 'adm-tag--pending'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>{formatDateTime(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function SettingsTab({
  ownerEmail,
  health,
  autoRefreshSec,
  onChangeAutoRefresh,
  onCheckHealth,
}) {
  return (
    <>
      <div className="adm-section-head">
        <div>
          <h2>⚙️ Admin Settings &amp; Security</h2>
          <p className="adm-section-sub">Server diagnostics, Spark-plan compliance, and live polling interval.</p>
        </div>
        <button type="button" className="adm-chip-btn" onClick={onCheckHealth}>
          🩺 Re-check Backend Health
        </button>
      </div>

      <div className="adm-charts-grid">
        <div className="adm-card">
          <h3 className="adm-card-title"><span>🛡️ Owner Authorization &amp; Security</span></h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
            <div><strong>Verified Owner Email:</strong> <code>{ownerEmail}</code></div>
            <div><strong>Firebase Project Plan:</strong> Spark Free Plan (Zero Cloud Functions)</div>
            <div><strong>Backend Service:</strong> Express API (`VITE_API_BASE_URL`)</div>
            <div><strong>Admin Enforcement:</strong> Independent HTTP 401/403 check on every `/api/admin/*` route</div>
            <div><strong>Player Isolation:</strong> UID-scoped Firestore rules + server token UID verification</div>
          </div>
        </div>

        <div className="adm-card">
          <h3 className="adm-card-title"><span>🩺 Backend Health Status</span></h3>
          {health ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
              <div>
                <strong>Service:</strong> {health.service} ({health.status})
              </div>
              <div>
                <strong>Firebase Admin SDK:</strong>{' '}
                <span className={`adm-tag ${health.firebaseAdminReady ? 'adm-tag--done' : 'adm-tag--pending'}`}>
                  {health.firebaseAdminReady ? 'Connected ✓' : 'Not Configured'}
                </span>
              </div>
              <div>
                <strong>Resend Email Notifications:</strong>{' '}
                <span className={`adm-tag ${health.resendConfigured ? 'adm-tag--done' : 'adm-tag--pending'}`}>
                  {health.resendConfigured ? 'Configured ✓' : 'Not Configured'}
                </span>
              </div>
              <div><strong>Last Probe:</strong> {formatDateTime(health.timestamp)}</div>
            </div>
          ) : (
            <div className="adm-banner">
              Backend health could not be fetched yet. Check <code>VITE_API_BASE_URL</code>.
            </div>
          )}
        </div>

        <div className="adm-card">
          <h3 className="adm-card-title"><span>⏱️ Live Monitoring Auto-Refresh Cadence</span></h3>
          <p className="adm-section-sub" style={{ marginBottom: 12 }}>
            Controls how often the Live Players panel polls `/api/admin/live`.
          </p>
          <div className="adm-filter-pills">
            {[
              { sec: 5, label: 'Every 5s' },
              { sec: 10, label: 'Every 10s' },
              { sec: 30, label: 'Every 30s' },
              { sec: 0, label: 'Manual Only' },
            ].map(opt => (
              <button
                key={opt.sec}
                type="button"
                className={`adm-pill ${autoRefreshSec === opt.sec ? 'adm-pill--active' : ''}`}
                onClick={() => onChangeAutoRefresh(opt.sec)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
