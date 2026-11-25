// Every pixel of Sizzle & Serve: the warm kitchen, the order board, the grill,
// the chopping board, the plate and the ingredient counter. All art is drawn
// with canvas shapes — no image files, no fonts from the network.
import { FIELD, GRILL_SECONDS, INGREDIENTS, INGREDIENT_BY_ID, RECIPE_BY_ID } from './config.js';
import { currentStep, orderReady } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

// Clickable regions, in field coordinates. main.js routes clicks through these.
export const LAYOUT = {
  tickets: [],
  bins: [],
  grill: { x: 452, y: 236, w: 224, h: 168 },
  board: { x: 716, y: 252, w: 216, h: 152 },
  serve: { x: 1004, y: 452, w: 200, h: 56 },
  plate: { x: 972, y: 196, w: 264, h: 240 },
};

const BIN_Y = 590;
const BIN_W = 148;
const BIN_H = 100;
const BIN_GAP = 8;
const BIN_X0 = 24;

for (let index = 0; index < INGREDIENTS.length; index += 1) {
  LAYOUT.bins.push({
    id: INGREDIENTS[index].id,
    x: BIN_X0 + index * (BIN_W + BIN_GAP),
    y: BIN_Y,
    w: BIN_W,
    h: BIN_H,
  });
}

