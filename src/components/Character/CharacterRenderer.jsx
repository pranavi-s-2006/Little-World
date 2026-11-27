// CharacterRenderer.jsx
// Chibi anime SVG character matching girl-reference.jpg
// Strict visual layering order:
//   1. Back hair
//   2. Neck and body (legs, shoes, neck, dress, arms)
//   3. Face
//   4. Ears
//   5. Eyes and eyelashes  (inside CharacterExpressions)
//   6. Eyebrows            (inside CharacterExpressions)
//   7. Nose                (inside CharacterExpressions)
//   8. Mouth               (inside CharacterExpressions)
//   9. Cheek blush         (inside CharacterExpressions)
//  10. Front hair and bangs
//  11. Headband

import { useId } from 'react';
import CharacterExpressions from './CharacterExpressions.jsx';
import { OUTFIT_COLORS } from './characterAssets.js';

const OUTLINE = '#4a3228';
const HAIR_MAIN = '#473328';
const HAIR_DARK = '#36241b';
const HAIR_HIGHLIGHT = '#755746';
const SKIN = '#fde5d4';
const SKIN_SHADOW = '#efc4a7';

// Reusable cute ribbon bow
function RibbonBow({ cx, cy, scale = 1, fill, knotFill }) {
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <path d="M 0 0 L -7.5 -4 Q -9.5 0 -7.5 4 Z" fill={fill} stroke={OUTLINE} strokeWidth="1.05" strokeLinejoin="round" />
      <path d="M 0 0 L 7.5 -4 Q 9.5 0 7.5 4 Z" fill={fill} stroke={OUTLINE} strokeWidth="1.05" strokeLinejoin="round" />
      <circle cx="0" cy="0" r="2.2" fill={knotFill} stroke={OUTLINE} strokeWidth="0.95" />
    </g>
  );
}

