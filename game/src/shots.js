// The screenshot scenes behind ?shot=cover|play|serve|rush. Each one stages a
// real game state — orders on the board, a dish mid-assembly, the grill and the
// board at work, a plate ready to serve — by driving the world's own state,
// so every frame is what a short game really looks like.
import { GRILL_SECONDS, RECIPE_BY_ID } from './config.js';
import { SCREEN_PLAY } from './world.js';

function makeOrder(world, recipeId, timeLeft, stepsDone) {
  const order = world.spawnOrder(recipeId);
  const recipe = RECIPE_BY_ID[recipeId];
  order.limit = 46;
  order.timeLeft = timeLeft;
  order.stepsDone = Math.min(stepsDone, recipe.steps.length);
  return order;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the
 * best score to show. Any unknown name stages the cover scene.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  state.screen = SCREEN_PLAY;

  if (name === 'play') {
    state.shiftLeft = 142;
    state.score = 0;
    state.orders = [];
    makeOrder(world, 'burger', 42, 0);
    state.activeOrderId = state.orders[0].id;
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'serve') {
    state.shiftLeft = 96;
    state.score = 540;
    state.combo = 4;
    state.bestCombo = 4;
    state.served = 6;
    state.orders = [];
    makeOrder(world, 'burger', 12, 5);
    state.activeOrderId = state.orders[0].id;
    return { screen: SCREEN_PLAY, best: 540 };
  }

  if (name === 'rush') {
    state.shiftLeft = 38;
    state.score = 890;
    state.combo = 5;
    state.bestCombo = 5;
    state.served = 9;
    state.orders = [];
    makeOrder(world, 'burger', 6, 3);
    makeOrder(world, 'pasta', 22, 1);
    makeOrder(world, 'omelette', 34, 0);
    state.activeOrderId = state.orders[0].id;
    state.grill = { orderId: state.orders[0].id, ing: 'patty', progress: GRILL_SECONDS };
    state.board = { orderId: state.orders[1].id, ing: 'tomato', clicksLeft: 1 };
    return { screen: SCREEN_PLAY, best: 890 };
  }

  // Cover: the fullest kitchen — two orders, a dish mid-assembly, the grill
  // sizzling and the timer running.
  state.shiftLeft = 107;
  state.score = 320;
  state.combo = 3;
  state.bestCombo = 3;
  state.served = 4;
  state.orders = [];
  makeOrder(world, 'burger', 31, 3);
  makeOrder(world, 'pasta', 40, 1);
  state.activeOrderId = state.orders[0].id;
  state.grill = { orderId: state.orders[0].id, ing: 'patty', progress: 2.1 };
  state.board = { orderId: state.orders[1].id, ing: 'tomato', clicksLeft: 2 };
  return { screen: SCREEN_PLAY, best: 320 };
}
