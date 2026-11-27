import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { isNotificationEndpointConfigured } from '../../services/notificationService.js';
import './AuthPages.css';

export default function LoginPage() {
  const { signInWithGoogle, loginWithEmail, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/game');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail({ email, password });
      navigate('/game');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <Link to="/" className="auth-back">← Back to Home</Link>
        <div className="auth-header">
          <div style={{ fontSize: '1.8rem' }}>🌸</div>
          <h1>Welcome Back!</h1>
          <p>Sign in to continue caring for Pranavi in your Little World.</p>
        </div>

        {!isConfigured && (
          <div className="auth-banner">
            <strong>Firebase Setup Required:</strong> Add your <code>VITE_FIREBASE_*</code> keys in <code>.env</code> (see <code>.env.example</code>) to enable real Google and Email/Password login.
          </div>
        )}

        {error && <div className="auth-error" role="alert">{error}</div>}

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogle}
          disabled={loading}
        >
          <span>🔵</span>
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <div className="auth-divider">or sign in with email</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In ✨'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create a new account →</Link>
        </div>

        <p className="auth-privacy-note">
          Google Authentication is used only for basic account identity (never Gmail inbox access)
          {isNotificationEndpointConfigured()
            ? '; login events notify the owner for account safety.'
            : ', and your game progress is saved privately to your account.'}
        </p>
      </div>
    </div>
  );
}
