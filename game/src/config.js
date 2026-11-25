// Sizzle & Serve — configuration: the kitchen's size, timing and menu.
// One canvas, one shift, three hearts. Orders arrive on the board, each with
// its own countdown; build the dish step by step and serve it before it expires.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const HEARTS = 3;
export const MAX_ORDERS = 3;
export const GRILL_SECONDS = 4;
export const CHOP_CLICKS = 3;
export const BEST_KEY = 'sizzle-and-serve-best';

/** Points for serving a dish, before the combo multiplier and time bonus. */
export const SERVE_BASE = 100;
/** Extra points per second left on the order when it is served. */
export const TIME_BONUS_PER_SECOND = 2;

/** How long an order lives, in seconds, by how many dishes have been served. */
export function orderTimeLimit(served) {
  return Math.max(28, 46 - served * 2);
}

/** Seconds between new orders arriving, by how many dishes have been served. */
export function spawnInterval(served) {
  return Math.max(7, 13 - served * 0.6);
}

// The eight ingredients on the counter. `key` is the keyboard shortcut (1-8),
// `color` is the main fill used when the ingredient is drawn.
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8a94f', dark: '#b97e2e' },
  { id: 'patty', name: 'Patty', key: '2', color: '#8a5a33', dark: '#5f3c1e' },
  { id: 'cheese', name: 'Cheese', key: '3', color: '#f7c948', dark: '#d9a41f' },
  { id: 'lettuce', name: 'Lettuce', key: '4', color: '#7dc242', dark: '#4e8f24' },
  { id: 'tomato', name: 'Tomato', key: '5', color: '#e5484d', dark: '#b02a2e' },
  { id: 'egg', name: 'Egg', key: '6', color: '#fdf6e3', dark: '#e8d9a8' },
  { id: 'pasta', name: 'Pasta', key: '7', color: '#f2d06b', dark: '#c9a13a' },
  { id: 'sauce', name: 'Sauce', key: '8', color: '#c0392b', dark: '#8e2318' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

// The menu: four recipes. Each step names an ingredient and how it is prepped:
// 'raw' goes straight on the plate, 'grill' cooks on the stove first,
// 'chop' needs three taps on the chopping board first.
export const RECIPES = [
  {
    id: 'burger',
    name: 'Sunny Burger',
    steps: [
      { ing: 'bun', prep: 'raw' },
      { ing: 'patty', prep: 'grill' },
      { ing: 'cheese', prep: 'raw' },
      { ing: 'lettuce', prep: 'chop' },
      { ing: 'bun', prep: 'raw' },
    ],
  },
  {
    id: 'pasta',
    name: 'Twirl Pasta',
    steps: [
      { ing: 'pasta', prep: 'raw' },
      { ing: 'sauce', prep: 'raw' },
      { ing: 'tomato', prep: 'chop' },
      { ing: 'cheese', prep: 'raw' },
    ],
  },
  {
    id: 'omelette',
    name: 'Golden Omelette',
    steps: [
      { ing: 'egg', prep: 'grill' },
      { ing: 'cheese', prep: 'raw' },
      { ing: 'tomato', prep: 'chop' },
    ],
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    steps: [
      { ing: 'lettuce', prep: 'chop' },
      { ing: 'tomato', prep: 'chop' },
      { ing: 'cheese', prep: 'raw' },
    ],
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((recipe) => [recipe.id, recipe]));
