import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../Auth/AuthPages.css';

export default function ProfilePage() {
  const { user, userProfile, isOwner, resendVerification, logout } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');

  async function handleResend() {
    try {
      await resendVerification();
      setMsg('Verification email sent! Please check your inbox.');
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <Link to="/game" className="auth-back">← Back to Game</Link>
        <div className="auth-header">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile'}
              style={{ width: 68, height: 68, borderRadius: '50%', border: '2px solid #f4c8e8', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ fontSize: '2.5rem' }}>🌸</div>
          )}
          <h1>{user?.displayName || userProfile?.displayName || 'Little Guardian'}</h1>
          <p>{user?.email}</p>
        </div>

        {msg && <div className="auth-success">{msg}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', color: '#5a4272', marginBottom: '18px' }}>
          <div><strong>Firebase UID:</strong> <code>{user?.uid}</code></div>
          <div><strong>Provider:</strong> {userProfile?.provider || user?.providerData?.[0]?.providerId || 'email'}</div>
          <div>
            <strong>Email Status:</strong>{' '}
            {user?.emailVerified ? '✅ Verified' : '⚠️ Not yet verified'}
            {!user?.emailVerified && (
              <button
                type="button"
                onClick={handleResend}
                style={{ marginLeft: 8, background: 'none', border: 'none', color: '#7c4dbc', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Resend Verification
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/game" className="auth-submit" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Enter Her Little World ✨
          </Link>
          {isOwner && (
            <Link to="/admin" className="auth-google-btn" style={{ textDecoration: 'none' }}>
              👑 Owner Dashboard (/admin)
            </Link>
          )}
          <button type="button" className="auth-google-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