function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Draw one ingredient as a little vector icon, centred at (x, y). */
export function drawIngredient(ctx, id, x, y, size) {
  const ing = INGREDIENT_BY_ID[id];
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.42, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s * 0.42, s * 0.06, s * 0.84, s * 0.1);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.18, -0.18], [0.05, -0.28], [0.22, -0.12]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.05, s * 0.03, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = ing.color;
    roundRect(ctx, -s * 0.44, -s * 0.2, s * 0.88, s * 0.4, s * 0.16);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = s * 0.04;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.24, -s * 0.14);
      ctx.lineTo(i * s * 0.24, s * 0.14);
      ctx.stroke();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, s * 0.22);
    ctx.lineTo(s * 0.42, s * 0.22);
    ctx.lineTo(s * 0.42, -s * 0.1);
    ctx.lineTo(0, -s * 0.34);
    ctx.lineTo(-s * 0.42, -s * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [dx, dy] of [[-0.2, 0.05], [0.12, -0.05], [0.24, 0.12]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * s * 0.22, s * 0.05, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, s * 0.1);
    ctx.quadraticCurveTo(0, -s * 0.18, s * 0.36, s * 0.1);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, s * 0.05, s * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7dc242';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.lineTo(-s * 0.14, -s * 0.16);
    ctx.lineTo(s * 0.14, -s * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.14, -s * 0.08, s * 0.1, s * 0.06, -0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.04, s * 0.44, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7b731';
    ctx.beginPath();
    ctx.arc(s * 0.06, s * 0.02, s * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(s * 0.0, -s * 0.06, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'pasta') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * (0.34 - i * 0.1), 0.3 + i * 0.8, Math.PI * 1.5 + i * 0.8);
      ctx.stroke();
    }
  } else if (id === 'sauce') {
    ctx.fillStyle = '#8e2318';
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * 0.4, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * 0.34, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a87c';
    ctx.beginPath();
    ctx.arc(-s * 0.12, -s * 0.06, s * 0.06, 0, Math.PI * 2);
    ctx.arc(s * 0.1, -s * 0.1, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWall(ctx) {
  ctx.fillStyle = '#f7ead7';
  ctx.fillRect(0, 64, FIELD.width, 492);
  ctx.fillStyle = '#f3ddba';
  for (let y = 76; y < 540; y += 46) {
    ctx.fillRect(0, y, FIELD.width, 2);
  }
  ctx.fillStyle = '#fff8ea';
  ctx.fillRect(0, 64, FIELD.width, 10);
  // Window with a sunny street.
  ctx.fillStyle = '#8d6e63';
  roundRect(ctx, 1080, 80, 176, 96, 10);
  ctx.fill();
  ctx.fillStyle = '#aee3f5';
  ctx.fillRect(1090, 90, 156, 76);
  ctx.fillStyle = '#ffd93b';
  ctx.beginPath();
  ctx.arc(1210, 108, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7dc242';
  ctx.beginPath();
  ctx.ellipse(1168, 162, 78, 10, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(1168, 90);
  ctx.lineTo(1168, 166);
  ctx.stroke();
  // Hanging pans.
  ctx.strokeStyle = '#6b4f2a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(560, 84);
  ctx.lineTo(560, 108);
  ctx.moveTo(640, 84);
  ctx.lineTo(640, 108);
  ctx.stroke();
  ctx.fillStyle = '#4a4a4a';
  ctx.beginPath();
  ctx.arc(560, 128, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(640, 128, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9a9a9a';
  ctx.beginPath();
  ctx.arc(560, 128, 14, 0, Math.PI * 2);
  ctx.arc(640, 128, 11, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeader(ctx, state) {
  ctx.fillStyle = '#5f3c1e';
  ctx.fillRect(0, 0, FIELD.width, 64);
  ctx.fillStyle = '#e8a94f';
  ctx.fillRect(0, 60, FIELD.width, 4);
  text(ctx, 'SIZZLE & SERVE', 24, 32, 26, '#ffe8b3', '800');
  // Shift timer, big and central.
  const urgent = state.shiftLeft <= 30;
  text(ctx, 'SHIFT', 470, 20, 13, '#d9b48a', '700');
  text(ctx, formatTime(state.shiftLeft), 470, 46, 30, urgent ? '#ff6b6b' : '#ffffff', '800');
  ctx.fillStyle = '#3d2712';
  roundRect(ctx, 560, 22, 180, 14, 7);
  ctx.fill();
  ctx.fillStyle = urgent ? '#ff6b6b' : '#7dc242';
  const fraction = Math.max(0, state.shiftLeft / 150);
  roundRect(ctx, 560, 22, 180 * fraction, 14, 7);
  ctx.fill();
  text(ctx, 'SCORE', 780, 20, 13, '#d9b48a', '700');
  text(ctx, String(state.score), 780, 46, 30, '#ffffff', '800');
  if (state.combo >= 2) {
    ctx.fillStyle = '#e8590c';
    roundRect(ctx, 900, 14, 104, 36, 18);
    ctx.fill();
    text(ctx, `COMBO x${state.combo}`, 952, 33, 18, '#ffffff', '800', 'center');
  }
  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    const x = 1060 + i * 34;
    ctx.fillStyle = i < state.hearts ? '#e5484d' : '#3d2712';
    ctx.beginPath();
    ctx.arc(x, 26, 9, 0, Math.PI * 2);
    ctx.arc(x + 14, 26, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 7, 30);
    ctx.lineTo(x + 21, 30);
    ctx.lineTo(x + 7, 46);
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, `SERVED ${state.served}`, 1180, 32, 16, '#ffe8b3', '700');
}

function drawOrderBoard(ctx, state) {
  text(ctx, 'ORDER BOARD', 24, 84, 18, '#5f3c1e', '800');
  LAYOUT.tickets = [];
  state.orders.forEach((order, index) => {
    const recipe = RECIPE_BY_ID[order.recipeId];
    const y = 100 + index * 78;
    const active = order.id === state.activeOrderId;
    const ready = orderReady(order);
    const urgent = order.timeLeft <= 10;
    ctx.fillStyle = active ? '#fff3d6' : '#ffffff';
    roundRect(ctx, 24, y, 380, 68, 12);
    ctx.fill();
    ctx.lineWidth = active ? 4 : 2;
    ctx.strokeStyle = ready ? '#2f9e44' : active ? '#e8a94f' : '#d9c7a8';
    ctx.stroke();
    text(ctx, recipe.name.toUpperCase(), 40, y + 20, 17, '#5f3c1e', '800');
    text(ctx, ready ? 'READY — SERVE!' : `${order.stepsDone}/${recipe.steps.length} steps`, 392, y + 20, 14, ready ? '#2f9e44' : '#8d6e63', '700', 'right');
    // Step icons.
    recipe.steps.forEach((step, stepIndex) => {
      const x = 44 + stepIndex * 44;
      drawIngredient(ctx, step.ing, x, y + 46, 30);
      if (stepIndex < order.stepsDone) {
        ctx.fillStyle = 'rgba(47,158,68,0.9)';
        ctx.beginPath();
        ctx.arc(x + 10, y + 34, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 34);
        ctx.lineTo(x + 9, y + 37);
        ctx.lineTo(x + 14, y + 31);
        ctx.stroke();
      }
    });
    // Countdown bar.
    const barX = 40;
    const barW = 348;
    ctx.fillStyle = '#efe3cc';
    roundRect(ctx, barX, y + 58, barW, 6, 3);
    ctx.fill();
    const fraction = Math.max(0, order.timeLeft / order.limit);
    ctx.fillStyle = urgent ? '#e03131' : fraction < 0.5 ? '#f08c00' : '#2f9e44';
    roundRect(ctx, barX, y + 58, barW * fraction, 6, 3);
    ctx.fill();
    LAYOUT.tickets.push({ id: order.id, x: 24, y, w: 380, h: 68 });
  });
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush', 40, 140, 15, '#8d6e63', '600');
    text(ctx, 'is coming. Get ready!', 40, 162, 15, '#8d6e63', '600');
  }
}

function drawGrill(ctx, state) {
  const { x, y, w, h } = LAYOUT.grill;
  ctx.fillStyle = '#3a3f47';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.fillStyle = '#22252b';
  roundRect(ctx, x + 12, y + 12, w - 24, h - 24, 10);
  ctx.fill();
  text(ctx, 'GRILL', x + w / 2, y + 26, 13, '#9a9a9a', '800', 'center');
  // Two burners.
  for (const burnerX of [x + 62, x + w - 62]) {
    ctx.fillStyle = '#17191d';
    ctx.beginPath();
    ctx.arc(burnerX, y + 96, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555b66';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(burnerX, y + 96, 34, 0, Math.PI * 2);
    ctx.stroke();
  }
  const grill = state.grill;
  if (grill) {
    const burnerX = x + 62;
    const done = grill.progress >= GRILL_SECONDS;
    drawIngredient(ctx, grill.ing, burnerX, y + 96, 62);
    if (!done) {
      ctx.strokeStyle = '#f7c948';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(burnerX, y + 96, 52, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * grill.progress) / GRILL_SECONDS);
      ctx.stroke();
      text(ctx, `${Math.ceil(GRILL_SECONDS - grill.progress)}s`, burnerX, y + 96, 15, '#ffffff', '800', 'center');
      // Steam.
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i += 1) {
        const sx = burnerX - 20 + i * 20;
        ctx.beginPath();
        ctx.moveTo(sx, y + 52);
        ctx.quadraticCurveTo(sx + 6, y + 40, sx - 2, y + 28);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#2f9e44';
      roundRect(ctx, burnerX - 52, y + 138, 104, 22, 11);
      ctx.fill();
      text(ctx, 'READY — CLICK!', burnerX, y + 149, 12, '#ffffff', '800', 'center');
    }
  } else {
    text(ctx, 'click a patty or egg', x + w / 2, y + 96, 13, '#777c86', '600', 'center');
    text(ctx, 'to grill it', x + w / 2, y + 116, 13, '#777c86', '600', 'center');
  }
}

function drawBoard(ctx, state) {
  const { x, y, w, h } = LAYOUT.board;
  ctx.fillStyle = '#c89b6a';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.fillStyle = '#a87c4f';
  roundRect(ctx, x + 10, y + 10, w - 20, h - 20, 8);
  ctx.fill();
  text(ctx, 'CHOPPING BOARD', x + w / 2, y + 26, 13, '#fff3d6', '800', 'center');
  const board = state.board;
  if (board) {
    drawIngredient(ctx, board.ing, x + w / 2, y + 78, 56);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < 3 - board.clicksLeft ? '#2f9e44' : '#efe3cc';
      ctx.beginPath();
      ctx.arc(x + w / 2 - 28 + i * 28, y + 122, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, `tap ${board.clicksLeft} more`, x + w / 2, y + 142, 13, '#fff3d6', '700', 'center');
  } else {
    text(ctx, 'click lettuce or tomato', x + w / 2, y + 78, 13, '#fff3d6', '600', 'center');
    text(ctx, 'to chop it', x + w / 2, y + 98, 13, '#fff3d6', '600', 'center');
  }
}

function drawPlate(ctx, state) {
  const { x, y, w } = LAYOUT.plate;
  const plateX = x + w / 2;
  const plateY = y + 150;
  const order = state.orders.find((item) => item.id === state.activeOrderId) ?? null;
  ctx.fillStyle = '#8d6e63';
  roundRect(ctx, x, y - 8, w, 26, 8);
  ctx.fill();
  text(ctx, 'PLATE', plateX, y + 5, 13, '#fff3d6', '800', 'center');
  // Plate.
  ctx.fillStyle = '#e9edf2';
  ctx.beginPath();
  ctx.ellipse(plateX, plateY, 104, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(plateX, plateY, 84, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  if (order) {
    const recipe = RECIPE_BY_ID[order.recipeId];
    const doneSteps = recipe.steps.slice(0, order.stepsDone);
    doneSteps.forEach((step, index) => {
      const layerY = plateY - 6 - index * 13;
      drawIngredient(ctx, step.ing, plateX, layerY, 66);
    });
    const step = currentStep(order);
    if (step) {
      const ing = INGREDIENT_BY_ID[step.ing];
      const prep = step.prep === 'grill' ? 'grill it' : step.prep === 'chop' ? 'chop it' : 'add it';
      text(ctx, `NEXT: ${ing.name} — ${prep}`, plateX, y + 208, 15, '#5f3c1e', '800', 'center');
    } else {
      text(ctx, 'DISH COMPLETE!', plateX, y + 208, 17, '#2f9e44', '800', 'center');
    }
  } else {
    text(ctx, 'pick an order ticket', plateX, y + 208, 15, '#8d6e63', '600', 'center');
  }
  // Serve button.
  const ready = order !== null && orderReady(order);
  const serve = LAYOUT.serve;
  ctx.fillStyle = ready ? '#2f9e44' : '#9a9a9a';
  roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 14);
  ctx.fill();
  if (ready) {
    ctx.strokeStyle = '#ffd93b';
    ctx.lineWidth = 3;
    roundRect(ctx, serve.x - 3, serve.y - 3, serve.w + 6, serve.h + 6, 16);
    ctx.stroke();
  }
  text(ctx, ready ? 'SERVE!  (Space)' : 'SERVE', serve.x + serve.w / 2, serve.y + serve.h / 2, 20, '#ffffff', '800', 'center');
}

function drawCounter(ctx, state) {
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(0, 556, FIELD.width, 164);
  ctx.fillStyle = '#a87c4f';
  ctx.fillRect(0, 556, FIELD.width, 10);
  text(ctx, 'INGREDIENTS — click in recipe order, or press 1–8', 24, 574, 14, '#fff3d6', '700');
  const order = state.orders.find((item) => item.id === state.activeOrderId) ?? null;
  const next = order ? currentStep(order) : null;
  LAYOUT.bins.forEach((bin) => {
    const ing = INGREDIENT_BY_ID[bin.id];
    const isNext = next !== null && next.ing === bin.id;
    ctx.fillStyle = isNext ? '#fff3d6' : '#f7ead7';
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 12);
    ctx.fill();
    if (isNext) {
      ctx.strokeStyle = '#e8a94f';
      ctx.lineWidth = 4;
      roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 12);
      ctx.stroke();
    }
    drawIngredient(ctx, bin.id, bin.x + bin.w / 2, bin.y + 40, 54);
    text(ctx, ing.name, bin.x + bin.w / 2, bin.y + 80, 15, '#5f3c1e', '800', 'center');
    ctx.fillStyle = '#8d6e63';
    roundRect(ctx, bin.x + bin.w - 30, bin.y + 8, 22, 22, 6);
    ctx.fill();
    text(ctx, ing.key, bin.x + bin.w - 19, bin.y + 19, 13, '#ffffff', '800', 'center');
  });
  text(ctx, 'Space = serve   •   Q/W/E = pick order   •   P = pause   •   R = restart', 24, 706, 13, '#d9c7a8', '600');
}

function drawPopups(ctx, state) {
  for (const popup of state.popups) {
    const alpha = popup.t < 1 ? 1 : Math.max(0, 1 - (popup.t - 1) / 0.4);
    ctx.globalAlpha = alpha;
    text(ctx, popup.text, popup.x, popup.y - popup.t * 36, 26, popup.color, '800', 'center');
    ctx.globalAlpha = 1;
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(40,24,8,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#fff8ea';
  roundRect(ctx, 340, 150, 600, 420, 20);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  roundRect(ctx, 340, 150, 600, 420, 20);
  ctx.stroke();
  text(ctx, title, 640, 210, 44, '#5f3c1e', '800', 'center');
  let y = 280;
  for (const line of lines) {
    text(ctx, line, 640, y, 19, '#5f3c1e', '600', 'center');
    y += 34;
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function draw(state, screen, best) {
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake * 24, (Math.random() - 0.5) * state.shake * 24);
    }
    drawWall(ctx);
    drawHeader(ctx, state);
    drawOrderBoard(ctx, state);
    drawGrill(ctx, state);
    drawBoard(ctx, state);
    drawPlate(ctx, state);
    drawCounter(ctx, state);
    drawPopups(ctx, state);
    ctx.restore();

    if (screen === SCREEN_TITLE) {
      overlay(ctx, 'SIZZLE & SERVE', [
        'Orders land on the board — build each dish',
        'in recipe order before its timer runs out.',
        'Bun, patty, cheese, lettuce, tomato, egg,',
        'pasta, sauce: grill the patty, chop the veg,',
        'then SERVE for points and combos.',
        '',
        'Click or press Space to start cooking!',
        best > 0 ? `Best score: ${best}` : 'First shift? Make it a tasty one.',
      ], '#e8a94f');
    } else if (screen === SCREEN_PAUSED) {
      overlay(ctx, 'PAUSED', [
        'The kitchen waits. The orders do not.',
        '',
        'Press P or Space to keep cooking.',
      ], '#8d6e63');
    } else if (screen === SCREEN_OVER) {
      overlay(ctx, state.shiftComplete ? 'SHIFT COMPLETE!' : 'OUT OF HEARTS!', [
        `Score: ${state.score}   •   Dishes served: ${state.served}`,
        `Orders lost: ${state.missed}   •   Best combo: x${state.bestCombo}`,
        state.score > best ? 'New best score!' : `Best score: ${best}`,
        '',
        'Press R or click to cook another shift.',
      ], state.shiftComplete ? '#2f9e44' : '#e03131');
    }
  }

  return { draw };
}
