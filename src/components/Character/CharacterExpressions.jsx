// CharacterExpressions.jsx
// Chibi anime facial expressions matching girl-reference.jpg
// Coordinates calibrated for viewBox="0 0 180 300" (face centered at cx=90, cy=94)
// Visual order inside <g>: Eyes & Eyelashes -> Eyebrows -> Nose -> Mouth -> Cheek Blush -> Tears -> StateAccessory

const OUTLINE = '#4a3228';
const LASH_COLOR = '#2d1a12';
const BROW_COLOR = '#472e20';

// Helper to render one large sparkling chibi anime eye
function SparklingEye({ cx, cy, irisGradId, scaleY = 1, wide = false, happyLift = false, watery = false }) {
  const rx = wide ? 12.6 : 12.0;
  const ry = wide ? 14.0 : 13.0;
  const irisRx = wide ? 10.2 : 9.8;
  const irisRy = wide ? 12.0 : 11.2;

  return (
    <g style={{ transform: `scaleY(${scaleY})`, transformOrigin: `${cx}px ${cy}px` }}>
      {/* Soft sclera */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" />

      {/* Subtle upper sclera shadow under upper lash */}
      <path
        d={`M ${cx - rx + 1} ${cy - 4} Q ${cx} ${cy - ry - 1} ${cx + rx - 1} ${cy - 4} Q ${cx} ${cy - ry + 5} ${cx - rx + 1} ${cy - 4} Z`}
        fill="#ead8d2"
        opacity="0.7"
      />

      {/* Large warm brown anime iris */}
      <ellipse cx={cx} cy={cy + 0.8} rx={irisRx} ry={irisRy} fill={`url(#${irisGradId})`} />

      {/* Soft lower warm amber-brown glow crescent */}
      <ellipse cx={cx} cy={cy + 6.4} rx={irisRx * 0.68} ry={irisRy * 0.28} fill="#c88454" opacity="0.55" />

      {/* Deep dark pupil */}
      <ellipse cx={cx} cy={cy + 0.5} rx={wide ? 5.2 : 5.0} ry={wide ? 6.1 : 5.8} fill="#231109" />

      {/* Main large crisp white sparkle catchlight */}
      <ellipse cx={cx - 3.8} cy={cy - 4.4} rx="3.4" ry="3.8" fill="#ffffff" opacity="0.97" />

      {/* Secondary sparkle catchlight */}
      <circle cx={cx + 3.8} cy={cy + 4.6} r="1.75" fill="#ffffff" opacity="0.92" />

      {/* Tiny accent glint */}
      <circle cx={cx - 4.8} cy={cy + 3.4} r="1.0" fill="#ffffff" opacity="0.78" />

      {/* Extra star glint for excited state */}
      {wide && (
        <path
          d={`M ${cx + 3.8} ${cy - 5.6} L ${cx + 4.6} ${cy - 3.8} L ${cx + 6.4} ${cy - 3.0} L ${cx + 4.6} ${cy - 2.2} L ${cx + 3.8} ${cy - 0.4} L ${cx + 3.0} ${cy - 2.2} L ${cx + 1.2} ${cy - 3.0} L ${cx + 3.0} ${cy - 3.8} Z`}
          fill="#fff8d6"
          opacity="0.95"
        />
      )}

      {/* Watery shimmer for sad/crying */}
      {watery && (
        <ellipse cx={cx} cy={cy + 9.0} rx={irisRx * 0.85} ry="2.8" fill="#a8d8ff" opacity="0.75" />
      )}

      {/* Delicate outer rim */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={LASH_COLOR} strokeWidth="0.9" opacity="0.2" />

      {/* Lower lid contour */}
      {happyLift ? (
        <path
          d={`M ${cx - rx + 2.5} ${cy + 9.6} Q ${cx} ${cy + 6.4} ${cx + rx - 2.5} ${cy + 9.6}`}
          stroke={LASH_COLOR}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.45"
        />
      ) : (
        <path
          d={`M ${cx - 7.5} ${cy + ry - 0.8} Q ${cx} ${cy + ry + 0.8} ${cx + 7.5} ${cy + ry - 0.8}`}
          stroke={LASH_COLOR}
          strokeWidth="1.0"
          fill="none"
          strokeLinecap="round"
          opacity="0.22"
        />
      )}
    </g>
  );
}

// Helper for natural upper eyelashes hugging the top contour of the eye
function UpperLashes({ cx, cy, isLeft, scaleY = 1, lift = 0 }) {
  const dir = isLeft ? -1 : 1;
  const innerX = cx - 10.6 * dir;
  const outerX = cx + 11.8 * dir;
  const archTopY = cy - 13.8 + lift;
  const cornerY = cy - 4.2 + lift;

  const blinkDrop = (1 - scaleY) * 11;

  return (
    <g transform={`translate(0, ${blinkDrop})`}>
      {/* Smooth thick upper eyelash hugging top of sclera/iris */}
      <path
        d={`M ${innerX} ${cy - 6.8 + lift} Q ${cx} ${archTopY} ${outerX} ${cornerY}`}
        stroke={LASH_COLOR}
        strokeWidth="3.3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Gentle soft outer lash flick */}
      <path
        d={`M ${outerX - 0.6 * dir} ${cornerY} Q ${outerX + 3.2 * dir} ${cornerY - 1.5} ${outerX + 4.0 * dir} ${cornerY - 3.4}`}
        stroke={LASH_COLOR}
        strokeWidth="2.0"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${outerX - 2.2 * dir} ${cornerY - 2.2} Q ${outerX + 1.4 * dir} ${cornerY - 4.0} ${outerX + 2.0 * dir} ${cornerY - 5.4}`}
        stroke={LASH_COLOR}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

// ── 5. EYES AND EYELASHES ────────────────────────────────────────────────────
function Eyes({ state, blinkProgress, irisGradId }) {
  const scaleY = Math.max(0.08, 1 - blinkProgress * 0.92);
  const leftCX = 68;
  const rightCX = 112;
  const eyeCY = 95;

  // Sleeping / Resting — peaceful closed crescent eyes with soft downward lashes
  if (state === 'sleeping' || state === 'resting') {
    return (
      <g className="eyes">
        <path d="M 56 95 Q 68 103 80 95" stroke={LASH_COLOR} strokeWidth="2.9" fill="none" strokeLinecap="round" />
        <path d="M 100 95 Q 112 103 124 95" stroke={LASH_COLOR} strokeWidth="2.9" fill="none" strokeLinecap="round" />
        <path d="M 59 97 L 57 100.5" stroke={LASH_COLOR} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 68 99 L 68 102.5" stroke={LASH_COLOR} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 77 97 L 79 100.5" stroke={LASH_COLOR} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 103 97 L 101 100.5" stroke={LASH_COLOR} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 112 99 L 112 102.5" stroke={LASH_COLOR} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 121 97 L 123 100.5" stroke={LASH_COLOR} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    );
  }

  // Very Happy / Laughing / Celebrating — joyful curved excited eyes (^ ^) with golden sparkles
  if (state === 'veryHappy' || state === 'laughing' || state === 'celebrating') {
    return (
      <g className="eyes">
        <path d="M 56 97 Q 68 83 80 97" stroke={LASH_COLOR} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M 100 97 Q 112 83 124 97" stroke={LASH_COLOR} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M 56 97 Q 52 94 51 91" stroke={LASH_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
        <path d="M 124 97 Q 128 94 129 91" stroke={LASH_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
        <path d="M 53 81 L 54.3 78 L 55.6 81 L 58.6 82.3 L 55.6 83.6 L 54.3 86.6 L 53 83.6 L 50 82.3 Z" fill="#ffd447" />
        <path d="M 125 81 L 126.3 78 L 127.6 81 L 130.6 82.3 L 127.6 83.6 L 126.3 86.6 L 125 83.6 L 122 82.3 Z" fill="#ffd447" />
      </g>
    );
  }

  // Sleepy / Tired — partially closed droopy lids showing lower brown iris & pupil
  if (state === 'sleepy' || state === 'tired') {
    const droopyY = state === 'sleepy' ? 0.56 : 0.68;
    const effectiveScale = Math.min(droopyY, scaleY);
    const lidY = state === 'sleepy' ? 91 : 88;
    return (
      <g className="eyes">
        <SparklingEye cx={leftCX} cy={eyeCY + 1.5} irisGradId={irisGradId} scaleY={effectiveScale} />
        <SparklingEye cx={rightCX} cy={eyeCY + 1.5} irisGradId={irisGradId} scaleY={effectiveScale} />
        <path d={`M 54 80 L 82 80 L 82 ${lidY} Q 68 ${lidY + 2} 54 ${lidY} Z`} fill="#fde5d4" />
        <path d={`M 98 80 L 126 80 L 126 ${lidY} Q 112 ${lidY + 2} 98 ${lidY} Z`} fill="#fde5d4" />
        <path d={`M 55 ${lidY} Q 68 ${lidY + 2.5} 81 ${lidY}`} stroke={LASH_COLOR} strokeWidth="3.0" fill="none" strokeLinecap="round" />
        <path d={`M 99 ${lidY} Q 112 ${lidY + 2.5} 125 ${lidY}`} stroke={LASH_COLOR} strokeWidth="3.0" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  // Happy / Playing / Bathing / Walking / Dancing / Waving / Clapping / Snow / Watering / Toys
  if (
    state === 'happy' || state === 'playing' || state === 'bathing' || state === 'walking'
    || state === 'running' || state === 'jumping' || state === 'dancing' || state === 'waving'
    || state === 'clapping' || state === 'playingToys' || state === 'watering' || state === 'snowEnjoy'
    || state === 'relaxingSofa'
  ) {
    return (
      <g className="eyes">
        <SparklingEye cx={leftCX} cy={eyeCY} irisGradId={irisGradId} scaleY={scaleY * 0.95} happyLift />
        <SparklingEye cx={rightCX} cy={eyeCY} irisGradId={irisGradId} scaleY={scaleY * 0.95} happyLift />
        <UpperLashes cx={leftCX} cy={eyeCY} isLeft={true} scaleY={scaleY * 0.95} />
        <UpperLashes cx={rightCX} cy={eyeCY} isLeft={false} scaleY={scaleY * 0.95} />
      </g>
    );
  }

  // Excited — extra wide sparkling eyes with star highlights
  if (state === 'excited') {
    return (
      <g className="eyes">
        <SparklingEye cx={leftCX} cy={eyeCY} irisGradId={irisGradId} scaleY={scaleY} wide />
        <SparklingEye cx={rightCX} cy={eyeCY} irisGradId={irisGradId} scaleY={scaleY} wide />
        <UpperLashes cx={leftCX} cy={eyeCY} isLeft={true} scaleY={scaleY} lift={-1.0} />
        <UpperLashes cx={rightCX} cy={eyeCY} isLeft={false} scaleY={scaleY} lift={-1.0} />
      </g>
    );
  }

  // Sad / Crying — glistening watery brown eyes
  if (state === 'sad' || state === 'crying') {
    return (
      <g className="eyes">
        <SparklingEye cx={leftCX} cy={eyeCY + 0.5} irisGradId={irisGradId} scaleY={scaleY * 0.92} watery />
        <SparklingEye cx={rightCX} cy={eyeCY + 0.5} irisGradId={irisGradId} scaleY={scaleY * 0.92} watery />
        <UpperLashes cx={leftCX} cy={eyeCY + 0.5} isLeft={true} scaleY={scaleY * 0.92} lift={1} />
        <UpperLashes cx={rightCX} cy={eyeCY + 0.5} isLeft={false} scaleY={scaleY * 0.92} lift={1} />
      </g>
    );
  }

  // Default (idle, talking, hungry, bored, sick, recovering, studying, eating, drinking)
  return (
    <g className="eyes">
      <SparklingEye cx={leftCX} cy={eyeCY} irisGradId={irisGradId} scaleY={scaleY} />
      <SparklingEye cx={rightCX} cy={eyeCY} irisGradId={irisGradId} scaleY={scaleY} />
      <UpperLashes cx={leftCX} cy={eyeCY} isLeft={true} scaleY={scaleY} />
      <UpperLashes cx={rightCX} cy={eyeCY} isLeft={false} scaleY={scaleY} />
    </g>
  );
}

// ── 6. EYEBROWS ──────────────────────────────────────────────────────────────
function Eyebrows({ state }) {
  if (state === 'sad' || state === 'crying' || state === 'sick') {
    return (
      <g className="eyebrows">
        <path d="M 57 77 Q 66 76 76 72.5" stroke={BROW_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
        <path d="M 104 72.5 Q 114 76 123 77" stroke={BROW_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (state === 'excited' || state === 'veryHappy') {
    return (
      <g className="eyebrows">
        <path d="M 58 74 Q 67 69.5 76 73" stroke={BROW_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
        <path d="M 104 73 Q 113 69.5 122 74" stroke={BROW_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (state === 'hungry' || state === 'tired' || state === 'bored' || state === 'recovering') {
    return (
      <g className="eyebrows">
        <path d="M 57 76.5 Q 67 74.5 76 73" stroke={BROW_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
        <path d="M 104 73 Q 113 74.5 123 76.5" stroke={BROW_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (state === 'sleeping' || state === 'resting' || state === 'sleepy') {
    return (
      <g className="eyebrows">
        <path d="M 58 76 Q 67 73.5 76 75.5" stroke={BROW_COLOR} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
        <path d="M 104 75.5 Q 113 73.5 122 76" stroke={BROW_COLOR} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
      </g>
    );
  }

  // Default (idle, happy, talking, studying, etc.) — soft cute curved brows
  return (
    <g className="eyebrows">
      <path d="M 58 76 Q 67 71.5 76 74.5" stroke={BROW_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      <path d="M 104 74.5 Q 113 71.5 122 76" stroke={BROW_COLOR} strokeWidth="2.0" fill="none" strokeLinecap="round" />
    </g>
  );
}

// ── 7. NOSE ──────────────────────────────────────────────────────────────────
function Nose() {
  return (
    <g className="nose">
      <path
        d="M 89 109.5 Q 90 111.2 91 109.5"
        stroke="#c98e73"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.82"
      />
    </g>
  );
}

// ── 8. MOUTH ─────────────────────────────────────────────────────────────────
function Mouth({ state, talkProgress }) {
  if (state === 'sleeping' || state === 'resting') {
    return (
      <path
        d="M 85 120.5 Q 90 123.5 95 120.5"
        stroke="#a85b52"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
    );
  }

  if (state === 'sleepy') {
    return (
      <g className="mouth">
        <ellipse cx="90" cy="122" rx="4.4" ry="5.5" fill="#df7180" stroke={OUTLINE} strokeWidth="1.5" />
        <ellipse cx="90" cy="124.5" rx="2.8" ry="2.1" fill="#f7a3ad" />
      </g>
    );
  }

  if (state === 'talking' || state === 'eating' || state === 'drinking' || state === 'laughing') {
    const openHeight = 2.0 + talkProgress * 6.0;
    const width = 5.5 + talkProgress * 2.5;
    if (talkProgress < 0.2) {
      return (
        <path
          d="M 83.5 120 Q 90 125 96.5 120"
          stroke={OUTLINE}
          strokeWidth="1.9"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    return (
      <g className="mouth">
        <path
          d={`M ${90 - width} 119.5 Q 90 ${119.5 + openHeight * 1.9} ${90 + width} 119.5 Q 90 ${119 - openHeight * 0.15} ${90 - width} 119.5 Z`}
          fill="#df7180"
          stroke={OUTLINE}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <ellipse cx="90" cy={120 + openHeight * 0.6} rx={width * 0.55} ry={Math.max(1, openHeight * 0.3)} fill="#f7a3ad" />
      </g>
    );
  }

  if (state === 'veryHappy' || state === 'excited' || state === 'celebrating') {
    return (
      <g className="mouth">
        <path
          d="M 80 118 Q 90 133.5 100 118 Q 90 119.5 80 118 Z"
          fill="#d96777"
          stroke={OUTLINE}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M 83.5 124 Q 90 128.5 96.5 124 Q 90 121.5 83.5 124 Z" fill="#f7a3ad" />
      </g>
    );
  }

  if (
    state === 'happy' || state === 'playing' || state === 'bathing' || state === 'walking'
    || state === 'running' || state === 'jumping' || state === 'dancing' || state === 'waving'
    || state === 'clapping' || state === 'playingToys' || state === 'watering' || state === 'snowEnjoy'
  ) {
    return (
      <g className="mouth">
        <path
          d="M 82 118.5 Q 90 131 98 118.5 Q 90 119.8 82 118.5 Z"
          fill="#df7180"
          stroke={OUTLINE}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M 85 123.5 Q 90 126.5 95 123.5 Q 90 121.5 85 123.5 Z" fill="#f7a3ad" />
      </g>
    );
  }

  if (state === 'crying') {
    return (
      <g className="mouth">
        <path
          d="M 83 124.5 Q 90 117 97 124.5 Q 90 128 83 124.5 Z"
          fill="#d96c7b"
          stroke={OUTLINE}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  if (state === 'sad') {
    return (
      <path
        d="M 84 124 Q 90 119 96 124"
        stroke={OUTLINE}
        strokeWidth="1.9"
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  if (state === 'hungry') {
    return (
      <path
        d="M 83.5 122 Q 86.8 119.5 90 122 Q 93.2 124.5 96.5 122"
        stroke={OUTLINE}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  if (state === 'sick' || state === 'tired' || state === 'bored') {
    return (
      <path
        d="M 84.5 122 Q 90 120.5 95.5 122"
        stroke={OUTLINE}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  // Idle / Studying / Recovering — gentle adorable smile
  return (
    <path
      d="M 83.5 120 Q 90 125.5 96.5 120"
      stroke={OUTLINE}
      strokeWidth="1.9"
      fill="none"
      strokeLinecap="round"
    />
  );
}

// ── 9. CHEEK BLUSH ───────────────────────────────────────────────────────────
function Cheeks({ state }) {
  const intensity =
    state === 'happy' || state === 'veryHappy' || state === 'excited' || state === 'playing'
      ? 0.62
      : state === 'talking' || state === 'bathing'
      ? 0.52
      : state === 'sad' || state === 'crying'
      ? 0.34
      : state === 'sick'
      ? 0.25
      : 0.46;

  const blushColor = state === 'sick' ? '#f0a6b8' : '#ff94ae';
  const hatchColor = '#e86f8c';

  return (
    <g className="cheeks">
      <ellipse cx="55.5" cy="112" rx="9.5" ry="5.0" fill={blushColor} opacity={intensity} />
      <ellipse cx="124.5" cy="112" rx="9.5" ry="5.0" fill={blushColor} opacity={intensity} />

      <g stroke={hatchColor} strokeWidth="1.0" strokeLinecap="round" opacity={intensity * 0.85}>
        <line x1="51" y1="113.5" x2="53" y2="110" />
        <line x1="54.5" y1="113.5" x2="56.5" y2="110" />
        <line x1="58" y1="113.5" x2="60" y2="110" />

        <line x1="120" y1="113.5" x2="122" y2="110" />
        <line x1="123.5" y1="113.5" x2="125.5" y2="110" />
        <line x1="127" y1="113.5" x2="129" y2="110" />
      </g>
    </g>
  );
}

// ── TEARS ────────────────────────────────────────────────────────────────────
function Tears({ state }) {
  if (state !== 'crying' && state !== 'sad') return null;
  const opacity = state === 'crying' ? 0.92 : 0.45;
  return (
    <g className="tears">
      <ellipse cx="62" cy="106" rx="4.2" ry="2.2" fill="#92d0ff" opacity={opacity} />
      <ellipse cx="118" cy="106" rx="4.2" ry="2.2" fill="#92d0ff" opacity={opacity} />
      {state === 'crying' && (
        <>
          <path d="M 61 107 Q 58 118 60 130" stroke="#7ec4ff" strokeWidth="3.0" fill="none" strokeLinecap="round" opacity="0.88" />
          <path d="M 119 107 Q 122 118 120 130" stroke="#7ec4ff" strokeWidth="3.0" fill="none" strokeLinecap="round" opacity="0.88" />
          <path d="M 60 131 C 57 135, 63 135, 60 131 Z" fill="#92d0ff" />
          <path d="M 120 131 C 117 135, 123 135, 120 131 Z" fill="#92d0ff" />
        </>
      )}
    </g>
  );
}

// ── STATE ACCESSORIES ────────────────────────────────────────────────────────
function StateAccessory({ state }) {
  if (state === 'sleeping') {
    return (
      <g>
        <text x="130" y="64" fontSize="14" opacity="0.9">💤</text>
        <text x="142" y="49" fontSize="10" opacity="0.7" fill="#6b68a8" fontWeight="bold">z</text>
        <text x="150" y="38" fontSize="8" opacity="0.5" fill="#6b68a8" fontWeight="bold">z</text>
      </g>
    );
  }
  if (state === 'hungry') {
    return (
      <g>
        <path d="M 102 186 Q 110 182 118 186" stroke="#f4845f" strokeWidth="2" fill="none" opacity="0.7" strokeDasharray="3,2" />
        <path d="M 104 194 Q 112 190 120 194" stroke="#f4845f" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="3,2" />
      </g>
    );
  }
  if (state === 'studying') {
    return (
      <g>
        <rect x="20" y="182" width="24" height="18" rx="2" fill="#5aaad4" stroke={OUTLINE} strokeWidth="1" />
        <rect x="22" y="183" width="10" height="16" rx="1" fill="#e2f2ff" />
        <rect x="33" y="183" width="9" height="16" rx="1" fill="#c8e6ff" />
        <rect x="132" y="176" width="5" height="20" rx="1.5" fill="#ffd700" stroke={OUTLINE} strokeWidth="0.9" transform="rotate(-18 134 186)" />
      </g>
    );
  }
  if (state === 'eating') {
    return (
      <g>
        <rect x="24" y="178" width="3.5" height="20" rx="1" fill="#c49060" />
        <ellipse cx="42" cy="194" rx="12" ry="7" fill="#ffd8c0" stroke="#f4845f" strokeWidth="1.5" />
        <ellipse cx="42" cy="192" rx="9" ry="4" fill="#f4845f" opacity="0.45" />
      </g>
    );
  }
  if (state === 'drinking') {
    return (
      <g>
        <path d="M 24 176 L 28 196 L 42 196 L 46 176 Z" fill="#c8e6ff" stroke="#5aaad4" strokeWidth="1.5" />
        <ellipse cx="35" cy="176" rx="11" ry="3.5" fill="#90c8f0" />
        <rect x="37" y="168" width="3.2" height="22" rx="1.6" fill="#ffb3cc" />
      </g>
    );
  }
  if (state === 'bathing') {
    return (
      <g>
        <circle cx="28" cy="166" r="6" fill="rgba(255,255,255,0.45)" stroke="#90c8f0" strokeWidth="1.8" />
        <circle cx="42" cy="152" r="4.5" fill="rgba(255,255,255,0.45)" stroke="#90c8f0" strokeWidth="1.6" />
        <circle cx="144" cy="160" r="5" fill="rgba(255,255,255,0.45)" stroke="#90c8f0" strokeWidth="1.8" />
      </g>
    );
  }
  if (state === 'playing') {
    return (
      <g>
        <text x="16" y="166" fontSize="15">⭐</text>
        <text x="142" y="156" fontSize="13">✨</text>
      </g>
    );
  }
  if (state === 'talking') {
    return (
      <g>
        <circle cx="140" cy="88" r="3.2" fill="#ff96b0" opacity="0.75" />
        <circle cx="148" cy="80" r="2.6" fill="#ff96b0" opacity="0.55" />
        <circle cx="154" cy="73" r="2.0" fill="#ff96b0" opacity="0.38" />
      </g>
    );
  }
  if (state === 'sick') {
    return (
      <g>
        <path d="M 130 66 Q 132 60 134 66 Q 134 71 132 71 Q 130 71 130 66" fill="#90c8f0" opacity="0.85" />
      </g>
    );
  }
  if (state === 'reading') {
    return (
      <g>
        <rect x="20" y="182" width="24" height="18" rx="2" fill="#ffb3cc" stroke={OUTLINE} strokeWidth="1" />
        <rect x="22" y="183" width="10" height="16" rx="1" fill="#fff6fa" />
        <rect x="33" y="183" width="9" height="16" rx="1" fill="#ffe6f0" />
      </g>
    );
  }
  if (state === 'drawing') {
    return (
      <g>
        <rect x="130" y="172" width="5" height="22" rx="2" fill="#ff85aa" stroke={OUTLINE} strokeWidth="0.9" transform="rotate(-18 132 183)" />
        <text x="16" y="170" fontSize="14">🎨</text>
      </g>
    );
  }
  if (state === 'watering') {
    return (
      <g>
        <text x="134" y="188" fontSize="17">🚿</text>
        <text x="150" y="198" fontSize="11">💧</text>
      </g>
    );
  }
  if (state === 'celebrating') {
    return (
      <g>
        <text x="14" y="140" fontSize="15">🎉</text>
        <text x="148" y="138" fontSize="15">✨</text>
      </g>
    );
  }
  if (state === 'rainReact') {
    return (
      <g>
        <text x="142" y="144" fontSize="16">☂️</text>
      </g>
    );
  }
  if (state === 'snowEnjoy') {
    return (
      <g>
        <text x="18" y="146" fontSize="14">❄️</text>
        <text x="146" y="146" fontSize="14">❄️</text>
      </g>
    );
  }
  if (state === 'dancing' || state === 'clapping') {
    return (
      <g>
        <text x="16" y="146" fontSize="14">🎵</text>
        <text x="146" y="142" fontSize="14">🎶</text>
      </g>
    );
  }
  if (state === 'playingToys') {
    return (
      <g>
        <text x="16" y="170" fontSize="16">🧸</text>
      </g>
    );
  }
  return null;
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
// Layering order inside face expressions:
//   5. Eyes and eyelashes
//   6. Eyebrows
//   7. Nose
//   8. Mouth
//   9. Cheek blush (+ tears & state cues)
export default function CharacterExpressions({ state, blinkProgress = 0, talkProgress = 0, irisGradId }) {
  return (
    <g className="character-expressions">
      <Eyes state={state} blinkProgress={blinkProgress} irisGradId={irisGradId} />
      <Eyebrows state={state} />
      <Nose />
      <Mouth state={state} talkProgress={talkProgress} />
      <Cheeks state={state} />
      <Tears state={state} />
      <StateAccessory state={state} />
    </g>
  );
}
