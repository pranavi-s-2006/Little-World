// Contextual dialogue for Pranavi — Phase 5 Emotional & Relationship-Aware

export const DIALOGUES = {
  // ── Time of day ──────────────────────────────────────────────────────────
  morning: [
    "Good morning! ☀️ I slept so well last night!",
    "Rise and shine~ Today is going to be wonderful!",
    "Good morning! What shall we do today?",
    "The morning light looks so pretty today~",
    "I love mornings! Everything feels so fresh and new.",
  ],
  afternoon: [
    "The afternoon sun feels so warm and cozy!",
    "I wonder what we should do this afternoon?",
    "It's such a beautiful day outside!",
    "Afternoon already? Time really flies~",
  ],
  evening: [
    "The sunset looks so pretty today...",
    "Evening already? Time flies when I'm with you!",
    "I love this golden hour light~",
    "Let's have a cozy evening together!",
    "The sky looks like cotton candy right now 🌸",
  ],
  night: [
    "The stars are so beautiful tonight...",
    "It's getting late. I should probably rest soon.",
    "I love how peaceful the night feels~",
    "The moon is so bright tonight...",
    "I'm getting a little sleepy. Will you tuck me in?",
  ],

  // ── Needs-based ──────────────────────────────────────────────────────────
  hungry: [
    "My tummy is rumbling... can we eat something? 🍽️",
    "Can we go to the kitchen? I'd love something yummy!",
    "Food would be really nice right now~",
  ],
  veryHungry: [
    "I'm really hungry now! Please feed me! 😢",
    "My stomach is growling so loudly...",
    "Please... can we have something to eat?",
  ],
  tired: [
    "I'm feeling a little sleepy...",
    "Maybe a short rest would help?",
    "My eyes are getting heavy~",
  ],
  sleepy: [
    "I can barely keep my eyes open... 😴",
    "I'm so sleepy... can we go to bed?",
    "Everything is getting blurry... I need rest.",
  ],
  sad: [
    "I'm feeling a little lonely today...",
    "Could you spend some time with me? 💜",
    "I feel a little blue today. Will you cheer me up?",
    "I just need a hug right now...",
  ],
  sick: [
    "I don't feel very well... 🤒",
    "I think I need some rest and care...",
    "Could you take care of me? I'm not feeling well.",
  ],
  recovering: [
    "I'm starting to feel a little better~",
    "Thank you for taking care of me 💕",
  ],
  dirty: [
    "I think I need a bath...",
    "A nice warm bath sounds wonderful right now~",
  ],
  bored: [
    "I'm a little bored... what should we do?",
    "Can we do something fun together?",
  ],

  // ── Positive states ──────────────────────────────────────────────────────
  happy: [
    "I'm so happy right now! 💕",
    "Today has been such a wonderful day!",
    "I love spending time with you!",
    "This is exactly what happiness feels like~",
  ],
  veryHappy: [
    "This is the BEST day ever! 🌟",
    "You make me so happy! Thank you!",
    "Everything is perfect! I love our little world!",
  ],
  excited: [
    "Oh my goodness, I'm so excited! ✨",
    "Today is such a special day~",
  ],

  // ── Activities ───────────────────────────────────────────────────────────
  playing: [
    "That was so much fun! Let's do it again sometime! 🎮",
    "Yay! I love playing together!",
    "I'm having the best time right now!",
  ],
  eating: [
    "Mmm, this is delicious! Thank you~ 😋",
    "Yummy! My favourite!",
    "You always know what I like~",
  ],
  drinking: [
    "Ahh, that's refreshing! 💧",
    "Thank you for the drink~",
  ],
  studying: [
    "I'm happy you helped me today. 📚",
    "Learning new things with you feels exciting!",
    "I finished another page!",
  ],
  bathing: [
    "Ahh, a warm bath feels so nice~ 🛁",
    "I feel so fresh and clean!",
  ],
  sleeping: [
    "Zzz... sweet dreams... 💤",
    "Zzz... dreaming of flowers...",
  ],
  resting: [
    "Mmm, this rest feels so good~",
    "Resting is so peaceful...",
  ],
  talking: [
    "I love talking with you! 💬",
    "Tell me more! I love listening~",
    "I feel so much better when we talk!",
  ],
  walking: [
    "I love exploring our little house~",
  ],

  // ── Relationship-tier lines ──────────────────────────────────────────────
  bondLow: [
    "Can we spend a little time together?",
    "I'm glad you came to visit me today~",
    "What should we try doing together?",
  ],
  bondGrowing: [
    "I really like spending time with you! 💕",
    "Every day feels warmer when you're around~",
    "I look forward to our moments together!",
  ],
  bondHigh: [
    "You always make my days special! 💖",
    "I feel so safe and happy whenever you're with me!",
    "Our little world is my favorite place because of you~",
  ],

  // ── Room flavor lines ────────────────────────────────────────────────────
  room_bedroom:  ["My bedroom feels so cozy and warm~", "I love looking out my bedroom window!"],
  room_kitchen:  ["The kitchen smells so comforting!", "Shall we bake or cook something yummy? 🍳"],
  room_garden:   ["Look how peaceful the flowers are today~ 🌸", "I love listening to the breeze in the garden!"],
  room_study:    ["My desk is all neat and ready for learning! 📖"],
  room_playroom: ["Look at all my cozy games and plushies! 🧸"],
  room_living:   ["Sitting together in the living room is so relaxing~ 🛋️"],
  room_diary:    ["I wrote down all our real moments in my diary~ 📖"],
  room_memories: ["I treasure every single page in our Memory Book! 📷"],
  room_bond:     ["Look how much our bond has grown~ 💕"],

  // ── Recent activity reflection ───────────────────────────────────────────
  after_played:  ["That was so much fun! Let's do it again sometime! 🎮"],
  after_studied: ["I'm happy you helped me today. Studying felt much easier! 📚"],
  after_event:   ["I think I'll remember today for a long time! 🌟"],
  after_ate:     ["That meal made me feel so warm and full~ 🍽️"],
  after_planted: ["I can't wait to watch our new flower sprout! 🌱"],

  // ── Idle fallback ────────────────────────────────────────────────────────
  idle: [
    "What should we do today?",
    "I wonder what's outside the window~",
    "Do you want to talk for a bit?",
    "I'm so glad you're here with me.",
  ],
};

