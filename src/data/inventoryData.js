// inventoryData.js — starting inventory quantities

export const INITIAL_INVENTORY = {
  // Food
  pancakes: 3, bread: 5, idli: 4, dosa: 3, cereal: 5, fruits: 6, eggs: 6,
  rice: 8, vegcurry: 4, chapati: 6, dal: 4, salad: 5, sandwich: 5,
  soup: 4, pasta: 3, ricemeal: 4, chapati2: 4,
  cookies: 6, cake: 2, icecream: 3, popcorn: 4, yogurt: 4,
  water: 99, milk: 8, juice: 5, smoothie: 3,
  // Bath items
  shampoo: 10, soap: 10, toothpaste: 10, facewash: 8,
  // Garden
  rose_seed: 3, sunflower_seed: 3, tulip_seed: 3, daisy_seed: 3,
  lavender_seed: 2, cherry_seed: 2,
};

export function buildInventory(saved = null) {
  return saved ?? { ...INITIAL_INVENTORY };
}
