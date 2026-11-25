// The kitchen's state: the shift clock, the order board, the grill, the chopping
// board and the plate. No drawing here — render.js paints whatever this holds.
import {
  CHOP_CLICKS,
  GRILL_SECONDS,
  HEARTS,
  MAX_ORDERS,
  RECIPES,
  RECIPE_BY_ID,
  SERVE_BASE,
  SHIFT_SECONDS,
  TIME_BONUS_PER_SECOND,
  orderTimeLimit,
  spawnInterval,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_MISSED = 2;
export const EVENT_WRONG = 4;
export const EVENT_OVER = 8;
export const EVENT_CHOP = 16;
export const EVENT_GRILL_DONE = 32;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

let nextOrderId = 1;

/** The step an order is waiting on, or null when the dish is finished. */
export function currentStep(order) {
  const recipe = RECIPE_BY_ID[order.recipeId];
  return order.stepsDone < recipe.steps.length ? recipe.steps[order.stepsDone] : null;
}

/** True when every step of the order is done and the plate is ready to serve. */
export function orderReady(order) {
  return currentStep(order) === null;
}

export function createWorld(random) {
  const state = {
    screen: SCREEN_TITLE,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    wrong: 0,
    hearts: HEARTS,
    shiftLeft: SHIFT_SECONDS,
    spawnIn: 1.2,
    orders: [],
    activeOrderId: null,
    grill: null,
    board: null,
    popups: [],
    shake: 0,
    shiftComplete: false,
  };

  function spawnOrder(recipeId) {
    const recipe = recipeId ? RECIPE_BY_ID[recipeId] : random.pick(RECIPES);
    const order = {
      id: nextOrderId,
      recipeId: recipe.id,
      timeLeft: orderTimeLimit(state.served),
      limit: orderTimeLimit(state.served),
      stepsDone: 0,
    };
    nextOrderId += 1;
    state.orders.push(order);
    if (state.activeOrderId === null) state.activeOrderId = order.id;
    return order;
  }

  function activeOrder() {
    return state.orders.find((order) => order.id === state.activeOrderId) ?? null;
  }

  function addPopup(text, x, y, color) {
    state.popups.push({ text, x, y, t: 0, color });
    if (state.popups.length > 8) state.popups.shift();
  }

  function useIngredient(ingredientId) {
    const order = activeOrder();
    if (!order || state.screen !== SCREEN_PLAY) return EVENT_NONE;
    const step = currentStep(order);
    if (!step) return EVENT_NONE;
    if (step.ing !== ingredientId) {
      state.combo = 0;
      state.wrong += 1;
      state.shake = 0.35;
      return EVENT_WRONG;
    }
    if (step.prep === 'raw') {
      order.stepsDone += 1;
      return EVENT_NONE;
    }
    if (step.prep === 'grill') {
      if (state.grill) return EVENT_WRONG;
      state.grill = { orderId: order.id, ing: ingredientId, progress: 0 };
      return EVENT_NONE;
    }
    if (state.board) return EVENT_WRONG;
    state.board = { orderId: order.id, ing: ingredientId, clicksLeft: CHOP_CLICKS };
    return EVENT_NONE;
  }

  function clickGrill() {
    if (!state.grill || state.grill.progress < GRILL_SECONDS) return EVENT_NONE;
    const order = state.orders.find((item) => item.id === state.grill.orderId);
    state.grill = null;
    if (!order) return EVENT_NONE;
    order.stepsDone += 1;
    return EVENT_GRILL_DONE;
  }

  function clickBoard() {
    if (!state.board) return EVENT_NONE;
    state.board.clicksLeft -= 1;
    if (state.board.clicksLeft > 0) return EVENT_CHOP;
    const order = state.orders.find((item) => item.id === state.board.orderId);
    state.board = null;
    if (!order) return EVENT_NONE;
    order.stepsDone += 1;
    return EVENT_CHOP;
  }

  function serve() {
    const order = activeOrder();
    if (!order || !orderReady(order)) return EVENT_NONE;
    const multiplier = 1 + state.combo * 0.25;
    const points = Math.round((SERVE_BASE + order.timeLeft * TIME_BONUS_PER_SECOND) * multiplier);
    state.score += points;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    addPopup(`+${points}`, 980, 300, '#2f9e44');
    if (state.combo >= 2) addPopup(`COMBO x${state.combo}!`, 980, 340, '#e8590c');
    state.orders = state.orders.filter((item) => item.id !== order.id);
    if (state.grill && state.grill.orderId === order.id) state.grill = null;
    if (state.board && state.board.orderId === order.id) state.board = null;
    state.activeOrderId = state.orders.length > 0 ? state.orders[0].id : null;
    if (state.orders.length === 0) state.spawnIn = Math.min(state.spawnIn, 1.0);
    return EVENT_SERVED;
  }

  function selectOrder(orderId) {
    if (state.orders.some((order) => order.id === orderId)) state.activeOrderId = orderId;
  }

  function step(dt) {
    let events = EVENT_NONE;
    if (state.screen !== SCREEN_PLAY) return events;
    state.shiftLeft -= dt;
    if (state.shiftLeft <= 0) {
      state.shiftLeft = 0;
      state.screen = SCREEN_OVER;
      state.shiftComplete = true;
      return EVENT_OVER;
    }
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    for (const popup of state.popups) popup.t += dt;
    state.popups = state.popups.filter((popup) => popup.t < 1.4);

    state.spawnIn -= dt;
    if (state.orders.length < MAX_ORDERS && state.spawnIn <= 0) {
      spawnOrder();
      state.spawnIn = spawnInterval(state.served);
    }
    if (state.grill) {
      state.grill.progress = Math.min(GRILL_SECONDS, state.grill.progress + dt);
    }
    for (const order of [...state.orders]) {
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        state.orders = state.orders.filter((item) => item.id !== order.id);
        state.missed += 1;
        state.hearts -= 1;
        state.combo = 0;
        addPopup('ORDER LOST!', 640, 240, '#e03131');
        if (state.activeOrderId === order.id) {
          state.activeOrderId = state.orders.length > 0 ? state.orders[0].id : null;
        }
        events |= EVENT_MISSED;
        if (state.hearts <= 0) {
          state.hearts = 0;
          state.screen = SCREEN_OVER;
          state.shiftComplete = false;
          events |= EVENT_OVER;
        }
      }
    }
    return events;
  }

  function reset() {
    state.screen = SCREEN_PLAY;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.missed = 0;
    state.wrong = 0;
    state.hearts = HEARTS;
    state.shiftLeft = SHIFT_SECONDS;
    state.spawnIn = 1.2;
    state.orders = [];
    state.activeOrderId = null;
    state.grill = null;
    state.board = null;
    state.popups = [];
    state.shake = 0;
    state.shiftComplete = false;
    spawnOrder();
  }

  return {
    state,
    activeOrder,
    currentStep,
    orderReady,
    spawnOrder,
    useIngredient,
    clickGrill,
    clickBoard,
    serve,
    selectOrder,
    step,
    reset,
  };
}
