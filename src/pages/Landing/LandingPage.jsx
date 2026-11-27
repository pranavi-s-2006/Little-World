import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import './LandingPage.css';

const FEATURES = [
  { icon: '🏡', title: 'Explore a Complete House', desc: 'Move freely through the bedroom, kitchen, bathroom, living room, study, playroom, and blooming garden.' },
  { icon: '💕', title: 'Care for the Little Girl', desc: 'Feed Pranavi warm meals, tuck her into bed, brush teeth, bathe, and watch her real-time animated actions.' },
  { icon: '🎮', title: 'Play Activities & Mini-Games', desc: 'Enjoy Memory Match, Gardening, Cozy Cooking, and Pastel Tile Puzzles with rewards.' },
  { icon: '👗', title: 'Customize Outfits & Rooms', desc: 'Unlock adorable dresses, hairstyles, scrapbook themes, and seasonal room decorations.' },
  { icon: '📷', title: 'Create Memories', desc: 'Preserve special milestones in the Memory Book and read Pranavi’s daily illustrated diary.' },
  { icon: '🌦️', title: 'Experience Weather & Seasons', desc: 'Watch sunny mornings, rainy afternoons, autumn leaves, and winter snowfall driven by the virtual clock.' },
];

export default function LandingPage() {
  const { user, isOwner } = useAuth();
  const [legalModal, setLegalModal] = useState(null); // 'privacy' | 'terms' | 'contact' | null

  return (
    <div className="landing-root">
      {/* Floating decorative sparkles & butterflies */}
      <div className="landing-sparkles" aria-hidden="true">
        {['🦋', '🌸', '✦', '⭐', '🌷', '✨'].map((sym, i) => (
          <motion.span
            key={i}
            className="lp-float-sym"
            style={{ left: `${8 + i * 16}%`, top: `${10 + (i % 3) * 22}%` }}
            animate={{ y: [0, -16, 0], rotate: [-6, 6, -6], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {sym}
          </motion.span>
        ))}
      </div>

      {/* Top Navigation */}
      <header className="lp-nav">
        <div className="lp-logo">
          <span className="lp-logo-flower">✿</span>
          <span className="lp-logo-text">HER LITTLE WORLD</span>
        </div>
        <nav className="lp-nav-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          {user ? (
            <>
              <Link to="/profile" className="lp-nav-pill">Profile</Link>
              {isOwner && <Link to="/admin" className="lp-nav-pill">Owner</Link>}
              <Link to="/game" className="lp-nav-cta">Enter World ✨</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="lp-nav-pill">Sign In</Link>
              <Link to="/register" className="lp-nav-cta">Start Free ✨</Link>
            </>
          )}
        </nav>
      </header>

      {/* A. Hero Section */}
      <section className="lp-hero">
        <motion.div
          className="lp-hero-copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="lp-badge">✿ Cozy Interactive Virtual Life Simulation</div>
          <h1 className="lp-hero-title">Your Little World of Happiness</h1>
          <p className="lp-hero-sub">
            Create memories, explore a cozy home and take care of your little companion.
          </p>
          <div className="lp-hero-actions">
            <Link to={user ? '/game' : '/register'} className="lp-btn lp-btn--primary">
              {user ? 'Open Your Little World ✨' : 'Start Your Little World 🌸'}
            </Link>
            <a href="#about" className="lp-btn lp-btn--secondary">
              Discover the World 🦋
            </a>
          </div>
        </motion.div>

        {/* Illustrated pastel house & garden preview */}
        <motion.div
          className="lp-hero-art"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="lp-house-card">
            <div className="lp-house-sky">
              <span>☀️</span>
              <span>☁️</span>
              <span>🦋</span>
            </div>
            <div className="lp-house-roof" />
            <div className="lp-house-body">
              <div className="lp-house-window">🪟 🌸</div>
              <div className="lp-house-door">🚪 💕</div>
              <div className="lp-house-window">🛏️ ✨</div>
            </div>
            <div className="lp-house-garden">
              <span>🌷</span><span>🌼</span><span>🌻</span><span>🌸</span><span>🌷</span>
            </div>
            <p className="lp-house-caption">Pranavi’s Cozy Pastel Home &amp; Garden</p>
          </div>
        </motion.div>
      </section>

      {/* B. About the Game */}
      <section id="about" className="lp-section lp-about">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">About HER LITTLE WORLD</h2>
          <p className="lp-about-text">
            HER LITTLE WORLD is a gentle, dreamy virtual life simulation where you become Pranavi’s caring guardian.
            Guide her through cozy mornings, delicious homemade meals, creative study sessions, playful afternoons,
            and starry nights—while watching your bond grow into unforgettable memories saved securely to your personal account.
          </p>
        </div>
      </section>

      {/* C. Features */}
      <section id="features" className="lp-section lp-features">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Everything Waiting Inside</h2>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                className="lp-feature-card"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <div className="lp-fc-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* D. How It Works */}
      <section id="how-it-works" className="lp-section lp-how">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">How It Works</h2>
          <div className="lp-steps-grid">
            <div className="lp-step-card">
              <span className="lp-step-num">1</span>
              <h3>Create Your Account</h3>
              <p>Sign in with Google or register with email &amp; password to create your private virtual world.</p>
            </div>
            <div className="lp-step-card">
              <span className="lp-step-num">2</span>
              <h3>Care, Move &amp; Play</h3>
              <p>Drag or walk Pranavi anywhere in her house, cook meals, play mini-games, and celebrate special days.</p>
            </div>
            <div className="lp-step-card">
              <span className="lp-step-num">3</span>
              <h3>Cloud-Saved Forever</h3>
              <p>Every diary page, outfit, garden flower, and memory stays safely synced to your personal account.</p>
            </div>
          </div>
        </div>
      </section>

      {/* E. Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">✿ HER LITTLE WORLD — Made with pastel warmth</div>
        <div className="lp-footer-links">
          <a href="#about">About</a>
          <button type="button" onClick={() => setLegalModal('privacy')}>Privacy Policy</button>
          <button type="button" onClick={() => setLegalModal('terms')}>Terms</button>
          <button type="button" onClick={() => setLegalModal('contact')}>Contact</button>
        </div>
      </footer>

      {/* Privacy / Terms / Contact Modal */}
      <AnimatePresence>
        {legalModal && (
          <motion.div
            className="lp-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLegalModal(null)}
          >
            <motion.div
              className="lp-modal"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={e => e.stopPropagation()}
            >
              {legalModal === 'privacy' && (
                <>
                  <h3>🔒 Privacy Policy &amp; Consent</h3>
                  <ul className="lp-legal-list">
                    <li>Google Authentication is used strictly for basic account identity (name, email, profile photo, UID). We never request or access Gmail inbox contents.</li>
                    <li>Basic profile information and your individual game progress are stored securely in your account.</li>
                    <li>Registration and explicit sign-in events are logged and trigger an owner notification email to <strong>prans0309@gmail.com</strong> for security and community awareness.</li>
                  </ul>
                </>
              )}
              {legalModal === 'terms' && (
                <>
                  <h3>📜 Terms of Use</h3>
                  <p>HER LITTLE WORLD is a cozy personal virtual life simulation. Each user account maintains its own isolated virtual world and cloud save data.</p>
                </>
              )}
              {legalModal === 'contact' && (
                <>
                  <h3>💌 Contact the Owner</h3>
                  <p>Have questions or feedback? Reach out at <a href="mailto:prans0309@gmail.com">prans0309@gmail.com</a>.</p>
                </>
              )}
              <button className="lp-modal-close" onClick={() => setLegalModal(null)}>Close ✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
