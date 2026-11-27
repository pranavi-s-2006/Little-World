import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { GameProvider } from './context/GameContext.jsx';
import Home from './pages/Home/Home.jsx';
import LandingPage from './pages/Landing/LandingPage.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import './styles/global.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? 'Something unexpected happened.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '12px',
          background: 'linear-gradient(160deg, #fff0f7, #f3e8ff)',
          color: '#6b4694', padding: '24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem' }}>🌸</div>
          <h2 style={{ margin: 0 }}>Oops! Her Little World hit a tiny snag</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '9px 20px', borderRadius: '999px', border: 'none',
              background: 'linear-gradient(135deg, #c084fc, #e879a0)',
              color: '#fff', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Reload World ↺
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '10px',
      background: 'linear-gradient(160deg, #fff0f7, #f3e8ff)',
      color: '#7c4dbc', fontWeight: 700,
    }}>
      <div style={{ fontSize: '2.2rem' }}>🌸</div>
      <div>Opening Her Little World...</div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function OwnerRoute({ children }) {
  const { user, isOwner, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOwner) return <Navigate to="/" replace />;
  return children;
}

function ProtectedGame() {
  const { user } = useAuth();
  return (
    <GameProvider key={user.uid} uid={user.uid}>
      <Home />
    </GameProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <ProtectedGame />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <OwnerRoute>
                  <AdminDashboard />
                </OwnerRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
