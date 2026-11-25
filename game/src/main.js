// Boot and the one loop: clicks and keys are read every frame, the world
// advances in fixed 1/60 s steps, and the renderer paints what is there. The
// game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=cover|play|serve|rush (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, FIELD, INGREDIENTS, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_GRILL_DONE,
  EVENT_MISSED,
  EVENT_OVER,
  EVENT_SERVED,
  EVENT_WRONG,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createWorld,
} from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, ACTION_SERVE, createInput } from './input.js';
import { LAYOUT, createRenderer } from './render.js';
import { stageShot } from './shots.js';
import { sfx } from './audio.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function inRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, FIELD.width, FIELD.height);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    sfx.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve dishes before their timers run out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(world.state.shiftComplete
      ? `Shift complete. Score ${world.state.score}. Best ${best}.`
      : `Out of hearts. Score ${world.state.score}. Best ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_SERVED) sfx.ding();
    if (events & EVENT_WRONG) sfx.wrong();
    if (events & EVENT_MISSED) sfx.lost();
    if (events & EVENT_GRILL_DONE) sfx.sizzle();
    if (events & EVENT_OVER) endGame();
  }

  function handleClick(point) {
    sfx.unlock();
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    for (const ticket of LAYOUT.tickets) {
      if (inRect(point, ticket)) {
        world.selectOrder(ticket.id);
        sfx.click();
        return;
      }
    }
    for (const bin of LAYOUT.bins) {
      if (inRect(point, bin)) {
        const events = world.useIngredient(bin.id);
        if (events & EVENT_WRONG) sfx.wrong();
        else sfx.click();
        return;
      }
    }
    if (inRect(point, LAYOUT.grill)) {
      const events = world.clickGrill();
      if (events & EVENT_GRILL_DONE) sfx.sizzle();
      else sfx.click();
      return;
    }
    if (inRect(point, LAYOUT.board)) {
      world.clickBoard();
      sfx.chop();
      return;
    }
    if (inRect(point, LAYOUT.serve)) {
      const events = world.serve();
      if (events & EVENT_SERVED) sfx.ding();
      else sfx.wrong();
    }
  }

  function handleKeys() {
    if (input.takeKey('q')) world.selectOrder(world.state.orders[0]?.id);
    if (input.takeKey('w')) world.selectOrder(world.state.orders[1]?.id);
    if (input.takeKey('e')) world.selectOrder(world.state.orders[2]?.id);
    for (const ingredient of INGREDIENTS) {
      if (input.takeKey(ingredient.key)) {
        const events = world.useIngredient(ingredient.id);
        if (events & EVENT_WRONG) sfx.wrong();
        else sfx.click();
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_RESTART && (screen === SCREEN_OVER || screen === SCREEN_PLAY)) {
      startGame();
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (actions & ACTION_SERVE && screen === SCREEN_PLAY) {
      const events = world.serve();
      if (events & EVENT_SERVED) sfx.ding();
      else sfx.wrong();
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const events = world.step(STEP);
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      handleKeys();
      for (const point of input.takeClicks()) handleClick(point);
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        for (const point of input.takeClicks()) handleClick(point);
      } else {
        input.takeClicks();
      }
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

// A small hook for automated play-testing: the real state, not a mock.
window.__sizzle = { world, state: world.state, LAYOUT };

if (shot) runShot(shot);
else runGame();
