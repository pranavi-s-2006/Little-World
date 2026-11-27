import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiBaseUrl } from '../../services/notificationService.js';
import '../Auth/AuthPages.css';

export default function AdminDashboard() {
  const { user, isOwner } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = getApiBaseUrl();
  const adminEndpoint = apiBaseUrl ? `${apiBaseUrl}/api/admin/overview` : '';

  useEffect(() => {
    if (!isOwner || !user || !adminEndpoint) return;
    let active = true;
    setLoading(true);
    setError('');

    async function loadDashboard() {
      try {
        const token = await user.getIdToken();
        const res = await fetch(adminEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        if (active) setData(json);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, [user, isOwner, adminEndpoint]);

  if (!isOwner) {
    return (
      <div className="auth-root">
        <div className="auth-card">
          <h1>🔒 Owner Access Only</h1>
          <p>You do not have permission to view this page.</p>
          <Link to="/" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root" style={{ alignItems: 'flex-start', paddingTop: 32 }}>
      <div className="auth-card" style={{ maxWidth: 860 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <Link to="/game" className="auth-back">← Back to Game</Link>
            <h1 style={{ margin: '4px 0', color: '#6b4394' }}>👑 Owner Dashboard</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#8f74a8' }}>
              Verified Owner: {user?.email}
            </p>
          </div>
          {data && (
            <div style={{ background: '#f8f0ff', border: '1.5px solid #e2c8ff', borderRadius: 16, padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c4dbc' }}>{data.totalUsers}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8f74a8' }}>Total Registered Users</div>
            </div>
          )}
        </div>

        {!adminEndpoint && (
          <div className="auth-banner" style={{ marginTop: 16 }}>
            <strong>Owner notification &amp; backend analytics services are not configured yet.</strong>{' '}
            Your Firebase Authentication and individual Firestore game saves work normally on the Firebase Spark free plan. Configure <code>VITE_API_BASE_URL</code> pointing to your Render backend to enable owner notifications and dashboard analytics.
          </div>
        )}

        {adminEndpoint && loading && <p style={{ marginTop: 18 }}>Loading owner analytics...</p>}
        {adminEndpoint && error && <div className="auth-banner" style={{ marginTop: 16 }}>{error}</div>}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}>
            <section>
              <h3 style={{ color: '#e8638a', margin: '0 0 8px' }}>🎀 Registered Users</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1.5px solid #f0e0ff', color: '#7c4dbc' }}>
                      <th style={{ padding: 6 }}>Name</th>
                      <th style={{ padding: 6 }}>Email</th>
                      <th style={{ padding: 6 }}>Provider</th>
                      <th style={{ padding: 6 }}>Registered</th>
                      <th style={{ padding: 6 }}>Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.users ?? []).map(u => (
                      <tr key={u.uid} style={{ borderBottom: '1px solid #f8f0ff' }}>
                        <td style={{ padding: 6 }}>{u.displayName}</td>
                        <td style={{ padding: 6 }}>{u.email}</td>
                        <td style={{ padding: 6 }}>{u.provider}</td>
                        <td style={{ padding: 6 }}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}</td>
                        <td style={{ padding: 6 }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 style={{ color: '#7c4dbc', margin: '0 0 8px' }}>✨ Recent Logins</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                {(data.recentLogins ?? []).slice(0, 12).map(ev => (
                  <div key={ev.eventId} style={{ background: '#fdf8ff', border: '1px solid #f0e0ff', borderRadius: 10, padding: '6px 10px' }}>
                    <strong>{ev.displayName}</strong> ({ev.email}) via <code>{ev.provider}</code> — {new Date(ev.timestamp).toLocaleString()}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
