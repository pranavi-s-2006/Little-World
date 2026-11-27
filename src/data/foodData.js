// foodData.js — complete food catalogue with categories, effects and prep times

export const FOOD_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];

export const FOOD_DATA = [
  // ── BREAKFAST ──────────────────────────────────────────────────────────
  { id:'pancakes',   name:'Pancakes',       emoji:'🥞', category:'breakfast', hunger:-35, happiness:18, health:3,  energy:12, prepTime:8,  desc:'Fluffy golden pancakes with maple syrup~' },
  { id:'bread',      name:'Bread & Butter', emoji:'🍞', category:'breakfast', hunger:-20, happiness:8,  health:2,  energy:8,  prepTime:2,  desc:'Soft bread with creamy butter' },
  { id:'idli',       name:'Idli',           emoji:'🫓', category:'breakfast', hunger:-28, happiness:12, health:8,  energy:10, prepTime:5,  desc:'Soft steamed rice cakes with chutney' },
  { id:'dosa',       name:'Dosa',           emoji:'🫔', category:'breakfast', hunger:-30, happiness:15, health:6,  energy:12, prepTime:7,  desc:'Crispy golden dosa with sambar' },
  { id:'cereal',     name:'Cereal',         emoji:'🥣', category:'breakfast', hunger:-22, happiness:10, health:5,  energy:10, prepTime:1,  desc:'Crunchy cereal with cold milk' },
  { id:'fruits',     name:'Fruit Bowl',     emoji:'🍓', category:'breakfast', hunger:-18, happiness:14, health:12, energy:8,  prepTime:3,  desc:'Fresh seasonal fruits — so healthy!' },
  { id:'eggs',       name:'Scrambled Eggs', emoji:'🍳', category:'breakfast', hunger:-25, happiness:10, health:8,  energy:10, prepTime:5,  desc:'Fluffy scrambled eggs with toast' },

  // ── LUNCH ──────────────────────────────────────────────────────────────
  { id:'rice',       name:'Rice',           emoji:'🍚', category:'lunch',     hunger:-35, happiness:10, health:5,  energy:12, prepTime:10, desc:'Steamed white rice — a classic!' },
  { id:'vegcurry',   name:'Veg Curry',      emoji:'🍛', category:'lunch',     hunger:-32, happiness:14, health:10, energy:10, prepTime:12, desc:'Colourful vegetable curry with spices' },
  { id:'chapati',    name:'Chapati',        emoji:'🫓', category:'lunch',     hunger:-28, happiness:12, health:6,  energy:10, prepTime:8,  desc:'Soft whole wheat chapati' },
  { id:'dal',        name:'Dal',            emoji:'🍲', category:'lunch',     hunger:-30, happiness:10, health:12, energy:8,  prepTime:10, desc:'Warm comforting lentil dal' },
  { id:'salad',      name:'Salad',          emoji:'🥗', category:'lunch',     hunger:-18, happiness:8,  health:15, energy:6,  prepTime:4,  desc:'Fresh garden salad with dressing' },
  { id:'sandwich',   name:'Sandwich',       emoji:'🥪', category:'lunch',     hunger:-25, happiness:12, health:5,  energy:8,  prepTime:3,  desc:'Yummy veggie sandwich' },

  // ── DINNER ─────────────────────────────────────────────────────────────
  { id:'soup',       name:'Soup',           emoji:'🍜', category:'dinner',    hunger:-30, happiness:14, health:10, energy:8,  prepTime:8,  desc:'Warm comforting soup for the evening' },
  { id:'pasta',      name:'Pasta',          emoji:'🍝', category:'dinner',    hunger:-35, happiness:18, health:4,  energy:12, prepTime:12, desc:'Creamy pasta with herbs' },
  { id:'ricemeal',   name:'Rice Meal',      emoji:'🍱', category:'dinner',    hunger:-38, happiness:12, health:8,  energy:12, prepTime:10, desc:'Complete rice meal with sides' },
  { id:'chapati2',   name:'Chapati & Veg',  emoji:'🫓', category:'dinner',    hunger:-32, happiness:12, health:8,  energy:10, prepTime:10, desc:'Chapati with mixed vegetables' },

  // ── SNACKS ─────────────────────────────────────────────────────────────
  { id:'cookies',    name:'Cookies',        emoji:'🍪', category:'snack',     hunger:-12, happiness:18, health:-2, energy:8,  prepTime:0,  desc:'Sweet homemade cookies~' },
  { id:'cake',       name:'Cake',           emoji:'🎂', category:'snack',     hunger:-15, happiness:22, health:-3, energy:10, prepTime:0,  desc:'Delicious slice of cake!' },
  { id:'icecream',   name:'Ice Cream',      emoji:'🍦', category:'snack',     hunger:-10, happiness:25, health:-2, energy:8,  prepTime:0,  desc:'Cool and creamy ice cream~' },
  { id:'popcorn',    name:'Popcorn',        emoji:'🍿', category:'snack',     hunger:-10, happiness:15, health:0,  energy:6,  prepTime:2,  desc:'Buttery popcorn for movie time!' },
  { id:'yogurt',     name:'Yogurt',         emoji:'🥛', category:'snack',     hunger:-14, happiness:10, health:8,  energy:6,  prepTime:0,  desc:'Creamy yogurt with honey' },

  // ── DRINKS ─────────────────────────────────────────────────────────────
  { id:'water',      name:'Water',          emoji:'💧', category:'drink',     hunger:-5,  happiness:5,  health:8,  energy:4,  prepTime:0,  desc:'Fresh cool water', isDrink:true },
  { id:'milk',       name:'Milk',           emoji:'🥛', category:'drink',     hunger:-12, happiness:10, health:10, energy:6,  prepTime:0,  desc:'Warm or cold milk~', isDrink:true },
  { id:'juice',      name:'Fresh Juice',    emoji:'🧃', category:'drink',     hunger:-8,  happiness:14, health:8,  energy:8,  prepTime:3,  desc:'Freshly squeezed fruit juice', isDrink:true },
  { id:'smoothie',   name:'Smoothie',       emoji:'🥤', category:'drink',     hunger:-14, happiness:16, health:12, energy:10, prepTime:4,  desc:'Fruity smoothie packed with goodness', isDrink:true },
];

export function getFoodById(id) {
  return FOOD_DATA.find(f => f.id === id);
}

export function getFoodByCategory(cat) {
  return FOOD_DATA.filter(f => f.category === cat);
}