export default function CharacterRenderer({
  state,
  outfit,
  blinkProgress,
  breatheScale,
  hairSway,
  talkProgress,
  walkPhase = 0,
  actionPhase = 0.5,
  visualAction = null,
}) {
  const uid = useId().replace(/:/g, '');
  const irisGradId = `iris-${uid}`;
  const backHairGradId = `backhair-${uid}`;

  const colors = OUTFIT_COLORS[outfit] ?? OUTFIT_COLORS.casual;
  const pose = visualAction?.pose ?? state;
  const prop = visualAction?.prop ?? null;
  const stageProgress = visualAction?.stageProgress ?? 0;

  const isSleeping = state === 'sleeping' || state === 'resting' || state === 'relaxingSofa' || pose === 'sleeping_bed';
  const isRaisedArms = state === 'playing' || state === 'excited' || state === 'veryHappy'
    || state === 'celebrating' || state === 'jumping' || state === 'snowEnjoy' || state === 'dancing';
  const isWaving = state === 'waving';
  const isClapping = state === 'clapping';
  const isBookOrDraw = state === 'studying' || state === 'reading' || state === 'drawing'
    || pose === 'reading_desk' || pose === 'writing_desk' || pose === 'drawing_easel';

  const walkL = walkPhase * 4;
  const walkR = -walkPhase * 4;
  const osc = (actionPhase - 0.5) * 2; // -1 .. +1

  // Dynamic arm paths driven by visualAction poses & actionPhase
  let leftArmPath = isRaisedArms
    ? 'M 58 160 Q 42 147 39 129'
    : isClapping
    ? 'M 58 162 Q 66 172 78 166'
    : isBookOrDraw
    ? 'M 58 162 Q 47 178 48 191'
    : isSleeping
    ? 'M 58 163 Q 52 180 56 196'
    : `M 58 163 Q ${47 - walkL * 0.4} 181 ${50 - walkL * 0.6} 198`;

  let rightArmPath = isRaisedArms || isWaving
    ? 'M 122 160 Q 138 147 141 129'
    : isClapping
    ? 'M 122 162 Q 114 172 102 166'
    : isBookOrDraw || state === 'watering'
    ? 'M 122 162 Q 133 178 132 191'
    : isSleeping
    ? 'M 122 163 Q 128 180 124 196'
    : `M 122 163 Q ${133 - walkR * 0.4} 181 ${130 - walkR * 0.6} 198`;

  let leftHandX = isRaisedArms ? 38 : isClapping ? 79 : isBookOrDraw ? 48 : isSleeping ? 56 : 50 - walkL * 0.6;
  let leftHandY = isRaisedArms ? 126 : isClapping ? 166 : isBookOrDraw ? 193 : isSleeping ? 198 : 200;
  let rightHandX = isRaisedArms || isWaving ? 142 : isClapping ? 101 : isBookOrDraw || state === 'watering' ? 132 : isSleeping ? 124 : 130 - walkR * 0.6;
  let rightHandY = isRaisedArms || isWaving ? 126 : isClapping ? 166 : isBookOrDraw || state === 'watering' ? 193 : isSleeping ? 198 : 200;

  if (pose === 'chopping') {
    const chopY = 180 + osc * 10;
    leftArmPath = 'M 58 162 Q 52 178 64 188';
    leftHandX = 65; leftHandY = 188;
    rightArmPath = `M 122 162 Q 124 ${chopY - 8} 108 ${chopY}`;
    rightHandX = 108; rightHandY = chopY;
  } else if (pose === 'stirring') {
    const stirX = 112 + Math.cos(actionPhase * Math.PI * 2) * 8;
    const stirY = 178 + Math.sin(actionPhase * Math.PI * 2) * 5;
    leftArmPath = 'M 58 162 Q 56 180 70 186';
    leftHandX = 70; leftHandY = 186;
    rightArmPath = `M 122 162 Q 128 ${stirY - 4} ${stirX} ${stirY}`;
    rightHandX = stirX; rightHandY = stirY;
  } else if (pose === 'serving') {
    leftArmPath = 'M 58 162 Q 56 178 72 178';
    rightArmPath = 'M 122 162 Q 124 178 108 178';
    leftHandX = 72; leftHandY = 178;
    rightHandX = 108; rightHandY = 178;
  } else if (pose === 'eating_utensil') {
    const lift = actionPhase; // 0 (plate) -> 1 (mouth)
    const sx = 120 - lift * 24;
    const sy = 186 - lift * 56;
    leftArmPath = 'M 58 162 Q 58 182 70 190';
    leftHandX = 70; leftHandY = 190;
    rightArmPath = `M 122 162 Q 134 ${sy + 10} ${sx} ${sy}`;
    rightHandX = sx; rightHandY = sy;
  } else if (pose === 'drinking_glass') {
    const lift = Math.sin(stageProgress * Math.PI); // smoothly raises, sips, lowers
    const gx = 122 - lift * 24;
    const gy = 184 - lift * 58;
    rightArmPath = `M 122 162 Q 135 ${gy + 12} ${gx} ${gy}`;
    rightHandX = gx; rightHandY = gy;
  } else if (pose === 'brushing_teeth') {
    const bx = 94 + osc * 8;
    rightArmPath = `M 122 162 Q 132 140 ${bx} 124`;
    rightHandX = bx; rightHandY = 124;
  } else if (pose === 'rinsing' || pose === 'skincare_pat') {
    const ry = 132 + osc * 5;
    leftArmPath = `M 58 162 Q 52 146 72 ${ry}`;
    rightArmPath = `M 122 162 Q 128 146 108 ${ry}`;
    leftHandX = 72; leftHandY = ry;
    rightHandX = 108; rightHandY = ry;
  } else if (pose === 'combing_hair') {
    const cy = 68 + actionPhase * 70;
    rightArmPath = `M 122 162 Q 146 ${cy + 14} 134 ${cy}`;
    rightHandX = 134; rightHandY = cy;
  } else if (pose === 'writing_desk' || pose === 'drawing_easel') {
    const wx = 124 + osc * 9;
    const wy = pose === 'drawing_easel' ? 162 + osc * 8 : 186;
    rightArmPath = `M 122 162 Q 134 174 ${wx} ${wy}`;
    rightHandX = wx; rightHandY = wy;
  } else if (pose === 'playing_toy') {
    const ty = 172 + osc * 8;
    leftArmPath = `M 58 162 Q 56 ${ty} 76 ${ty}`;
    rightArmPath = `M 122 162 Q 124 ${ty} 104 ${ty}`;
    leftHandX = 76; leftHandY = ty;
    rightHandX = 104; rightHandY = ty;
  } else if (pose === 'watering_can') {
    const tiltY = 182 + osc * 4;
    rightArmPath = `M 122 162 Q 138 170 140 ${tiltY}`;
    rightHandX = 140; rightHandY = tiltY;
  } else if (pose === 'towel_dry') {
    const tx = 90 + osc * 10;
    leftArmPath = `M 58 162 Q 60 144 ${tx - 16} 132`;
    rightArmPath = `M 122 162 Q 120 144 ${tx + 16} 132`;
    leftHandX = tx - 16; leftHandY = 132;
    rightHandX = tx + 16; rightHandY = 132;
  }

  return (
    <svg
      viewBox="0 0 180 300"
      className="character-svg"
      aria-label={`Pranavi — ${state}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Warm sparkling brown anime iris gradient matching girl-reference.jpg */}
        <linearGradient id={irisGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c160b" />
          <stop offset="48%" stopColor="#5c301a" />
          <stop offset="82%" stopColor="#915432" />
          <stop offset="100%" stopColor="#b57247" />
        </linearGradient>

        {/* Soft gradient for long flowing dark brown back hair */}
        <linearGradient id={backHairGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={HAIR_MAIN} />
          <stop offset="70%" stopColor={HAIR_MAIN} />
          <stop offset="100%" stopColor={HAIR_DARK} />
        </linearGradient>
      </defs>

      {/* ══════════════════════════════════════════════════════════════
          1. BACK HAIR — Long flowing dark brown hair behind body & face
      ══════════════════════════════════════════════════════════════ */}
      <g style={{ transform: `rotate(${hairSway}deg)`, transformOrigin: '90px 58px' }}>
        <path
          d="M 32 78
             C 29 34, 54 14, 90 14
             C 126 14, 151 34, 148 78
             C 155 114, 163 158, 166 196
             C 168 212, 159 227, 148 234
             C 146 222, 142 216, 138 229
             C 131 221, 126 213, 120 221
             L 112 204 L 68 204 L 60 221
             C 54 213, 49 221, 42 229
             C 38 216, 34 222, 32 234
             C 21 227, 12 212, 14 196
             C 17 158, 25 114, 32 78 Z"
          fill={`url(#${backHairGradId})`}
          stroke={OUTLINE}
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <path
          d="M 46 122 Q 90 136 134 122 L 138 205 Q 90 213 42 205 Z"
          fill={HAIR_DARK}
          opacity="0.55"
        />
        <path d="M 33 120 Q 25 168 30 218" stroke={HAIR_DARK} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65" />
        <path d="M 41 132 Q 35 176 40 217" stroke={HAIR_HIGHLIGHT} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4" />
        <path d="M 147 120 Q 155 168 150 218" stroke={HAIR_DARK} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65" />
        <path d="M 139 132 Q 145 176 140 217" stroke={HAIR_HIGHLIGHT} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4" />
      </g>

      {/* ══════════════════════════════════════════════════════════════
          2. NECK AND BODY — Legs, shoes, neck, puff-sleeve dress, arms
      ══════════════════════════════════════════════════════════════ */}
      {!isSleeping ? (
        <g>
          <path
            d={`M 77 224 L ${76 + walkL * 0.35} ${266 + Math.min(0, walkL * 0.4)}`}
            stroke={OUTLINE}
            strokeWidth="13.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M 77 224 L ${76 + walkL * 0.35} ${266 + Math.min(0, walkL * 0.4)}`}
            stroke={SKIN}
            strokeWidth="10.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M 103 224 L ${104 + walkR * 0.35} ${266 + Math.min(0, walkR * 0.4)}`}
            stroke={OUTLINE}
            strokeWidth="13.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M 103 224 L ${104 + walkR * 0.35} ${266 + Math.min(0, walkR * 0.4)}`}
            stroke={SKIN}
            strokeWidth="10.2"
            fill="none"
            strokeLinecap="round"
          />

          <path
            d={`M ${70.5 + walkL * 0.35} ${258 + Math.min(0, walkL * 0.4)} Q ${76 + walkL * 0.35} ${260.5 + Math.min(0, walkL * 0.4)} ${81.5 + walkL * 0.35} ${258 + Math.min(0, walkL * 0.4)}`}
            stroke={colors.headband}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${98.5 + walkR * 0.35} ${258 + Math.min(0, walkR * 0.4)} Q ${104 + walkR * 0.35} ${260.5 + Math.min(0, walkR * 0.4)} ${109.5 + walkR * 0.35} ${258 + Math.min(0, walkR * 0.4)}`}
            stroke={colors.headband}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />

          <g transform={`translate(${walkL * 0.35}, ${Math.min(0, walkL * 0.4)})`}>
            <ellipse cx="73" cy="272" rx="11.5" ry="7.2" fill={colors.shoe} stroke={OUTLINE} strokeWidth="1.6" />
            <ellipse cx="70" cy="270" rx="4.5" ry="2" fill="#ffffff" opacity="0.35" />
            <RibbonBow cx={72} cy={268.5} scale={0.58} fill={colors.trim} knotFill={colors.secondary} />
          </g>

          <g transform={`translate(${walkR * 0.35}, ${Math.min(0, walkR * 0.4)})`}>
            <ellipse cx="107" cy="272" rx="11.5" ry="7.2" fill={colors.shoe} stroke={OUTLINE} strokeWidth="1.6" />
            <ellipse cx="104" cy="270" rx="4.5" ry="2" fill="#ffffff" opacity="0.35" />
            <RibbonBow cx={108} cy={268.5} scale={0.58} fill={colors.trim} knotFill={colors.secondary} />
          </g>
        </g>
      ) : (
        <g>
          <path d="M 76 226 Q 66 238 58 244" stroke={OUTLINE} strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M 76 226 Q 66 238 58 244" stroke={SKIN} strokeWidth="9.8" fill="none" strokeLinecap="round" />
          <path d="M 104 226 Q 114 238 122 244" stroke={OUTLINE} strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M 104 226 Q 114 238 122 244" stroke={SKIN} strokeWidth="9.8" fill="none" strokeLinecap="round" />
          <ellipse cx="56" cy="246" rx="9" ry="5.5" fill={colors.shoe} stroke={OUTLINE} strokeWidth="1.4" transform="rotate(-18 56 246)" />
          <ellipse cx="124" cy="246" rx="9" ry="5.5" fill={colors.shoe} stroke={OUTLINE} strokeWidth="1.4" transform="rotate(18 124 246)" />
        </g>
      )}

      {/* Neck */}
      <rect x="82" y="137" width="16" height="16" rx="6" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" />
      <path d="M 83 139 Q 90 146 97 139 L 97 137 L 83 137 Z" fill={SKIN_SHADOW} opacity="0.7" />

      {/* Arms & hands */}
      <g>
        <path d={leftArmPath} stroke={OUTLINE} strokeWidth="12.5" fill="none" strokeLinecap="round" />
        <path d={leftArmPath} stroke={SKIN} strokeWidth="9.4" fill="none" strokeLinecap="round" />
        <path d={rightArmPath} stroke={OUTLINE} strokeWidth="12.5" fill="none" strokeLinecap="round" />
        <path d={rightArmPath} stroke={SKIN} strokeWidth="9.4" fill="none" strokeLinecap="round" />

        <ellipse cx={leftHandX} cy={leftHandY} rx="6.8" ry="6.2" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" />
        <ellipse cx={rightHandX} cy={rightHandY} rx="6.8" ry="6.2" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" />
      </g>

      {/* Pastel-blue Puff-Sleeve Dress (gentle breathing on torso) */}
      <g style={{ transform: `scaleY(${breatheScale})`, transformOrigin: '90px 175px' }}>
        <path
          d="M 69 177 Q 90 182 111 177 L 138 225 Q 114 236 90 236 Q 66 236 42 225 Z"
          fill={colors.primary}
          stroke={OUTLINE}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M 77 182 Q 70 208 65 232" stroke={colors.secondary} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M 90 183 L 90 235" stroke={colors.secondary} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55" />
        <path d="M 103 182 Q 110 208 115 232" stroke={colors.secondary} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M 46 223 Q 90 234 134 223" stroke={colors.trim} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.6" />

        <path
          d="M 65 148 Q 76 145 82 147 Q 90 152 98 147 Q 104 145 115 148 L 111 178 Q 90 183 69 178 Z"
          fill={colors.primary}
          stroke={OUTLINE}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M 68 149 Q 90 156.5 112 149"
          stroke={colors.secondary}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.75"
        />

        <ellipse cx="59" cy="158" rx="11.5" ry="10.2" fill={colors.primary} stroke={OUTLINE} strokeWidth="1.7" />
        <ellipse cx="121" cy="158" rx="11.5" ry="10.2" fill={colors.primary} stroke={OUTLINE} strokeWidth="1.7" />
        <path d="M 52 163 Q 59 167 66 163" stroke={colors.secondary} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M 114 163 Q 121 167 128 163" stroke={colors.secondary} strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* Cute chest & waist ribbon bows */}
        <RibbonBow cx={90} cy={155.5} scale={0.8} fill={colors.trim} knotFill={colors.secondary} />
        <path d="M 70 177.5 Q 90 182.5 110 177.5" stroke={colors.secondary} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.85" />
        <RibbonBow cx={90} cy={179} scale={0.95} fill={colors.trim} knotFill={colors.secondary} />
      </g>

      {/* ══════════════════════════════════════════════════════════════
          3. FACE — Soft rounded chibi anime head (chubby cheeks, cute chin)
      ══════════════════════════════════════════════════════════════ */}
      <g className="character-head">
        <path
          d="M 44 88
             C 43 58, 61 46, 90 46
             C 119 46, 137 58, 136 88
             C 137 118, 123 139, 90 141
             C 57 139, 43 118, 44 88 Z"
          fill={SKIN}
          stroke={OUTLINE}
          strokeWidth="1.85"
          strokeLinejoin="round"
        />
        {/* Soft forehead shadow beneath bangs */}
        <path
          d="M 50 71 Q 90 61 130 71 Q 127 50 90 47 Q 53 50 50 71 Z"
          fill={SKIN_SHADOW}
          opacity="0.3"
        />
        <ellipse cx="90" cy="128" rx="18" ry="5.5" fill="#ffffff" opacity="0.18" />

        {/* ════════════════════════════════════════════════════════════
            4. EARS
        ════════════════════════════════════════════════════════════ */}
        <g className="ears">
          <path d="M 44 91 C 36 90, 35 105, 44 107" fill={SKIN} stroke={OUTLINE} strokeWidth="1.65" strokeLinecap="round" />
          <path d="M 42 95.5 Q 39 99 42.5 102.5" stroke="#df9f88" strokeWidth="1.25" fill="none" strokeLinecap="round" />

          <path d="M 136 91 C 144 90, 145 105, 136 107" fill={SKIN} stroke={OUTLINE} strokeWidth="1.65" strokeLinecap="round" />
          <path d="M 138 95.5 Q 141 99 137.5 102.5" stroke="#df9f88" strokeWidth="1.25" fill="none" strokeLinecap="round" />
        </g>

        {/* ════════════════════════════════════════════════════════════
            5-9. EYES, EYEBROWS, NOSE, MOUTH, CHEEK BLUSH (+ TEARS/ACCESSORIES)
        ════════════════════════════════════════════════════════════ */}
        <CharacterExpressions
          state={state}
          blinkProgress={blinkProgress}
          talkProgress={talkProgress}
          irisGradId={irisGradId}
        />

        {/* ════════════════════════════════════════════════════════════
            10. FRONT HAIR AND BANGS — Soft rounded anime bangs framing
                the forehead above eyebrows (y <= 69) + side framing locks
                outside the cheeks (x < 45 and x > 135).
        ════════════════════════════════════════════════════════════ */}
        <g style={{ transform: `rotate(${hairSway * 0.25}deg)`, transformOrigin: '90px 44px' }}>
          {/* Side face-framing hime locks */}
          <path
            d="M 36 67 C 30 96, 33 128, 41 155 C 46 135, 45 105, 45 76 Z"
            fill={HAIR_MAIN}
            stroke={OUTLINE}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          <path
            d="M 144 67 C 150 96, 147 128, 139 155 C 134 135, 135 105, 135 76 Z"
            fill={HAIR_MAIN}
            stroke={OUTLINE}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />

          {/* Soft rounded layered anime bangs ending cleanly above eyebrows */}
          <path
            d="M 35 75
               C 35 34, 58 20, 90 20
               C 122 20, 145 34, 145 75
               C 140 65, 134 60, 128 67
               C 124 62, 120 56, 117 53
               C 115 62, 110 66, 104 68
               C 100 61, 97 54, 95 51
               C 93 61, 90 67, 86 70
               C 81 64, 78 56, 76 52
               C 73 61, 68 67, 61 68
               C 57 62, 54 56, 52 53
               C 49 61, 44 66, 35 75 Z"
            fill={HAIR_MAIN}
            stroke={OUTLINE}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />

          {/* Subtle soft strand folds */}
          <path d="M 52 53 Q 53 60 56 64" stroke={HAIR_DARK} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M 76 52 Q 77 60 80 65" stroke={HAIR_DARK} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M 95 51 Q 96 59 99 64" stroke={HAIR_DARK} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M 117 53 Q 118 60 121 64" stroke={HAIR_DARK} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />

          {/* Glossy anime hair highlights */}
          <path
            d="M 53 43 Q 66 37 78 40"
            stroke={HAIR_HIGHLIGHT}
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path
            d="M 86 39 Q 94 37 102 39"
            stroke={HAIR_HIGHLIGHT}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M 109 40 Q 119 39 128 45"
            stroke={HAIR_HIGHLIGHT}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>

        {/* ════════════════════════════════════════════════════════════
            11. HEADBAND — Light blue curved headband on top of hair
        ════════════════════════════════════════════════════════════ */}
        <g className="headband">
          <path
            d="M 35 77
               C 38 38, 61 21, 90 21
               C 119 21, 142 38, 145 77
               L 139 80
               C 136 45, 116 30, 90 30
               C 64 30, 44 45, 41 80 Z"
            fill={colors.headband}
            stroke={OUTLINE}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M 55 36 Q 74 25 95 26"
            stroke="#ffffff"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx="103" cy="27" r="1.4" fill="#ffffff" opacity="0.55" />
        </g>
      </g>

      {/* ════════════════════════════════════════════════════════════
          12. LIVE INTERACTIVE ACTION PROPS (attached to hands/table/body)
      ════════════════════════════════════════════════════════════ */}
      <ActionPropsLayer
        prop={prop}
        actionPhase={actionPhase}
        stageProgress={stageProgress}
        leftHandX={leftHandX}
        leftHandY={leftHandY}
        rightHandX={rightHandX}
        rightHandY={rightHandY}
      />
    </svg>
  );
}

function ActionPropsLayer({ prop, actionPhase, stageProgress, leftHandX, leftHandY, rightHandX, rightHandY }) {
  if (!prop) return null;
  const osc = (actionPhase - 0.5) * 2;

  switch (prop) {
    case 'chopping_board':
      return (
        <g className="action-prop">
          <rect x="64" y="196" width="52" height="10" rx="4" fill="#e6b88a" stroke={OUTLINE} strokeWidth="1.2" />
          <circle cx="78" cy="195" r="4" fill="#ff7043" />
          <circle cx="88" cy="195" r="3.5" fill="#78d47e" />
          <circle cx="98" cy="195" r="3.5" fill="#ffd700" />
          {/* Moving knife in right hand */}
          <g transform={`translate(${rightHandX - 4}, ${rightHandY - 2}) rotate(${osc * 18})`}>
            <rect x="-14" y="-3" width="14" height="5" rx="1.5" fill="#dce7f2" stroke={OUTLINE} strokeWidth="1" />
            <rect x="0" y="-2" width="8" height="3.5" rx="1" fill="#8b5a3c" />
          </g>
        </g>
      );

    case 'cooking_pan':
      return (
        <g className="action-prop">
          <ellipse cx="90" cy="197" rx="22" ry="6.5" fill="#555b6e" stroke={OUTLINE} strokeWidth="1.2" />
          <rect x="110" y="195" width="16" height="4" rx="2" fill="#3a3f4f" />
          <circle cx="84" cy="195" r="3" fill="#ff8a65" />
          <circle cx="94" cy="194" r="3" fill="#ffd54f" />
          {/* Stirring spoon in right hand */}
          <line x1={rightHandX} y1={rightHandY} x2="90" y2="195" stroke="#c49060" strokeWidth="3.2" strokeLinecap="round" />
          {/* Rising steam puffs */}
          <circle cx={82 + osc * 3} cy={180 - actionPhase * 12} r="4" fill="rgba(255,255,255,0.7)" />
          <circle cx={96 - osc * 3} cy={174 - actionPhase * 14} r="5" fill="rgba(255,255,255,0.55)" />
        </g>
      );

    case 'plated_meal':
      return (
        <g className="action-prop">
          <ellipse cx="90" cy="184" rx="20" ry="6" fill="#ffffff" stroke="#ffb3cc" strokeWidth="1.5" />
          <ellipse cx="90" cy="182" rx="12" ry="4" fill="#ff9e80" />
          <text x="84" y="176" fontSize="10">✨</text>
        </g>
      );

    case 'spoon_plate': {
      const portionScale = Math.max(0.25, 1 - stageProgress * 0.8);
      return (
        <g className="action-prop">
          <ellipse cx="86" cy="198" rx="20" ry="6.5" fill="#ffffff" stroke="#f4845f" strokeWidth="1.4" />
          <ellipse cx="86" cy="196" rx={13 * portionScale} ry={4.5 * portionScale} fill="#ffb74d" />
          {/* Spoon moving with right hand toward mouth */}
          <g transform={`translate(${rightHandX}, ${rightHandY}) rotate(${-20 - actionPhase * 25})`}>
            <line x1="0" y1="0" x2="-12" y2="-8" stroke="#b0bec5" strokeWidth="2.4" strokeLinecap="round" />
            <ellipse cx="-14" cy="-9" rx="4" ry="2.6" fill="#cfd8dc" stroke={OUTLINE} strokeWidth="0.8" />
          </g>
        </g>
      );
    }

    case 'empty_plate':
      return (
        <g className="action-prop">
          <ellipse cx="86" cy="198" rx="18" ry="5.5" fill="#ffffff" stroke="#98e6b8" strokeWidth="1.5" />
          <text x="80" y="190" fontSize="11">✨</text>
        </g>
      );

    case 'water_glass': {
      const waterFill = Math.max(0.15, 1 - stageProgress * 0.8);
      const tilt = Math.sin(stageProgress * Math.PI) * -28;
      return (
        <g transform={`translate(${rightHandX}, ${rightHandY}) rotate(${tilt})`}>
          <path d="M -6 -10 L -4.5 8 L 4.5 8 L 6 -10 Z" fill="rgba(220, 242, 255, 0.85)" stroke="#5aaad4" strokeWidth="1.4" />
          <rect x="-4" y={8 - 14 * waterFill} width="8" height={14 * waterFill} rx="1.5" fill="#7ec8f2" opacity="0.85" />
        </g>
      );
    }

    case 'toothbrush_foam':
      return (
        <g className="action-prop">
          {/* Toothbrush attached to right hand */}
          <g transform={`translate(${rightHandX}, ${rightHandY}) rotate(-10)`}>
            <rect x="-14" y="-2" width="18" height="3.2" rx="1.5" fill="#ff85aa" stroke={OUTLINE} strokeWidth="0.8" />
            <rect x="-16" y="-4.5" width="5" height="3.5" rx="1" fill="#ffffff" stroke="#90c8f0" strokeWidth="0.8" />
          </g>
          {/* Animated foam bubbles around smile */}
          <circle cx={84 + osc * 2} cy="121" r="3.2" fill="#ffffff" opacity="0.9" />
          <circle cx={91 - osc * 2} cy="123" r="3.8" fill="#ffffff" opacity="0.92" />
          <circle cx={96 + osc * 1.5} cy="120" r="2.8" fill="#e8f7ff" opacity="0.88" />
        </g>
      );

    case 'water_splash':
      return (
        <g className="action-prop">
          <circle cx={leftHandX} cy={leftHandY - 6 - actionPhase * 6} r="3.2" fill="#90c8f0" opacity="0.85" />
          <circle cx={rightHandX} cy={rightHandY - 4 - actionPhase * 8} r="3.5" fill="#b3e0ff" opacity="0.85" />
          <circle cx="90" cy={128 + osc * 4} r="2.8" fill="#90c8f0" opacity="0.75" />
        </g>
      );

    case 'shower_bubbles':
      return (
        <g className="action-prop">
          {/* Modest pastel soap bubbles around lower body + falling water droplets */}
          <ellipse cx="90" cy="204" rx="34" ry="12" fill="rgba(255,255,255,0.88)" stroke="#a8d8f0" strokeWidth="1.4" />
          <circle cx="64" cy={196 - actionPhase * 10} r="7" fill="rgba(255,255,255,0.82)" stroke="#a8d8f0" strokeWidth="1.2" />
          <circle cx="114" cy={194 - (1 - actionPhase) * 10} r="6.5" fill="rgba(255,255,255,0.82)" stroke="#a8d8f0" strokeWidth="1.2" />
          <line x1="65" y1={18 + actionPhase * 22} x2="65" y2={26 + actionPhase * 22} stroke="#7ec8f2" strokeWidth="2" strokeLinecap="round" />
          <line x1="90" y1={12 + (1 - actionPhase) * 24} x2="90" y2={20 + (1 - actionPhase) * 24} stroke="#7ec8f2" strokeWidth="2" strokeLinecap="round" />
          <line x1="115" y1={20 + actionPhase * 20} x2="115" y2={28 + actionPhase * 20} stroke="#7ec8f2" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    case 'fluffy_towel':
      return (
        <g className="action-prop">
          <rect x={leftHandX - 4} y={leftHandY - 6} width="46" height="16" rx="6" fill="#ffd6e7" stroke="#ffb3cc" strokeWidth="1.4" />
        </g>
      );

    case 'hair_comb':
      return (
        <g transform={`translate(${rightHandX}, ${rightHandY}) rotate(20)`}>
          <rect x="-4" y="-8" width="6" height="18" rx="2" fill="#c9a8ff" stroke={OUTLINE} strokeWidth="0.9" />
          <line x1="-7" y1="-5" x2="-4" y2="-5" stroke={OUTLINE} strokeWidth="1" />
          <line x1="-7" y1="0" x2="-4" y2="0" stroke={OUTLINE} strokeWidth="1" />
          <line x1="-7" y1="5" x2="-4" y2="5" stroke={OUTLINE} strokeWidth="1" />
        </g>
      );

    case 'skincare_puff':
      return (
        <g className="action-prop">
          <circle cx={rightHandX} cy={rightHandY} r="5.5" fill="#fff0f7" stroke="#ffb3cc" strokeWidth="1.2" />
          <text x="50" y="106" fontSize="10">✨</text>
          <text x="122" y="106" fontSize="10">✨</text>
        </g>
      );

    case 'cozy_blanket':
      return (
        <g className="action-prop">
          <path
            d="M 50 184 Q 90 176 130 184 L 136 248 Q 90 256 44 248 Z"
            fill="#d9c0ff"
            stroke="#a87de8"
            strokeWidth="1.6"
            opacity="0.94"
          />
          <text x="82" y="216" fontSize="13" opacity="0.85">✦</text>
        </g>
      );

    case 'open_book':
      return (
        <g className="action-prop">
          <path d="M 62 184 L 90 188 L 90 206 L 62 202 Z" fill="#fff9f0" stroke="#c084fc" strokeWidth="1.3" />
          <path d="M 118 184 L 90 188 L 90 206 L 118 202 Z" fill="#fff3fa" stroke="#c084fc" strokeWidth="1.3" />
          {/* Animated turning page */}
          <path
            d={`M 90 188 Q ${90 + osc * 16} 178 ${90 + osc * 22} 198 L 90 206 Z`}
            fill="#ffffff"
            stroke="#d9b3f7"
            strokeWidth="1"
          />
        </g>
      );

    case 'pencil_notebook':
      return (
        <g className="action-prop">
          <rect x="66" y="188" width="44" height="18" rx="3" fill="#fff9f0" stroke="#90c8f0" strokeWidth="1.4" />
          <line x1="72" y1="194" x2="104" y2="194" stroke="#b3d9f5" strokeWidth="1" />
          <line x1="72" y1="199" x2="98" y2="199" stroke="#b3d9f5" strokeWidth="1" />
          <g transform={`translate(${rightHandX}, ${rightHandY}) rotate(-28)`}>
            <rect x="-2" y="-14" width="4" height="16" rx="1" fill="#ffd700" stroke={OUTLINE} strokeWidth="0.9" />
          </g>
        </g>
      );

    case 'teddy_toy':
      return (
        <g transform={`translate(90, ${176 + osc * 7})`}>
          <circle cx="-8" cy="-10" r="4" fill="#c49060" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="8" cy="-10" r="4" fill="#c49060" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="0" cy="-4" r="9" fill="#d9a878" stroke={OUTLINE} strokeWidth="1.1" />
          <ellipse cx="0" cy="8" rx="10" ry="9" fill="#d9a878" stroke={OUTLINE} strokeWidth="1.1" />
          <circle cx="-3" cy="-5" r="1.2" fill={OUTLINE} />
          <circle cx="3" cy="-5" r="1.2" fill={OUTLINE} />
          <ellipse cx="0" cy="-2" rx="2.4" ry="1.6" fill="#fff0e0" />
        </g>
      );

    case 'paintbrush_palette':
      return (
        <g className="action-prop">
          <ellipse cx={leftHandX} cy={leftHandY - 2} rx="12" ry="8" fill="#ffe4b5" stroke={OUTLINE} strokeWidth="1.1" />
          <circle cx={leftHandX - 4} cy={leftHandY - 4} r="2.2" fill="#ff85aa" />
          <circle cx={leftHandX + 3} cy={leftHandY - 4} r="2.2" fill="#90c8f0" />
          <circle cx={leftHandX} cy={leftHandY + 2} r="2.2" fill="#ffd700" />
          <g transform={`translate(${rightHandX}, ${rightHandY}) rotate(-25)`}>
            <rect x="-1.5" y="-16" width="3" height="16" rx="1" fill="#8b5a3c" />
            <ellipse cx="0" cy="-18" rx="2.5" ry="3.5" fill="#ff85aa" />
          </g>
        </g>
      );

    case 'watering_can_drops':
      return (
        <g className="action-prop">
          <g transform={`translate(${rightHandX - 4}, ${rightHandY}) rotate(22)`}>
            <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#90c8f0" stroke={OUTLINE} strokeWidth="1.1" />
            <path d="M 8 -2 L 20 -8 L 20 -4 L 8 3 Z" fill="#90c8f0" stroke={OUTLINE} strokeWidth="1" />
          </g>
          <circle cx={rightHandX + 20} cy={rightHandY + 2 + actionPhase * 18} r="2.2" fill="#7ec8f2" />
          <circle cx={rightHandX + 25} cy={rightHandY + 6 + (1 - actionPhase) * 18} r="2" fill="#b3e0ff" />
        </g>
      );

    case 'music_notes':
      return (
        <g className="action-prop">
          <text x={22 + osc * 4} y={136 - actionPhase * 12} fontSize="14">🎵</text>
          <text x={144 - osc * 4} y={132 - (1 - actionPhase) * 12} fontSize="14">🎶</text>
        </g>
      );

    default:
      return null;
  }
}