function pickNonRepeating(candidates, recentLines = []) {
  const pool = candidates.filter(Boolean);
  if (pool.length === 0) return DIALOGUES.idle[0];
  const fresh = pool.filter(line => !recentLines.includes(line));
  const finalPool = fresh.length > 0 ? fresh : pool;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

export function getDialogue(key) {
  const lines = DIALOGUES[key] ?? DIALOGUES.idle;
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getContextualDialogue({
  characterState = 'idle',
  timeOfDay = 'morning',
  room = 'bedroom',
  guardianLevel = 1,
  recentActivities = [],
  memories = [],
  recentLines = [],
  forceIdle = false,
} = {}) {
  // Urgent need or active activity takes priority unless cycling idle lines
  const urgentStates = ['sleeping', 'crying', 'sad', 'sick', 'veryHungry', 'hungry', 'sleepy', 'dirty', 'playing', 'studying', 'eating', 'drinking', 'bathing', 'talking', 'resting'];
  if (!forceIdle && urgentStates.includes(characterState)) {
    return pickNonRepeating(DIALOGUES[characterState] ?? DIALOGUES.idle, recentLines);
  }

  const pool = [];

  // 1. Relationship tier lines
  if (guardianLevel >= 4) pool.push(...DIALOGUES.bondHigh);
  else if (guardianLevel >= 2) pool.push(...DIALOGUES.bondGrowing);
  else pool.push(...DIALOGUES.bondLow);

  // 2. Recent activity reflections (last activity from today)
  const latest = recentActivities[recentActivities.length - 1];
  if (latest) {
    if (latest.type === 'played')  pool.push(...DIALOGUES.after_played);
    if (latest.type === 'studied') pool.push(...DIALOGUES.after_studied);
    if (latest.type === 'event')   pool.push(...DIALOGUES.after_event);
    if (latest.type === 'ate')     pool.push(...DIALOGUES.after_ate);
    if (latest.type === 'planted') pool.push(...DIALOGUES.after_planted);
  }

  // 3. Memory callback (when memories exist)
  if (memories.length > 0) {
    const mem = memories[Math.floor(Math.random() * Math.min(4, memories.length))];
    if (mem?.title) {
      pool.push(`I still smile thinking about "${mem.title}"~ 💕`);
    }
  }

  // 4. Current room & time of day
  if (DIALOGUES[`room_${room}`]) pool.push(...DIALOGUES[`room_${room}`]);
  if (DIALOGUES[timeOfDay])      pool.push(...DIALOGUES[timeOfDay]);
  if (characterState === 'happy' || characterState === 'veryHappy') {
    pool.push(...(DIALOGUES[characterState] ?? []));
  }

  return pickNonRepeating(pool, recentLines);
}
