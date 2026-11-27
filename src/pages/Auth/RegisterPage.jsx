import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { isNotificationEndpointConfigured } from '../../services/notificationService.js';
import './AuthPages.css';

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong ✨'];
  return { score, label: labels[score] };
}

export default function RegisterPage() {
  const { signInWithGoogle, registerWithEmail, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleGoogle() {
    setError('');
    if (!consent) {
      setError('Please review and accept the Privacy & Consent notice before creating an account.');
      return;
    }
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
    if (!consent) {
      setError('Please accept the Privacy & Consent notice to continue.');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail({ displayName, email, password });
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
          <div style={{ fontSize: '1.8rem' }}>🎀</div>
          <h1>Start Your Little World</h1>
          <p>Create your personal account and cloud-saved virtual home.</p>
        </div>

        {!isConfigured && (
          <div className="auth-banner">
            <strong>Firebase Setup Required:</strong> Configure <code>.env</code> with your Firebase keys before registering.
          </div>
        )}

        {error && <div className="auth-error" role="alert">{error}</div>}

        <label className="auth-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
          />
          <span>
            I agree that HER LITTLE WORLD stores my basic profile and isolated cloud game save
            {isNotificationEndpointConfigured()
              ? <> and notifies the owner (<strong>prans0309@gmail.com</strong>) on registration and sign-in events</>
              : null}.
          </span>
        </label>

        <div style={{ height: '12px' }} />

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogle}
          disabled={loading}
        >
          <span>🔵</span>
          <span>{loading ? 'Connecting...' : 'Register with Google'}</span>
        </button>

        <div className="auth-divider">or register with email</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reg-name">Display Name</label>
            <input
              id="reg-name"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your Guardian Name"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
            {password && <span className="auth-strength">Strength: {strength.label}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account 🌸'}
          </button>
        </form>

        <div className="auth-links">
          <span>Already have an account?</span>
          <Link to="/login">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
