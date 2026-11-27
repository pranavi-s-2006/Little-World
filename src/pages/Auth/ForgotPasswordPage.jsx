import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSent(false);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <Link to="/login" className="auth-back">← Back to Sign In</Link>
        <div className="auth-header">
          <div style={{ fontSize: '1.8rem' }}>💌</div>
          <h1>Reset Password</h1>
          <p>Enter your email and we’ll send a password reset link.</p>
        </div>

        {!isConfigured && (
          <div className="auth-banner">
            <strong>Firebase Setup Required:</strong> Configure <code>.env</code> to send password reset emails.
          </div>
        )}

        {error && <div className="auth-error" role="alert">{error}</div>}
        {sent && (
          <div className="auth-success" role="status">
            Reset link sent! Please check your inbox (and spam folder).
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reset-email">Email Address</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}
