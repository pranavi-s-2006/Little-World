// AdminDashboard.jsx — HER LITTLE WORLD Owner Control Center (/admin)
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';
import { db, OWNER_NOTIFICATION_EMAIL } from '../../services/firebaseClient.js';
import { getApiBaseUrl } from '../../services/notificationService.js';
import {
  fetchAdminOverview,
  fetchAdminLive,
  fetchAdminUsers,
  fetchAdminUserProfile,
  fetchAdminActivities,
  fetchAdminAnalytics,
  triggerPresenceCleanup,
  fetchBackendHealth,
} from '../../services/adminApiService.js';
import {
  OverviewTab,
  LivePlayersTab,
  AnalyticsTab,
  SettingsTab,
} from './AdminTabsOverviewLive.jsx';
import {
  UsersDirectoryTab,
  PlayerProgressTab,
  ActivitiesTab,
} from './AdminTabsUsersProgress.jsx';
import './AdminDashboard.css';

const NAV_TABS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'live', label: 'Live Players', icon: '🟢' },
  { id: 'users', label: 'All Users', icon: '👥' },
  { id: 'progress', label: 'Player Progress', icon: '🌟' },
  { id: 'activities', label: 'Activity History', icon: '📝' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const { user, isOwner } = useAuth();
  const apiBaseUrl = getApiBaseUrl();

  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [autoRefreshSec, setAutoRefreshSec] = useState(10);
  const [error, setError] = useState('');

  // Tab data states
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const [userFilters, setUserFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'all',
    sortBy: 'lastActive',
    sortDir: 'desc',
    page: 1,
    limit: 15,
  });
  const [directoryData, setDirectoryData] = useState(null);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  const [selectedUid, setSelectedUid] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [actFilters, setActFilters] = useState({
    uid: '',
    type: 'all',
    status: 'all',
    dateRange: 'all',
    page: 1,
    limit: 25,
  });
  const [activitiesData, setActivitiesData] = useState(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [healthData, setHealthData] = useState(null);

  const loadOverview = useCallback(async () => {
    if (!user || !isOwner || !apiBaseUrl) return;
    setOverviewLoading(true);
    try {
      const json = await fetchAdminOverview(user, dateRange);
      setOverviewData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setOverviewLoading(false);
    }
  }, [user, isOwner, apiBaseUrl, dateRange]);

  const loadLive = useCallback(async () => {
    if (!user || !isOwner || !apiBaseUrl) return;
    setLiveLoading(true);
    try {
      const json = await fetchAdminLive(user);
      setLiveData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLiveLoading(false);
    }
  }, [user, isOwner, apiBaseUrl]);

  const loadUsers = useCallback(async () => {
    if (!user || !isOwner || !apiBaseUrl) return;
    setDirectoryLoading(true);
    try {
      const json = await fetchAdminUsers(user, userFilters);
      setDirectoryData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setDirectoryLoading(false);
    }
  }, [user, isOwner, apiBaseUrl, userFilters]);

  const loadProfile = useCallback(async (uid) => {
    if (!user || !isOwner || !apiBaseUrl || !uid) return;
    setProfileLoading(true);
    try {
      const json = await fetchAdminUserProfile(user, uid);
      setProfileData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }, [user, isOwner, apiBaseUrl]);

  const loadActivities = useCallback(async () => {
    if (!user || !isOwner || !apiBaseUrl) return;
    setActivitiesLoading(true);
    try {
      const json = await fetchAdminActivities(user, actFilters);
      setActivitiesData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setActivitiesLoading(false);
    }
  }, [user, isOwner, apiBaseUrl, actFilters]);

  const loadAnalytics = useCallback(async () => {
    if (!user || !isOwner || !apiBaseUrl) return;
    setAnalyticsLoading(true);
    try {
      const json = await fetchAdminAnalytics(user, dateRange);
      setAnalyticsData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user, isOwner, apiBaseUrl, dateRange]);

  const loadHealth = useCallback(async () => {
    if (!apiBaseUrl) return;
    try {
      const json = await fetchBackendHealth();
      setHealthData(json);
    } catch {}
  }, [apiBaseUrl]);

  // Initial load for owner overview & health
  useEffect(() => {
    if (!isOwner || !user || !apiBaseUrl) return;
    loadOverview();
    loadLive();
    loadHealth();
  }, [isOwner, user, apiBaseUrl, loadOverview, loadLive, loadHealth]);

  // Load tab-specific data cleanly on switch / filter change
  useEffect(() => {
    if (!isOwner || !user || !apiBaseUrl) return;
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'activities') loadActivities();
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'progress' && selectedUid) loadProfile(selectedUid);
  }, [activeTab, isOwner, user, apiBaseUrl, selectedUid, loadUsers, loadActivities, loadAnalytics, loadProfile]);

  // Periodic live monitoring refresh
  useEffect(() => {
    if (!isOwner || !user || !apiBaseUrl || autoRefreshSec <= 0) return;
    if (activeTab !== 'live' && activeTab !== 'overview') return;
    const id = setInterval(() => {
      if (activeTab === 'live') loadLive();
      else loadOverview();
    }, autoRefreshSec * 1000);
    return () => clearInterval(id);
  }, [activeTab, isOwner, user, apiBaseUrl, autoRefreshSec, loadLive, loadOverview]);

  // Optional Firestore real-time signal on playerPresence (owner-protected rule; triggers secure backend refresh)
  useEffect(() => {
    if (!isOwner || !db || !apiBaseUrl) return;
    let firstSnap = true;
    let unsub = null;
    try {
      unsub = onSnapshot(
        collection(db, 'playerPresence'),
        () => {
          if (firstSnap) {
            firstSnap = false;
            return;
          }
          if (activeTab === 'live') loadLive();
        },
        () => {
          // Gracefully ignore if Firestore rules are not yet deployed; polling still updates live view
        }
      );
    } catch {}
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [isOwner, apiBaseUrl, activeTab, loadLive]);

  function inspectPlayer(uid) {
    setSelectedUid(uid);
    setActiveTab('progress');
  }

  async function handleCleanupStale() {
    if (!user || !isOwner || !apiBaseUrl) return;
    try {
      await triggerPresenceCleanup(user);
      loadLive();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!isOwner) {
    return (
      <div className="adm-root" style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="adm-card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>🔒</div>
          <h2 style={{ margin: '0 0 8px', color: '#6b4394' }}>Owner Access Only</h2>
          <p className="adm-section-sub" style={{ marginBottom: 16 }}>
            Only the verified owner account ({OWNER_NOTIFICATION_EMAIL}) can view the HER LITTLE WORLD Admin Dashboard.
          </p>
          <Link to="/" className="adm-chip-btn adm-chip-btn--primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const userSummaryList = overviewData?.users ?? directoryData?.users ?? liveData?.players ?? [];

  return (
    <div className="adm-root">
      <header className="adm-topbar">
        <div className="adm-brand">
          <div className="adm-brand-badge">👑</div>
          <div>
            <h1>HER LITTLE WORLD · Owner Control Center</h1>
            <p>Verified Owner: {user?.email}</p>
          </div>
        </div>
        <div className="adm-top-actions">
          <Link to="/game" className="adm-chip-btn adm-chip-btn--primary">
            🏡 Back to Game
          </Link>
          <Link to="/profile" className="adm-chip-btn">
            👤 Profile
          </Link>
        </div>
      </header>

      <div className="adm-shell">
        <nav className="adm-sidebar" aria-label="Admin Navigation">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`adm-nav-item ${activeTab === tab.id ? 'adm-nav-item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'live' && (liveData?.onlineCount ?? 0) > 0 && (
                <span className="adm-nav-badge">{liveData.onlineCount}</span>
              )}
            </button>
          ))}
        </nav>

        <main className="adm-main">
          {!apiBaseUrl && (
            <div className="adm-banner">
              <strong>Owner notification &amp; backend analytics services are not configured yet.</strong>{' '}
              Configure <code>VITE_API_BASE_URL</code> pointing to your Render backend (e.g.{' '}
              <code>https://little-world-1.onrender.com</code>) to load live presence, user analytics, and activity histories.
              Firebase Authentication and individual Firestore game saves continue working normally on the Firebase Spark free plan.
            </div>
          )}

          {error && <div className="adm-error" role="alert">{error}</div>}

          {activeTab === 'overview' && (
            <OverviewTab
              data={overviewData}
              loading={overviewLoading}
              dateRange={dateRange}
              onChangeRange={setDateRange}
              onInspectUser={inspectPlayer}
            />
          )}

          {activeTab === 'live' && (
            <LivePlayersTab
              liveData={liveData}
              loading={liveLoading}
              onRefresh={loadLive}
              onCleanup={handleCleanupStale}
              onInspectUser={inspectPlayer}
              autoRefreshSec={autoRefreshSec}
            />
          )}

          {activeTab === 'users' && (
            <UsersDirectoryTab
              directory={directoryData}
              loading={directoryLoading}
              filters={userFilters}
              onUpdateFilters={(patch) => setUserFilters(prev => ({ ...prev, ...patch }))}
              onSelectUser={inspectPlayer}
            />
          )}

          {activeTab === 'progress' && (
            <PlayerProgressTab
              selectedUid={selectedUid}
              userList={userSummaryList}
              profile={profileData}
              loading={profileLoading}
              onSelectUid={setSelectedUid}
              onBackToUsers={() => setActiveTab('users')}
            />
          )}

          {activeTab === 'activities' && (
            <ActivitiesTab
              activitiesData={activitiesData}
              loading={activitiesLoading}
              filters={actFilters}
              userList={userSummaryList}
              onUpdateFilters={(patch) => setActFilters(prev => ({ ...prev, ...patch }))}
              onInspectUser={inspectPlayer}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              analyticsData={analyticsData}
              loading={analyticsLoading}
              dateRange={dateRange}
              onChangeRange={setDateRange}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              ownerEmail={OWNER_NOTIFICATION_EMAIL}
              health={healthData}
              autoRefreshSec={autoRefreshSec}
              onChangeAutoRefresh={setAutoRefreshSec}
              onCheckHealth={loadHealth}
            />
          )}
        </main>
      </div>
    </div>
  );
}
