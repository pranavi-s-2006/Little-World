// CatCompanion.jsx
// White cat companion from the reference image — cute, sits near Pranavi

import { motion } from 'framer-motion';

export default function CatCompanion({ visible = true, position = 'sitting', scale = 1 }) {
  if (!visible) return null;

  // Animation variants
  const bodyVariants = {
    sitting:   { y: [0, -2, 0], transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
    sleeping:  { rotate: [0, 1, 0], transition: { duration: 4, repeat: Infinity } },
    playing:   { y: [0, -6, 0], transition: { duration: 1.2, repeat: Infinity } },
    walking:   { x: [-3, 3, -3], transition: { duration: 1.5, repeat: Infinity } },
  };

  const tailVariant = {
    sitting:  { rotate: [-8, 8, -8], transition: { duration: 2, repeat: Infinity } },
    sleeping: { rotate: [-2, 2, -2], transition: { duration: 5, repeat: Infinity } },
    playing:  { rotate: [-15, 15, -15], transition: { duration: 0.6, repeat: Infinity } },
    walking:  { rotate: [-10, 10, -10], transition: { duration: 0.8, repeat: Infinity } },
  };

  const isSleeping = position === 'sleeping';

  return (
    <motion.div
      className="cat-companion"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'bottom center',
      }}
      animate={bodyVariants[position] ?? bodyVariants.sitting}
      initial={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4 }}
    >
      <svg
        viewBox="0 0 60 50"
        style={{ width: '60px', height: '50px', overflow: 'visible' }}
        aria-label="Cat companion"
      >
        {/* Tail */}
        <motion.g
          animate={tailVariant[position] ?? tailVariant.sitting}
          style={{ transformOrigin: '45px 32px' }}
        >
          <path
            d="M45 32 Q55 25 58 18"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M45 32 Q55 25 58 18"
            stroke="#f0f0f0"
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Body */}
        <ellipse cx="30" cy="32" rx="18" ry="13" fill="white"/>
        <ellipse cx="30" cy="31" rx="17" ry="12" fill="#fafafa"/>
        
        {/* Body shadow */}
        <ellipse cx="30" cy="38" rx="16" ry="4" fill="#000" opacity="0.08"/>

        {/* Back legs */}
        <ellipse cx="20" cy="38" rx="4.5" ry="7" fill="white"/>
        <ellipse cx="40" cy="38" rx="4.5" ry="7" fill="white"/>

        {/* Front legs */}
        <ellipse cx="24" cy="40" rx="3.5" ry="6" fill="white"/>
        <ellipse cx="36" cy="40" rx="3.5" ry="6" fill="white"/>
        
        {/* Paws */}
        <ellipse cx="24" cy="44" rx="4" ry="2.5" fill="#f0f0f0"/>
        <ellipse cx="36" cy="44" rx="4" ry="2.5" fill="#f0f0f0"/>

        {/* Head */}
        <circle cx="30" cy="20" r="12" fill="white"/>
        <circle cx="30" cy="19.5" r="11" fill="#fafafa"/>

        {/* Ears */}
        <path d="M20 12 L18 5 L24 14 Z" fill="white"/>
        <path d="M40 12 L42 5 L36 14 Z" fill="white"/>
        <path d="M21 12 L20 7 L24 13 Z" fill="#ffe0e8" opacity="0.5"/>
        <path d="M39 12 L40 7 L36 13 Z" fill="#ffe0e8" opacity="0.5"/>

        {/* Eyes */}
        {isSleeping ? (
          <>
            {/* Sleeping — closed eyes */}
            <path d="M24 19 Q27 22 30 19" stroke="#2a2a2a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <path d="M36 19 Q33 22 30 19" stroke="#2a2a2a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          </>
        ) : (
          <>
            {/* Open eyes */}
            <ellipse cx="25" cy="19" rx="2.5" ry="3.5" fill="#2a2a2a"/>
            <ellipse cx="35" cy="19" rx="2.5" ry="3.5" fill="#2a2a2a"/>
            {/* Eye shine */}
            <ellipse cx="26" cy="18" rx="1" ry="1.5" fill="white" opacity="0.8"/>
            <ellipse cx="36" cy="18" rx="1" ry="1.5" fill="white" opacity="0.8"/>
          </>
        )}

        {/* Nose */}
        <path d="M30 23 L28 25 L30 26 L32 25 Z" fill="#ff9bb5"/>

        {/* Mouth */}
        <path d="M30 26 Q28 28 26 27" stroke="#2a2a2a" strokeWidth="1" fill="none" strokeLinecap="round"/>
        <path d="M30 26 Q32 28 34 27" stroke="#2a2a2a" strokeWidth="1" fill="none" strokeLinecap="round"/>

        {/* Whiskers */}
        <line x1="13" y1="22" x2="20" y2="21" stroke="#d0d0d0" strokeWidth="0.8"/>
        <line x1="13" y1="24" x2="20" y2="24" stroke="#d0d0d0" strokeWidth="0.8"/>
        <line x1="47" y1="22" x2="40" y2="21" stroke="#d0d0d0" strokeWidth="0.8"/>
        <line x1="47" y1="24" x2="40" y2="24" stroke="#d0d0d0" strokeWidth="0.8"/>

        {/* Collar (optional) */}
        <ellipse cx="30" cy="27" rx="6" ry="2" fill="#ff9bb5" opacity="0.7"/>
        <circle cx="30" cy="27" r="1.5" fill="#ffd700"/>
      </svg>
    </motion.div>
  );
}
